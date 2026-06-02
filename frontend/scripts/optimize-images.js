const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const imagesToConvert = [
  { src: 'video_chat_experience_1_1778757946493.png', dest: 'video_chat_experience_1_1778757946493.webp' },
  { src: 'global-friends.png', dest: 'global-friends.webp' },
  { src: 'home-support-3d.png', dest: 'home-support-3d.webp' },
  { src: 'global_connection_2_1778758015960.png', dest: 'global_connection_2_1778758015960.webp' },
  { src: 'safe_video_chat_3_1778758050606.png', dest: 'safe_video_chat_3_1778758050606.webp' },
  { src: 'support-3d.png', dest: 'support-3d.webp' }
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function optimizeImages() {
  console.log('⚡ Starting ZoneMeet PageSpeed Asset Optimization...');
  
  // 1. Optimize favicon.png (1.29 MB -> ~3 KB)
  const faviconSrc = path.join(publicDir, 'favicon.png');
  const faviconTemp = path.join(publicDir, 'favicon_temp.png');
  
  if (fs.existsSync(faviconSrc)) {
    const origSize = fs.statSync(faviconSrc).size;
    console.log(`\n⏳ Resizing and compressing favicon.png (Original: ${formatBytes(origSize)})...`);
    
    try {
      await sharp(faviconSrc)
        .resize(48, 48)
        .png({ quality: 80, compressionLevel: 9, adaptiveFiltering: true })
        .toFile(faviconTemp);
      
      const newSize = fs.statSync(faviconTemp).size;
      fs.unlinkSync(faviconSrc);
      fs.renameSync(faviconTemp, faviconSrc);
      
      const savings = ((origSize - newSize) / origSize * 100).toFixed(2);
      console.log(`✅ favicon.png optimized successfully!`);
      console.log(`   Before: ${formatBytes(origSize)}`);
      console.log(`   After:  ${formatBytes(newSize)}`);
      console.log(`   Savings: ${savings}% 🔥`);
    } catch (err) {
      console.error('❌ Error optimizing favicon.png:', err);
    }
  } else {
    console.log('⚠️ favicon.png not found!');
  }

  // 2. Convert large PNGs to WebP (quality 80)
  for (const img of imagesToConvert) {
    const srcPath = path.join(publicDir, img.src);
    const destPath = path.join(publicDir, img.dest);
    
    if (fs.existsSync(srcPath)) {
      const origSize = fs.statSync(srcPath).size;
      console.log(`\n⏳ Converting ${img.src} to WebP (${formatBytes(origSize)})...`);
      
      try {
        await sharp(srcPath)
          .webp({ quality: 80 })
          .toFile(destPath);
        
        const newSize = fs.statSync(destPath).size;
        const savings = ((origSize - newSize) / origSize * 100).toFixed(2);
        console.log(`✅ Created ${img.dest}!`);
        console.log(`   Before: ${formatBytes(origSize)}`);
        console.log(`   After:  ${formatBytes(newSize)}`);
        console.log(`   Savings: ${savings}% 🔥`);
      } catch (err) {
        console.error(`❌ Error converting ${img.src}:`, err);
      }
    } else {
      console.log(`⚠️ Source image ${img.src} not found!`);
    }
  }
  
  console.log('\n🎉 Asset optimization complete!');
}

optimizeImages();
