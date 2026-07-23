# VENUS CARE – Premium Luxury Cosmetics E-Commerce

---

## Deployed Environments

- **Frontend (Vercel)**: `https://venus-f3m6zcesh-neelpatel1026s-projects.vercel.app`
- **Backend (Render)**: `https://venus-zu4f.onrender.com`

---

## Production Deployment Architecture

This project is structured as a MERN stack monorepo:
- `/frontend`: Built using Vite and React.
- `/backend`: Built using Express.js and Node.js.

---

## 🔐 Google OAuth (Sign-In) Configuration Guide

For the Google Sign-In functionality to operate successfully on the production frontend domain, the frontend origin must be whitelisted in the Google Cloud Console.

### Step-by-Step Whitelisting:
1. Navigate to the **[Google Cloud Console Credentials Screen](https://console.cloud.google.com/apis/credentials)**.
2. Select your active project.
3. Under **OAuth 2.0 Client IDs**, select the client ID associated with this application (`VITE_GOOGLE_CLIENT_ID`).
4. Find the **Authorized JavaScript Origins** section.
5. Click **Add URI** and input the following URLs:
   - `http://localhost:5173` (for local development)
   - `https://venus-f3m6zcesh-neelpatel1026s-projects.vercel.app` (Production Vercel Domain)
6. Save the settings. It may take a few minutes for Google's DNS to update the GSI origins configuration.

---

## Backend Deployment on Render

- **Root Directory**: `(leave blank)`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `MONGO_URI`: MongoDB connection string.
  - `JWT_SECRET`: Signature key for encoding JWT session tokens.
  - `NODE_ENV`: `production`
