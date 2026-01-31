import { React, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
const apiUrl = import.meta.env.VITE_API_URL;

function BowlingStats() {
  const [playerData, setPlayerData] = useState([]);

  useEffect(() => {
    GetBowlingReord();
  }, []);

  const GetBowlingReord = async () => {
    try {
      const MatchId = localStorage.getItem("MatchId");
      const teambowl = localStorage.getItem("bowlingTeam");
      const response = await axios.get(
        `${apiUrl}/api/bowlingrecord/${MatchId}/${teambowl}`
      );

      // Calculate economy rate dynamically
      const dataWithEconomyRate = response.data.map(player => ({
        ...player,
        economyRate: player.oversBowled > 0 ? player.runsConceded / player.oversBowled : 0
      }));

      setPlayerData(dataWithEconomyRate);
      console.log(dataWithEconomyRate);
    } catch (error) {
      console.error("Error occurred at fetching bowling record", error);
    }
  };

  return (
    <div className="p-4 bg-gray-900 min-h-screen">
      <div className="flex justify-center items-center mb-6">
        <Link to={"/Scoreboard"}>
          <div className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
            ScoreBoard
          </div>
        </Link>
      </div>

      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-gray-800 divide-y divide-gray-700 rounded-lg">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Overs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Maidens
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Runs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Wickets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Extras
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Economy Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {playerData.map((player, index) => (
              <tr key={index} className="hover:bg-gray-700 transition duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {player.player.pName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.oversBowled}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.maidens}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.runsConceded}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.wicketsTaken}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.extras}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.economyRate.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BowlingStats;
