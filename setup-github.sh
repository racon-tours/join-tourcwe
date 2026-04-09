#!/bin/bash
# ============================================================
# TourCWE — join.tourcwe.com
# GitHub + Netlify setup script
# Run from inside the join-tourcwe/ directory
# ============================================================

set -e

# ---- CONFIG: fill these in ----
GITHUB_TOKEN=""          # Your GitHub Personal Access Token (repo scope)
GITHUB_USERNAME=""       # Your GitHub username (e.g. IBMikeNichols)
REPO_NAME="join-tourcwe"
NETLIFY_SITE_ID="d1d4d320-fb54-49e0-904d-ea713138605c"

# ---- Validate ----
if [ -z "$GITHUB_TOKEN" ] || [ -z "$GITHUB_USERNAME" ]; then
  echo "❌ Please set GITHUB_TOKEN and GITHUB_USERNAME at the top of this script."
  exit 1
fi

echo "🚀 Creating GitHub repo..."
curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"join.tourcwe.com — TourCWE website\"}" \
  | grep -E '"full_name"|"html_url"|"message"'

echo ""
echo "📦 Initializing git and pushing..."
git init
git add .
git commit -m "Initial site build — join.tourcwe.com"
git branch -M main
git remote add origin "https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git push -u origin main

echo ""
echo "✅ Code pushed to: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "Next: Connect to Netlify at:"
echo "  https://app.netlify.com/projects/join-tourcwe/configuration/deploys"
echo "  → Link to GitHub → $GITHUB_USERNAME/$REPO_NAME"
echo "  → Branch: main | Publish dir: (leave blank)"
