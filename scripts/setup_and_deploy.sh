#!/usr/bin/env bash
# Setup and deploy script (Bash)
# Requires: gh (optional), vercel (optional)

read -p "Nome do repositório no GitHub (ex: salao-eliane-melo): " REPO_NAME
read -p "Visibilidade (public/private) [private]: " VISIBILITY
VISIBILITY=${VISIBILITY:-private}

echo "Inicializando..."

if [ ! -d .git ]; then
  git init
  git checkout -b main
  git add .
  git commit -m "Initial commit"
else
  echo "Repositório Git já inicializado."
fi

read -p "Usar gh para criar repo? (y/n) [y]: " USE_GH
USE_GH=${USE_GH:-y}
if [ "$USE_GH" = "y" ]; then
  if ! command -v gh >/dev/null; then
    echo "gh CLI não encontrado. Instale e autentique com 'gh auth login'"
  else
    gh repo create "$REPO_NAME" --$VISIBILITY --source=. --remote=origin --push
  fi
else
  read -p "URL do remote (ex: https://github.com/USER/$REPO_NAME.git): " REMOTE
  if [ -n "$REMOTE" ]; then
    git remote add origin "$REMOTE"
    git push -u origin main
  fi
fi

read -p "Executar deploy no Vercel? (y/n) [n]: " DO_VERCEL
DO_VERCEL=${DO_VERCEL:-n}
if [ "$DO_VERCEL" = "y" ]; then
  if ! command -v vercel >/dev/null; then
    echo "Vercel CLI não encontrado. Instale com 'npm i -g vercel' e autentique com 'vercel login'"
  else
    vercel --prod --confirm
  fi
fi

echo "Concluído. Verifique o GitHub e Vercel."