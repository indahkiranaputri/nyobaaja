# Deployment Guide

## Full functionality setup

1. Deploy backend to a Node.js host such as Render, Railway, Fly.io, or VPS.
2. Use the deployed API URL as the value for `window.API_BASE` in the frontend pages, or keep the current same-origin setup if frontend and backend run on the same host.
3. Make sure the backend is running at `/api`.
4. Open the site and test:
   - Register/login
   - Product listing
   - Cart and checkout
   - Admin login and product management

## Recommended hosts
- Render: use the included `render.yaml`
- Railway: connect the repository and start `node server.js`
- Fly.io: use `fly.toml` or the standard Node deployment flow

## Important note
GitHub Pages alone only serves static files. The full e-commerce features require a Node.js backend.
