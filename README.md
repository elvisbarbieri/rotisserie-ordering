# Web — customer store + staff POS

Talks to **`rotisserie-backend`** using the FE contract in [`../rotisserie-backend/contract.md`](../rotisserie-backend/contract.md).

Base URL (local): `http://localhost:8080/v1` via `NEXT_PUBLIC_API_BASE_URL` / `API_BASE_URL`.

## Run

Start the API first:

```bash
cd ../rotisserie-backend
npm install   # first time
npm run offline
```

Then in this folder:

```bash
cp .env.example .env.local   # first time only
npm install                  # first time only
npm run dev
```

| App | URL |
|-----|-----|
| Customer store | http://localhost:3000 |
| Staff POS | http://localhost:3000/staff |

The first visit to `/cardapio` seeds sample menu items if the catalog is empty (via BFF → `POST /items`).

## Integration notes

| Surface | How it calls the API |
|---------|----------------------|
| Store (`/cardapio`, checkout, …) | Next BFF `/api/store/*` → backend `/items`, `/orders` |
| Staff (`/staff/*`) | Browser → backend `/v1/*` directly (CORS) |

Do **not** call `/api/store/...` on the backend — those paths exist only on this Next app.
