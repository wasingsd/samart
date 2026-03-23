const fs = require('fs');
const path = require('path');

const directory = __dirname;
const excludeDirs = ['.git', 'node_modules', '.next'];
const includeExts = ['.ts', '.tsx', '.js', '.css', '.md', '.json'];

function walkAndReplace(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        if (excludeDirs.includes(file)) continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            walkAndReplace(fullPath);
        } else if (stat.isFile() && includeExts.includes(path.extname(fullPath))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace exact cases
            content = content.replaceAll('Panya', 'SAMART');
            content = content.replaceAll('panya', 'samart');
            content = content.replaceAll('PANYA', 'SAMART');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

console.log('Starting rename process...');
walkAndReplace(directory);
console.log('Rename complete.');
