Refactor to API-first — Summary (COMPLETED)

Status:
- Frontend and admin pages now prefer the server REST API (`/api`) served by `server.js` using SQLite (`data/db.sqlite`) as the Single Source of Truth (SSoT). The file `data/db.json` is used only as an initial seed and migrates into SQLite on first run.
- Admin CRUD (create/update/delete products) and order status updates are API-first when an admin token is present; local fallback remains only for offline or server-failure scenarios.
- Cart and reviews are persisted to the server when the user is authenticated; anonymous users keep a local fallback that is migrated on login.

Files changed (important):
- `js/api_client.js` — central API client and token storage (uses safe helpers).
- `js/admin_script.js` — admin CRUD, sync, and order status handlers updated to use API-first flows.
- `js/script.js`, `keranjang.html`, `login.html` — cart, checkout, photo handling, and login-driven migrations.
- `tests/integration_test.js` — lightweight smoke test for core endpoints.
- `package.json` — `test:integration` script and `node-fetch` dev dependency for compatibility.

Manual verification & deploy checklist:
1) Install deps & start server locally:
```bash
npm install
npm start
```
2) Run integration smoke test (optional):
```bash
npm run test:integration
```
3) Verify cross-device sync:
  - Open site on two devices/browsers (desktop and phone).
  - Login as admin via `admin_login.html` on one device; create/edit/delete a product — confirm changes visible on the other device.
  - As customer: add items as guest on one device, login on that device, then open the other device and login with same account — cart and orders should match.
4) Checkout with photo as authenticated user and confirm the database (SQLite `data/db.sqlite`) contains the order with `photo` field; local `krPhotoDataUrl` should be removed.

Deployment notes:
- After verification, push the repo to GitHub (all static files plus `server.js` and `data/db.json` seed). Use GitHub Actions or deploy to a Node host to run the API; the server will migrate seed data into `data/db.sqlite` automatically on first run.

If you run the tests or the UI checks and paste any console/server errors here, I will debug and patch quickly.