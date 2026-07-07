# Eema Frontend

## Stack
- Next.js (React)
- TypeScript
- Tailwind CSS

## Prerequisites
- Node.js 20+ (LTS)
- npm or yarn or pnpm

## How to run locally
1. Copy the example environment file and fill in the required variable:
   ```bash
   cp .env.example .env.local
   ```
   The only required variable is `NEXT_PUBLIC_API_URL` (the base URL of the backend API).

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## Environment Variables
See `.env.example` for the list of variables.

## Important: Backend Dependency
The frontend requires the eema-backend to be running and accessible at the URL specified in `NEXT_PUBLIC_API_URL`.
By default, for local development, set:
   NEXT_PUBLIC_API_URL=http://localhost:8080

## Vercel Deployment
1. Push the code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Import the project in Vercel.
3. Set the environment variable `NEXT_PUBLIC_API_URL` to the production backend URL (e.g., `https://api.eema.co`).
4. Deploy.

