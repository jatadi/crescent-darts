# Crescent Darts - Website Instructions

## Overview
Crescent Darts is a website designed to keep track of scores for darts games, supporting the most common game modes. The site will allow users to manage player profiles, track scores, and maintain head-to-head records between players.

## Game Modes
1. **x01**
   - Options: 201, 301, 501, 701
   - Rules:
     - Double In (optional)
     - Double Out (optional)

2. **Cricket**
   - Options: 15 Rounds, 20 Rounds

## Features
### General Gameplay Features
- Ability to select the number of players in a game
- Choose the number of **legs/sets** per match
- Enter custom names for each player
- Upload photos for each player

### Player Data Management
- Store player information (name, photo) in a database
- Keep a **head-to-head record** between players
- Display player statistics and win/loss records

### Scoring Logic
- After each dart (3 per turn), press the amount that was hit:
  - Values: **1 - 20, 25, 50**
  - Multipliers: **Single, Double, Triple (1 - 20)**

## Tech Stack
Suggested technologies for implementation:
- **Frontend:** Next.js (React) with Tailwind CSS
- **Backend:** Node.js (Express or Next.js API routes)
- **Database:** PostgreSQL / Supabase for player and game data storage
- **Authentication:** Optional, using Firebase or Supabase Auth

## UI & UX Considerations
- **Game Setup Page:**
  - Select game mode (x01 or Cricket)
  - Choose number of players
  - Enter player names and upload photos
  - Set number of legs/sets
  
- **Gameplay Interface:**
  - Display player names, photos, and scores
  - Interactive UI for scoring darts
  - Rules enforcement (e.g., Double In/Out for x01)
  
- **Stats & History Page:**
  - Show player stats and head-to-head records
  - Display past matches with results

## API Endpoints
- **POST /players** - Add a new player (name, photo)
- **GET /players** - Fetch all players
- **POST /game** - Create a new game session
- **GET /game/{id}** - Retrieve game details
- **POST /score** - Update player scores
- **GET /history** - Fetch match history

## Additional Notes
- The website should be mobile-friendly
- Consider adding a "Save Game" feature for resuming later
- A dark mode theme would be a plus

## UI Requirements
- Mobile-friendly design
- Simple, intuitive scoring interface
- Clear display of current scores
- Basic animations for score updates
- Dark mode support

---
This specification covers the essential features needed for a functional darts scoring application.

Let me know if you'd like any refinements or additional details!

# Crescent Darts - Development Plan

## Phase 1: Project Setup & Basic Structure (1-2 days)
1. Initialize Next.js project with TypeScript
   ```bash
   npx create-next-app@latest crescent-darts --typescript --tailwind
   ```

2. Set up Supabase project
   - Create new project
   - Set up database tables
   - Get API keys

3. Create basic project structure
   ```
   src/
     components/
     pages/
     types/
     utils/
     styles/
   ```

## Phase 2: Core Components & Layout (2-3 days)
1. Create basic layout components
   - Header with navigation
   - Main layout wrapper
   - Basic responsive design

2. Implement essential UI components
   - Button component
   - Player card component
   - Score input pad
   - Game mode selector

3. Set up basic routing
   - Home page
   - New game page
   - Active game page
   - Players page
   - History page

## Phase 3: Player Management (2 days)
1. Create player database operations
   - Add new player
   - List players
   - Edit player details

2. Build player management UI
   - Player creation form
   - Player list view
   - Basic player statistics

## Phase 4: Game Logic Implementation (3-4 days)
1. Implement x01 game mode
   - Score calculation
   - Turn management
   - Double out validation
   - Win condition checking

2. Implement Cricket game mode
   - Marks tracking
   - Points calculation
   - Win condition checking

3. Create game state management
   - Turn tracking
   - Score history
   - Player rotation

## Phase 5: Game UI & Interaction (3-4 days)
1. Build game setup interface
   - Game mode selection
   - Player selection
   - Game options configuration

2. Create main game interface
   - Score input pad
   - Current player indicator
   - Score display
   - Turn history

3. Implement game flow
   - Turn transitions
   - Score updates
   - Win detection and game end

## Phase 6: History & Statistics (2-3 days)
1. Create game history tracking
   - Save completed games
   - Record player statistics

2. Build history interface
   - List of past games
   - Basic filtering
   - Game details view

## Phase 7: Polish & Refinement (2-3 days)
1. Implement dark mode
   - Theme toggle
   - Consistent styling

2. Add animations
   - Score updates
   - Turn transitions
   - Winner celebration

3. Mobile optimization
   - Touch-friendly controls
   - Responsive layouts
   - Testing on different devices

## Phase 8: Testing & Deployment (1-2 days)
1. Testing
   - Basic functionality testing
   - Mobile device testing
   - Score calculation verification

2. Deployment
   - Deploy to Vercel
   - Set up production database
   - Final testing in production

## Total Estimated Time: 2-3 weeks

### Getting Started
1. Set up development environment
   - Node.js
   - Git repository
   - Code editor

2. Install dependencies
   ```bash
   npm install @supabase/supabase-js
   npm install @headlessui/react
   npm install clsx
   ```

3. Begin with Phase 1 and progress sequentially

### Notes
- Each phase should be completed with basic testing before moving to the next
- Regular commits with clear messages
- Mobile-first development approach
- Focus on core functionality first, then add enhancements

---
This plan can be adjusted based on progress and priorities.
