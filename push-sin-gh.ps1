# Sube el proyecto a GitHub SIN GitHub CLI (gh).
# Antes: crea el repo vacio en https://github.com/new
#   - Owner: tatisar
#   - Name: 10X-Builders-langchain-agent
#   - NO marques "Add a README" (debe estar vacio)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "Verificando git..." -ForegroundColor Cyan
git --version

if (-not (Select-String -Path .gitignore -Pattern '^env\.local$' -Quiet)) {
    Add-Content .gitignore "`nenv.local`n"
    Write-Host "Anadido env.local a .gitignore" -ForegroundColor Yellow
}

if (git ls-files --error-unmatch env.local 2>$null) {
    git rm --cached env.local
    Write-Host "env.local quitado del indice (sigue en disco)" -ForegroundColor Yellow
}

$upstreamUrl = "https://github.com/lab10-org/10X-Builders-langchain-agent.git"
$originUrl = "https://github.com/tatisar/10X-Builders-langchain-agent.git"

if (git remote) -notcontains "upstream" {
    git remote add upstream $upstreamUrl
}
if (git remote) -contains "origin" {
    git remote set-url origin $originUrl
} else {
    git remote add origin $originUrl
}

Write-Host "`nRemotes:" -ForegroundColor Cyan
git remote -v

$status = git status --porcelain
if ($status) {
    Write-Host "`nHay cambios sin commit. Haciendo commit de .gitignore si aplica..." -ForegroundColor Yellow
    git add .gitignore
    if (git diff --cached --quiet) {
        Write-Host "Nada que commitear en .gitignore" -ForegroundColor Gray
    } else {
        git commit -m "Ignore env.local to keep API keys out of the repo"
    }
}

Write-Host "`nSubiendo a origin main..." -ForegroundColor Cyan
Write-Host "Si pide usuario/contrasena, usa un Personal Access Token como contrasena." -ForegroundColor Yellow
git push -u origin main

Write-Host "`nListo. Repo: https://github.com/tatisar/10X-Builders-langchain-agent" -ForegroundColor Green
