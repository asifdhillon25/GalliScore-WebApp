import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const apiUrl = import.meta.env.VITE_API_URL;


const MatchForm = () => {

  const navigate = useNavigate();

  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  const [tossWinner, setTossWinner] = useState('');
  const [decision, setDecision] = useState('');
  const [overs, setOvers] = useState('');
  const [wickets, setWickets] = useState('');
  localStorage.setItem("inningfinished",false);

  const handleSubmit = async (event) => {
    event.preventDefault();
   const userId =  localStorage.getItem('userId');
    
   const response = await axios.post(`${apiUrl}/api/init`,{
      team1Name:team1Name
      ,team2Name:team2Name,
      tossWinner:tossWinner,
      decision:decision,
      overs:overs,
      wickets:wickets,
      userId

    })

    
    const MatchId = response.data[0]._id;
    localStorage.setItem('MatchId',MatchId);
    console.log('match id is: ',MatchId);
    navigate('/InitPlayers')
    
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-gray-800 text-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Match Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Team Name */}
        <div>
          <label htmlFor="team1Name" className="block text-lg font-medium">Team 1 Name</label>
          <input
            type="text"
            id="team1Name"
            value={team1Name}
            onChange={(e) => setTeam1Name(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter team A name"
            required
          />
        </div>
        <div>
          <label htmlFor="team2Name" className="block text-lg font-medium">Team 2 Name</label>
          <input
            type="text"
            id="team2Name"
            value={team2Name}
            onChange={(e) => setTeam2Name(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter team B name"
            required
          />
        </div>
        {/* Toss Winner */}
        <div>
          <label className="block text-lg font-medium">Who won the toss?</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="teamA"
                name="tossWinner"
                value={team1Name}
                checked={tossWinner === team1Name}
                onChange={(e) => setTossWinner(e.target.value)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600"
              />
              <label htmlFor="teamA" className="ml-2 text-sm font-medium">Team A</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="teamB"
                name="tossWinner"
                value={team2Name}
                checked={tossWinner === team2Name}
                onChange={(e) => setTossWinner(e.target.value)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600"
              />
              <label htmlFor="teamB" className="ml-2 text-sm font-medium">Team B</label>
            </div>
          </div>
        </div>

        {/* Decision */}
        <div>
          <label className="block text-lg font-medium">Decision (Bat/Bowl)</label>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="bat"
                name="decision"
                value="bat"
                checked={decision === 'bat'}
                onChange={(e) => setDecision(e.target.value)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600"
              />
              <label htmlFor="bat" className="ml-2 text-sm font-medium">Bat</label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="bowl"
                name="decision"
                value="bowl"
                checked={decision === 'bowl'}
                onChange={(e) => setDecision(e.target.value)}
                className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600"
              />
              <label htmlFor="bowl" className="ml-2 text-sm font-medium">Bowl</label>
            </div>
          </div>
        </div>

        {/* Number of Overs */}
        <div>
          <label htmlFor="overs" className="block text-lg font-medium">Number of Overs</label>
          <input
            type="number"
            id="overs"
            value={overs}
            onChange={(e) => setOvers(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter number of overs"
            required
          />
        </div>

        {/* Number of Wickets */}
        <div>
          <label htmlFor="wickets" className="block text-lg font-medium">Number of Wickets</label>
          <input
            type="number"
            id="wickets"
            value={wickets}
            onChange={(e) => setWickets(e.target.value)}
            className="mt-1 block w-full p-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter number of wickets"
            required
          />
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-bold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default MatchForm;
