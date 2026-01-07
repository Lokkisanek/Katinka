#!/usr/bin/env node
// Converts images from assets/photos -> assets/photos-new as WebP and writes a manifest.json
// Usage:
//   npm install
//   npm run convert-photos

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

async function convertAll() {
  const repoRoot = path.resolve(__dirname, '..');
  const inDir = path.join(repoRoot, 'assets', 'photos');
  const outDir = path.join(repoRoot, 'assets', 'photos-new');
  await fs.mkdir(outDir, { recursive: true });

  const entries = await fs.readdir(inDir);
  const imageFiles = entries.filter(f => /\.(jpe?g|png|gif|webp|heic)$/i.test(f));
  const outList = [];

  console.log(`Found ${imageFiles.length} files in ${inDir}`);

  for (const file of imageFiles) {
    const inPath = path.join(inDir, file);
    const name = path.parse(file).name;
    const outName = `${name}.webp`;
    const outPath = path.join(outDir, outName);
    try {
      // sharp will read many formats including HEIC when libvips/libheif support is present
      await sharp(inPath)
        .webp({ quality: 90 })
        .toFile(outPath);
      console.log(`Converted: ${file} -> ${outName}`);
      outList.push(outName);
    } catch (err) {
      console.warn(`Failed to convert ${file}, skipping. Error:`, err.message || err);
    }
  }

  // write manifest
  const manifestPath = path.join(outDir, 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(outList, null, 2), 'utf8');
  console.log(`Wrote manifest with ${outList.length} entries to ${manifestPath}`);
}

convertAll().catch(err => {
  console.error('Conversion failed:', err);
  process.exitCode = 1;
});
