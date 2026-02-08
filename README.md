# AI Game Maker Studio

A production-ready web application that lets anyone create games by chatting with AI. Generate code with OpenAI and 3D assets with Meshy AI, preview instantly, and export your creation.

## Features

- **Chat-Based Development**: Describe what you want in plain English
- **AI Code Generation**: Uses OpenAI GPT-4o to generate and modify game code
- **3D Asset Generation**: Create 3D models from text prompts using Meshy AI
- **Instant Preview**: See your game running in real-time (Phaser for 2D, Three.js for 3D)
- **Starter Templates**: Begin with pre-built templates for platformers, shooters, and exploration games
- **Project Export**: Download complete projects with all code and assets
- **Secure by Design**: Server-side API calls, patch validation, rate limiting

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: Zustand
- **Database**: Prisma + SQLite (swappable to PostgreSQL)
- **Auth**: Email magic links (JWT-based sessions)
- **Game Engines**: Phaser (2D), Three.js (3D)
- **AI APIs**: OpenAI (code generation), Meshy AI (3D assets)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Copy the environment file and configure:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - `DATABASE_URL` - SQLite file path (default: `file:./dev.db`)
   - `JWT_SECRET` - A secure random string for sessions
   - `OPENAI_API_KEY` - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
   - `MESHY_API_KEY` - Get from [Meshy AI](https://www.meshy.ai/)

4. Initialize the database:

```bash
pnpm db:push
pnpm db:seed
```

5. Start the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript check
pnpm test         # Run tests
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed templates
pnpm db:studio    # Open Prisma Studio
```

## Project Structure

```
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Template seeding
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   │   ├── auth/    # Authentication endpoints
│   │   │   ├── codex/   # OpenAI code generation
│   │   │   ├── meshy/   # Meshy 3D generation
│   │   │   └── projects/# Project CRUD
│   │   ├── auth/        # Auth pages
│   │   ├── studio/      # Studio app
│   │   └── page.tsx     # Landing page
│   ├── components/
│   │   ├── studio/      # Studio components
│   │   └── ui/          # shadcn/ui components
│   └── lib/
│       ├── auth/        # Auth utilities
│       ├── security/    # Patch validation, rate limiting
│       └── store/       # Zustand store
└── ...
```

## Security Features

- **Server-Side API Keys**: All API keys are stored in environment variables and used only on the server
- **Patch Validation**: Generated code is validated before application
  - Path traversal prevention
  - Forbidden paths (node_modules, .env, .git)
  - File extension whitelist
  - Size limits
  - Binary content detection
- **Unsafe Code Detection**: Warnings for eval, child_process, etc.
- **Rate Limiting**: Per-user limits on API calls (20 codex/hour, 10 meshy/hour)
- **Magic Link Auth**: Passwordless, secure email authentication

## Demo Mode

If API keys are not configured, the app runs in demo mode:
- Code generation returns sample responses
- 3D generation simulates processing and returns placeholder assets
- Magic link URLs are logged to the console

## Templates

Three starter templates are included:

1. **2D Platformer**: Side-scrolling with player movement, jumping, and collectibles
2. **Top-Down Shooter**: WASD movement, mouse aiming, and shooting mechanics
3. **3D Exploration**: First-person scene with terrain, lighting, and object placement

## API Endpoints

### Authentication
- `POST /api/auth/login` - Send magic link
- `GET /api/auth/verify` - Verify magic link token
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `GET /api/projects/[id]/export` - Export project

### Code Generation
- `POST /api/codex/generate` - Generate code changes

### 3D Assets
- `POST /api/meshy/create` - Start 3D generation
- `GET /api/meshy/status?id=` - Check job status

### Admin
- `GET /api/jobs` - View job queue status

## Testing

```bash
pnpm test
```

Tests cover:
- Path traversal protection
- File content validation
- Patch format validation
- Unsafe code detection

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Configure environment variables
4. Deploy

### Self-Hosted

1. Build the application:
```bash
pnpm build
```

2. Start the server:
```bash
pnpm start
```

For production, consider:
- Using PostgreSQL instead of SQLite
- Setting up proper SMTP for magic links
- Configuring a CDN for assets

## License

MIT

---

Built with Next.js, Prisma, and AI
