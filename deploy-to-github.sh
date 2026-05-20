#!/bin/bash
# Push dashboard to https://github.com/dylandias1198/Vouchers
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"

echo "==> Working directory: $REPO_ROOT"

echo "==> Regenerating dashboard data..."
if [ -x "$REPO_ROOT/.venv/bin/python" ]; then
  "$REPO_ROOT/.venv/bin/python" mitc_voucher_map/generate_map.py
else
  python3 mitc_voucher_map/generate_map.py
fi

# Broken git init leaves an empty .git folder — remove it and start clean
if [ -d .git ] && [ ! -f .git/HEAD ]; then
  echo "==> Removing incomplete .git folder..."
  rm -rf .git
fi

if [ ! -f .git/HEAD ]; then
  echo "==> Initializing git repository..."
  if ! git init; then
    echo ""
    echo "ERROR: git init failed in this folder."
    echo "Run these commands in the macOS Terminal app (outside Cursor):"
    echo ""
    echo "  cd $REPO_ROOT"
    echo "  rm -rf .git"
    echo "  git init"
    echo "  git remote add origin https://github.com/dylandias1198/Vouchers.git"
    echo "  git add .gitignore .github mitc_voucher_map netlify.toml DEPLOY.md deploy-to-github.sh run_dashboard.sh"
    echo "  git commit -m \"Add MITC voucher dashboard\""
    echo "  git branch -M main"
    echo "  git push -u origin main"
    echo ""
    exit 1
  fi
fi

if ! git remote get-url origin &>/dev/null 2>&1; then
  git remote add origin https://github.com/dylandias1198/Vouchers.git
fi

echo "==> Staging files..."
git add .gitignore .github/workflows/deploy-pages.yml netlify.toml DEPLOY.md deploy-to-github.sh run_dashboard.sh mitc_voucher_map

echo "==> Commit..."
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Update MITC voucher dashboard for GitHub Pages"
fi

echo "==> Pushing to origin main..."
git branch -M main
git push -u origin main

echo ""
echo "Success. Enable Pages:"
echo "  https://github.com/dylandias1198/Vouchers/settings/pages"
echo "  Source: GitHub Actions"
echo ""
echo "Live site:"
echo "  https://dylandias1198.github.io/Vouchers/"
