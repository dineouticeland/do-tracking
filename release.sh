#!/usr/bin/env bash

set -euo pipefail

# -------- DEPENDENCIES --------
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) not installed"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ GitHub CLI not authenticated"
  exit 1
fi

# -------- VERSION EXTRACTION --------
if command -v jq >/dev/null 2>&1; then
  VERSION=$(jq -r '.version' package.json)
else    
  VERSION=$(node -p "require('./package.json').version")
fi

if [[ -z "$VERSION" || "$VERSION" == "null" ]]; then
  echo "❌ Could not read version from package.json"
  exit 1
fi

TAG="v$VERSION"
TITLE="Version $TAG"
NOTES="Release $TAG"

# -------- SAFETY CHECKS --------
if [[ ! -f package.json ]]; then
  echo "❌ package.json not found"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree is not clean"
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "❌ Tag '$TAG' already exists"
  exit 1
fi

# -------- RELEASE FLOW --------
echo "🏷️  Creating tag $TAG"
git tag -a "$TAG" -m "$TITLE"

echo "🚀 Pushing tag $TAG"
git push origin "$TAG"

echo "📦 Creating GitHub release $TAG"
gh release create "$TAG" \
  --title "$TITLE" \
  --notes "$NOTES"

echo "✅ Release $TAG created successfully"