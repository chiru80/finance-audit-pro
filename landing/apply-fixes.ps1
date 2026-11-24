$h = Get-Content "C:\Users\HP\Desktop\Finance Aduit Pro\landing\index.html" -Raw

# Fix 1: Add </main> before footer (one-section FAIL - footer inside main)
$h = $h -replace '</div></footer><nav class="actionbar"', '</div></footer></main><nav class="actionbar"'

# Fix 2: Change "Log in" button in actionbar from btn--primary to btn--secondary
$h = $h -replace '<a class="btn btn--primary" href="https://weeklyfinance.online/login" style="height:44px">Log in</a>', '<a class="btn btn--secondary" href="https://weeklyfinance.online/login" style="height:44px">Log in</a>'

# Fix 3: Fix copy-headings
$h = $h -replace '<h3 id="features-third-h" class="t-h3">Daily collections and ledger</h3>', '<h3 id="features-third-h" class="t-h3">Daily collections and ledger in Finance Audit Pro</h3>'

Set-Content "C:\Users\HP\Desktop\Finance Aduit Pro\landing\index.html" $h