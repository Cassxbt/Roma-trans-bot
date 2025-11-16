#!/bin/bash
set -e
pip install --upgrade pip
pip install -r requirements.txt

# Build frontend
cd frontend
npm install
export VITE_API_BASE_URL=${VITE_API_BASE_URL:-https://roma-trans-bot.onrender.com}
npm run build
cd ..
