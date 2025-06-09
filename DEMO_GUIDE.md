# Fantasy Learning App - Demo Guide

## 🚀 Application Overview

Fantasy Learning is a competitive learning platform where users join groups and compete in weekly 1-on-1 learning challenges. The app features:

- **User Authentication** with NextAuth.js (credentials provider for demo)
- **Group Management** with invite codes
- **Weekly Sessions** with automatic user pairing based on Elo ratings
- **Interactive Learning Modules** with embedded quizzes
- **Real-time Scoring** and Elo rating updates
- **Leaderboards** (weekly and overall)
- **AI Content Generation** (OpenAI integration ready)

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, NextAuth.js, Prisma ORM
- **Database**: SQLite (for demo), PostgreSQL (production ready)
- **Queue System**: BullMQ with Redis (for automated session creation)
- **AI Integration**: OpenAI API for content generation

## 🎯 Demo Data

The application has been seeded with demo data:

### Demo Users
- **alice@example.com** (Alice Johnson, Rating: 1200)
- **bob@example.com** (Bob Smith, Rating: 1150)  
- **charlie@example.com** (Charlie Brown, Rating: 1300)

### Demo Group
- **Name**: Demo Learning Group
- **Invite Code**: `DEMO123`
- **Members**: All three demo users

### Demo Content
- **Topic**: Introduction to Quantum Computing
- **Sections**: 2 learning modules with embedded quizzes
- **Questions**: 4 multiple-choice questions total

## 🧪 Testing the Application

### 1. Start the Application
```bash
npm run dev
```
The app will be available at http://localhost:3000

### 2. Authentication Flow
1. Open http://localhost:3000
2. Click "Sign In to Get Started"
3. Use the "Test User" provider
4. Enter any email (e.g., `alice@example.com` for demo user)

### 3. Group Management
1. After signing in, you'll see the dashboard
2. If using a demo email, you'll see the "Demo Learning Group"
3. Test creating a new group or joining with invite code `DEMO123`

### 4. Learning Session
1. Click on the active session card
2. Click "Start Learning" to begin the interactive module
3. Read through the content sections
4. Answer the embedded quiz questions
5. See real-time scoring and progress tracking

### 5. Leaderboard
1. View the leaderboard in the sidebar
2. Switch between "Weekly" and "Overall" rankings
3. See Elo ratings and scores

## 🔧 API Endpoints Testing

All API endpoints are functional and protected:

### Authentication
- `GET /api/auth/session` - Get current session
- `GET /api/auth/providers` - Get available auth providers
- `POST /api/auth/signin/credentials` - Sign in with credentials

### Groups
- `GET /api/groups` - Get user's groups (protected)
- `POST /api/groups` - Create new group (protected)
- `POST /api/groups/join` - Join group with invite code (protected)

### Sessions
- `GET /api/sessions/current?groupId=<id>` - Get current week's session (protected)
- `POST /api/sessions/<id>/complete` - Complete session and update Elo (protected)

### Learning
- `POST /api/responses` - Submit quiz answers (protected)
- `GET /api/leaderboard?groupId=<id>&scope=<weekly|overall>` - Get rankings (protected)

## 🎮 Full User Flow Demo

1. **Sign In**: Use `alice@example.com`
2. **View Dashboard**: See the Demo Learning Group and active session
3. **Start Learning**: Click on the session with Bob Smith
4. **Complete Module**: Read content and answer all questions
5. **Check Scores**: See updated scores and Elo ratings
6. **View Leaderboard**: Check rankings in the sidebar

## 🧪 Automated Tests

Run the test suite to verify all functionality:

```bash
node test-app.js
```

This tests:
- Homepage loading
- Authentication APIs
- Database connectivity
- Protected route behavior
- Service configurations

## 🔄 Background Services

The app includes automated systems:

### Session Creation Worker
- Automatically creates weekly sessions every Monday
- Pairs users based on Elo ratings
- Generates new topics using OpenAI API

### Elo Rating System
- Updates ratings after each completed session
- Uses configurable K-factor for rating adjustments
- Maintains competitive balance

## 🚀 Production Deployment

For production deployment:

1. **Database**: Switch to PostgreSQL in `prisma/schema.prisma`
2. **Redis**: Set up Redis server for BullMQ
3. **OpenAI**: Add real OpenAI API key for content generation
4. **Email**: Configure email provider for authentication
5. **Environment**: Update all environment variables

## 📊 Key Features Demonstrated

✅ **Complete Authentication System**
✅ **Group Management with Invite Codes**
✅ **Interactive Learning Modules**
✅ **Real-time Quiz System**
✅ **Elo Rating Calculations**
✅ **Leaderboard Rankings**
✅ **Responsive UI with Modern Design**
✅ **API Protection and Middleware**
✅ **Database Integration**
✅ **Background Job Processing**

## 🎉 Success Criteria

The application successfully demonstrates:

1. **User Authentication** - Secure login/logout flow
2. **Group Dynamics** - Create, join, and manage learning groups
3. **Competitive Learning** - Weekly challenges with scoring
4. **Interactive Content** - Rich learning modules with quizzes
5. **Real-time Updates** - Live scoring and rating changes
6. **Modern UI/UX** - Beautiful, responsive interface
7. **Scalable Architecture** - Production-ready backend systems

The Fantasy Learning MVP is fully functional and ready for user testing! 