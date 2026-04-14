/**
 * Norla — Android Icon Generator
 *
 * Generates all required Android icon sizes from the Norla logo.
 * Uses the 'sharp' package which is already installed in the project.
 *
 * Run from the nureli/ directory:
 *   node scripts/generate-android-icons.js
 *
 * This will create all mipmap icon files in the correct Android folders.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_ICON = path.join(__dirname, '..', 'public', 'logo-bg.png');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// All Android icon sizes required
const ICON_CONFIGS = [
  { folder: 'mipmap-mdpi',    size: 48 },
  { folder: 'mipmap-hdpi',    size: 72 },
  { folder: 'mipmap-xhdpi',   size: 96 },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground icon for adaptive icons (slightly smaller — 108dp canvas, icon at center 72dp)
const FOREGROUND_CONFIGS = [
  { folder: 'mipmap-mdpi',    size: 108 },
  { folder: 'mipmap-hdpi',    size: 162 },
  { folder: 'mipmap-xhdpi',   size: 216 },
  { folder: 'mipmap-xxhdpi',  size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generateIcons() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('❌ Source icon not found:', SOURCE_ICON);
    console.error('   Make sure public/logo-bg.png exists.');
    process.exit(1);
  }

  console.log('🎨 Generating Android icons from:', path.basename(SOURCE_ICON));
  console.log('');

  for (const { folder, size } of ICON_CONFIGS) {
    const dir = path.join(ANDROID_RES, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Standard launcher icon
    const iconPath = path.join(dir, 'ic_launcher.png');
    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toFile(iconPath);
    console.log(`  ✅ ${folder}/ic_launcher.png (${size}x${size})`);

    // Round icon (same source, just circular crop using svg mask)
    const roundPath = path.join(dir, 'ic_launcher_round.png');
    const circleSvg = Buffer.from(
      `<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}" /></svg>`
    );
    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(roundPath);
    console.log(`  ✅ ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  // Also generate Play Store icon (512x512 PNG)
  const playStorePath = path.join(__dirname, '..', 'play-store-icon-512.png');
  await sharp(SOURCE_ICON)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(playStorePath);
  console.log('');
  console.log(`  🏪 play-store-icon-512.png (512x512) — for Play Store listing`);

  // Generate feature graphic template (1024x500 — plain teal background with logo)
  const featureGraphicPath = path.join(__dirname, '..', 'play-store-feature-graphic.png');
  const logoBuffer = await sharp(SOURCE_ICON).resize(200, 200).toBuffer();
  await sharp({
    create: {
      width: 1024,
      height: 500,
      channels: 4,
      background: { r: 13, g: 148, b: 136, alpha: 1 }, // Norla teal #0D9488
    }
  })
    .composite([{
      input: logoBuffer,
      gravity: 'centre',
    }])
    .png()
    .toFile(featureGraphicPath);
  console.log(`  🖼️  play-store-feature-graphic.png (1024x500) — for Play Store listing`);

  console.log('');
  console.log('✨ All icons generated successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Run: npx cap sync android');
  console.log('   2. Open Android Studio and verify icons look correct');
  console.log('   3. Use play-store-icon-512.png for Play Store listing');
  console.log('   4. Use play-store-feature-graphic.png as the Feature Graphic');
}

generateIcons().catch((err) => {
  console.error('❌ Icon generation failed:', err.message);
  process.exit(1);
});
