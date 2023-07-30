import players from './data/players.json';
import league from './data/league.json';
import {Collapse, UncontrolledTooltip} from 'reactstrap';
import {useId, useState} from 'react';
import countries from './data/countries';
import {FullPlayerRoundInfo} from './types';

const teams = league.teams.sort((a, b) => b.score.total - a.score.total);
const currentRoundName = Object.keys(league.teams[0].score)
  .filter(it => it !== 'total')
  .sort()
  .reverse()[0] as 'round-1' | 'round-2';
const previousRoundScores = league.teams
  .slice()
  .sort((a, b) => b.score.total - b.score[currentRoundName] - (a.score.total - a.score[currentRoundName]));
const rankings = Object.fromEntries(
  teams.map(team => {
    return [
      team.teamName,
      {
        current: -1,
        previous: -1,
      },
    ];
  })
);

let previousUserCurrentScore = -1000;
let previousUserCurrentRank = 1;
for (let index = 0; index < teams.length; index++) {
  if (teams[index].score.total === previousUserCurrentScore) {
    rankings[teams[index].teamName].current = previousUserCurrentRank;
  } else {
    rankings[teams[index].teamName].current = index + 1;
    previousUserCurrentRank = index + 1;
  }
  previousUserCurrentScore = teams[index].score.total;
}

let previousUserPreviousRoundScore = -1000;
let previousUserPreviousRoundRank = 1;
for (let index = 0; index < previousRoundScores.length; index++) {
  const currentUserPreviousRoundScore =
    previousRoundScores[index].score.total - previousRoundScores[index].score[currentRoundName];
  if (currentUserPreviousRoundScore === previousUserPreviousRoundScore) {
    rankings[previousRoundScores[index].teamName].previous = previousUserPreviousRoundRank;
  } else {
    rankings[previousRoundScores[index].teamName].previous = index + 1;
    previousUserPreviousRoundRank = index + 1;
  }
  previousUserPreviousRoundScore = currentUserPreviousRoundScore;
}

function unslugify(raw: string): string {
  return raw
    .split('-')
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

const countryToFlagMapping: {[key: string]: string} = {
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
  Ireland: 'ir',
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

const TeamRound = ({
  slug,
  round,
  initialIsOpen,
}: {
  slug: string;
  round: (typeof teams)[0]['results']['round-1'];
  initialIsOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen ?? false);

  const id = useId();
  const roundPlayers: FullPlayerRoundInfo[] = round.players.map(player => {
    const playerInfo = players.find(it => it.playerId === player.playerId);
    if (playerInfo) {
      const countryPlayed = countries[playerInfo.club][slug]?.players > 0;
      const benched = countryPlayed && !player.played;
      return {
        ...playerInfo,
        ...player,
        benched,
      };
    } else {
      return undefined;
    }
  });
  const playersPlayed = roundPlayers.filter(player => player?.played).length;
  const playersAvailable = Math.min(11, 15 - roundPlayers.filter(player => player?.benched).length);

  return (
    <div className="card">
      <strong
        className="card-header d-flex align-items-center"
        onClick={() => {
          setIsOpen(previous => !previous);
        }}
        style={{cursor: 'pointer'}}
      >
        <div>{unslugify(slug)}</div>
        <div>
          <small>
            <span className="fas fa-shirt ms-4 me-2 text-muted" />
            {playersPlayed} / {playersAvailable}
          </small>
        </div>
        <div className="badge rounded-pill tabular-nums text-bg-secondary ms-auto">{round.score}</div>
      </strong>
      <Collapse isOpen={isOpen} className="card-body">
        <div className="d-flex flex-column gap-2">
          {roundPlayers.map(playerInfo => {
            if (playerInfo) {
              return (
                <div className="d-flex gap-3" key={playerInfo.playerId}>
                  <div
                    className={`align-self-center shadow-sm fi fis fi-${
                      countryToFlagMapping[playerInfo.country]
                    } rounded-circle`}
                  />
                  <small>
                    <div className="badge text-bg-secondary fw-bold text-center" style={{width: 30}}>
                      {playerInfo.position}
                    </div>
                  </small>
                  <div
                    className={
                      playerInfo.played
                        ? ''
                        : playerInfo.benched
                        ? 'text-decoration-line-through text-secondary'
                        : 'text-secondary'
                    }
                  >
                    <div id={'player' + id + playerInfo.playerId}>{playerInfo.name}</div>
                    <UncontrolledTooltip target={'#' + CSS.escape('player' + id + playerInfo.playerId)}>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                      }).format(playerInfo.fantasyPrice)}
                    </UncontrolledTooltip>
                  </div>
                  <div className="d-flex align-items-center gap-2 ms-auto">
                    {playerInfo.isCaptain && <div className="badge rounded-pill text-bg-success">2 x</div>}
                    {playerInfo.played && (
                      <div className="badge rounded-pill tabular-nums text-bg-primary">{playerInfo.points as any}</div>
                    )}
                  </div>
                </div>
              );
            } else {
              return (
                <div>
                  <em>Player info missing</em>
                </div>
              );
            }
          })}
          {round.transfers ? (
            <div className="d-flex justify-content-end align-items-center gap-3">
              <em>Transfers</em>
              <div className="badge rounded-pill tabular-nums text-bg-danger">{round.transfers}</div>
            </div>
          ) : null}
        </div>
      </Collapse>
    </div>
  );
};

const Team = ({team, className}: {team: (typeof teams)[0]; className?: string}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <h4
        className="d-flex align-items-center mb-0"
        style={{cursor: 'pointer'}}
        onClick={() => {
          setIsOpen(previous => !previous);
        }}
      >
        <div style={{width: '1em'}}>
          <small>
            {rankings[team.teamName].current < rankings[team.teamName].previous ? (
              <span className="fas fa-caret-up text-success" />
            ) : rankings[team.teamName].current > rankings[team.teamName].previous ? (
              <span className="fas fa-caret-down text-danger" />
            ) : (
              ''
            )}
          </small>
        </div>
        <div className="text-muted me-3" style={{minWidth: '1.2em'}}>
          <small>{rankings[team.teamName].current}.</small>
        </div>
        <div className="flex-fill">{team.teamName}</div>
        <div className="badge rounded-pill tabular-nums text-bg-secondary ms-3">{team.score.total}</div>
      </h4>
      <Collapse isOpen={isOpen}>
        <div className="d-flex flex-column gap-3 pt-3">
          {Object.entries(team.results)
            .sort(([slugA, _a], [slugB, _b]) => {
              if (slugA < slugB) {
                return -1;
              }
              if (slugA > slugB) {
                return 1;
              }
              return 0;
            })
            .map(([slug, round], index, results) => (
              <TeamRound key={slug} slug={slug} round={round} initialIsOpen={index === results.length - 1} />
            ))}
        </div>
      </Collapse>
    </div>
  );
};

function App() {
  console.log('players', players);
  console.log('countries', countries);
  console.log('league', league);

  return (
    <div className="d-flex py-3" style={{width: '100vw'}}>
      <div className="container mx-auto" style={{maxWidth: 600}}>
        <h1>Teams</h1>
        <div className="list-group">
          {teams.map(team => (
            <Team key={team.teamName} team={team} className="list-group-item" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
