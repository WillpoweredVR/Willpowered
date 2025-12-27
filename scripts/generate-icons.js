/**
 * Icon Generation Script for PWA
 * 
 * This script generates PNG icons from the SVG source.
 * Run with: node scripts/generate-icons.js
 * 
 * Requirements:
 * - Install sharp: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('Generating PWA icons...');
  
  const svgBuffer = fs.readFileSync(inputSvg);
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Generated ${size}x${size}`);
  }
  
  // Generate badge icon (for notifications)
  await sharp(svgBuffer)
    .resize(72, 72)
    .png()
    .toFile(path.join(outputDir, 'badge-72x72.png'));
  console.log('✓ Generated badge');
  
  // Generate checkin shortcut icon
  await sharp(svgBuffer)
    .resize(96, 96)
    .png()
    .toFile(path.join(outputDir, 'checkin-96x96.png'));
  console.log('✓ Generated checkin shortcut');
  
  // Generate chat shortcut icon
  await sharp(svgBuffer)
    .resize(96, 96)
    .png()
    .toFile(path.join(outputDir, 'chat-96x96.png'));
  console.log('✓ Generated chat shortcut');
  
  console.log('\\nAll icons generated successfully!');
}

generateIcons().catch(console.error);

