const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const mobileAssets = [
  { src: 'video_chat_experience_1_1778757946493.png', dest: 'video_chat_experience_1_1778757946493_mobile.webp', width: 480 },
  { src: 'global-friends.png', dest: 'global-friends_mobile.webp', width: 480 },
  { src: 'global_connection_2_1778758015960.png', dest: 'global_connection_2_1778758015960_mobile.webp', width: 480 },
  { src: 'home-support-3d.png', dest: 'home-support-3d_mobile.webp', width: 360 },
  { src: 'safe_video_chat_3_1778758050606.png', dest: 'safe_video_chat_3_1778758050606_mobile.webp', width: 360 }
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function generateMobileAssets() {
  console.log('⚡ Starting Mobile WebP Asset Optimization...');
  
  for (const img of mobileAssets) {
    const srcPath = path.join(publicDir, img.src);
    const destPath = path.join(publicDir, img.dest);
    
    if (fs.existsSync(srcPath)) {
      const origSize = fs.statSync(srcPath).size;
      console.log(`\n⏳ Converting & Resizing ${img.src} to WebP width ${img.width}px (Original: ${formatBytes(origSize)})...`);
      
      try {
        await sharp(srcPath)
          .resize(img.width)
          .webp({ quality: 75 })
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
  
  console.log('\n🎉 Mobile asset optimization complete!');
}

generateMobileAssets();
