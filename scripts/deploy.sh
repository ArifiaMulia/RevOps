#!/bin/bash

# Prasetia RevOps Hub - Easy Deploy Script
# Usage: ./deploy.sh

echo "🚀 Starting Deployment..."

# 1. Pull latest changes from GitHub
echo "📥 Fetching updates from GitHub..."
git fetch origin
git reset --hard origin/main

# 2. Stop and Remove existing containers
echo "🛑 Stopping existing containers..."
docker compose down --remove-orphans

# 3. Build and Start
echo "🔄 Building and starting containers..."
docker compose build --no-cache
docker compose up -d

# 4. Clean up unused images (to save space)
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment Complete!"
echo "   App is running via Coolify network"
echo "   URL: https://revops.virtuenet.space"
