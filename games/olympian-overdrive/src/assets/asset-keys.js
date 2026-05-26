export const ASSET_KEYS = {
  SHARED_PLAYER_JACK_DEFAULT: 'shared_player_jack_default',
  PICKLEBALL_OPPONENT_DEFAULT: 'pickleball_opponent_default',
  SOCCER_GOALIE_DEFAULT: 'soccer_goalie_default',
  PICKLEBALL_BALL_DEFAULT: 'pickleball_ball_default',
  SOCCER_BALL_DEFAULT: 'soccer_ball_default',
  PICKLEBALL_PADDLE_DEFAULT: 'pickleball_paddle_default',
};

export const ASSET_MANIFEST = [
  {
    key: ASSET_KEYS.SHARED_PLAYER_JACK_DEFAULT,
    path: 'assets/sports/player-jack.png',
    type: 'image',
  },
  {
    key: ASSET_KEYS.PICKLEBALL_OPPONENT_DEFAULT,
    path: 'assets/sports/player-ai-pickle.png',
    type: 'image',
  },
  {
    key: ASSET_KEYS.SOCCER_GOALIE_DEFAULT,
    path: 'assets/sports/player-goalie.png',
    type: 'image',
  },
  {
    key: ASSET_KEYS.PICKLEBALL_BALL_DEFAULT,
    path: 'assets/sports/ball-pickle.png',
    type: 'image',
  },
  {
    key: ASSET_KEYS.SOCCER_BALL_DEFAULT,
    path: 'assets/sports/ball-soccer.png',
    type: 'image',
  },
  {
    key: ASSET_KEYS.PICKLEBALL_PADDLE_DEFAULT,
    path: 'assets/sports/paddle.png',
    type: 'image',
  },
];

export const ASSET_PATHS_BY_KEY = ASSET_MANIFEST.reduce((acc, asset) => {
  acc[asset.key] = asset.path;
  return acc;
}, {});

export default ASSET_MANIFEST;