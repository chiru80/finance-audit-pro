import fs from 'fs';

const content = fs.readFileSync('C:/Users/HP/Desktop/Finance Aduit Pro/landing/index.html', 'utf8');

// Remove the ledger section (between collect and features)
const pattern = /\n  <section class="section section-air" id="ledger"[^>]*style="--h:1">[\s\S]*?<\/section>\n/;
const newContent = content.replace(pattern, '\n');

fs.writeFileSync('C:/Users/HP/Desktop/Finance Aduit Pro/landing/index.html', newContent);

console.log('Ledger section removed');