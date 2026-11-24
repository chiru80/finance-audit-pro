$raw = [System.IO.File]::ReadAllText("C:\Users\HP\Desktop\Finance Aduit Pro\landing\index.html")
$pretty = $raw -replace '>\s+<', "`n<"
[System.IO.File]::WriteAllText("C:\Users\HP\Desktop\Finance Aduit Pro\landing\_pretty.html", $pretty)
"done"