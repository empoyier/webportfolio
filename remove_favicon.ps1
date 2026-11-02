Get-ChildItem -Path 'd:\Codes\Portfolio2' -Recurse -Filter *.html | ForEach-Object {
    $path = $_.FullName
    $lines = Get-Content $path | Where-Object { $_ -notmatch '(?i)<link\s+rel=["'']icon["'']\s+type=["'']image/png["'']\s+href=["'']faviconandlastpageimg\.png["'']' }
    Set-Content -Path $path -Value $lines -Encoding UTF8
    Write-Host "Removed favicon from $path"
}
