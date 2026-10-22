$ErrorActionPreference = "Stop"
Set-Location "C:\Users\Hp\.gemini\antigravity\scratch\clinic-care-app"

$token = (& gh auth token).Trim()
if (-not $token) {
    Write-Error "Could not retrieve gh auth token"
    exit 1
}

$remotes = git remote
if ($remotes -contains "pages") {
    git remote remove pages
}

git remote add pages "https://${token}@github.com/rahibhussain1988-svg/rahibhussain1988-svg.github.io.git"
git push -u pages main

# Reset remote URL to clean URL
git remote set-url pages "https://github.com/rahibhussain1988-svg/rahibhussain1988-svg.github.io.git"
Write-Host "Push completed successfully and remote URL reset."
