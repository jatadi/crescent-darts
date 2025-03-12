# Crescent Darts 🎯

A modern web application for tracking darts games, built with Next.js and Supabase.

## Features

- **Multiple Game Types**
  - X01 (301, 501, 701)
  - Cricket
  
- **Player Management**
  - Create players with profile photos
  - Take photos using device camera
  - Delete players
  
- **Game Features**
  - Real-time score tracking
  - Turn management
  - Statistics tracking
  - Game history
  - Victory celebrations
  
- **Responsive Design**
  - Works on mobile and desktop
  - Dark mode support

## Technical Stack

- **Frontend**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Framer Motion

- **Backend**
  - Supabase (Database & Storage)
  - PostgreSQL

## Database Schema

### Tables
- `players` - Store player information
- `games` - Track game sessions
- `game_players` - Record player stats for each game
- `turns` - Store individual turn data

## Getting Started

1. Clone the repository
```bash
git clone [repository-url]
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server
```bash
npm run dev
```

## Game Rules

### X01
- Players start with 301, 501, or 701 points
- Must reach exactly zero to win
- Optional double-out rule

### Cricket
- Close numbers 15-20 and bullseye
- Three marks to close a number
- Score points on open numbers
- Lowest score wins when all numbers are closed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Deployment

This project is deployed using [Vercel](https://vercel.com). To deploy your own instance:

1. Fork this repository
2. Sign up for Vercel
3. Import your forked repository
4. Add your Supabase environment variables
5. Deploy!

Live demo: [your-url-here](https://your-url-here)
