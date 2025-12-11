# Setup and deploy script (PowerShell)
# Pre-requisitos: gh (GitHub CLI) instalado e autenticado (opcional), vercel CLI instalado e autenticado (opcional)
# Editar as variáveis abaixo antes de rodar se desejar definí-las estaticamente

$repoName = Read-Host "Nome do repositório no GitHub (ex: salao-eliane-melo)"
$visibility = Read-Host "Visibilidade (public/private)"; if (-not $visibility) { $visibility = 'private' }
$useGh = Read-Host "Usar GitHub CLI (gh) para criar o repo? (y/n)"; if ($useGh -eq 'y') { $useGh = $true } else { $useGh = $false }
$doVercel = Read-Host "Executar deploy no Vercel ao final? (y/n)"; if ($doVercel -eq 'y') { $doVercel = $true } else { $doVercel = $false }

Write-Host "Iniciando..." -ForegroundColor Cyan

# 1) Inicializar git se necessário
if (-not (Test-Path .git)) {
    git init
    git checkout -b main
    git add .
    git commit -m "Initial commit"
} else {
    Write-Host "Repositório Git já inicializado." -ForegroundColor Yellow
}

# 2) Criar repositório no GitHub (opcional com gh)
if ($useGh) {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Host "gh CLI não encontrado. Instale e autentique com 'gh auth login'" -ForegroundColor Red
    } else {
        gh repo create $repoName --$visibility --source=. --remote=origin --push
    }
} else {
    Write-Host "Por favor crie o repositório manualmente no GitHub e adicione o remote origin." -ForegroundColor Yellow
    $remote = Read-Host "URL do remote (ex: https://github.com/USER/$repoName.git)"
    if ($remote) { git remote add origin $remote; git push -u origin main }
}

# 3) Deploy no Vercel (opcional)
if ($doVercel) {
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "Vercel CLI não encontrado. Instale com 'npm i -g vercel' e autentique com 'vercel login'" -ForegroundColor Red
    } else {
        vercel --prod --confirm
    }
}

Write-Host "Pronto. Verifique o repositório no GitHub e o deploy no Vercel." -ForegroundColor Green
