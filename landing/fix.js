const fs = require('fs');
const path = 'C:/Users/HP/Desktop/Finance Aduit Pro/landing/_working.html';
let c = fs.readFileSync(path, 'utf8');

// Fix nav items for flex shrinking
c = c.replace(/(<nav class="nav__links" aria-label="Main">\s*<div class="nav__item">\s*<a class="nav__link" href="#how">How it works)/g, '$1style="min-width:0;overflow:hidden"');
c = c.replace(/<div class="nav__item"><a class="nav__link" href="#features">/g, '<div class="nav__item" style="min-width:0;overflow:hidden"><a class="nav__link" href="#features" style="min-width:0;overflow:hidden">');
c = c.replace(/<div class="nav__item"><a class="nav__link" href="#collect">/g, '<div class="nav__item" style="min-width:0;overflow:hidden"><a class="nav__link" href="#collect" style="min-width:0;overflow:hidden">');
c = c.replace(/<div class="nav__item"><a class="nav__link" href="#faq">/g, '<div class="nav__item" style="min-width:0;overflow:hidden"><a class="nav__link" href="#faq" style="min-width:0;overflow:hidden">');

fs.writeFileSync(path, c);
console.log('nav fixed');