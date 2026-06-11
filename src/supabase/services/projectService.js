import { supabase } from '../../lib/supabase';

// Map Project from DB to UI
const mapProjectToUI = (dbProject) => {
  if (!dbProject) return null;
  return {
    ...dbProject,
    ownerId: dbProject.owner_id,
    thumbnail: dbProject.cover_image,
    createdAt: dbProject.created_at ? new Date(dbProject.created_at) : null,
    updatedAt: dbProject.updated_at ? new Date(dbProject.updated_at) : null,
    // blocks mapping if included
    blocks: dbProject.blocks ? dbProject.blocks.map(mapBlockToUI) : undefined,
  };
};

const mapProjectToDB = (uiProject) => {
  const db = { ...uiProject };
  if (db.ownerId !== undefined) { db.owner_id = db.ownerId; delete db.ownerId; }
  if (db.thumbnail !== undefined) { db.cover_image = db.thumbnail; delete db.thumbnail; }
  delete db.createdAt;
  db.updated_at = new Date().toISOString();
  return db;
};

// Map Block from DB to UI
const mapBlockToUI = (dbBlock) => {
  if (!dbBlock) return null;
  return {
    id: dbBlock.id,
    order: dbBlock.position,
    type: dbBlock.type,
    ...(dbBlock.content || {}) // spread JSONB content
  };
};

// Map Block from UI to DB
const mapBlockToDB = (uiBlock, projectId) => {
  const { id, order, type, ...content } = uiBlock;
  return {
    ...(id ? { id } : {}), // only include id if it exists
    project_id: projectId,
    position: order,
    type: type,
    content: content
  };
};

// Generates a unique slug
const generateSlug = async (title, ownerId) => {
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  let slug = baseSlug;
  let counter = 1;
  let isAvailable = false;

  while (!isAvailable) {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('slug', slug)
      .maybeSingle();
      
    if (error) throw error;
    if (!data) {
      isAvailable = true;
    } else {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
  return slug;
};

export const getPublishedProjectsPage = async (lastVisible = 0, pageSize = 20) => {
  try {
    const from = lastVisible || 0;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      projects: data.map(mapProjectToUI),
      lastDoc: data.length === pageSize ? to + 1 : null,
      hasMore: data.length === pageSize
    };
  } catch (error) {
    console.error("Error fetching published projects page:", error);
    throw error;
  }
};

export const fetchUserProjects = async (uid) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', uid)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapProjectToUI);
  } catch (error) {
    console.error("Error fetching user projects:", error);
    throw error;
  }
};

export const getUserPublishedProjectsPage = async (uid, lastVisible = 0, pageSize = 20) => {
  try {
    const from = lastVisible || 0;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', uid)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      projects: data.map(mapProjectToUI),
      lastDoc: data.length === pageSize ? to + 1 : null,
      hasMore: data.length === pageSize
    };
  } catch (error) {
    console.error("Error fetching user published projects page:", error);
    throw error;
  }
};

export const createProject = async (ownerId, projectData) => {
  try {
    const slug = await generateSlug(projectData.title, ownerId);
    
    // Insert project
    const { data: projectDoc, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: ownerId,
        title: projectData.title,
        slug: slug,
        cover_image: projectData.thumbnail || '',
        category: projectData.category || 'Design',
        status: projectData.status || 'draft',
      })
      .select('id')
      .single();

    if (projectError) throw projectError;

    // Insert blocks
    if (projectData.blocks && projectData.blocks.length > 0) {
      const blocksToInsert = projectData.blocks.map((b, i) => mapBlockToDB({ ...b, order: i }, projectDoc.id));
      const { error: blocksError } = await supabase
        .from('blocks')
        .insert(blocksToInsert);
        
      if (blocksError) throw blocksError;
    }

    return { success: true, id: projectDoc.id, slug };
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

export const getProjectById = async (projectId) => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return null;

    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (blocksError) throw blocksError;

    return mapProjectToUI({ ...project, blocks });
  } catch (error) {
    console.error("Error fetching project:", error);
    throw error;
  }
};

export const getProjectBySlug = async (ownerId, slug) => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('slug', slug)
      .maybeSingle();

    if (projectError) throw projectError;
    if (!project) return null;

    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .select('*')
      .eq('project_id', project.id)
      .order('position', { ascending: true });

    if (blocksError) throw blocksError;

    return mapProjectToUI({ ...project, blocks });
  } catch (error) {
    console.error("Error fetching project by slug:", error);
    throw error;
  }
};

export const updateProject = async (projectId, updatedData) => {
  try {
    const { blocks, ...projectFields } = updatedData;
    
    // Update project
    const dbProjectData = mapProjectToDB(projectFields);
    const { error: projectError } = await supabase
      .from('projects')
      .update(dbProjectData)
      .eq('id', projectId);

    if (projectError) throw projectError;

    // Update blocks (Phase 1 logic: delete old, insert new)
    if (blocks) {
      const { error: deleteError } = await supabase
        .from('blocks')
        .delete()
        .eq('project_id', projectId);
        
      if (deleteError) throw deleteError;

      if (blocks.length > 0) {
        const blocksToInsert = blocks.map((b, i) => mapBlockToDB({ ...b, order: i }, projectId));
        const { error: insertError } = await supabase
          .from('blocks')
          .insert(blocksToInsert);
          
        if (insertError) throw insertError;
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = async (projectId) => {
  try {
    // 1. Fetch project and blocks to get storage URLs
    const project = await getProjectById(projectId);
    if (!project) return { success: false };

    const urlsToDelete = [];
    if (project.thumbnail) urlsToDelete.push(project.thumbnail);
    
    if (project.blocks) {
      project.blocks.forEach(block => {
        if (block.url) urlsToDelete.push(block.url);
        if (block.images && Array.isArray(block.images)) {
          block.images.forEach(img => {
            if (img.url) urlsToDelete.push(img.url);
          });
        }
      });
    }

    // 2. Delete storage files
    const { deleteFileByUrl } = await import("./storageService");
    const deleteFilePromises = urlsToDelete.map(url => deleteFileByUrl(url));
    await Promise.allSettled(deleteFilePromises);

    // 3. Delete project document (Blocks are ON DELETE CASCADE usually, but let's delete explicitly if needed)
    // Actually, user schema showed project_id YES, but no CASCADE explicitly mentioned, so let's delete blocks first.
    await supabase.from('blocks').delete().eq('project_id', projectId);
    
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// --- BLOCKS ---

export const fetchProjectBlocks = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data.map(mapBlockToUI);
  } catch (error) {
    console.error("Error fetching project blocks:", error);
    throw error;
  }
};

export const addProjectBlock = async (projectId, blockData) => {
  try {
    const dbBlock = mapBlockToDB(blockData, projectId);
    const { data, error } = await supabase
      .from('blocks')
      .insert(dbBlock)
      .select('id')
      .single();

    if (error) throw error;
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Error adding project block:", error);
    throw error;
  }
};

export const updateProjectBlock = async (projectId, blockId, updatedData) => {
  try {
    // We need to fetch the existing block to properly merge JSONB if we only want partial updates,
    // but the Firebase version updated the whole document or merged fields.
    // Given the UI usually sends the whole block, mapBlockToDB handles it.
    // However, mapBlockToDB puts everything into `content`. 
    // In Postgres, updating `content` JSONB overwrites the whole JSON object if done this way.
    // If it's a partial update, it's safer to use JSONB concatenation, but let's stick to simple update for now.
    
    // We need to just update the row.
    const dbBlock = mapBlockToDB(updatedData, projectId);
    const { error } = await supabase
      .from('blocks')
      .update(dbBlock)
      .eq('id', blockId)
      .eq('project_id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error updating project block:", error);
    throw error;
  }
};

export const deleteProjectBlock = async (projectId, blockId) => {
  try {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)
      .eq('project_id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error deleting project block:", error);
    throw error;
  }
};
