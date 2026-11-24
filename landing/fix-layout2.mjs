import fs from 'fs';

let content = fs.readFileSync('C:/Users/HP/Desktop/Finance Aduit Pro/landing/index.html', 'utf8');

// Remove double blank lines
content = content.replace(/\n\n\n/g, '\n\n');

fs.writeFileSync('C:/Users/HP/Desktop/Finance Aduit Pro/landing/index.html', content);
console.log('Double blank lines fixed');