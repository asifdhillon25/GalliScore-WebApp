import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScoreBoard from '../components/scoreboard.component';
const apiUrl = import.meta.env.VITE_API_URL;

const InitPlayers = () => {
    const navigate = useNavigate();
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
     
    const MatchId = localStorage.getItem('MatchId');
    console.log(MatchId);
    const response = await axios.post(`${apiUrl}/api/init/players/${MatchId}`,{
        striker:striker,
        nonStriker:nonStriker,
        bowler:bowler,
        
  
      });

      const {strikerId,nonStrikerId,bowlerId ,scoreBoardId,battingTeam,bowlingTeam} = response.data;
      localStorage.setItem('strikerId',strikerId);
      localStorage.setItem('nonStrikerId',nonStrikerId);
      localStorage.setItem('bowlerId',bowlerId),
      localStorage.setItem('scoreBoardId',scoreBoardId);
      localStorage.setItem('battingTeam',battingTeam);
      localStorage.setItem('bowlingTeam',bowlingTeam);
      console.log("Ids of players and scoreboard\n",strikerId,nonStrikerId,bowlerId,scoreBoardId );
      navigate('/scoreboard');
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4 w-full max-w-md"
      >
        <h2 className="text-xl font-semibold">Match Details</h2>

        <div className="flex flex-col space-y-2">
          <label htmlFor="striker" className="text-sm font-medium">Striker Batsman</label>
          <input
            type="text"
            id="striker"
            value={striker}
            onChange={(e) => setStriker(e.target.value)}
            placeholder="Enter Striker Batsman"
            className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="non-striker" className="text-sm font-medium">Non-Striker Batsman</label>
          <input
            type="text"
            id="non-striker"
            value={nonStriker}
            onChange={(e) => setNonStriker(e.target.value)}
            placeholder="Enter Non-Striker Batsman"
            className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="bowler" className="text-sm font-medium">Bowler</label>
          <input
            type="text"
            id="bowler"
            value={bowler}
            onChange={(e) => setBowler(e.target.value)}
            placeholder="Enter Bowler"
            className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default InitPlayers;
