# ⭐ Chore Stars - Setup Guide

A fun chore tracking app for kids, with a parent management portal.

## Structure

```
docker/
├── chores-app/
│   ├── backend/          # Node.js Express API
│   ├── frontend/         # React app (served via Nginx)
│   ├── chores.yml        # Docker Compose service definitions
│   └── README.md
├── appdata/
│   └── chores/
│       ├── db/           # MySQL data (auto-created)
│       └── init/         # SQL init scripts
└── docker-compose.yml    # Add include line here
```

## Step 1: Copy files to your Docker host

```bash
# Create app directories
mkdir -p ~/docker/chores-app
mkdir -p ~/docker/appdata/chores/{db,init}

# Copy the chores-app folder to ~/docker/chores-app/
# Copy the init SQL file:
cp chores-app/db/init.sql ~/docker/appdata/chores/init/
```

## Step 2: Add environment variables to your .env file

```bash
# Add these to ~/docker/.env
CHORES_DB_ROOT_PASSWORD=your_secure_root_password
CHORES_DB_USER=choresuser
CHORES_DB_PASSWORD=your_secure_db_password
CHORES_SESSION_SECRET=a_very_long_random_secret_string_here
```

## Step 3: Add to your docker-compose.yml

Add the following to the `include:` section of your `~/docker/docker-compose.yml`:

```yaml
include:
  # ... your existing services ...
  - chores-app/chores.yml
```

## Step 4: Deploy

```bash
cd ~/docker
docker compose up -d chores-db chores-backend chores-frontend
```

## Step 5: First Login

- Navigate to: `https://chores.scarlett.id.au`
- Click **"Parents"** in the top right
- Login with: `admin` / `admin123`
- **IMMEDIATELY** change the password in Settings!

## Step 6: Set Up Your Family

1. Go to **Children** tab → Add each child with their avatar and colour
2. Go to **Chores** tab → Create chores, assign them to children or all kids
3. Share `https://chores.scarlett.id.au` with the kids!

## How It Works

### For Kids
- Visit the main page to see both children's chores
- Tap a chore to mark it complete (earns stars ⭐)
- Tap **🎁 My Rewards** to request or redeem rewards

### For Parents
- Login at `/parent/login`
- **Children**: Add/edit children, see their points
- **Chores**: Create chores with scheduling (daily/weekly/specific days/monthly)
- **Rewards**: Review and approve reward requests, set star costs
- **Overview**: See each child's stats and recent activity

## Chore Frequency Options
- **Every Day** - appears 7 days a week
- **Weekly** - choose which days of the week  
- **Specific Days** - same as weekly (pick days)
- **Monthly** - appears on the 1st of each month

## Troubleshooting

```bash
# View logs
docker logs chores-backend
docker logs chores-frontend
docker logs chores-db

# Restart services
docker compose restart chores-frontend chores-backend

# Access database directly
docker exec -it chores-db mysql -u choresuser -p choresapp
```

## Security Notes
- The parent portal requires login - kids dashboard is public
- Change the default `admin`/`admin123` credentials immediately
- Chore completion (tapping chores) doesn't require login by design
- Reward nominations don't require login (kids can request)
- Only parents can approve/reject rewards and manage chores
