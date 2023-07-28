import players from "./players.json";

const countries: {[country: string]: {[round: string]: {points: number; players: number}}} = {};
for (const player of players) {
  if (!(player.club in countries)) {
    countries[player.club] = {}
    if (player.score){
      for (const [round, score] of Object.entries(player.score)) {
        countries[player.club][round] = {
          points: score ?? 0,
          players: 1,
        }
      }
    }
  } else {
    const country = countries[player.club];
    if (player.score){
      for (const [round, score] of Object.entries(player.score)) {
        if (!(round in country)) {
          countries[player.club][round] = {
            points: score ?? 0,
            players: 1,
          }
        } else {
          country[round].points += score ?? 0;
          country[round].players += 1;
        }
      }
    }
  }
}

export default countries;
