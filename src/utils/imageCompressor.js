/**
 * Image compression utility using HTML5 Canvas.
 * Compresses camera/phone photos (5-15MB) into lightweight crisp JPEGs (~80-180KB)
 * for snappy upload and seamless local/cloud storage.
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.78) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('File tidak ditemukan'));
    }
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Format berkas harus berupa gambar (JPG, PNG, WebP)'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Fill white background in case of transparent PNG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
