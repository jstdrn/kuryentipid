/* Decode locally chosen images for profile pictures and appliance icons. */
window.LocalPhoto = (() => {
  'use strict';
  const prefix = 'data:image/png;base64,';

  function isSavedPng(value, maxBytes) {
    if (typeof value !== 'string' || !value.startsWith(prefix)) return false;
    const encoded = value.slice(prefix.length);
    if (encoded.length > 4 * Math.ceil(maxBytes / 3) || encoded.length % 4 !== 0) return false;
    if (!encoded.startsWith('iVBORw0KGgo') || !/^[a-zA-Z0-9+/]+={0,2}$/.test(encoded)) return false;
    const padding = encoded.endsWith('==') ? 2 : Number(encoded.endsWith('='));
    return encoded.length * 3 / 4 - padding <= maxBytes;
  }

  async function resize(file, {side = 96, square = false, maxMB = 3, maxMP = 24} = {}) {
    if (file.size > maxMB * 1024 * 1024) throw new Error('Choose an image of ' + maxMB + ' MB or less.');
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const signature = String.fromCharCode(...header);
    const png = signature.startsWith('\x89PNG\r\n\x1a\n');
    const jpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
    const webp = signature.slice(0, 4) === 'RIFF' && signature.slice(8) === 'WEBP';
    if (!png && !jpeg && !webp) throw new Error('Choose a PNG, JPEG, or WebP image.');
    const image = new Image();
    const url = URL.createObjectURL(new Blob([file], {type: png ? 'image/png' : jpeg ? 'image/jpeg' : 'image/webp'}));
    try {
      image.src = url;
      try { await image.decode(); } catch { throw new Error('This image could not be read. Choose another file.'); }
      const {naturalWidth: width, naturalHeight: height} = image;
      if (!width || !height || width * height > maxMP * 1000000) throw new Error('Choose an image up to ' + maxMP + ' megapixels.');
      const cropWidth = square ? Math.min(width, height) : width;
      const cropHeight = square ? cropWidth : height;
      const scale = Math.min(side / cropWidth, side / cropHeight, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cropWidth * scale));
      canvas.height = Math.max(1, Math.round(cropHeight * scale));
      const context = canvas.getContext('2d');
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, (width - cropWidth) / 2, (height - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return Object.freeze({resize, isSavedPng});
})();
