# 🚀 Deploy Basilio to Vercel (100% Free)

This guide will help you deploy your Basilio digital cookbook app completely free using Vercel, MongoDB Atlas, and other free services.

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- MongoDB Atlas account (free)
- Google account (for OAuth and optional Gemini AI)

## 🏗️ Step 1: Set Up MongoDB Atlas (Database)

1. **Create MongoDB Atlas Account**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free account
   - Choose "Free" tier (M0 Sandbox - 512MB storage)

2. **Create a Cluster**:
   - Click "Create" to create a new deployment
   - Choose "M0 FREE" tier
   - Select a region close to you
   - Name your cluster (e.g., "basilio-cluster")

3. **Set Up Database Access**:
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and strong password
   - Set role to "Atlas Admin" (for simplicity)
   - Click "Add User"

4. **Configure Network Access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**:
   - Go to "Database" and click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like `mongodb+srv://...`)
   - Replace `<password>` with your database user password

## 🔐 Step 2: Set Up Google OAuth

1. **Go to Google Cloud Console**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Name it "Basilio App"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-app-name.vercel.app/api/auth/callback/google` (replace with your actual Vercel domain)
   - Save and copy Client ID and Client Secret

## 📁 Step 3: Prepare Your Code

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/basilio.git
   git push -u origin main
   ```

2. **Create Environment Variables File**:
   Create `.env.example` in your project root:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/basilio?retryWrites=true&w=majority

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Vercel Blob (will be auto-configured by Vercel)
   BLOB_READ_WRITE_TOKEN=your-blob-token
   ```

## 🌐 Step 4: Deploy to Vercel

1. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your Basilio repository from GitHub

2. **Configure Environment Variables**:
   - In Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add all variables from your `.env.example`:

   **Required Environment Variables:**
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/basilio
   NEXTAUTH_URL = https://your-app-name.vercel.app
   NEXTAUTH_SECRET = generate-a-random-secret-key
   GOOGLE_CLIENT_ID = your-google-client-id
   GOOGLE_CLIENT_SECRET = your-google-client-secret
   ```

3. **Generate NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```
   Or use online generator: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

4. **Enable Vercel Blob Storage**:
   - In Vercel dashboard, go to "Storage"
   - Click "Create Database" > "Blob"
   - This will automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables

5. **Deploy**:
   - Click "Deploy" in Vercel
   - Wait for deployment to complete
   - Your app will be available at `https://your-app-name.vercel.app`

## 🔧 Step 5: Update OAuth Redirect URLs

After deployment:

1. **Update Google OAuth**:
   - Go back to Google Cloud Console
   - Update OAuth redirect URI to: `https://your-actual-vercel-url.vercel.app/api/auth/callback/google`

## 🎯 Step 6: Test Your Deployment

1. Visit your Vercel URL
2. Test sign-up/sign-in with Google
3. Create a recipe with image upload
4. Test family creation and joining
5. Test shopping list functionality

## 💰 Free Tier Limits

**Vercel (Frontend & API)**:
- 100GB bandwidth/month
- 6,000 execution hours/month
- 1,000 deployments/month

**MongoDB Atlas (Database)**:
- 512MB storage
- Shared CPU
- No connection limit

**Vercel Blob (Image Storage)**:
- 1GB storage
- 1,000 operations/month

**Google OAuth**:
- Unlimited (free tier)

## 🔄 Continuous Deployment

Once set up, any push to your `main` branch will automatically trigger a new deployment on Vercel.

## 🐛 Troubleshooting

**Common Issues:**

1. **MongoDB Connection Error**:
   - Check if IP is whitelisted (0.0.0.0/0)
   - Verify connection string format
   - Ensure password doesn't contain special characters

2. **OAuth Error**:
   - Verify redirect URLs match exactly
   - Check that Google+ API is enabled
   - Ensure NEXTAUTH_URL is correct

3. **Image Upload Error**:
   - Verify Vercel Blob is enabled
   - Check BLOB_READ_WRITE_TOKEN is set

4. **Build Error**:
   - Check all environment variables are set
   - Review Vercel function logs

## 🎉 You're Done!

Your Basilio app is now live and completely free! Share the URL with your family and start building your digital cookbook together.

**Your free setup includes**:
- ✅ Full-featured web app
- ✅ User authentication  
- ✅ Database storage
- ✅ Image upload & storage
- ✅ Family sharing
- ✅ Mobile-optimized design
- ✅ Automatic deployments