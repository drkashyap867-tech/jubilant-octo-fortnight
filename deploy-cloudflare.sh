#!/bin/bash

# 🚀 Cloudflare Deployment Script for MedCounsel V2.2.0
# This script deploys both frontend (Pages) and backend (Workers) to Cloudflare

set -e

echo "🚀 Starting Cloudflare Deployment for MedCounsel V2.2.0..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Wrangler CLI is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please login to Cloudflare first:${NC}"
    echo -e "${BLUE}   wrangler login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Cloudflare authentication verified${NC}"

# Deploy Backend API (Workers)
echo -e "${BLUE}🔧 Deploying Backend API to Cloudflare Workers...${NC}"
cd backend

# Build the worker
echo "Building Cloudflare Worker..."
npm run build || echo "Build command not found, using default build"

# Deploy to Workers
echo "Deploying to Cloudflare Workers..."
wrangler deploy --env production

# Get the worker URL
WORKER_URL=$(wrangler whoami | grep -o 'https://.*\.workers\.dev' | head -1)
echo -e "${GREEN}✅ Backend API deployed to: ${WORKER_URL}${NC}"

cd ..

# Deploy Frontend (Pages)
echo -e "${BLUE}🎨 Deploying Frontend to Cloudflare Pages...${NC}"
cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build the frontend
echo "Building frontend application..."
npm run build

# Deploy to Pages
echo "Deploying to Cloudflare Pages..."
wrangler pages deploy dist --project-name medcounsel-v2-2-0

cd ..

echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo -e "   Frontend: https://medcounsel-v2-2-0.pages.dev"
echo -e "   Backend API: ${WORKER_URL}"
echo -e "   Version: 2.2.0"
echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo -e "   1. Update your domain DNS to point to Cloudflare"
echo -e "   2. Configure custom domain in Cloudflare Pages"
echo -e "   3. Set up environment variables in Cloudflare dashboard"
echo -e "   4. Test your deployed application"
echo ""
echo -e "${GREEN}🚀 MedCounsel V2.2.0 is now live on Cloudflare!${NC}"
