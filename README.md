# Next.js + shadcn/ui + Supabase Template

A modern full-stack application template built with Next.js 15, shadcn/ui components, and Supabase backend.

## Features

- ⚡ **Next.js 15** with App Router and Turbopack
- 🎨 **shadcn/ui** - Beautiful, accessible UI components
- 🗄️ **Supabase** - Backend as a Service with PostgreSQL
- 🎯 **TypeScript** - Type safety throughout
- 💨 **Tailwind CSS** - Utility-first CSS framework
- 🔧 **ESLint** - Code linting and formatting
- 🎭 **Sonner** - Beautiful toast notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (optional for demo)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Utility functions
└── ...
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Adding Components

Add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your project URL and anon key
3. Update your `.env.local` file with these credentials
4. Create tables and set up your database schema as needed

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Other Platforms

This template can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify
