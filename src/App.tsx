import players from './data/players.json';
import league from './data/league.json';
import {Collapse, UncontrolledTooltip} from 'reactstrap';
import {useId, useState} from 'react';
import countries from './data/countries';
import deadlines from './data/deadlines.json';
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

function calculateTeamCompleteness(roundPlayers: (FullPlayerRoundInfo | undefined)[]): {
  playersPlayed: number;
  playersAvailable: number;
  teamIsComplete: boolean;
} {
  const playersPlayed = roundPlayers.filter(player => player?.played).length;
  const playersAvailable = Math.min(11, roundPlayers.length - roundPlayers.filter(player => player?.benched).length);

  const firstPendingPlayerIndex = roundPlayers.findIndex(
    player => !(player?.played || player?.benched || player?.injured)
  );
  const lastPlayedPlayerIndex = roundPlayers.findLastIndex(player => player?.played);

  const noPendingPlayers = firstPendingPlayerIndex === -1;
  /* If all players that are pending are _behind_ all players that have played, nobody will come on
     the field to overtake/change the "temporary" scores that are currently recorded.
     If you currently have temporary points recorded from a bench-player while waiting for your captain to play,
     the scores will change significantly once the captain plays.
  */
  const noPendingPlayersWillOvertakePlayedPlayers = firstPendingPlayerIndex > lastPlayedPlayerIndex;

  const teamIsComplete = noPendingPlayers || (playersPlayed == 11 && noPendingPlayersWillOvertakePlayedPlayers);
  return {
    playersPlayed,
    playersAvailable,
    teamIsComplete,
  };
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

const PlayerPosition = ({position}: {position: string}) => {
  let color: string;
  switch (position) {
    case 'FW':
      color = 'success';
      break;
    case 'MF':
      color = 'warning';
      break;
    case 'DF':
      color = 'danger';
      break;
    case 'GK':
      color = 'secondary';
      break;
    default:
      color = 'secondary';
  }
  return (
    <small>
      <div className={`badge bg-${color}-subtle text-${color}-emphasis fw-bold text-center`} style={{width: 30}}>
        {position}
      </div>
    </small>
  );
};

const Player = ({playerInfo}: {playerInfo: FullPlayerRoundInfo}) => {
  const id = useId();

  return (
    <div className="d-flex gap-3">
      <div
        className={`align-self-center shadow-sm fi fis fi-${
          countryToFlagMapping[playerInfo.country]
        } rounded-circle flex-shrink-0`}
      />
      <PlayerPosition position={playerInfo.position} />
      <div
        className={`d-flex align-items-baseline ${
          playerInfo.played
            ? ''
            : playerInfo.benched || playerInfo.injured
            ? 'text-decoration-line-through text-secondary'
            : 'text-secondary'
        }`}
      >
        <div id={'player' + id + playerInfo.playerId}>{playerInfo.name}</div>
        <UncontrolledTooltip target={'#' + CSS.escape('player' + id + playerInfo.playerId)}>
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(playerInfo.fantasyPrice)}
        </UncontrolledTooltip>
        {!playerInfo.played && !playerInfo.benched && !playerInfo.injured && (
          <small>
            <span
              className="ms-2 far fa-clock"
              title="The player will receive points once their team has played – as long as they are not benched."
            />
          </small>
        )}
        {!playerInfo.played && playerInfo.injured && (
          <small>
            <span
              className="ms-2 fas fa-user-injured text-danger"
              title="The player is injured and will therefore not play this round."
            />
          </small>
        )}
      </div>
      {playerInfo.played && (
        <div className="align-self-center ms-auto">
          {playerInfo.isCaptain ? (
            <div className="d-flex">
              <div className="badge pe-1 rounded-start-pill rounded-end-0 bg-success-subtle text-success-emphasis">
                2 x
              </div>
              <small className="badge ps-1 rounded-end-pill rounded-start-0 tabular-nums text-bg-primary">
                {playerInfo.points as any}
              </small>
            </div>
          ) : (
            <div className="badge rounded-pill tabular-nums text-bg-primary">{playerInfo.points}</div>
          )}
        </div>
      )}
    </div>
  );
};

const Lineup = ({
  slug,
  playerIds,
  transfers,
}: {
  slug: string;
  playerIds: (typeof teams)[0]['players']['round-1'];
  transfers: (typeof teams)[0]['transfers']['round-1'];
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const roundPlayers: (FullPlayerRoundInfo | undefined)[] =
    playerIds?.map(playerId => {
      return players.find(it => it.playerId === playerId);
    }) ?? [];

  return (
    <div className="list-group-item ps-0">
      <div className="d-flex align-items-center position-relative fw-semibold">
        <button
          className="btn p-0 fw-bold stretched-link tabular-nums"
          onClick={() => {
            setIsOpen(previous => !previous);
          }}
        >
          {unslugify(slug)}
        </button>
        <span className="ms-4 far fa-clock text-secondary" />
      </div>
      <Collapse isOpen={isOpen} className="card-body">
        <div className="d-flex flex-column gap-2 pt-3">
          {roundPlayers.map((playerInfo, index) =>
            playerInfo ? (
              <Player key={playerInfo.playerId} playerInfo={playerInfo} />
            ) : (
              <div key={index}>
                <em>Player info missing</em>
              </div>
            )
          )}
          {transfers ? (
            <div className="d-flex justify-content-end align-items-center gap-3">
              <em>Transfers</em>
              <div className="badge rounded-pill tabular-nums text-bg-danger">{transfers}</div>
            </div>
          ) : null}
        </div>
      </Collapse>
    </div>
  );
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

  const roundPlayers: (FullPlayerRoundInfo | undefined)[] = round.players.map(player => {
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
  const {playersPlayed, playersAvailable, teamIsComplete} = calculateTeamCompleteness(roundPlayers);

  return (
    <div className="list-group-item ps-0">
      <div className="d-flex align-items-center position-relative fw-semibold">
        <button
          className="btn p-0 fw-bold stretched-link tabular-nums"
          onClick={() => {
            setIsOpen(previous => !previous);
          }}
        >
          {unslugify(slug)}
        </button>
        <div>
          <small>
            <span className="fas fa-shirt ms-4 me-2 text-primary" />
            <span className="tabular-nums">{playersPlayed}</span>
            {playersPlayed === 11 && !teamIsComplete && (
              <span title="Team has starters that haven't played yet. Current score includes points from players on the bench">
                *
              </span>
            )}{' '}
            / <span className="tabular-nums">{playersAvailable}</span>
            {teamIsComplete && <span className="fas fa-check ms-2 text-primary" />}
          </small>
        </div>
        <div className="badge rounded-pill tabular-nums bg-primary-subtle text-primary-emphasis ms-auto">
          {round.score}
        </div>
      </div>
      <Collapse isOpen={isOpen} className="card-body">
        <div className="d-flex flex-column gap-2 pt-3">
          {roundPlayers.map((playerInfo, index) =>
            playerInfo ? (
              <Player key={playerInfo.playerId} playerInfo={playerInfo} />
            ) : (
              <div key={index}>
                <em>Player info missing</em>
              </div>
            )
          )}
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

  const ranking = rankings[team.teamName];

  let upcomingRound: string | undefined = undefined;
  for (const roundSlug in team.players) {
    if (!(roundSlug in team.results)) {
      if (new Date(deadlines[roundSlug as keyof typeof deadlines]) < new Date()) {
        upcomingRound = roundSlug;
      }
    }
  }

  return (
    <div className={className}>
      <div className="d-flex align-items-center gap-3 px-3 position-relative">
        <div className="d-flex align-items-center gap-2">
          <div className="text-center" style={{width: '1em'}}>
            {ranking.current < ranking.previous ? (
              <div className="d-flex flex-column">
                <span className="fas fa-fw fa-caret-up text-success" />
                <small>
                  <small className="text-success d-block">+{ranking.previous - ranking.current}</small>
                </small>
              </div>
            ) : ranking.current > ranking.previous ? (
              <div className="d-flex flex-column">
                <span className="fas fa-fw fa-caret-down text-danger" />
                <small>
                  <small className="text-danger d-block">-{ranking.current - ranking.previous}</small>
                </small>
              </div>
            ) : (
              ''
            )}
          </div>
          <div className="text-muted text-end tabular-nums" style={{minWidth: '1.3em'}}>
            {rankings[team.teamName].current}.
          </div>
        </div>
        <h5 className="flex-fill d-flex align-items-center gap-3 mb-0">
          <button
            className="btn btn-lg p-0 fw-medium text-start flex-fill stretched-link"
            onClick={() => {
              setIsOpen(previous => !previous);
            }}
          >
            {team.teamName}
          </button>
          <div className="badge rounded-pill tabular-nums bg-primary-subtle text-primary-emphasis">
            {team.score.total}
          </div>
        </h5>
      </div>
      <Collapse isOpen={isOpen}>
        <div className="list-group list-group-flush ps-3 pt-2">
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
          {upcomingRound && (
            <Lineup
              slug={upcomingRound}
              playerIds={team.players[upcomingRound as keyof typeof team.players]?.slice(0, 15)}
              transfers={team.transfers[upcomingRound as keyof typeof team.transfers]}
            />
          )}
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
    <div className="d-flex py-3 bg-light" style={{width: '100vw'}}>
      <div className="container mx-auto" style={{maxWidth: 600}}>
        <div className="mb-3 d-flex flex-row align-items-center justify-content-start">
          <img className="rounded-circle me-3" src="/leah.jpeg" style={{height: 50}} />
          <h1 className="mb-0">Leah Williamson minneliga</h1>
        </div>
        <div className="list-group">
          {teams.map(team => (
            <Team key={team.teamName} team={team} className="list-group-item px-0 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
