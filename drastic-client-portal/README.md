# DrasticDigital Client Portal

A modern, responsive client portal built with Next.js, TypeScript, and Tailwind CSS that integrates with Google Drive for file management.

## Features

- **User Authentication**: Secure email/password authentication using NextAuth.js
- **File Management**: Browse, upload, and download files from client-specific Google Drive folders
- **Dashboard**: Overview of client activity, stats, and quick access links
- **Responsive Design**: Fully responsive layout that works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14 with App Router, React 18
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **File Handling**: Google Drive API integration
- **Animations**: Framer Motion
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 
- Google Drive Service Account credentials

### Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables by creating a `.env.local` file with:
   ```
   # Authentication
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000

   # Google Drive API
   GOOGLE_CLIENT_EMAIL=your-service-account-email
   GOOGLE_PRIVATE_KEY=your-service-account-private-key
   ```
4. Run the development server:
   ```
   npm run dev
   ```

### Deployment

The application is designed to be deployed on Vercel:

1. Push your code to a GitHub repository
2. Import the project in the Vercel dashboard
3. Configure the required environment variables in the Vercel project settings
4. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Secret key for NextAuth session encryption |
| `NEXTAUTH_URL` | Your application's URL (e.g., https://your-app.vercel.app) |
| `GOOGLE_CLIENT_EMAIL` | Google service account email |
| `GOOGLE_PRIVATE_KEY` | Google service account private key |

## Project Structure

- `/src/app/(auth)` - Authentication pages (login, register)
- `/src/app/(dashboard)` - Dashboard pages and layout
- `/src/app/api` - API routes for file management and authentication
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and configurations
- `/src/lib/google-drive` - Google Drive integration

## License

This project is licensed under the MIT License
