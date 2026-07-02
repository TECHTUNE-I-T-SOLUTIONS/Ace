const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    await fsPromises.mkdir(dir, { recursive: true });
  }
}

async function generateIcons() {
  const inputPath = path.join(__dirname, '..', 'assets', 'logo.png');
  const outputDir = path.join(__dirname, '..', 'assets', 'icons');
  
  await ensureDir(outputDir);
  
  // Read the input image
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  console.log(`Input image: ${metadata.width}x${metadata.height}, ${metadata.format}`);
  
  // Create properly sized icons
  // For Android adaptive icon: foregroundImage should be ~1024x1024
  // The image will be automatically centered and scaled by the system
  
  const sizes = [
    { name: 'app-icon-1024.png', size: 1024 },
    { name: 'app-icon-512.png', size: 512 },
    { name: 'app-icon-192.png', size: 192 },
    { name: 'app-icon-144.png', size: 144 },
    { name: 'app-icon-96.png', size: 96 },
    { name: 'app-icon-72.png', size: 72 },
    { name: 'app-icon-48.png', size: 48 },
  ];
  
  // Get the dominant color for backgrounds
  const { dominant } = await sharp(inputPath).stats();
  const bgColor = `rgb(${Math.round(dominant.r)}, ${Math.round(dominant.g)}, ${Math.round(dominant.b)})`;
  console.log(`Dominant color: ${bgColor}`);
  
  for (const { name, size } of sizes) {
    const outputPath = path.join(outputDir, name);
    
    // Resize with padding to ensure it fits within the safe zone
    // For adaptive icons, we need 10% padding
    const safeSize = Math.round(size * 0.8); // 80% of total size for safe zone
    const padding = Math.round((size - safeSize) / 2);
    
    // Create a white/transparent background and embed the resized image
    await sharp(inputPath)
      .resize(safeSize, safeSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(outputPath);
    
    console.log(`Created ${name} (${size}x${size}) - ${bgColor}`);
  }
  
  // Create a version with background for Android adaptive icon
  const adaptiveSize = 1024;
  const adaptiveSafeSize = Math.round(adaptiveSize * 0.72); // 72% safe zone
  const adaptivePadding = Math.round((adaptiveSize - adaptiveSafeSize) / 2);
  
  await sharp(inputPath)
    .resize(adaptiveSafeSize, adaptiveSafeSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: adaptivePadding,
      bottom: adaptivePadding,
      left: adaptivePadding,
      right: adaptivePadding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(outputDir, 'adaptive-foreground.png'));
  
  console.log('Created adaptive-foreground.png (1024x1024 with padding)');
  
  // Create notification icon (should be solid white on transparent for Android)
  // This is important for notification icons to show properly
  await sharp(inputPath)
    .resize(96, 96, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(outputDir, 'notification-icon.png'));
  
  console.log('Created notification-icon.png (96x96)');
  
  console.log('\nAll icons generated successfully!');
  console.log(`Output directory: ${outputDir}`);
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});