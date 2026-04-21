# ⭐ Chore Stars — Setup Guide

## Prerequisites

- Docker & Docker Compose v2
- A domain name with Cloudflare DNS
- Traefik v3 already running (see [hhttps://github.com/gscarlett-git/chore-stars](https://github.com/gscarlett-git/chore-stars) for reference config)

---

## Directory Structure

After setup your Docker directory should look like this:

```
~/docker/
├── docker-compose.yml        # Your main compose file
├── .env                      # Environment variables
├── chores-app/               # This repo
│   ├── backend/
│   ├── frontend/
│   ├── db/
│   └── chores.yml
└── appdata/
    └── chores/
        ├── db/               # MySQL data (auto-created)
        └── init/             # SQL init script
            └── init.sql
```

---

## Step 1: Clone the repo

```bash
cd ~/docker
git clone https://github.com/gscarlett-git/chore-stars.git chores-app
```

---

## Step 2: Create data directories

```bash
mkdir -p ~/docker/appdata/chores/{db,init}
cp ~/docker/chores-app/db/init.sql ~/docker/appdata/chores/init/
```

---

## Step 3: Add environment variables

Add the following to your `~/docker/.env` file:

```env
CHORES_DB_ROOT_PASSWORD=your_secure_root_password
CHORES_DB_USER=choresuser
CHORES_DB_PASSWORD=your_secure_db_password
CHORES_SESSION_SECRET=a_very_long_random_string_at_least_32_chars
```

Generate a good session secret with:
```bash
openssl rand -hex 32
```

---

## Step 4: Add to your docker-compose.yml

Add the following to the `include:` section of your `~/docker/docker-compose.yml`:

```yaml
include:
  # ... your existing services ...
  - chores-app/chores.yml
```

---

## Step 5: Update chores.yml for your domain

The `chores.yml` file uses `${DOMAINNAME_1}` from your `.env`. The app will be available at `chores.${DOMAINNAME_1}`.

If you use a different domain variable name, update the Traefik labels in `chores.yml`:

```yaml
- "traefik.http.routers.chores-rtr.rule=Host(`chores.yourdomain.com`)"
```

---

## Step 6: Deploy

```bash
cd ~/docker
docker compose up -d chores-db chores-backend chores-frontend
```

Watch the logs to confirm everything started:
```bash
docker logs chores-db --tail=20
docker logs chores-backend --tail=20
docker logs chores-frontend --tail=20
```

---

## Step 7: First login

- Navigate to `https://chores.yourdomain.com`
- Click **Parents** in the top right corner
- Login: `admin` / `admin123`
- Go to **Settings** and **change the password immediately**

---

## Step 8: Set up your family

1. **Children tab** → Add each child, pick an avatar and colour
2. **Chores tab** → Create chores and assign them
3. Share `https://chores.yourdomain.com` with the kids!

---

## Chore Frequency Options

| Option | When it appears |
|--------|----------------|
| Every Day | 7 days a week |
| School Days | Monday – Friday |
| Weekends | Saturday & Sunday |
| Specific Days | Your chosen days |
| Monthly | 1st of each month |

---

## Updating

To pull the latest changes and redeploy:

```bash
cd ~/docker/chores-app
git pull

cd ~/docker
docker compose build chores-frontend chores-backend
docker compose up -d chores-frontend chores-backend
```

---

## Troubleshooting

```bash
# View logs
docker logs chores-backend --tail=50
docker logs chores-frontend --tail=50
docker logs chores-db --tail=50

# Restart services
docker compose restart chores-frontend chores-backend

# Access the database directly
docker exec -it chores-db mysql -u choresuser -p choresapp

# Reset admin password
HASH=$(docker exec chores-backend node -e \
  "const b=require('bcrypt');b.hash('newpassword',10).then(h=>console.log(h));")
docker exec chores-db mysql -u choresuser -pYOUR_DB_PASSWORD choresapp \
  -e "UPDATE users SET password_hash='$HASH' WHERE username='admin';"
```

---

## Security Notes

- The kids dashboard is **public** — no login required to complete chores or request rewards
- The parent portal requires login to manage chores, children, and approve rewards
- Secrets are excluded from git via `.gitignore` — never commit your `.env` file
- Session cookies are secured via `trust proxy` for Traefik HTTPS termination
