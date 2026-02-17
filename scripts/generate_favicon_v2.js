const fs = require('fs');
const path = require('path');

const fredSvgPath = path.join(__dirname, '../public/fred-3d-1.svg');
const faviconPath = path.join(__dirname, '../public/favicon.svg');

try {
    const fredSvgContent = fs.readFileSync(fredSvgPath, 'utf8');

    // Extract the base64 image data
    const match = fredSvgContent.match(/xlink:href="(data:image\/png;base64,[^"]+)"/);

    if (!match) {
        console.error('Could not find base64 image data in fred-3d-1.svg');
        process.exit(1);
    }

    const base64Data = match[1];

    // Create the new SVG content
    // Circular background: White fill, Violet outline
    // Violet color: #7c3aed (Violet-600)
    // Centered Fred image

    const newSvgContent = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <!-- White background circle with Violet outline -->
  <circle cx="256" cy="256" r="248" fill="white" stroke="#7c3aed" stroke-width="16"/>
  
  <!-- Image centered and scaled. -->
  <image x="64" y="64" width="384" height="384" xlink:href="${base64Data}"/>
</svg>`;

    fs.writeFileSync(faviconPath, newSvgContent);
    console.log('Successfully generated public/favicon.svg with violet outline');

} catch (error) {
    console.error('Error generating favicon:', error);
    process.exit(1);
}
