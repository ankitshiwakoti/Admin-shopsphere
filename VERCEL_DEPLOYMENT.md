# Deploying ShopSphere Admin to Vercel

This guide will help you deploy the ShopSphere Admin application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [Git](https://git-scm.com/) installed on your computer
3. A MongoDB database (e.g., [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## Deployment Steps

### 1. Prepare Your Project

Make sure your project includes the following files:
- `vercel.json` (configuration for Vercel)
- `.env` file with your environment variables (see `.env.example` for reference)
- `api/index.js` (entry point for Vercel serverless functions)

Your project structure should include:
```
project/
├── api/
│   └── index.js  (Vercel entry point)
├── public/       (Static assets)
├── views/        (EJS templates)
├── app.js        (Main application)
├── vercel.json   (Vercel configuration)
└── package.json  (Dependencies and scripts)
```

### 2. Set Up MongoDB

Ensure you have a MongoDB database ready. If using MongoDB Atlas:
1. Create a new project
2. Build a new cluster (the free tier is sufficient to start)
3. Create a database user with password
4. Whitelist IP addresses (you can use `0.0.0.0/0` to allow access from anywhere)
5. Copy your connection string for the next step

### 3. Deploy to Vercel

#### Option 1: Using the Vercel Dashboard

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Log in to Vercel Dashboard
3. Click "New Project"
4. Import your repository
5. Configure the project:
   - Framework Preset: Other
   - Build Command: `npm run vercel-build` (creates necessary directories)
   - Output Directory: Leave default
   - Development Command: `npm run dev`
6. Add Environment Variables:
   - Add all variables from your `.env` file, especially:
     - `MONGODB_URI`: Your MongoDB connection string
     - `SESSION_SECRET`: A random string for session security
     - `JWT_SECRET`: A random string for JWT tokens
     - `NODE_ENV`: Set to `production`
     - `VERCEL`: Set to `true`
7. Click "Deploy"

#### Option 2: Using the Vercel CLI

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Log in to Vercel from your terminal:
   ```
   vercel login
   ```

3. Navigate to your project directory and deploy:
   ```
   cd path/to/shopsphere-admin
   vercel
   ```

4. Follow the prompts to configure your project
5. Set your environment variables when prompted, or add them later in the Vercel dashboard

### 4. Troubleshooting Common Deployment Issues

#### My deployment fails with module import errors

This can happen when there are issues with ES modules. Make sure:
1. Your `package.json` has `"type": "module"` set
2. All imports use the `.js` extension (e.g., `import x from './file.js'`)
3. The Vercel build command creates any necessary directories

#### My app deploys but shows a 500 error

Check these common issues:
1. MongoDB connection string is incorrect
2. Environment variables are missing
3. Files or directories referenced in the code don't exist in the Vercel environment

To debug, check the function logs in your Vercel dashboard.

### 5. Handling File Uploads

Since Vercel has a read-only filesystem in production, file uploads won't work by default. Consider using a cloud storage service like:

- [AWS S3](https://aws.amazon.com/s3/)
- [Cloudinary](https://cloudinary.com/)
- [Firebase Storage](https://firebase.google.com/products/storage)

You'll need to update your file upload logic in the application to use one of these services.

### 6. Important Limitations

1. **Serverless Functions**: Vercel runs Node.js apps as serverless functions with some limitations:
   - Maximum execution time of 10 seconds (on free plan)
   - Maximum payload size of 4.5MB
   - Cold starts may cause the first request to be slower

2. **File System**: The filesystem is read-only except for `/tmp`, which is temporary

3. **WebSockets**: Not supported on the free plan

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js on Vercel](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js) 