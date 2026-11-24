const fs = require('fs');
const path = 'C:/Users/HP/Desktop/Finance Aduit Pro/landing/index.html';
let html = fs.readFileSync(path, 'utf8');

// Track all fixes applied
const fixes = [];

// Fix 1: Change "How it works" link to name the product (copy-headline)
if (html.includes('href="#how">How it works</a>')) {
  html = html.replace('href="#how">How it works</a>', 'href="#how">How it works</a>');
  fixes.push('copy-headline: How it works already exists');
}

// Fix 2: Add mobile CSS for nav fixes in head
const styleStart = html.indexOf('<style id="premium-theme">');
const styleEnd = html.indexOf('</style>') + '</style>'.length;

if (styleStart > 0 && styleEnd > styleStart) {
  const existingStyles = html.substring(styleStart, styleEnd);
  
  // Add mobile fixes
  const mobileFixes = `

/* Mobile and accessibility fixes */
@media (max-width: 639px) {
  .chev { flex-shrink: 0; }
  .nav__links { position: fixed; top: 72px; left: 0; right: 0; background: var(--p-bg); border-bottom: 1px solid var(--p-border); max-height: calc(100vh - 72px); overflow-y: auto; z-index: 50; display: none; }
  .nav__links.is-open { display: flex; flex-direction: column; }
  .nav__item { width: 100%; }
  .menu-card { flex-shrink: 0; }
  .btn--primary { width: 100%; max-width: 280px; }
  main#top { padding-top: 72px !important; }
  .hero { padding-top: 0 !important; margin-top: -72px; }
  header.nav { height: 72px; }
  .nav__toggle { display: block !important; }
  .nav__actions { display: none; }
}

@media (min-width: 640px) {
  .nav__toggle { display: none; }
}

:focus { outline: 2px solid var(--p-action); outline-offset: 2px; }
:focus-visible { outline: 2px solid var(--p-action); outline-offset: 2px; border-radius: var(--r-sm); }
a:focus-visible, button:focus-visible { outline: 2px solid var(--p-action); outline-offset: 2px; border-radius: var(--r-sm); }
`;
  
  const newStyles = existingStyles + mobileFixes;
  html = html.substring(0, styleStart) + newStyles + html.substring(styleEnd);
  fixes.push('Added mobile CSS for nav, focus, header fixes');
}

// Fix 3: Ensure hero height fits one screen
html = html.replace(
  '<section class="hero hero--collage"',
  '<section class="hero hero--collage" style="min-height: 100svh">'
);
fixes.push('hero-screen: Added min-height');

// Fix 4: Fix section-height - ensure sections are 1-2 screens
// This is handled by the layout kit, but we need to ensure --h is set properly
html = html.replace(
  'id="faq" aria-labelledby="faq-h" style="--h:2"',
  'id="faq" aria-labelledby="faq-h" style="--h:1"'
);
fixes.push('section-height: Fixed faq section to 1 screen');

// Fix 5: Fix container-edges - add text alignment fix
if (!html.includes('.wrap { padding-left: var(--s-6)')) {
  const styleBefore = '</style><link';
  const containerFix = `
.wrap { padding-left: var(--s-6); padding-right: var(--s-6); }
@media (min-width: 1024px) { .wrap { padding-left: var(--s-8); padding-right: var(--s-8); } }
`;
  html = html.replace(styleBefore, containerFix + styleBefore);
  fixes.push('container-edges: Added padding to wrap');
}

// Fix 6: Fix section-air - ensure consistent gaps between sections
if (!html.includes('main > section')) {
  const styleBefore = '</style><link';
  const sectionFix = `
main > section:not(.hero) { margin-top: calc(var(--s-8) * 2); }
`;
  html = html.replace(styleBefore, sectionFix + styleBefore);
  fixes.push('section-air: Added consistent section margins');
}

// Fix 7: Fix copy-headline - "See how it works" needs to name the product
html = html.replace(
  'href="#how">See how it works</a>',
  'href="#how">See how Finance Audit Pro works</a>'
);
fixes.push('copy-headline: Added product name');

// Fix 8: Fix cut-text issues - ensure d-note__line and d-row elements don't clip
html = html.replace(
  'style="overflow: visible;"',
  'style="overflow: visible; white-space: normal;"'
);
fixes.push('cut-text: Added white-space normal to prevent clipping');

// Fix 9: Fix hero-fill
html = html.replace(
  'hero--collage h1 { font-size: var(--t-h1); max-width: 22ch; }',
  'hero--collage h1 { font-size: var(--t-h1); max-width: 22ch; } .hero--collage .hero__text { min-height: calc(100vh - 72px); display: flex; align-items: center; } .hero__lead { max-width: 44ch; }'
);
fixes.push('hero-fill: Added hero text min-height');

// Fix 10: Fix links - ensure external links have proper context
if (!html.includes('https://weeklyfinance.online/signup" rel="nofollow noopener"')) {
  html = html.replace(
    'href="https://weeklyfinance.online/signup"',
    'href="https://weeklyfinance.online/signup" rel="nofollow noopener"'
  );
  fixes.push('links: Added rel attributes');
}

// Write the updated HTML
fs.writeFileSync(path, html);

console.log('Fixes applied:');
fixes.forEach(f => console.log('  -', f));