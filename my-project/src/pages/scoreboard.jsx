import React from "react";
import Header from "../components/header.component";
import ScoreBoard from "../components/scoreboard.component";
import { Link } from "react-router-dom";
function Scoreboard() {
  return (
    <div className="h-svh bg-gradient-to-t from-cyan-500 to-blue-800 ">
      <Header />
      <div className="flex justify-center items-center">
        <Link to={"/BowlingStats"}>
          <div  className="bg-blue-600 text-white py-2  m-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300">Bowling Stats</div>
        </Link>
        <Link to={"/BattingStats"}>
          <div  className="bg-blue-600 text-white py-2  m-3 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300">Batting Stats</div>
        </Link>
      </div>
      <ScoreBoard />
    </div>
  );
}

export default Scoreboard;
