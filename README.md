# Hometown Music Tracker

A Next.js application for tracking concerts and music events at local venues. Users can follow their favorite artists and venues to receive personalized updates about upcoming shows.

## Features

- **User Authentication**: Secure login, signup, and password reset flows
- **Artist & Venue Following**: Follow your favorite artists and venues
- **Personalized Feed**: See upcoming shows from artists and venues you follow
- **Admin Dashboard**: Manage artists, venues, and events
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, Bootstrap
- **Backend**: Next.js Server Actions, Supabase
- **Authentication**: Supabase Auth with Next.js Server Actions
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn
- Supabase account and project

### Environment Setup

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication System

The application uses Supabase Auth with Next.js Server Actions for authentication. This approach ensures secure cookie handling and provides a robust authentication flow.

### Key Features

- **Server Actions**: All authentication operations are handled by server actions
- **Secure Cookie Handling**: Cookies are managed securely by the server
- **Role-Based Access Control**: Support for admin and user roles
- **Form Validation**: Comprehensive validation for all authentication forms
- **Error Handling**: User-friendly error messages and detailed logging

### Authentication Flow

1. User registers or logs in
2. Server action authenticates the user and sets session cookies
3. Middleware protects routes based on authentication status
4. User can update profile, reset password, or log out

For detailed documentation on the authentication system, see [Authentication System Documentation](docs/authentication-system.md).

## Project Structure

- **`/app`**: Next.js App Router pages and components
- **`/actions`**: Server actions for authentication and data operations
- **`/components`**: Reusable React components
- **`/utils`**: Utility functions and helpers
- **`/docs`**: Project documentation
- **`/public`**: Static assets

## Documentation

For more detailed documentation, see the [docs folder](docs/README.md).

## Development

### Running Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Deployment

The application is configured for deployment on Vercel. See [Vercel Deployment Guide](docs/vercel-deployment-guide.md) for details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
