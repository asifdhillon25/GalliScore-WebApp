import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/header.component";
import MatchCard from "./MatchCard";
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

function UserPage() {
  const [Matches, setMatches] = useState([]);

  useEffect(() => {
    getMatches();
  }, []);

  const getMatches = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await axios.get(`${apiUrl}/api/allmatches/${userId}`);
      setMatches(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('error occurred while getting user matches', error);
    }
  };

  return (
    <div className="h-screenb bg-blue-700">
      <Header />
      <Link to={"/OpeningData"}>
        <div className="flex m-10 rounded-lg p-10 shadow-md hover:scale-105 duration-75 cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500 text-white justify-center items-center font-bold text-3xl">
          Start Match
        </div>
      </Link>

      {/* Map over the Matches array to render a MatchCard for each match */}
      {Matches.map((match, index) => (
        <MatchCard
          key={match._id} // Use match._id as the key
          team1={match.FirstScoreBoard?.TeamBat}
          team2={match.SecondScoreBoard?.TeamBat}
          team1score={match.FirstScoreBoard?.TeamRuns}
          team2score={match.SecondScoreBoard?.TeamRuns}
          team1wickets={match.FirstScoreBoard?.TotalWickets}
          team2wickets={match.SecondScoreBoard?.TotalWickets}
          tossteam={match.Toss.tName}
          decision={match.WinDecision}
          over={match.FirstScoreBoard?.CurrentOver}
          ball={match.FirstScoreBoard?.CurrentBall}
          totalwickets={match.NoOfWickets}
        />
      ))}
    </div>
  );
}

export default UserPage;
