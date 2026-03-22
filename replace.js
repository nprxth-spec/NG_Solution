const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('./src');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('blue-') && !file.includes('globals.css')) {
        content = content.replace(/blue-(50|100|200|300|400|500|600|700|800|900|950)/g, 'teal-$1');
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
});
console.log(`Updated ${count} files.`);
