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
      'South Africa',
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
    const remainingCountries = ['Spain', 'England', 'Sweden', 'Australia'];
    return remainingCountries.includes(country);
  }
  if (round === 'round-7') {
    const remainingCountries = ['Spain', 'England', 'Sweden', 'Australia'];
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

for (const country of Object.keys(countries)) {
  for (let round = 1; round <= 7; round++) {
    const slug = `round-${round}`;
    if (countries[country][slug] === undefined) {
      countries[country][slug] = {
        players: 0,
        points: 0,
        remaining: countryRemaining(country, slug),
      };
    }
  }
}

export default countries;

export const countryToFlagMapping: {[key: string]: string} = {
  Australia: 'au',
  Argentina: 'ar',
  Brazil: 'br',
  Canada: 'ca',
  Colombia: 'co',
  'Costa Rica': 'cr',
  China: 'cn',
  Denmark: 'dk',
  England: 'gb-eng',
  France: 'fr',
  Germany: 'de',
  Haiti: 'ht',
  Ireland: 'ie',
  Italy: 'it',
  Jamaica: 'jm',
  Japan: 'jp',
  Morocco: 'ma',
  Netherlands: 'nl',
  'New Zealand': 'nz',
  Norway: 'no',
  Nigeria: 'ng',
  Panama: 'pa',
  Philippines: 'ph',
  Portugal: 'pt',
  Spain: 'es',
  'South Africa': 'za',
  'South Korea': 'kr',
  Sweden: 'se',
  Switzerland: 'ch',
  USA: 'us',
  Vietnam: 'vn',
  Zambia: 'zm',
};
