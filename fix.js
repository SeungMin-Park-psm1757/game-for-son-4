const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    // We are looking for literal backslash followed by backtick
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(file, content);
}

fixFile('src/shop.ts');
fixFile('src/ui.ts');
