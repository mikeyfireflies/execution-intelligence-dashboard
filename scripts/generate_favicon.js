const fs = require('fs');
const path = require('path');
const fredSvgPath = path.join(__dirname, '../public/fred-3d-1.svg');
const faviconPath = path.join(__dirname, '../public/favicon.svg');

try {
    const fredSvgContent = fs.readFileSync(fredSvgPath, 'utf8');

    // Extract the base64 image data using a simpler regex since we know the format
    const base64Start = 'xlink:href="';
    const startIndex = fredSvgContent.indexOf(base64Start);

    if (startIndex === -1) {
        console.error('Could not find base64 image data start in fred-3d-1.svg');
        process.exit(1);
    }

    const startPos = startIndex + base64Start.length;
    const endPos = fredSvgContent.indexOf('"', startPos);

    if (endPos === -1) {
        console.error('Could not find base64 image data end in fred-3d-1.svg');
        process.exit(1);
    }

    const base64Data = fredSvgContent.substring(startPos, endPos);

    // Create the new SVG content
    // Circular background with black to purple gradient
    // Centered Fred image

    const newSvgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#000000;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="256" fill="url(#grad1)"/>
  <!-- Image centered and scaled. 512 width/height, image approx 75% size -->
  <image x="64" y="64" width="384" height="384" xlink:href="${base64Data}"/>
</svg>`;

    fs.writeFileSync(faviconPath, newSvgContent);
    console.log('Successfully generated public/favicon.svg');

} catch (error) {
    console.error('Error generating favicon:', error);
    process.exit(1);
}
