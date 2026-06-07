import { collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, limit, startAfter } from "firebase/firestore";
import { db } from "../config";

const PROJECTS_COLLECTION = "projects";

const generateSlug = async (title, ownerId) => {
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  let slug = baseSlug;
  let counter = 1;
  let isAvailable = false;

  while (!isAvailable) {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("ownerId", "==", ownerId),
      where("slug", "==", slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      isAvailable = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
};

// Fetch paginated published projects (Explore page)
export const getPublishedProjectsPage = async (lastVisible = null, pageSize = 20) => {
  try {
    let q = query(
      collection(db, PROJECTS_COLLECTION), 
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    if (lastVisible) {
      q = query(
        collection(db, PROJECTS_COLLECTION), 
        where("status", "==", "published"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }
    const snap = await getDocs(q);
    return {
      projects: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] || null,
      hasMore: snap.docs.length === pageSize
    };
  } catch (error) {
    console.error("Error fetching published projects page:", error);
    throw error;
  }
};

// Fetch user's projects for dashboard (all statuses)
export const fetchUserProjects = async (uid) => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION), 
      where("ownerId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user projects:", error);
    throw error;
  }
};

// Fetch public projects for a specific user's portfolio
export const getUserPublishedProjectsPage = async (uid, lastVisible = null, pageSize = 20) => {
  try {
    let q = query(
      collection(db, PROJECTS_COLLECTION), 
      where("ownerId", "==", uid),
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    if (lastVisible) {
      q = query(
        collection(db, PROJECTS_COLLECTION), 
        where("ownerId", "==", uid),
        where("status", "==", "published"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(pageSize)
      );
    }
    const snap = await getDocs(q);
    return {
      projects: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] || null,
      hasMore: snap.docs.length === pageSize
    };
  } catch (error) {
    console.error("Error fetching user published projects page:", error);
    throw error;
  }
};

export const createProject = async (ownerId, projectData) => {
  try {
    const slug = await generateSlug(projectData.title, ownerId);
    
    const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), {
      ownerId,
      title: projectData.title,
      slug,
      thumbnail: projectData.thumbnail || '',
      category: projectData.category || "Design",
      status: projectData.status || "draft",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    if (projectData.blocks && projectData.blocks.length > 0) {
      const blocksRef = collection(db, PROJECTS_COLLECTION, docRef.id, "blocks");
      const statusToSave = projectData.status || "draft";
      for (let i = 0; i < projectData.blocks.length; i++) {
        await addDoc(blocksRef, { ...projectData.blocks[i], order: i, ownerId, status: statusToSave });
      }
    }

    return { success: true, id: docRef.id, slug };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { id: snap.id, ...snap.data() };
      // Fetch blocks
      const blocksRef = collection(db, PROJECTS_COLLECTION, projectId, "blocks");
      const blocksSnap = await getDocs(query(blocksRef, orderBy("order", "asc")));
      data.blocks = blocksSnap.docs.map(b => ({ id: b.id, ...b.data() }));
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

export const getProjectBySlug = async (ownerId, slug) => {
  try {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("ownerId", "==", ownerId),
      where("slug", "==", slug),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0];
      const data = { id: docData.id, ...docData.data() };
      // Fetch blocks
      const blocksRef = collection(db, PROJECTS_COLLECTION, data.id, "blocks");
      const blocksSnap = await getDocs(query(blocksRef, orderBy("order", "asc")));
      data.blocks = blocksSnap.docs.map(b => ({ id: b.id, ...b.data() }));
      return data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching project by slug:", error);
    throw error;
  }
}

export const updateProject = async (projectId, updatedData) => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    const { blocks, ...projectFields } = updatedData;

    await updateDoc(docRef, {
      ...projectFields,
      updatedAt: serverTimestamp(),
    });

    if (blocks) {
      // For phase 1: Delete all existing blocks and rewrite to ensure order and state is perfectly synced
      const blocksRef = collection(db, PROJECTS_COLLECTION, projectId, "blocks");
      const oldBlocksSnap = await getDocs(blocksRef);
      const deletePromises = oldBlocksSnap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      const statusToSave = projectFields.status || "draft";
      const ownerIdToSave = projectFields.ownerId;
      const addPromises = blocks.map((b, i) => addDoc(blocksRef, { ...b, order: i, ownerId: ownerIdToSave, status: statusToSave }));
      await Promise.all(addPromises);
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    
    // 1. Fetch project to get thumbnail
    const projSnap = await getDoc(docRef);
    if (!projSnap.exists()) return { success: false };
    const projectData = projSnap.data();

    // 2. Fetch blocks
    const blocksRef = collection(db, PROJECTS_COLLECTION, projectId, "blocks");
    const blocksSnap = await getDocs(blocksRef);
    const blocks = blocksSnap.docs.map(b => b.data());

    // 3. Extract all storage URLs
    const urlsToDelete = [];
    if (projectData.thumbnail) urlsToDelete.push(projectData.thumbnail);
    
    blocks.forEach(block => {
      if (block.url) urlsToDelete.push(block.url);
      if (block.images && Array.isArray(block.images)) {
        block.images.forEach(img => {
          if (img.url) urlsToDelete.push(img.url);
        });
      }
    });

    // 4. Delete storage files
    const { deleteFileByUrl } = await import("./storageService");
    const deleteFilePromises = urlsToDelete.map(url => deleteFileByUrl(url));
    await Promise.allSettled(deleteFilePromises);

    // 5. Delete block documents
    const deleteBlockPromises = blocksSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deleteBlockPromises);

    // 6. Delete project document
    await deleteDoc(docRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// --- BLOCKS ---

export const fetchProjectBlocks = async (projectId) => {
  try {
    const blocksRef = collection(db, PROJECTS_COLLECTION, projectId, "blocks");
    const q = query(blocksRef, orderBy("order", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching project blocks:", error);
    throw error;
  }
};

export const addProjectBlock = async (projectId, blockData) => {
  try {
    const blocksRef = collection(db, PROJECTS_COLLECTION, projectId, "blocks");
    const docRef = await addDoc(blocksRef, blockData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding project block:", error);
    throw error;
  }
};

export const updateProjectBlock = async (projectId, blockId, updatedData) => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId, "blocks", blockId);
    await updateDoc(docRef, updatedData);
    return { success: true };
  } catch (error) {
    console.error("Error updating project block:", error);
    throw error;
  }
};

export const deleteProjectBlock = async (projectId, blockId) => {
  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId, "blocks", blockId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting project block:", error);
    throw error;
  }
};
