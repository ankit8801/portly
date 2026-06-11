import { supabase } from '../../lib/supabase';

const BUCKET_NAME = 'portly-assets';

/**
 * Uploads a file (Blob or File) to Supabase Storage and returns the public download URL.
 * @param {Blob|File} file - The file to upload.
 * @param {string} path - The storage path (e.g., 'users/123/image-1.jpg').
 * @returns {Promise<string>} - The download URL.
 */
export const uploadFile = async (file, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Deletes a file from Supabase Storage given its public download URL.
 * @param {string} url - The public URL of the file.
 * @returns {Promise<void>}
 */
export const deleteFileByUrl = async (url) => {
  if (!url || !url.includes("supabase.co")) return;
  try {
    // Extract path from URL: .../storage/v1/object/public/portly-assets/users/123/image.jpg
    const bucketMarker = `${BUCKET_NAME}/`;
    const startIndex = url.indexOf(bucketMarker);
    if (startIndex !== -1) {
      const path = url.substring(startIndex + bucketMarker.length);
      
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);
        
      if (error) throw error;
    }
  } catch (err) {
    console.error("Error deleting file by url:", err);
    // Suppress error if file doesn't exist anymore
  }
};
