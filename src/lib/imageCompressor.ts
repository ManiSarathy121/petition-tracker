/**
 * Client-Side File Compression Utility
 * Automatically compresses images and file uploads under 150 KB before uploading to Supabase Storage.
 */

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savedPercent: number;
}

export async function compressFileUnder150KB(file: File): Promise<CompressionResult> {
  const MAX_BYTES = 150 * 1024; // 150 KB
  const originalSize = file.size;

  // If already under 150 KB, return as-is
  if (originalSize <= MAX_BYTES) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      savedPercent: 0,
    };
  }

  // 1. Image Compression (JPEG, PNG, WebP, Camera Captures)
  if (file.type.startsWith("image/")) {
    const compressedBlob = await new Promise<File>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;

        // Resize dimensions if large (max 1200px)
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.75;
        const attemptCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              if (blob.size <= MAX_BYTES || quality <= 0.15) {
                const compressed = new File(
                  [blob],
                  file.name.replace(/\.[^.]+$/, ".jpg"),
                  {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  }
                );
                resolve(compressed);
              } else {
                quality -= 0.15;
                attemptCompress();
              }
            },
            "image/jpeg",
            quality
          );
        };

        attemptCompress();
      };

      img.onerror = () => resolve(file);
      img.src = url;
    });

    const compressedSize = compressedBlob.size;
    const savedPercent = Math.max(
      0,
      Math.round(((originalSize - compressedSize) / originalSize) * 100)
    );

    return {
      file: compressedBlob,
      originalSize,
      compressedSize,
      savedPercent,
    };
  }

  // 2. PDF / Other Documents: Return file with compression metadata
  return {
    file,
    originalSize,
    compressedSize: file.size,
    savedPercent: 0,
  };
}

export function formatKB(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
