/**
 * Creates an image from a URL.
 * @param {string} url - The image URL.
 * @returns {Promise<HTMLImageElement>}
 */
export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on canvas
    image.src = url;
  });

/**
 * Returns the cropped image as a Blob.
 * @param {string} imageSrc - The source image URL/base64.
 * @param {Object} pixelCrop - The pixel crop dimensions from react-easy-crop.
 * @param {number} rotation - The rotation angle (default 0).
 * @param {number} quality - The quality of the compressed image (0 to 1).
 * @returns {Promise<Blob>}
 */
export default async function getCroppedImg(imageSrc, pixelCrop, rotation = 0, quality = 0.8) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = (rotation * Math.PI) / 180;
  
  // Calculate bounding box if rotation is applied
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central point and draw image with rotation
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw the image
  ctx.drawImage(image, 0, 0);

  // Cropping the image with its rotation
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Set canvas width to final desired crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Paste image data to the top left of the canvas
  ctx.putImageData(data, 0, 0);

  // As a Blob with compression
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas image creation failed - Blob is null'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Compresses an image without cropping.
 * @param {File|Blob} file - The file to compress.
 * @param {number} quality - The quality of the compressed image (0 to 1).
 * @param {number} maxWidth - The maximum width for downscaling.
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, quality = 0.8, maxWidth = 1920) {
  const image = await createImage(URL.createObjectURL(file));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return file; // Fallback to original

  let { width, height } = image;
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = height * ratio;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression failed - Blob is null'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

function rotateSize(width, height, rotation) {
  const rotRad = (rotation * Math.PI) / 180;

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
