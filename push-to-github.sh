#!/usr/bin/env bash
#
# Squeek Life — push this source folder to GitHub in one command.
#
#   ./push-to-github.sh https://github.com/<your-user>/<your-repo>.git
#
# Create the repository on GitHub first (empty — no README, no .gitignore),
# then run this. Works on macOS, Linux and Git Bash on Windows.

set -euo pipefail

REPO_URL="${1:-}"
BRANCH="${2:-main}"

if [ -z "$REPO_URL" ]; then
  echo "Usage: ./push-to-github.sh https://github.com/<user>/<repo>.git [branch]"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed. Install it from https://git-scm.com/downloads and try again."
  exit 1
fi

# Make sure we are in the project folder, not inside frontend/ or backend/.
if [ ! -d frontend ] || [ ! -d backend ]; then
  echo "This folder has no frontend/ and backend/ — run the script from the unzipped"
  echo "project folder (the one that contains frontend, backend and README.md)."
  exit 1
fi

case "$REPO_URL" in
  *.git) ;;
  *) REPO_URL="${REPO_URL%/}.git" ;;
esac

# 1. Repository -------------------------------------------------------------
if [ ! -d .git ]; then
  echo "→ git init"
  git init -q
fi

if [ -z "$(git config user.name || true)" ]; then
  git config user.name "$(git config --global user.name || echo 'Squeek Life')"
fi
if [ -z "$(git config user.email || true)" ]; then
  git config user.email "$(git config --global user.email || echo 'squeek@example.com')"
fi

# 2. Commit -----------------------------------------------------------------
git add -A
if git diff --cached --quiet; then
  echo "→ nothing new to commit"
else
  echo "→ committing $(git diff --cached --name-only | wc -l | tr -d ' ') files"
  git commit -q -m "Squeek Life — From Rags to Riches"
fi

git branch -M "$BRANCH"

# 3. Remote -----------------------------------------------------------------
if git remote get-url origin >/dev/null 2>&1; then
  echo "→ origin already set, updating it"
  git remote set-url origin "$REPO_URL"
else
  echo "→ git remote add origin $REPO_URL"
  git remote add origin "$REPO_URL"
fi

# 4. Push -------------------------------------------------------------------
echo "→ pushing to $BRANCH (you may be asked to sign in to GitHub)"
if git push -u origin "$BRANCH"; then
  echo
  echo "Done. Repository: ${REPO_URL%.git}"
else
  echo
  echo "Push was rejected — usually because the repository already has commits"
  echo "(for example a README created on GitHub). Overwriting is safe: this folder"
  echo "already contains every file, README.md included."
  echo
  printf "Type y and press Enter to overwrite (force push): "
  read -r ANSWER
  if [ "$ANSWER" = "y" ] || [ "$ANSWER" = "Y" ]; then
    git push -u origin "$BRANCH" --force
    echo
    echo "Done. Repository: ${REPO_URL%.git}"
  else
    echo "Skipped — nothing changed on GitHub."
  fi
fi
