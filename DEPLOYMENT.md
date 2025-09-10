# SpeedRunLisk Production Deployment Guide

This guide walks you through deploying SpeedRunLisk to production on speedrunlisk.xyz using Vercel and Neon Database.

## Prerequisites

- Domain purchased on Spaceship: speedrunlisk.xyz ✅
- GitHub repository ready for deployment
- Vercel account
- Neon Database account
- Firebase project (for image uploads)
- Alchemy account (for Lisk RPC)
- WalletConnect project

## Step 1: Database Setup (Neon Database)

### 1.1 Create Neon Database
1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project named "speedrunlisk"
3. Select PostgreSQL version 15 or later
4. Choose a region close to your users (US East recommended)
5. Copy the connection string from the dashboard

### 1.2 Configure Database
```bash
# Your connection string will look like:
# postgresql://username:password@hostname.neon.tech/database_name?sslmode=require
```

## Step 2: Vercel Deployment Setup

### 2.1 Connect Repository
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your SpeedRunLisk GitHub repository
4. Set the following configuration:
   - **Framework Preset**: Next.js
   - **Root Directory**: `packages/nextjs`
   - **Build Command**: `cd ../.. && yarn build`
   - **Output Directory**: `.next`
   - **Install Command**: `yarn install`

### 2.2 Configure Custom Domain
1. In your Vercel project dashboard, go to "Settings" > "Domains"
2. Add domain: `speedrunlisk.xyz`
3. Add domain: `www.speedrunlisk.xyz` (redirect to main domain)

### 2.3 Configure DNS (Spaceship)
1. Log into your Spaceship domain management
2. Go to DNS settings for speedrunlisk.xyz
3. Add the following records:
   ```
   Type: A
   Name: @
   Value: 76.76.19.61
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## Step 3: Environment Variables Setup

### 3.1 Required Environment Variables
In your Vercel project dashboard, go to "Settings" > "Environment Variables" and add:

#### Database
```
POSTGRES_URL=postgresql://username:password@hostname.neon.tech/database_name?sslmode=require
```

#### Authentication
```
NEXTAUTH_URL=https://speedrunlisk.xyz
NEXTAUTH_SECRET=<generate-32-char-random-string>
```

#### API Keys
```
NEXT_PUBLIC_ALCHEMY_API_KEY=<your-alchemy-api-key>
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<your-walletconnect-project-id>
```

#### Firebase (Image Uploads)
```
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

#### Security
```
REVALIDATION_TOKEN=<generate-secure-random-token>
```

### 3.2 Generate Secure Secrets
```bash
# Generate NEXTAUTH_SECRET (32 characters)
openssl rand -base64 32

# Generate REVALIDATION_TOKEN
openssl rand -hex 32
```

## Step 4: Firebase Setup

### 4.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Storage
4. Go to Project Settings > Service Accounts
5. Generate new private key
6. Copy the JSON content for `FIREBASE_SERVICE_ACCOUNT_KEY`

### 4.2 Configure Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 5: API Keys Setup

### 5.1 Alchemy API Key
1. Go to [Alchemy](https://www.alchemy.com)
2. Create account and new app
3. Select "Ethereum" > "Lisk Sepolia"
4. Copy API key for `NEXT_PUBLIC_ALCHEMY_API_KEY`

### 5.2 WalletConnect Project ID
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create new project
3. Copy Project ID for `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`

## Step 6: Database Migration

The database will be automatically migrated on the first production build thanks to this build script:
```json
"build": "next build && sh -c 'if [ \"$VERCEL_ENV\" = \"production\" ]; then yarn drizzle-kit migrate; fi'"
```

### 6.1 Seed Production Database
After first deployment, manually run:
```bash
# Connect to your production database via Neon console or
# Create a deployment script that seeds initial data
yarn workspace @speedrun-lisk/nextjs db:seed
```

## Step 7: Deployment

### 7.1 Deploy to Vercel
1. Push your code to the main branch
2. Vercel will automatically deploy
3. Monitor the build logs for any issues
4. Verify the deployment at speedrunlisk.xyz

### 7.2 Post-Deployment Verification
- [ ] Site loads correctly at speedrunlisk.xyz
- [ ] Database connections work
- [ ] User authentication works (wallet connect)
- [ ] Image uploads work (Firebase)
- [ ] Challenge data loads correctly
- [ ] All API endpoints respond correctly

## Step 8: Monitoring and Maintenance

### 8.1 Set up Monitoring
1. Enable Vercel Analytics
2. Configure error tracking (Sentry recommended)
3. Set up uptime monitoring

### 8.2 Backup Strategy
- Neon Database includes automatic backups
- Consider setting up weekly database exports
- Monitor database usage and scale as needed

## Production Checklist

- [ ] Neon Database created and configured
- [ ] All environment variables set in Vercel
- [ ] Custom domain configured (speedrunlisk.xyz)
- [ ] DNS records configured in Spaceship
- [ ] Firebase project setup for image uploads
- [ ] API keys configured (Alchemy, WalletConnect)
- [ ] Database migrated and seeded
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Site monitoring enabled
- [ ] Backup strategy implemented

## Cost Estimates

- **Neon Database**: $20-40/month (Pro plan)
- **Vercel**: $20/month (Pro plan for custom domain)
- **Firebase**: $0-25/month (based on storage usage)
- **Total**: ~$40-85/month

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify POSTGRES_URL is correct
   - Check Neon dashboard for database status
   - Ensure SSL mode is enabled

2. **Build Failures**
   - Check environment variables are set
   - Verify all dependencies are installed
   - Review build logs in Vercel dashboard

3. **Domain Not Resolving**
   - DNS propagation can take 24-48 hours
   - Verify DNS records in Spaceship
   - Check Vercel domain configuration

## Support

- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Neon Support: [neon.tech/docs](https://neon.tech/docs)
- Firebase Support: [firebase.google.com/support](https://firebase.google.com/support)