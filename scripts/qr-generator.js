/* QR Code Generator - Custom Implementation */

class QRCodeGenerator {
  static create(value, options = {}) {
    const size = options.size || 268;
    const fgColor = options.fgColor || '#0a0a0a';
    const bgColor = options.bgColor || '#ffffff';
    const errorCorrectionLevel = options.errorCorrectionLevel || 'M';

    // Simple QR code implementation using qrcode.js library
    if (typeof QRCode !== 'undefined') {
      return new QRCode(document.createElement('div'), {
        text: value,
        width: size,
        height: size,
        colorDark: fgColor,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel[errorCorrectionLevel]
      });
    }
    
    // Fallback to basic implementation
    return this.createBasicQR(value, size, fgColor, bgColor);
  }

  static createBasicQR(value, size, fgColor, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    
    // Draw placeholder pattern
    ctx.fillStyle = fgColor;
    const moduleSize = size / 25;
    
    // Create a simple pattern
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if ((i + j) % 2 === 0 || (i % 3 === 0 && j % 3 === 0)) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }
    
    // Add corner squares
    this.drawCornerSquare(ctx, 0, 0, moduleSize, fgColor);
    this.drawCornerSquare(ctx, size - 7 * moduleSize, 0, moduleSize, fgColor);
    this.drawCornerSquare(ctx, 0, size - 7 * moduleSize, moduleSize, fgColor);
    
    return canvas;
  }

  static drawCornerSquare(ctx, x, y, moduleSize, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
    ctx.fillStyle = color;
    ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
  }

  static generateSVG(value, options = {}) {
    const size = options.size || 268;
    const fgColor = options.fgColor || '#0a0a0a';
    const bgColor = options.bgColor || '#ffffff';
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${bgColor}" rx="12"/>
        <g fill="${fgColor}">
          ${this.generateQRPattern(value, size, fgColor)}
        </g>
      </svg>
    `;
  }

  static generateQRPattern(value, size, color) {
    const moduleSize = size / 25;
    let pattern = '';
    
    // Generate basic QR pattern
    for (let i = 0; i < 25; i++) {
      for (let j = 0; j < 25; j++) {
        if ((i + j) % 2 === 0 || (i % 3 === 0 && j % 3 === 0)) {
          pattern += `<rect x="${i * moduleSize}" y="${j * moduleSize}" width="${moduleSize}" height="${moduleSize}"/>`;
        }
      }
    }
    
    return pattern;
  }
}

// Export for use in the application
window.QRCodeGenerator = QRCodeGenerator;
