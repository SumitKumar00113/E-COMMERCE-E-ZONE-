# PROJECT1

Simple mono-repo with small example services for practice: `auth`, `cart`, `order`, and `product`.

## Repository layout

- `auth/` — Authentication service (Backend + frontend)
- `cart/` — Cart service (Backend)
- `order/` — Order service (Backend)
- `product/` — Product service (Backend + frontend)
- `address` — Address Service(Backend)

Each service typically has a `Backend/` folder containing a Node.js app and a `frontend/` folder for the Vite React app when present.

## Getting started

1. Install dependencies for a service (example for `order` Backend):

   ```bash
   cd order/Backend
   npm install
   ```

2. Start the service (check each service's `package.json` for scripts):

   ```bash
   npm run dev    # or npm start / npm run serve depending on script
   ```

3. Frontend apps (Vite):

   ```bash
   cd product/frontend
   npm install
   npm run dev
   ```

## Environment

- Copy `.env.example` to `.env` in the service folder you are running (or to the repo root if you prefer central envs) and fill real values.
- `.env` and `.env.*` are ignored by git per `.gitignore`.

## Tests

- Run backend tests where present. Example:

  ```bash
  cd product/Backend
  npm test
  ```

## Git

- A top-level `.gitignore` is present to exclude `node_modules`, build output, IDE folders, and environment files.

## Notes

- Some folders contain markdown notes (e.g., `Cohort online market place.md`). Remove or archive them if they are not needed.
- If you want, I can add per-service `README.md` files with service-specific scripts and env variables.

## License

This workspace does not include a license file. Add one if you plan to share the code publicly.
# E-COMMERCE-E-ZONE-
