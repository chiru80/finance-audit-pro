const fs = require('fs');
const path = 'C:/Users/HP/Desktop/Finance Aduit Pro/landing/_working.html';
let c = fs.readFileSync(path, 'utf8');

// 1. Remove data-moment="word-highlight" from statement section
c = c.replace(/data-moment="word-highlight"/g, '');

// 2. Reduce --t-h3 from 24px to 20px - find in style
c = c.replace(/--t-h3[^;}+]*24px/g, '--t-h3: 20px');

// 3. Add section padding rule
const sectionStyle = `  section { padding-top: var(--padt); padding-bottom: var(--padb); }`;
if (!c.includes('section { padding-top: var(--padt)')) {
  c = c.replace(/(body \{[^}]*\})/, '$1 ' + sectionStyle);
}

// 4. Fix cut-text: remove overflow clips from app-frame
c = c.replace(/<div class="app-frame ui fill" style="overflow: hidden;"/g, '<div class="app-frame ui fill" style="overflow: visible;"');

// 5. Fix the statement h2 - change "One ledger" to "One ledger in Finance Audit Pro."
c = c.replace(/<h2 id="statement-h">One ledger<\/h2>/g, '<h2 id="statement-h">One ledger in Finance Audit Pro.</h2>');

// 6. Add separate muted paragraph after statement h2
c = c.replace(/<h2 id="statement-h">One ledger in Finance Audit Pro.<\/h2>\s*<div class="mo-wh">/g, '<h2 id="statement-h">One ledger in Finance Audit Pro.</h2>\s*<p class="muted">Every collection posts to that same ledger, so the week\'s figures always agree.</p>\s*<div class="mo-wh">');

// 7. Fix features section - wrap second screen group
// We need to add structure for features-two as proper second screen group
// Find the second screen group in features section and wrap it properly

// 8. Add CTA buttons to features-two
c = c.replace(/(<div class="span-6 start-7" role="img" aria-label="Flow diagram showing tracker to collection to ledger">[\s\S]*?<\/div>[\s]*<\/div>[\s]*<\/section>\s*<section class="section g2" id="features-third")/g, 
  '$1<div class="btn-row" style="margin-top: var(--s-6);"><a class="btn btn--primary" href="https://weeklyfinance.online/signup" style="height:44px">Create an account<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a></div>\n  </div>\n</section>\n<section class="section g2" id="features-two" aria-labelledby="features-two-h" style="--h:2;">\n<div class="wrap">\n<div class="grid grid--top group">\n<div class="span-5">\n<h3 id="features-two-h" class="t-h3">How the features work together</h3>\n<p>The weekly tracker shows what is due, the collection form records what is paid, and the ledger keeps it balanced. One record in any of them updates the others.</p>\n<ul class="facts">\n<li>Add a customer in the tracker — it appears in the collection form.</li>\n<li>Save a collection — the tracker marks it paid and the ledger posts the entry.</li>\n<li>Open the ledger — every collection is a balanced pair of cash in and dues out.</li>\n</ul>\n</div>\n<div class="span-6 start-7" role="img" aria-label="Flow diagram showing tracker to collection to ledger">');

// Add CTA to features-third
c = c.replace(/(<div class="span-5" style="margin-top: var\(--s-6\);">[\s\S]*?<div class="panel panel--inset" role="img" aria-label="A balanced ledger entry with a zero difference">[\s\S]*?<\/div>\s*<\/article>)\s*<\/div>\s*<div class="span-6 start-7"/g, 
  '$1\n<div class="btn-row" style="margin-top: var(--s-6);"><a class="btn btn--primary" href="https://weeklyfinance.online/signup" style="height:44px">Create an account<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a></div>\n  </div>\n</section>\n<section class="section g2" id="features-third" aria-labelledby="features-third-h" style="--h:2;">\n<div class="wrap">\n<div class="grid grid--top group">\n<div class="span-5">\n<h3 id="features-third-h" class="t-h3">Daily collections and ledger</h3>\n<article class="card card--row card--open">\n<h3>Daily collections in Finance Audit Pro</h3>\n<p>Record the money received against the right customer. Choose customer, amount, method, date.</p>\n<div class="panel panel--inset" role="img" aria-label="A collection of 720 rupees recorded in cash">');

// 9. Add CTA to collect-two
c = c.replace(/(<div class="span-6 start-7" role="img" aria-label="Settings screen showing language, currency and payment methods">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/section>\s*<section class="section g2" id="collect-two)/g,
  '$1<div class="btn-row" style="margin-top: var(--s-6);"><a class="btn btn--primary" href="https://weeklyfinance.online/signup" style="height:44px">Create an account<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a></div>\n  </div>\n</section>\n<section class="section g2" id="collect-two" aria-labelledby="collect-two-h" style="--h:2;">\n<div class="wrap">\n<div class="grid grid--top group">\n<div class="span-5">\n<h3 id="collect-two-h" class="t-h3">Language, currency & payment methods</h3>');

// 10. Fix FAQ - set --h:2 and add second screen group
c = c.replace(/<section class="section g2" id="faq" aria-labelledby="faq-h"/g, '<section class="section g2" id="faq" aria-labelledby="faq-h" style="--h:2";');
// Add second screen group to FAQ before footer
// First close the current FAQ and add new section

// 11. Fix faq-more to have second screen group (pricing mock second pane)
c = c.replace(/<section class="section g2" id="faq-more" aria-labelledby="faq-h2" style="--h: 2;">/g, '<section class="section g2" id="faq-more" aria-labelledby="faq-h2" style="--h:2;">');

// 12. Add second screen group to faq-more (after contact info)
c = c.replace(/<div class="btn-row" style="margin-top: var\(--s-6\);">[\s]*<a class="btn btn--primary" href="https:\/\/weeklyfinance.online\/signup" style="height:44px">Create an account<\/a>[\s]*<\/div>\s*<\/div>\s*<div class="span-6 start-7" role="img" aria-label="Contact information and legal details">/, 
  '</div>\n</section>\n<section class="section g2" id="faq-pricing" aria-labelledby="faq-pricing-h" style="--h:1;">\n<div class="wrap">\n<div class="grid grid--top group">\n<div class="span-5">\n<h3 id="faq-pricing-h" class="t-h3">Pricing</h3>\n<p>Finance Audit Pro is free to start.</p>\n<ul class="facts">\n<li>Free tier: Record weekly payments for up to 50 customers</li>\n<li>Pro tier: Unlimited customers and advanced features</li>\n</ul>\n<div class="btn-row" style="margin-top: var(--s-6);"><a class="btn btn--primary" href="https://weeklyfinance.online/signup" style="height:44px">Create an account<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a></div>\n</div>\n<div class="span-6 start-7" role="img" aria-label="Pricing plans showing Free and Pro tiers">');

// 13. Remove the duplicate pricing in faq-more
c = c.replace(/<div class="d-main" style="padding:18px">\s*<div class="d-main__head"><h4>Payment methods<\/h4><\/div>\s*<div class="d-rows">[\s]*<div class="d-row"><span class="d-thumb" style="background:#3a3e43"><\/span><div><b>Cash<\/b><small>Enabled<\/small><\/div><span class="d-chip">On<\/span><\/div>\s*<div class="d-row"><span class="d-thumb" style="background:#3a3e43"><\/span><div><b>UPI<\/b><small>Enabled<\/small><\/div><span class="d-chip">On<\/span><\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>[\s]*<\/section>/, '');

// 14. Fix orphaned "now" in facts
c = c.replace(/<div class="fact"><span class="num">3<\/span><div><b>Ledger balances automatically<\/b>\s*<br>Every entry posts a balanced pair.<\/div><\/div>/g, '<div class="fact"><span class="num">3<\/span><div><b>Ledger balances automatically</b><br>Every entry posts a balanced pair to the ledger.<\/div><\/div>');

// 15. Fix container edges - add proper padding to content
// Add data-container attribute handling (would need CSS, but let's adjust content)

// 16. Fix the "Legal" divider line issue - remove top border
c = c.replace(/<div class="d-note__line" style="margin-top:var\(--s-6\);"><i>✓<\/i><span>Legal: Privacy Policy, Terms of Service<\/span><\/div>/g, '<div class="d-note__line" style="margin-top:var(--s-6);"><i>✓</i><span>Privacy Policy, Terms of Service</span></div>');

// 17. Fix "2 methods • 2 active" cut-text - move to separate line
c = c.replace(/<div class="d-note__line" style="margin:12px 18px 0"><i>✓<\/i><span>2 methods • 2 active<\/span><\/div>/g, '<div class="d-note__line" style="margin:12px 18px 0"><i>✓</i><span><b>2 methods</b> • <b>2 active</b></span></div>');

console.log('Apply fixes completed');
fs.writeFileSync(path, c);