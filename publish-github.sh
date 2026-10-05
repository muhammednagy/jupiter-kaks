#!/usr/bin/env bash
set -euo pipefail

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$project_dir"

command -v gh >/dev/null || { echo "Install GitHub CLI first: https://cli.github.com/" >&2; exit 1; }
gh auth status || { echo "Sign in with: gh auth login -h github.com" >&2; exit 1; }

if [ -e .git ]; then
  echo "This folder already has Git metadata. Review it before publishing." >&2
  echo "If ready, run: gh repo create jupiter-kaks --public --source . --remote origin --push" >&2
  exit 1
fi

git init -b main
git add .gitignore README.md CHROMEWEBSTORE.md manifest.json package.json \
  background.js content.js page-bridge.js shared.js popup.html popup.css popup.js \
  tests/extension.test.cjs publish-github.sh
git commit -m "Create Jupiter Kaks bilingual subtitle extension"
gh repo create jupiter-kaks --public --source . --remote origin --push \
  --description "Estonian and English subtitles together on Jupiter, translated ahead for free."
gh repo view --json url --jq .url
