# Blog Application

A simple blog application built with Express.js and SQLite.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
JWTSECRET=your_jwt_secret_key_here
PORT=1010
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your JWT secret:
```
JWTSECRET=your_secure_jwt_secret_here
```

3. Run the development server:
```bash
npm run dev
```

## Vercel Deployment

1. Set environment variables in Vercel dashboard:
   - `JWTSECRET`: Your JWT secret key

2. Deploy to Vercel:
```bash
vercel
```

## Important Notes

- This application uses an in-memory database for Vercel compatibility
- Data will be lost on each deployment - consider using a cloud database for production
- For production, consider migrating to PostgreSQL or MongoDB
