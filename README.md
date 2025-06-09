# Fantasy Learning Web App

A competitive learning platform where users join groups and compete in weekly 1-on-1 learning challenges. Content and questions are dynamically generated using ChatGPT API.

## Features

- **User Authentication**: NextAuth.js with email magic links and OAuth providers
- **Group Management**: Create and join learning groups with invite codes
- **Weekly Sessions**: Automated weekly pairing based on Elo ratings
- **Dynamic Content**: ChatGPT-generated learning modules and quiz questions
- **Interactive Learning**: Markdown content with embedded multiple-choice quizzes
- **Elo Rating System**: Competitive ranking system with rating updates
- **Real-time Leaderboards**: Weekly and overall group rankings
- **Background Jobs**: BullMQ for automated session creation

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Queue System**: BullMQ with Redis
- **Content Generation**: OpenAI GPT API
- **Styling**: Tailwind CSS with shadcn/ui components

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- OpenAI API key

### 1. Clone and Install

```bash
git clone <repository-url>
cd fantasy-learning
npm install --legacy-peer-deps
```

### 2. Environment Setup

Copy the example environment file and configure:

```bash
cp .env.example .env.local
```

Update `.env.local` with your values:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fantasy_learning"

# Redis (for BullMQ)
REDIS_URL="redis://localhost:6379"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI API for content generation
OPENAI_API_KEY="your-openai-api-key-here"

# Email Configuration (optional - for magic link auth)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npx prisma db seed
```

### 4. Start Services

Make sure PostgreSQL and Redis are running, then:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage

### Getting Started

1. **Sign Up/Sign In**: Use email magic link or OAuth providers
2. **Create or Join Group**: Use invite codes to join friends
3. **Weekly Challenges**: Sessions are automatically created every Monday
4. **Learn and Compete**: Read content, answer quizzes, earn points
5. **Track Progress**: View leaderboards and Elo ratings

### User Flow

1. **Join Group** → Enter invite code or create new group
2. **Weekly Matchup** → Paired with opponent based on Elo rating
3. **Topic Assignment** → ChatGPT generates educational content
4. **Learning Module** → Read content and answer embedded quizzes
5. **Point Scoring** → Earn points for correct answers
6. **Elo Update** → Ratings updated based on performance
7. **Leaderboard** → View weekly and overall rankings

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth authentication |
| POST | `/api/groups` | Create group |
| POST | `/api/groups/join` | Join group with invite code |
| GET | `/api/groups` | Get user's groups |
| GET | `/api/sessions/current` | Get current week's session |
| POST | `/api/responses` | Submit quiz answer |
| POST | `/api/sessions/[id]/complete` | Complete session & update Elo |
| GET | `/api/leaderboard` | Get group leaderboard |

## Architecture

```
[Browser SPA (Next.js)]
  ↕ HTTPS JSON API
[API Layer (Next.js API Routes)]
  ↕ ORM
[PostgreSQL Database]
  ↕ Background Worker (BullMQ)
[Content Service (OpenAI API)]
```

## Content Generation

The app uses OpenAI's GPT API to generate:

- **Learning Topics**: Random educational subjects
- **Content Modules**: 3-4 sections of educational content in Markdown
- **Quiz Questions**: Multiple-choice questions with explanations
- **Adaptive Difficulty**: Content tailored to learning objectives

## Background Jobs

BullMQ handles automated tasks:

- **Weekly Session Creation**: Every Monday at 00:00 UTC
- **User Pairing**: Based on Elo ratings (adjacent pairing)
- **Content Generation**: Automatic topic and question creation
- **Elo Updates**: Rating calculations after session completion

## Development

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main dashboard
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── ContentReader.tsx
│   ├── QuestionCard.tsx
│   ├── Leaderboard.tsx
│   └── SessionCard.tsx
├── lib/               # Utility functions
│   ├── auth.ts        # NextAuth config
│   ├── prisma.ts      # Database client
│   ├── openai.ts      # Content generation
│   ├── elo.ts         # Rating calculations
│   ├── queue.ts       # Background jobs
│   └── utils.ts       # Helper functions
└── prisma/
    └── schema.prisma  # Database schema
```

### Key Components

- **ContentReader**: Displays learning content with embedded quizzes
- **QuestionCard**: Interactive multiple-choice question component
- **SessionCard**: Shows matchup details and session status
- **Leaderboard**: Displays weekly and overall rankings

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
