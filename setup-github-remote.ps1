$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$log = Join-Path $PSScriptRoot "setup-github-log.txt"

function Log($msg) {
    $line = "$(Get-Date -Format o) $msg"
    $line | Tee-Object -FilePath $log -Append
}

"" | Out-File $log -Encoding utf8
Log "Starting GitHub setup for tatisar"

# Never push local secrets
if (-not (Select-String -Path .gitignore -Pattern '^env\.local$' -Quiet)) {
    Add-Content .gitignore "`nenv.local`n"
    Log "Added env.local to .gitignore"
}

if (git ls-files --error-unmatch env.local 2>$null) {
    git rm --cached env.local 2>&1 | ForEach-Object { Log $_ }
    Log "Removed env.local from git index (file kept on disk)"
}

$upstreamUrl = "https://github.com/lab10-org/10X-Builders-langchain-agent.git"
$originUrl = "https://github.com/tatisar/10X-Builders-langchain-agent.git"

$remotes = git remote 2>&1
if ($remotes -match '^origin$') {
    $currentOrigin = (git remote get-url origin).Trim()
    if ($currentOrigin -eq $upstreamUrl) {
        git remote rename origin upstream 2>&1 | ForEach-Object { Log $_ }
        Log "Renamed origin -> upstream (lab10-org)"
    } elseif ($currentOrigin -ne $originUrl) {
        git remote remove origin 2>&1 | ForEach-Object { Log $_ }
        Log "Removed old origin: $currentOrigin"
    }
}

if (-not (git remote) -match 'upstream') {
    git remote add upstream $upstreamUrl 2>&1 | ForEach-Object { Log $_ }
    Log "Added upstream remote"
}

if (-not (git remote) -match '^origin$') {
    git remote add origin $originUrl 2>&1 | ForEach-Object { Log $_ }
    Log "Added origin -> $originUrl"
} else {
    git remote set-url origin $originUrl 2>&1 | ForEach-Object { Log $_ }
    Log "Set origin URL -> $originUrl"
}

Log "Remotes:"
git remote -v 2>&1 | ForEach-Object { Log $_ }

Log "gh auth status:"
gh auth status 2>&1 | ForEach-Object { Log $_ }

$repoExists = $false
try {
    gh repo view tatisar/10X-Builders-langchain-agent 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $repoExists = $true }
} catch {}

if (-not $repoExists) {
    Log "Creating GitHub repo tatisar/10X-Builders-langchain-agent ..."
    gh repo create tatisar/10X-Builders-langchain-agent --public --source=. --remote=origin --description "LangChain agent fork (10X Builders)" 2>&1 | ForEach-Object { Log $_ }
} else {
    Log "Repo already exists on GitHub"
}

Log "Pushing main to origin..."
git push -u origin main 2>&1 | ForEach-Object { Log $_ }

Log "Done. ExitCode push=$LASTEXITCODE"
