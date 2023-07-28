import "./App.css";
import players from "./data/players.json";
import league from "./data/league.json";
import { Collapse } from "reactstrap";
import { useState } from "react";

const teams = league.teams.sort((a, b) => b.score.total - a.score.total);

const TeamRound = ({
  slug,
  round,
  initialIsOpen,
}: {
  slug: string;
  round: typeof teams[0]["results"]["round-1"];
  initialIsOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen ?? false);

  return (
    <div className="card">
      <strong
        className="card-header d-flex"
        onClick={() => {
          setIsOpen((previous) => !previous);
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="flex-fill">{slug}</div>
        <div className="badge rounded-pill text-bg-secondary">
          {round.score}
        </div>
      </strong>
      <Collapse isOpen={isOpen} className="card-body">
        {round.players.map((player) => {
          const playerInfo = players.find(
            (it) => it.playerId === player.playerId
          );
          if (playerInfo) {
            return (
              <div className="d-flex gap-3 py-1">
                <div
                  className={`flex-fill ${
                    player.played ? "" : "text-secondary"
                  }`}
                >
                  {playerInfo.name}
                </div>
                {"points" in player && (
                  <div className="badge rounded-pill text-bg-primary">
                    {player.points as any}
                  </div>
                )}
                {player.isCaptain && (
                  <div className="badge rounded-pill text-bg-success">x 2</div>
                )}
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
      </Collapse>
    </div>
  );
};

const Team = ({
  team,
  className,
}: {
  team: typeof teams[0];
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <h3
        className="d-flex align-items-center"
        style={{ cursor: "pointer" }}
        onClick={() => {
          setIsOpen((previous) => !previous);
        }}
      >
        <div className="flex-fill">{team.teamName}</div>
        <div className="badge rounded-pill text-bg-secondary ms-3">
          {team.score.total}
        </div>
      </h3>
      <Collapse isOpen={isOpen}>
        <div className="d-flex flex-column gap-3">
          {Object.entries(team.results).map(([slug, round], index, results) => (
            <TeamRound
              key={slug}
              slug={slug}
              round={round}
              initialIsOpen={index === results.length - 1}
            />
          ))}
        </div>
      </Collapse>
    </div>
  );
};

function App() {
  console.log("players", players);
  console.log("league", league);

  return (
    <div className="container">
      <h1>Teams</h1>
      <div className="list-group">
        {teams.map((team) => (
          <Team key={team.teamName} team={team} className="list-group-item" />
        ))}
      </div>
    </div>
  );
}

export default App;
