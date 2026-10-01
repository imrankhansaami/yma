import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const imageDirs = [
  join(projectRoot, 'src/assets/images'),
  join(projectRoot, 'public'),
];

const outputDir = join(projectRoot, 'src/assets/images/optimized');
const publicOutputDir = join(projectRoot, 'public/optimized');

// Create output directories
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
if (!existsSync(publicOutputDir)) mkdirSync(publicOutputDir, { recursive: true });

const imageExtensions = ['.png', '.jpg', '.jpeg'];

async function optimizeImage(inputPath, outputPath) {
  const ext = extname(inputPath).toLowerCase();
  const name = basename(inputPath, ext);

  try {
    const inputStats = statSync(inputPath);
    const inputSizeKB = (inputStats.size / 1024).toFixed(2);

    // Optimize as WebP (best compression for web)
    const webpPath = join(dirname(outputPath), `${name}.webp`);
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(webpPath);

    const webpStats = statSync(webpPath);
    const webpSizeKB = (webpStats.size / 1024).toFixed(2);
    const savings = ((1 - webpStats.size / inputStats.size) * 100).toFixed(1);

    console.log(`✓ ${basename(inputPath)}`);
    console.log(`  Original: ${inputSizeKB} KB → WebP: ${webpSizeKB} KB (${savings}% smaller)`);

    // Also create optimized PNG/JPG for fallback
    if (ext === '.png') {
      const pngPath = join(dirname(outputPath), `${name}.png`);
      await sharp(inputPath)
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(pngPath);
      const pngStats = statSync(pngPath);
      console.log(`  Optimized PNG: ${(pngStats.size / 1024).toFixed(2)} KB`);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      const jpgPath = join(dirname(outputPath), `${name}.jpg`);
      await sharp(inputPath)
        .jpeg({ quality: 80 })
        .toFile(jpgPath);
      const jpgStats = statSync(jpgPath);
      console.log(`  Optimized JPG: ${(jpgStats.size / 1024).toFixed(2)} KB`);
    }

    return {
      original: inputStats.size,
      optimized: webpStats.size,
    };
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error.message);
    return null;
  }
}

async function processDirectory(dir, outDir) {
  const files = readdirSync(dir);
  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = statSync(filePath);

    if (stats.isFile()) {
      const ext = extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        // Only optimize large images (> 100KB)
        if (stats.size > 100 * 1024) {
          const result = await optimizeImage(filePath, join(outDir, file));
          if (result) {
            totalOriginal += result.original;
            totalOptimized += result.optimized;
          }
        }
      }
    }
  }

  return { totalOriginal, totalOptimized };
}

async function main() {
  console.log('🖼️  Image Optimization Script\n');
  console.log('Processing large images (> 100KB)...\n');

  let grandTotalOriginal = 0;
  let grandTotalOptimized = 0;

  // Process src/assets/images
  console.log('📁 src/assets/images:');
  const assetsResult = await processDirectory(imageDirs[0], outputDir);
  grandTotalOriginal += assetsResult.totalOriginal;
  grandTotalOptimized += assetsResult.totalOptimized;

  console.log('\n📁 public:');
  const publicResult = await processDirectory(imageDirs[1], publicOutputDir);
  grandTotalOriginal += publicResult.totalOriginal;
  grandTotalOptimized += publicResult.totalOptimized;

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Original total: ${(grandTotalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Optimized total: ${(grandTotalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total savings: ${((1 - grandTotalOptimized / grandTotalOriginal) * 100).toFixed(1)}%`);
  console.log('\n✅ Optimized images saved to:');
  console.log(`   ${outputDir}`);
  console.log(`   ${publicOutputDir}`);
  console.log('\n⚠️  Note: Update your imports to use the optimized images.');
  console.log('   Consider using WebP format with PNG/JPG fallback for best results.');
}

main().catch(console.error);
