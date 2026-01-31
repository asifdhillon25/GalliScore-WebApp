import React from "react";

function MatchCard({
  team1,
  team2,
  team1score,
  team2score,
  team1wickets,
  team2wickets,
  totalwickets,
  tossteam,
  decision,
  over,
  ball,
}) {
  // Determine the match result based on scores
  const matchResult = () => {
    if (team1score > team2score) {
      return `${team1} Won By ${team1score - team2score} Runs`;
    } else if (team1score < team2score) {
      return `${team2} Won By ${totalwickets - team2wickets} Wickets`;
    } else {
      return "Draw";
    }
  };

  return (
    <div className="flex flex-col m-10 rounded-lg p-10 shadow-md hover:scale-105 duration-75 cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500 text-white justify-around items-center font-bold text-3xl">
      <div className="flex flex-row justify-between text-center items-center w-full">
        <div>{team1}</div>
        <div>VS</div>
        <div>{team2}</div>
      </div>
      <div className="flex flex-row justify-between text-lg items-center w-full">
        {/* Display the scores and wickets for each team */}
        <div>{`${team1score}-${team1wickets}`}</div>
        {/* Display the match result dynamically */}
        <div className="font-normal">{matchResult()}</div>
        <div>{`${team2score}-${team2wickets}`}</div>
      </div>
      <div className="flex flex-row justify-between text-lg items-center w-full">
        {/* Display the overs and balls dynamically */}
        <div>{`Overs ${over}.${ball}`}</div>
        {/* Example of dynamically displaying the 'Man Of The Match' */}
        <div>
          <span className="font-normal">Man Of The Match</span> Babar Azam
        </div>
        <div>{`Overs ${over}.${ball}`}</div>
      </div>
    </div>
  );
}

export default MatchCard;
