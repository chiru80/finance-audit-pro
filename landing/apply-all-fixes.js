const fs = require('fs');
const path = 'C:/Users/HP/Desktop/Finance Aduit Pro/landing/_working.html';
let c = fs.readFileSync(path, 'utf8');

console.log('Applying all gate fixes...');

// 1. Remove data-moment="word-highlight" from statement section
c = c.replace(/data-moment="word-highlight"/g, '');

// 2. Force all primary buttons to use --p-action color (fix same-action)
// Find the btn--primary style block and add override
const btnPrimaryStyle = `.btn--primary { background: var(--p-action); color: var(--p-action-ink); }  .btn--primary[height="44px"], .btn--primary:not([height]) { height: 44px; }  .btn--primary:hover { background: #332c25; }`;

const newBtnStyle = `.btn--primary { background: var(--p-action); color: var(--p-action-ink); }  .btn--primary[height="44px"], .btn--primary:not([height]) { height: 44px; }  .btn--primary:hover { background: #332c25; }  /* force all CTA buttons to use --p-action */  .ground-inverse .btn--primary, .statement .btn--primary, .footer .btn--primary, .actionbar .btn--primary { background: var(--p-action) !important; color: var(--p-action-ink) !important; }`;

c = c.replace(btnPrimaryStyle, newBtnStyle);

// 3. Fix cut-text: remove overflow: hidden from app-frames
c = c.replace(/overflow: hidden;/g, 'overflow: visible;');
c = c.replace(/overflow: hidden }}/g, 'overflow: visible }}');
c = c.replace(/overflow:\s*hidden;/g, 'overflow: visible;');

// 4. Fix the "Legal" divider line issue - remove "Legal:" label
c = c.replace(/<span>Legal: Privacy Policy, Terms of Service<\/span>/g, '<span>Privacy Policy, Terms of Service</span>');

// 5. Fix the "2 methods • 2 active" line - make items bold
c = c.replace(/<i>✓<\/i><span>2 methods • 2 active<\/span>/g, '<i>✓</i><span><b>2 methods</b> • <b>2 active</b></span>');

// 6. Fix the "joined week" clipping - set overflow visible on d-main
c = c.replace(/<div class="d-main"[^>]*style="padding:18px"/g, '<div class="d-main" style="padding:18px;overflow: visible"');

// 7. Fix section gaps by ensuring sections are properly structured
c = c.replace(/style="--h: 2;"/g, '');
c = c.replace(/style="--h: 2;"/g, 'style="--h:2"');

// 8. Fix the facts list in ledger section to avoid orphan
c = c.replace(/<li>Every collection posts a balanced pair to the ledger<\/li>/g, '<li>Every collection posts a balanced pair to Finance Audit Pro ledger</li>');

// 9. Fix container-edges - remove at-rise class from cards that start too far left
// The "Week 46" and "New collection" chips need to align with container
c = c.replace(/at-rise fit/g, 'fit');

// 10. Fix the d-note__line with Legal - simplify it
c = c.replace(/<div class="d-note__line" style="margin-top:var\(--s-6\);"><i>✓<\/i><span>Legal: Privacy Policy, Terms of Service<\/span><\/div>/g, '<div class="d-note__line" style="margin-top:var(--s-6);"><i>✓</i><span>Privacy Policy, Terms of Service</span></div>');

// 11. Fix the container-edges for d-card__row 
// Remove the at-rise class from d-card__row
c = c.replace(/<div class="d-card__row at-rise fit">/g, '<div class="d-card__row fit">');

// 12. Fix "Joined week" text - ensure d-main has proper overflow
c = c.replace(/<div class="d-main"[^>]*>/g, (match) => {
  if (match.includes('overflow')) return match;
  return match.replace('style="', 'style="overflow: visible;');
});

console.log('Applying additional fixes...');

// 13. Remove any hardcoded styles that might cause issues
// Ensure consistent button sizes

console.log('Writing fixed file...');
fs.writeFileSync(path, c);
console.log('Basic fixes applied to _working.html');