import players from './data/players.json';
import league from './data/league.json';
import {Collapse, UncontrolledTooltip, Modal, ModalHeader, ModalBody} from 'reactstrap';
import {createContext, useContext, useId, useState} from 'react';
import countries, {countryToFlagMapping} from './data/countries';
import deadlines from './data/deadlines.json';
import {FullPlayerRoundInfo, PlayerInfo, Position} from './types';
import {
  createHashRouter,
  createRoutesFromElements,
  Link,
  Outlet,
  Route,
  RouterProvider,
  useParams,
} from 'react-router-dom';
import {Stats} from './Stats';

const leagueTeams = league.teams.map(team => ({
  ...team,
  points: Object.entries(team.score)
    .filter(([slug]) => slug !== 'total')
    .map(([_, points]) => points)
    .reduce((a, b) => a + b, 0),
}));

const teams = leagueTeams.sort((a, b) => b.points - a.points);
const currentRoundName = Object.keys(leagueTeams[0].score)
  .filter(it => it !== 'total')
  .sort()
  .reverse()[0] as 'round-1' | 'round-2';
const previousRoundScores = leagueTeams
  .slice()
  .sort((a, b) => b.points - b.score[currentRoundName] - (a.points - a.score[currentRoundName]));
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
  if (teams[index].points === previousUserCurrentScore) {
    rankings[teams[index].teamName].current = previousUserCurrentRank;
  } else {
    rankings[teams[index].teamName].current = index + 1;
    previousUserCurrentRank = index + 1;
  }
  previousUserCurrentScore = teams[index].points;
}

let previousUserPreviousRoundScore = -1000;
let previousUserPreviousRoundRank = 1;
for (let index = 0; index < previousRoundScores.length; index++) {
  const currentUserPreviousRoundScore =
    previousRoundScores[index].points - previousRoundScores[index].score[currentRoundName];
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

function orderPositions(a: PlayerInfo, b: PlayerInfo): number {
  if (a?.position && b?.position) {
    const positionValue = {
      GK: 0,
      DF: 1,
      MF: 2,
      FW: 3,
    };
    return positionValue[a.position] - positionValue[b.position];
  }
  if (!a?.position && b?.position) {
    return -1;
  }
  if (a?.position && !b?.position) {
    return 1;
  }
  return 0;
}

function calculateTeamCompleteness(roundPlayers: (FullPlayerRoundInfo | undefined)[]): {
  playersPlayed: number;
  playersAvailable: number;
  teamIsComplete: boolean;
} {
  const playersPlayed = roundPlayers.filter(player => player?.played).length;
  const playersAvailable = Math.min(11, roundPlayers.length - roundPlayers.filter(player => player?.out).length);

  const firstPendingPlayerIndex = roundPlayers.findIndex(
    player => !(player?.played || player?.out || player?.injured || !countries)
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

export const Country = ({country}: {country: string}) => {
  return (
    <div
      className={`align-self-center shadow-sm fi fis fi-${countryToFlagMapping[country]} rounded-circle flex-shrink-0`}
    />
  );
};

export const PlayerPosition = ({position}: {position: Position}) => {
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
        {position ?? '?'}
      </div>
    </small>
  );
};

const Player = ({playerInfo}: {playerInfo?: FullPlayerRoundInfo}) => {
  const id = useId();

  return playerInfo ? (
    <div className="d-flex gap-3">
      <Country country={playerInfo.country} />
      <PlayerPosition position={playerInfo.position} />
      <div
        className={`d-flex align-items-baseline ${
          playerInfo.played
            ? ''
            : playerInfo.out || playerInfo.injured
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
          }).format(playerInfo.fantasyPrice ?? 0)}
        </UncontrolledTooltip>
        {playerInfo.isDesignatedCaptain && (
          <div className="ms-2 badge rounded-pill bg-success-subtle text-success-emphasis">C</div>
        )}
        {playerInfo.isDesignatedViceCaptain && (
          <div className="ms-2 badge rounded-pill bg-success-subtle text-success-emphasis">V</div>
        )}
        {!playerInfo.played && !playerInfo.out && !playerInfo.injured && (
          <small>
            <span
              className="ms-2 far fa-clock"
              title="The player will receive points once their team has played – as long as they are not out."
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
  ) : (
    <div>
      <em>Player info missing</em>
    </div>
  );
};

type PlayerOrdering = 'priority' | 'position';
const PlayerOrderingContext = createContext<PlayerOrdering>('position');

const Squad = ({
  onFieldPlayers,
  benchedPlayers,
  transfers,
}: {
  onFieldPlayers: (FullPlayerRoundInfo | undefined)[];
  benchedPlayers: (FullPlayerRoundInfo | undefined)[];
  transfers: number;
}) => (
  <div className="d-flex flex-column gap-2 pt-3">
    {onFieldPlayers.map((playerInfo, index) => (
      <Player key={playerInfo?.playerId ?? index} playerInfo={playerInfo} />
    ))}
    <div className="d-flex flex-column bg-light gap-2 pt-1" style={{marginRight: -8, marginLeft: -8, padding: 8}}>
      Bench
      {benchedPlayers.map((playerInfo, index) => (
        <Player key={playerInfo?.playerId ?? index} playerInfo={playerInfo} />
      ))}
    </div>
    {transfers ? (
      <div className="d-flex justify-content-end align-items-center gap-3">
        <em>Transfers</em>
        <div className="badge rounded-pill tabular-nums text-bg-danger">{transfers}</div>
      </div>
    ) : null}
  </div>
);

const FutureLineup = ({
  slug,
  playerIds,
  transfers,
}: {
  slug: string;
  playerIds: (typeof teams)[0]['players']['round-1'];
  transfers: (typeof teams)[0]['transfers']['round-1'];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ordering = useContext(PlayerOrderingContext);

  const roundPlayers: (FullPlayerRoundInfo | undefined)[] =
    playerIds?.map((player, index) => {
      const playerInfo = players.find(it => it.playerId === player);
      if (playerInfo) {
        const out = !countries[playerInfo.club][slug]?.remaining || (playerInfo.injured ?? undefined);
        return {
          ...playerInfo,
          position: playerInfo.position as Position,
          out,
          isDesignatedCaptain: index === 0,
          isDesignatedViceCaptain: index === 1,
        };
      } else {
        return undefined;
      }
    }) ?? [];
  const onFieldPlayers = roundPlayers.slice(0, 11);
  const benchedPlayers = roundPlayers.slice(11);
  if (ordering === 'position') {
    onFieldPlayers.sort(orderPositions);
  }

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
        <Squad onFieldPlayers={onFieldPlayers} benchedPlayers={benchedPlayers} transfers={transfers} />
      </Collapse>
    </div>
  );
};

const TeamRound = ({
  slug,
  round,
  initialIsOpen,
  title,
  className,
}: {
  slug: string;
  round: (typeof teams)[0]['results']['round-1'];
  initialIsOpen?: boolean;
  title: string;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen ?? false);
  const ordering = useContext(PlayerOrderingContext);

  const roundPlayers: (FullPlayerRoundInfo | undefined)[] = round.players.map((player, index) => {
    const playerInfo = players.find(it => it.playerId === player.playerId);
    if (playerInfo) {
      const countryPlayed = countries[playerInfo.club][slug]?.players > 0;
      const out = !countries[playerInfo.club][slug]?.remaining || (countryPlayed && !player.played);
      return {
        ...playerInfo,
        ...player,
        position: playerInfo.position as Position,
        out,
        isDesignatedCaptain: index === 0,
        isDesignatedViceCaptain: index === 1,
      };
    } else {
      return undefined;
    }
  });
  const {playersPlayed, playersAvailable, teamIsComplete} = calculateTeamCompleteness(roundPlayers);
  const onFieldPlayers = teamIsComplete ? roundPlayers.filter(player => player?.played) : roundPlayers.slice(0, 11);
  const benchedPlayers = teamIsComplete ? roundPlayers.filter(player => !player?.played) : roundPlayers.slice(11);
  if (ordering === 'position') {
    onFieldPlayers.sort(orderPositions);
  }

  return (
    <div className={`list-group-item ps-0 ${className ?? ''}`}>
      <div className="d-flex align-items-center gap-3 position-relative fw-semibold">
        <button
          className="btn p-0 fw-bold stretched-link tabular-nums text-start"
          onClick={() => {
            setIsOpen(previous => !previous);
          }}
        >
          {title}
        </button>
        <div className="d-flex" style={{whiteSpace: 'nowrap'}}>
          <small>
            <span className="fas fa-shirt ms-2 me-2 text-primary" />
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
        <Squad onFieldPlayers={onFieldPlayers} benchedPlayers={benchedPlayers} transfers={round.transfers} />
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
          <div className="badge rounded-pill tabular-nums bg-primary-subtle text-primary-emphasis">{team.points}</div>
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
              <TeamRound
                key={slug}
                title={unslugify(slug)}
                slug={slug}
                round={round}
                initialIsOpen={index === results.length - 1}
              />
            ))}
          {upcomingRound && (
            <FutureLineup
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

const League = () => {
  const rounds: string[] = [];
  for (const player of players) {
    for (const round in player.score) {
      if (!rounds.includes(round)) {
        rounds.push(round);
      }
    }
  }

  rounds.sort();

  const {roundSlug: selectedRoundSlug} = useParams<{roundSlug: string}>();

  return (
    <div className="container mx-auto" style={{maxWidth: 600}}>
      <div className="mb-3 d-flex flex-row align-items-center justify-content-start">
        <img className="rounded-circle me-3" src="/leah.jpeg" style={{height: 50}} />
        <h1 className="mb-0">Leah Williamson minneliga</h1>
      </div>
      <div className="mb-3">
        <Link className="btn btn-outline-secondary" to="/stats">
          <span className="fas fa-table me-3" />
          Player stats
          <span className="fas fa-chevron-right ms-3" />
        </Link>
      </div>
      <div className="d-flex gap-2 pb-2 mb-2" style={{overflowX: 'auto', whiteSpace: 'nowrap'}}>
        <Link
          className={`btn btn-sm ${!selectedRoundSlug ? 'btn-secondary' : 'btn-outline-secondary'} rounded-pill`}
          to="/"
        >
          All rounds
        </Link>
        {rounds.map(roundSlug => (
          <Link
            key={roundSlug}
            className={`btn btn-sm ${
              selectedRoundSlug === roundSlug ? 'btn-secondary' : 'btn-outline-secondary'
            } rounded-pill`}
            to={`/rounds/${roundSlug}`}
          >
            {unslugify(roundSlug)}
          </Link>
        ))}
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  );
};

const AllRounds = () => {
  return (
    <div className="list-group">
      {teams.map(team => (
        <Team key={team.teamName} team={team} className="list-group-item px-0 bg-white" />
      ))}
    </div>
  );
};

const LeagueRound = () => {
  const {roundSlug} = useParams<{roundSlug: string}>();

  const roundResults = teams
    .map(team => ({teamName: team.teamName, results: team.results[roundSlug as keyof typeof team.results]}))
    .sort((a, b) => {
      return b.results.score - a.results.score;
    });

  return (
    <div className="list-group">
      {roundResults.map(({teamName, results}) => (
        <TeamRound key={teamName} title={teamName} className="ps-3" slug={roundSlug!} round={results} />
      ))}
    </div>
  );
};

function App() {
  console.log('players', players);
  console.log('countries', countries);
  console.log('league', league);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ordering, setOrdering] = useState<PlayerOrdering>('position');

  const router = createHashRouter(
    createRoutesFromElements(
      <>
        <Route
          path="/"
          element={
            <PlayerOrderingContext.Provider value={ordering}>
              <League />
            </PlayerOrderingContext.Provider>
          }
        >
          <Route index element={<AllRounds />} />
          <Route path="/rounds/:roundSlug" element={<LeagueRound />} />
        </Route>
        <Route path="stats" element={<Stats />} />
      </>
    )
  );

  return (
    <div className="d-flex py-3 bg-light" style={{minHeight: '100vh'}}>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setSettingsOpen(true)}
        style={{position: 'absolute', top: 12, right: 12}}
      >
        <span className="fa fa-gear" />
      </button>
      <RouterProvider router={router} />
      <Modal isOpen={settingsOpen} toggle={() => setSettingsOpen(false)}>
        <ModalHeader toggle={() => setSettingsOpen(false)}>Settings</ModalHeader>
        <ModalBody>
          <form>
            <div className="form-group">
              <label htmlFor="ordering">Player ordering</label>
              <select
                className="form-select"
                id="ordering"
                value={ordering}
                onChange={e => setOrdering(e.target.value as PlayerOrdering)}
              >
                <option key="priority" value="priority">
                  By Priority
                </option>
                <option key="position" value="position">
                  By Position
                </option>
              </select>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </div>
  );
}

export default App;
