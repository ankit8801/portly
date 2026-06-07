/**
 * Uploads an image Blob to IMGBB and returns the direct display URL.
 * @param {Blob} blob - The image blob to upload.
 * @returns {Promise<string>} - The uploaded image URL.
 */
export const uploadToIMGBB = async (blob) => {
  const API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
  
  if (!API_KEY) {
    throw new Error("IMGBB API Key is missing in environment variables.");
  }

  const formData = new FormData();
  formData.append("image", blob);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || "IMGBB upload failed");
    }
  } catch (error) {
    console.error("IMGBB Upload Error:", error);
    throw error;
  }
};
