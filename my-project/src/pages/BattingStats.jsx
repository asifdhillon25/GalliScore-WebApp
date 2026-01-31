import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;

function BattingStats() {
  const [battingData, setBattingData] = useState([]);

  useEffect(() => {
    getBattingRecord();
  }, []);

  const getBattingRecord = async () => {
    try {
      const matchId = localStorage.getItem("MatchId");
      const teamBat = localStorage.getItem("battingTeam");
      const response = await axios.get(
        `${apiUrl}/api/battingrecord/${matchId}/${teamBat}`
      );

      // Calculate strike rate dynamically
      const dataWithStrikeRate = response.data.map((player) => ({
        ...player,
        strikeRate: player.ballsFaced > 0 ? (player.totalRuns / player.ballsFaced) * 100 : 0,
      }));

      setBattingData(dataWithStrikeRate);
      console.log(dataWithStrikeRate);
    } catch (error) {
      console.error("Error occurred while fetching batting records", error);
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
                Runs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Balls Faced
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Fours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Sixes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Strike Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {battingData.map((player, index) => (
              <tr key={index} className="hover:bg-gray-700 transition duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {player.player.pName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.totalRuns}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.ballsFaced}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.fours}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.sixes}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {player.strikeRate.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BattingStats;
