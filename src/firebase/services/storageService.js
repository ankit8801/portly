import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config";

/**
 * Uploads a file (Blob or File) to Firebase Storage and returns the download URL.
 * @param {Blob|File} file - The file to upload.
 * @param {string} path - The storage path (e.g., 'projects/image-1.jpg').
 * @returns {Promise<string>} - The download URL.
 */
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Deletes a file from Firebase Storage given its download URL.
 * @param {string} url - The download URL of the file.
 * @returns {Promise<void>}
 */
export const deleteFileByUrl = async (url) => {
  if (!url || !url.includes("firebasestorage.googleapis.com")) return;
  try {
    // Extract path from URL: .../b/BUCKET/o/PATH?alt=media...
    const decodedUrl = decodeURIComponent(url);
    const startIndex = decodedUrl.indexOf('/o/') + 3;
    const endIndex = decodedUrl.indexOf('?');
    if (startIndex !== 2 && endIndex !== -1) {
      const path = decodedUrl.substring(startIndex, endIndex);
      const fileRef = ref(storage, path);
      // Wait for firebase storage delete (need to import deleteObject)
      const { deleteObject } = await import("firebase/storage");
      await deleteObject(fileRef);
    }
  } catch (err) {
    console.error("Error deleting file by url:", err);
    // Suppress error if file doesn't exist anymore
  }
};
