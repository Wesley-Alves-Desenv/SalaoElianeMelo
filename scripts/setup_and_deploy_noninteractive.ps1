# Non-interactive setup script
$repoName = 'salaoelianemelo'
Write-Output "Repo: $repoName"

if (-not (Test-Path .git)) {
  git init
  git branch -M main
  Write-Output 'git initialized'
} else {
  Write-Output 'git exists'
}

git add .
try {
  $hasHead = git rev-parse --verify HEAD 2>$null
} catch {
  $hasHead = $null
}
if (-not $hasHead) {
  git commit -m 'chore: initial commit'
} else {
  Write-Output 'commit already exists'
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Output 'gh CLI found — attempting to create repo and push'
  try {
    gh repo create $repoName --private --source=. --remote=origin --push --confirm
    Write-Output 'gh create succeeded'
  } catch {
    Write-Output "gh create failed: $($_.Exception.Message)"
  }
} else {
  Write-Output 'gh CLI not found — please run gh auth login and then run: gh repo create <name> --private --source=. --remote=origin --push'
}

try {
  $origin = git remote get-url origin
  Write-Output "origin: $origin"
} catch {
  Write-Output 'no origin configured'
}

Write-Output 'done'