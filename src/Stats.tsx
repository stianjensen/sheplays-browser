import {useId, useState} from 'react';
import players from './data/players.json';
import {Link} from 'react-router-dom';
import {countryRemaining, countryToFlagMapping} from './data/countries';
import {Country, PlayerPosition} from './App';

function calculatePlayerTotalScore(scores: (typeof players)[0]['score']): number {
  return scores ? Object.values(scores).reduce((a, b) => a + b, 0) : 0;
}

export const Stats = () => {
  const [countryFilter, setCountryFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [totalPointsMinimumFilter, setTotalPointsMinimumFilter] = useState('');

  const [showOnlyRemainingCountries, setShowOnlyRemainingCountries] = useState(true);

  const filteredPlayers = players
    .filter(player => {
      if (showOnlyRemainingCountries && !countryRemaining(player.country, 'round-5')) {
        return false;
      }

      if (countryFilter && player.country !== countryFilter) {
        return false;
      }

      if (positionFilter && player.position !== positionFilter) {
        return false;
      }

      if (nameFilter && !player.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }

      if (priceFilter && !player.fantasyPrice.toString().startsWith(priceFilter)) {
        return false;
      }

      if (totalPointsMinimumFilter && calculatePlayerTotalScore(player.score) < Number(totalPointsMinimumFilter)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (a.country < b.country) {
        return -1;
      }
      if (a.country > b.country) {
        return 1;
      }
      if (a.position < b.position) {
        return -1;
      }
      if (a.position > b.position) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });

  const rounds = [1, 2, 3, 4];

  const id = useId();

  return (
    <div className="container mx-auto">
      <div className="d-flex gap-3 mb-3 align-items-baseline">
        <h1 className="mb-0">Stats</h1>
        <Link to="/">Back to league</Link>
      </div>
      <div className="card table-responsive">
        <div className="card-body border-bottom bg-light-subtle">
          <div className="form-check">
            <input
              id={id + 'show-only-remaining-countries'}
              type="checkbox"
              className="form-check-input"
              checked={showOnlyRemainingCountries}
              onChange={e => {
                setShowOnlyRemainingCountries(e.target.checked);
              }}
            />
            <label htmlFor={id + 'show-only-remaining-countries'}>Show only remaining countries</label>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>
                <div className="d-flex flex-column align-items-center">
                  <div>Country</div>
                  <select
                    className="form-select form-select-sm"
                    style={{width: 100}}
                    value={countryFilter}
                    onChange={e => {
                      setCountryFilter(e.target.value);
                    }}
                  >
                    <option value="">---</option>
                    {Object.keys(countryToFlagMapping)
                      .filter(country => !showOnlyRemainingCountries || countryRemaining(country, 'round-5'))
                      .map(country => (
                        <option>{country}</option>
                      ))}
                  </select>
                </div>
              </th>
              <th>
                <div className="d-flex flex-column align-items-center">
                  <div>Position</div>
                  <select
                    className="form-select form-select-sm"
                    style={{width: 60}}
                    value={positionFilter}
                    onChange={e => {
                      setPositionFilter(e.target.value);
                    }}
                  >
                    <option value="">---</option>
                    <option>GK</option>
                    <option>DF</option>
                    <option>MF</option>
                    <option>FW</option>
                  </select>
                </div>
              </th>
              <th>
                <div className="d-flex flex-column align-items-center">
                  <div>Name</div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    size={5}
                    value={nameFilter}
                    onChange={e => {
                      setNameFilter(e.target.value);
                    }}
                  />
                </div>
              </th>
              <th>
                <div className="d-flex flex-column align-items-end">
                  <div>Price</div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    size={5}
                    value={priceFilter}
                    onChange={e => {
                      setPriceFilter(e.target.value);
                    }}
                  />
                </div>
              </th>
              {rounds.map(round => (
                <th key={round} {...{valign: 'top'}} className="text-end">
                  R{round}
                </th>
              ))}
              <th>
                <div className="d-flex flex-column align-items-end">
                  <div>Total</div>
                  <input
                    type="text"
                    className="form-control form-control-sm text-end"
                    placeholder="Min. total"
                    size={1}
                    value={totalPointsMinimumFilter}
                    onChange={e => {
                      setTotalPointsMinimumFilter(e.target.value);
                    }}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(player => {
              return (
                <tr key={player.playerId}>
                  <td className="text-center">
                    <Country country={player.country} />
                  </td>
                  <td className="text-center">
                    <PlayerPosition position={player.position} />
                  </td>
                  <td>{player.name}</td>
                  <td className="text-end tabular-nums">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(player.fantasyPrice)}
                  </td>
                  {rounds.map(round => (
                    <td key={round} className="tabular-nums text-end">
                      {player.score?.[`round-${round}` as keyof typeof player.score] ?? 0}
                    </td>
                  ))}
                  <td className="tabular-nums fw-semibold text-end">{calculatePlayerTotalScore(player.score)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
