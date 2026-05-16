const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'frontend/pages');
const searchString = 'http://localhost:5000';
const replaceString = 'https://meetzone-backend.onrender.com';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(searchString)) {
        content = content.replace(new RegExp(searchString, 'g'), replaceString);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.js')) {
            replaceInFile(fullPath);
        }
    }
}

walkDir(directoryPath);
console.log('Replacement complete.');
