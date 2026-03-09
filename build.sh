#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Installing Frontend Dependencies ---"
cd frontend
npm install

echo "--- Building Frontend ---"
npm run build
cd ..

echo "--- Installing Backend Dependencies ---"
pip install -r backend/requirements.txt

echo "--- Build Complete ---"
