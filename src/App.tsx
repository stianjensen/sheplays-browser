import './App.css';
import players from './data/players.json';
import league from './data/league.json';
import {Collapse, UncontrolledTooltip} from 'reactstrap';
import {useId, useState} from 'react';
import countries from './data/countries';

const teams = league.teams.sort((a, b) => b.score.total - a.score.total);

const countryToFlagMapping: {[key: string]: string} = {
  Australia: 'au',
  Argentina: 'ar',
  Brazil: 'br',
  Canada: 'ca',
  Colombia: 'co',
  'Costa Rica': 'cr',
  China: 'cn',
  Denmark: 'dk',
  England: 'eng',
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

  return (
    <div className="card">
      <strong
        className="card-header d-flex"
        onClick={() => {
          setIsOpen(previous => !previous);
        }}
        style={{cursor: 'pointer'}}
      >
        <div className="flex-fill">{slug}</div>
        <div className="badge rounded-pill text-bg-secondary">{round.score}</div>
      </strong>
      <Collapse isOpen={isOpen} className="card-body">
        {round.players.map(player => {
          const playerInfo = players.find(it => it.playerId === player.playerId);
          if (playerInfo) {
            const countryPlayed = countries[playerInfo.club][slug]?.players > 0;
            const benched = countryPlayed && !player.played;
            return (
              <div className="d-flex gap-3 py-1" key={player.playerId}>
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
                    player.played ? '' : benched ? 'text-decoration-line-through text-secondary' : 'text-secondary'
                  }
                >
                  <div id={'player' + id + player.playerId}>{playerInfo.name}</div>
                  <UncontrolledTooltip target={'#' + CSS.escape('player' + id + player.playerId)}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(playerInfo.fantasyPrice)}
                  </UncontrolledTooltip>
                </div>
                <div className="d-flex align-items-center gap-2 ms-auto">
                  {player.isCaptain && <div className="badge rounded-pill text-bg-success">2 x</div>}
                  {'points' in player && (
                    <div className="badge rounded-pill text-bg-primary">{player.points as any}</div>
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
            <div className="badge rounded-pill text-bg-danger">{round.transfers}</div>
          </div>
        ) : null}
      </Collapse>
    </div>
  );
};

const Team = ({team, className}: {team: (typeof teams)[0]; className?: string}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <h3
        className="d-flex align-items-center"
        style={{cursor: 'pointer'}}
        onClick={() => {
          setIsOpen(previous => !previous);
        }}
      >
        <div className="flex-fill">{team.teamName}</div>
        <div className="badge rounded-pill text-bg-secondary ms-3">{team.score.total}</div>
      </h3>
      <Collapse isOpen={isOpen}>
        <div className="d-flex flex-column gap-3">
          {Object.entries(team.results).map(([slug, round], index, results) => (
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
