import "./App.css";
import players from "./data/players.json";
import league from "./data/league.json";

const teams = league.teams.sort((a, b) => b.score.total - a.score.total);

const TeamRound = ({
  slug,
  round,
}: {
  slug: string;
  round: typeof teams[0]["results"]["round-1"];
}) => {
  return (
    <div className="card">
      <strong className="card-header d-flex">
        <div className="flex-fill">{slug}</div>
        <div className="badge rounded-pill text-bg-secondary">
          {round.score}
        </div>
      </strong>
      <div className="card-body">
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
      </div>
    </div>
  );
};

const Team = ({ team }: { team: typeof teams[0] }) => {
  return (
    <div className="mb-4">
      <h3 className="d-flex">
        <div>{team.teamName}</div>
        <div className="badge rounded-pill text-bg-secondary ms-3">
          {team.score.total}
        </div>
      </h3>
      <div className="d-flex text-start gap-3">
        {Object.entries(team.results).map(([slug, round]) => (
          <TeamRound key={slug} slug={slug} round={round} />
        ))}
      </div>
    </div>
  );
};

function App() {
  console.log("players", players);
  console.log("league", league);

  return (
    <div className="container">
      <h1>Teams</h1>
      <div>
        {teams.map((team) => (
          <Team key={team.teamName} team={team} />
        ))}
      </div>
    </div>
  );
}

export default App;
