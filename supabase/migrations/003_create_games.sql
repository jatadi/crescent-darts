-- Create games table
create table games (
  id uuid default uuid_generate_v4() primary key,
  game_type text not null,
  starting_score integer not null,
  status text not null default 'active',
  winner_id uuid references players(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  settings jsonb not null default '{}'::jsonb
);

-- Create game_players table for player participation and final stats
create table game_players (
  game_id uuid references games(id) on delete cascade,
  player_id uuid references players(id),
  final_score integer not null,
  darts_thrown integer not null,
  total_score integer not null,
  primary key (game_id, player_id)
);

-- Create turns table for detailed game history
create table turns (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references games(id) on delete cascade,
  player_id uuid references players(id),
  scores integer[] not null,
  turn_order integer not null
); 