# Social-Media

This is the repo hosting the open-source behind **Sync**, the everything social media.  
**Note:** This repository may differ from actual Sync code.  
For something more decentralized, see [RSSX](https://github.com/thegoodduck/rssx) (Maintained by one of the coders behind Halo and Sync).

---

## 🚀 How to Host Your Own Halo Server

Anyone can run their own Halo server and join the decentralized Sync network!  
Here’s how to get started:

---

### 1. Clone the Repository

```bash
git clone https://github.com/xs-xspert-software/social-media.git
cd Social-Media
```

---

### 2. Configure Environment Variables

Copy the example environment file and edit it:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Set your database credentials, JWT secret, and (optionally) federation variables:

- `FEDERATION_POSTS_API` — (optional) Remote API for posts (e.g. your Vercel deployment)
- `FEDERATION_USERINFO_API` — (optional) Remote API for user info
- `FEDERATION_VIDEOS_API` — (optional) Remote API for videos
- `FEDERATION_BASE_URL` — The public URL of your backend (e.g. https://yourdomain.com)

---

### 3. Run with Docker (Recommended)

Halo is designed for easy Docker deployment:

```bash
docker compose up --build
```

This will start:

- PostgreSQL database
- Backend server (Node.js/Express/TypeScript)
- Frontend (Vue/Vite)
- Video backend (Django, if configured)

---

### 4. Access Your Server

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)

---

### 5. Federation & API Discovery

Your server will automatically expose federation endpoints:

- `/federation/discover` — Shows your API and federation endpoint locations
- `/federation/posts?remote=<remote_url>` — Proxy posts from a remote Halo server
- `/federation/user-info?remote=<remote_url>&userId=<id>` — Proxy user info
- `/federation/videos?remote=<remote_url>` — Proxy videos
- `/federation/inbox` — Accept federation requests (future: push, follow, etc.)

**Example:**

```bash
curl http://localhost:3000/federation/discover
```

---

### 6. Production Hosting

- Set your environment variables for production (see above).
- Point your domain to your server and set `FEDERATION_BASE_URL` accordingly.
- Use HTTPS for federation and user security.
- You can deploy on any VPS, cloud provider, or even Vercel/Render for the frontend.

---

### 7. Join the Federation

- Share your `/federation/discover` endpoint with others.
- Add other Halo servers to your `/federation/servers` list for discovery.
- Your users can now interact with remote servers and content!

---

### 8. Configure Your Instance

Configure your server settings in `config.json` and customize branding as needed for your self-hosted deployment.

---

### 9. Contribute & Get Help

- Open issues or discussions on GitHub for support.
- PRs and new federation features are welcome!

---

**Halo is the engine. Sync is the platform.**  
You can run your own, federate, and help build the decentralized social web!
