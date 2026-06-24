# Smart Job Portal Deployment

This project uses:
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas Free Tier

## 1. Local prerequisites

- Node.js 18 or newer
- MongoDB Community Server for local development or a MongoDB Atlas Free Tier cluster
- Git repository pushed to GitHub

## 2. Environment variables

### Server

Create `server/.env` from [`server/.env.example`](./server/.env.example).

Required values:
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL`

Optional values:
- `MONGO_DB_NAME`
- `MONGO_MAX_POOL_SIZE`
- `MONGO_SERVER_SELECTION_TIMEOUT_MS`
- `MONGO_SOCKET_TIMEOUT_MS`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

### Client

Create `client/.env` from [`client/.env.example`](./client/.env.example).

Optional override:
- `VITE_API_BASE_URL`

If you do not set it, the production client build will fall back to the Render API URL used by this project.

## 3. MongoDB Atlas setup

1. Create a free Atlas cluster.
2. Create a database user with read and write access.
3. Add your IP address to the Network Access allowlist.
4. Copy the Atlas connection string into `server/.env` as `MONGO_URI`.
5. Set `MONGO_DB_NAME` to `smart_job_portal` or your preferred database name.

## 4. Local MongoDB option

If you want to run the app locally without Atlas, use MongoDB Community Server and set:

```env
MONGO_URI=mongodb://127.0.0.1:27017/?readPreference=primaryPreferred
MONGO_DB_NAME=smart_job_portal
```

If your local MongoDB uses authentication, include the username and password in the URI provided by your local setup.

## 5. Backend deployment on Render

Use the following values:
- Root directory: `server`
- Environment: `Node`
- Build command: `npm install`
- Start command: `npm start`

Set these Render environment variables:
- `NODE_ENV=production`
- `MONGO_URI=your_atlas_connection_string`
- `MONGO_DB_NAME=smart_job_portal`
- `JWT_SECRET=your_long_random_secret`
- `CLIENT_URL=https://your-vercel-app.vercel.app`

Optional seeded admin values:
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

After deployment, copy the Render service URL for the client API base URL.

## 6. Frontend deployment on Vercel

Use the following values:
- Root directory: `client`
- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

Set this Vercel environment variable if you want to override the default API URL:
- `VITE_API_BASE_URL=https://your-render-app.onrender.com/api`

## 7. Final wiring

1. Deploy the backend first.
2. Optionally copy the Render URL into `client/.env` as `VITE_API_BASE_URL` if you want to override the default.
3. Deploy the frontend.
4. Update the Render `CLIENT_URL` to the final frontend URL.
5. Redeploy the backend if you changed `CLIENT_URL`.

## 8. Verify the deployment

Check these endpoints and pages:
- `GET /api/health`
- Frontend home page
- Login and register
- Browse jobs
- Profile page
- Employer dashboard
- Admin dashboard

## 9. Helpful commands

From the repo root:

```bash
npm run dev:server
npm run dev:client
```

From the server folder:

```bash
npm run dev
```

From the client folder:

```bash
npm run dev
```
