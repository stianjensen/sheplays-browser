import players from './players.json';

export function countryRemaining(country: string, round: string): boolean {
  if (['round-1', 'round-2', 'round-3'].includes(round)) {
    return true;
  }

  if (round === 'round-4') {
    const remainingCountries = [
      'Spain',
      'Netherlands',
      'England',
      'Sweden',
      'Japan',
      'Australia',
      'Colombia',
      'France',
      'Jamaica',
      'Nigeria',
      'USA',
      'Norway',
      'Morocco',
      'Switzerland',
      'South-Africa',
      'Denmark',
    ];
    return remainingCountries.includes(country);
  }
  if (round === 'round-5') {
    const remainingCountries = [
      'Spain',
      'Netherlands',
      'England',
      'Sweden',
      'Japan',
      'Australia',
      'Colombia',
      'France',
    ];
    return remainingCountries.includes(country);
  }
  if (round === 'round-6') {
    const remainingCountries = [
      'Spain',
      'Netherlands',
      'England',
      'Sweden',
      'Japan',
      'Australia',
      'Colombia',
      'France',
    ];
    return remainingCountries.includes(country);
  }
  if (round === 'round-7') {
    const remainingCountries = [
      'Spain',
      'Netherlands',
      'England',
      'Sweden',
      'Japan',
      'Australia',
      'Colombia',
      'France',
    ];
    return remainingCountries.includes(country);
  }
  return false;
}

const countries: {[country: string]: {[round: string]: {points: number; players: number; remaining: boolean}}} = {};
for (const player of players) {
  if (!(player.club in countries)) {
    countries[player.club] = {};
    if (player.score) {
      for (const [round, score] of Object.entries(player.score)) {
        countries[player.club][round] = {
          points: score ?? 0,
          players: 1,
          remaining: countryRemaining(player.club, round),
        };
      }
    }
  } else {
    const country = countries[player.club];
    if (player.score) {
      for (const [round, score] of Object.entries(player.score)) {
        if (!(round in country)) {
          countries[player.club][round] = {
            points: score ?? 0,
            players: 1,
            remaining: countryRemaining(player.club, round),
          };
        } else {
          country[round].points += score ?? 0;
          country[round].players += 1;
        }
      }
    }
  }
}

export default countries;
