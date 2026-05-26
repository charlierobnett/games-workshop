export const SPORT_PICKLEBALL = 'pickleball';
export const SPORT_SOCCER = 'soccer';
export const SPORT_MASHUP_PICKLE_SOCCER = 'mashup-pickle-soccer';

export const SPORT_KEYS = [
  SPORT_PICKLEBALL,
  SPORT_SOCCER,
  SPORT_MASHUP_PICKLE_SOCCER,
];

export function isValidSportKey(key) {
  return SPORT_KEYS.includes(key);
}

export function getRandomBaseSportKey() {
  const baseSports = [SPORT_PICKLEBALL, SPORT_SOCCER];
  return baseSports[Math.floor(Math.random() * baseSports.length)];
}