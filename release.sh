#!/usr/bin/env bash
echo "🚀 Releasing $VERSION"
set -euo pipefail

# -------- CONFIG --------
VERSION="${1:-}"
TITLE="${2:-}"
NOTES="${3:-}"

# -------- VALIDATION --------
if [[ -z "$VERSION" ]]; then
  echo "❌ Usage: ./release.sh <version> [title] [notes]"
  echo "Example: ./release.sh v1.0.0 \"Version 1.0.0\" \"Summary of changes\""
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) is not installed"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "❌ GitHub CLI is not authenticated"
  exit 1
fi

# -------- DEFAULTS --------
TITLE="${TITLE:-Version ${VERSION}}"
NOTES="${NOTES:-Release ${VERSION}}"

# -------- SAFETY CHECKS --------
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "❌ Tag '$VERSION' already exists"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree is not clean"
  exit 1
fi

# -------- RELEASE FLOW --------
echo "🏷️  Creating tag $VERSION"
git tag -a "$VERSION" -m "$TITLE"

echo "🚀 Pushing tag"
git push origin "$VERSION"

echo "📦 Creating GitHub release"
gh release create "$VERSION" \
  --title "$TITLE" \
  --notes "$NOTES"

echo "✅ Release $VERSION created successfully"