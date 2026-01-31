import React, { useState, useEffect } from "react";
import Button from "./Button.component";
import axios from "axios";
import Checkbox from "./CheckBox.component";
import Modal from "./model.component";
import { useNavigate } from 'react-router-dom';

const apiUrl = import.meta.env.VITE_API_URL;

function ScoreBoard() {

  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatterModalOpen, setIsBatterModalOpen] = useState(false);
  const [newBowlerName, setNewBowlerName] = useState("");
  const [TotalOver, SetTotalOver] = useState(0);
  const [MaxWickets, SetMaxWickets] = useState(0);
  const [BowlingTeamPlayers, SetBowlingTeamPlayers] = useState([]);
  const [BattingTeamPlayers, SetBattingTeamPlayers] = useState([]);
  const [TeamBat, setTeamBat] = useState("");
  const [TeamBowl, setTeamBowl] = useState("");
  const [Striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [Bowler, setBowler] = useState("");
  const [TeamRuns, setTeamRuns] = useState(0);
  const [StrikerRuns, setStrikerRuns] = useState(0);
  const [StrikerBalls, setStrikerBalls] = useState(0);
  const [nonStrikerRuns, setNonStrikerRuns] = useState(0);
  const [nonStrikerBalls, setNonStrikerBalls] = useState(0);
  const [TotalWickets, setTotalWickets] = useState(0);
  const [BowlerWickets, setBowlerWickets] = useState(0);
  const [OverBalls, setBowlerBalls] = useState([]);
  const [BowlerRun, setBowlerRun] = useState(0);
  const [CurrentOver, setCurrentOver] = useState(0);
  const [CurrentBall, setCurrentBall] = useState(0);
  const [BowlerOverNo, setBowlerOverNo] = useState(0);
  const [InningCount, setInningcount] = useState(0);

  // To set checkboxes and run input
  const [wicket, setWicket] = useState(false);
  const [wide, setWide] = useState(false);
  const [dot, setDot] = useState(false);
  const [noBall, setNoBall] = useState(false);
  const [bye, setBye] = useState(false);
  const [legBye, setLegBye] = useState(false);
  const [run, setRun] = useState(0);

  const scoreBoardId1 = localStorage.getItem("scoreBoardId");

  const GetData = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/scoreboard/${scoreBoardId1}`
      );
      const data = response.data;
      console.log(data);
      // Set state values from the response data
      setTeamBat(data.TeamBat);
      setTeamBowl(data.TeamBowl);
      setStriker(data.Striker);
      setNonStriker(data.nonStriker);
      setBowler(data.Bowler);
      setTeamRuns(data.TeamRuns);
      setStrikerRuns(data.StrikerRuns);
      setStrikerBalls(data.StrikerBalls);
      setNonStrikerRuns(data.nonStrikerRuns);
      setNonStrikerBalls(data.nonStrikerBalls);
      setTotalWickets(data.TotalWickets);
      console.log("tow",data.TotalWickets);
      setBowlerWickets(data.BowlerWickets);
      setBowlerBalls(data.BowlerBalls);
      setBowlerRun(data.BowlerRun);
      setCurrentOver(data.CurrentOver);
      setCurrentBall(data.CurrentBall);
      setBowlerOverNo(data.BowlerOverNo);
      setBowlerBalls(data.OverBalls);
      setCurrentOver(data.CurrentOver);
    } catch (error) {
      console.error("Error fetching scoreboard data:", error);
    }
  };

  useEffect(() => {
    if (scoreBoardId1) {
      GetData();
      GetMatchData();
      
    }
  }, [scoreBoardId1]);

  const GetMatchData = async () => {
    try {
      const MatchId = localStorage.getItem("MatchId");

      const response = await axios.get(`${apiUrl}/api/MatchData`, {
        params: { MatchId }, // Pass MatchId as a query parameter
      });

      const { NoOfWickets, NoOfOvers } = response.data;
      SetMaxWickets(NoOfWickets);
      SetTotalOver(NoOfOvers);
    } catch (error) {
      console.error("Error fetching match data:", error);
    }
  };

  const handleBallSubmission = async () => {
    try {
     

      

      const strikerId = localStorage.getItem("strikerId");
      const nonStrikerId = localStorage.getItem("nonStrikerId");
      const bowlerId = localStorage.getItem("bowlerId");
      const MatchId = localStorage.getItem("MatchId");

      console.log("data from handle ball",strikerId,nonStrikerId,bowlerId);

     
      
      


      await axios.post(`${apiUrl}/api/setnewball`, {
        wicket,
        wide,
        noBall,
        dot,
        bye,
        legBye,
        run,
        scoreBoardId1,
        strikerId,
        nonStrikerId,
        bowlerId,
        MatchId,
      });
      
if ((run == 1 || run == 3 || run == 5) && CurrentBall != 5) {
  SwapBatsman();
} else {
  await GetData();
  
}

if(wicket==true)
{
  setIsBatterModalOpen(true);
}

      setWicket(false);
      setWide(false);
      setDot(false);
      setNoBall(false);
      setBye(false);
      setLegBye(false);
      setRun(0);
    } catch (error) {
      console.error("Error submitting ball details:", error);
    }
  };


useEffect(()=>
{
  console.log(" from use effect CurrentBall",CurrentBall,"MaxWickets",MaxWickets,"TotalWickets",TotalWickets);

if(MaxWickets!==0 && TotalOver!==0)
{
  
  if(TotalWickets>=MaxWickets || CurrentOver>=TotalOver)
  {
    const inningstatus = localStorage.getItem("inningfinished");
    console.log('inningstatus: ',inningstatus);
    if(  inningstatus=== "true")
      {
        console.log('match finished');
        navigate("/UserPage");

      }
      else{
        FinishInnings();
      }
    
  }
}

if (CurrentBall ==0 && CurrentOver!==0) {
  setIsModalOpen(true);
}

GetTeamPlayers();

},[CurrentBall,CurrentOver,TotalWickets,TotalOver,wicket,noBall,wide])  

  const FinishInnings = async () => {

    localStorage.setItem("inningfinished",true);

   
    console.log("finish caled");
navigate("/SecondInning");
    
  };

  const SwapBatsman = async () => {
    const strikerId2 = localStorage.getItem("strikerId");
    const nonStrikerId2 = localStorage.getItem("nonStrikerId");
    localStorage.setItem("strikerId", nonStrikerId2);
    localStorage.setItem("nonStrikerId", strikerId2);
    const strikerId = localStorage.getItem("strikerId");
    const nonStrikerId = localStorage.getItem("nonStrikerId");
    const MatchId = localStorage.getItem("MatchId");

    await axios.put(`${apiUrl}/api/swapBatsman`, {
      scoreBoardId1,
      strikerId,
      nonStrikerId,
      MatchId,
    });
    await GetData();
  };

  const handleModalConfirm = async (inputValue) => {
    // Directly use inputValue for the request
    setIsModalOpen(false);
    const MatchId = localStorage.getItem("MatchId");
    const bowlingTeam = localStorage.getItem("bowlingTeam");
    const scoreBoardId1 = localStorage.getItem("scoreBoardId");

    try {
      const response = await axios.post(`${apiUrl}/api/newbowler`, {
        MatchId,
        newBowlerName: inputValue, // Use inputValue directly
        bowlingTeam,
        scoreBoardId1,
      });

      const { bowlerid } = response.data;
      localStorage.setItem("bowlerId", bowlerid);
      console.log("Bowler ID returned:", bowlerid);

      await GetData();
    } catch (error) {
      console.error(
        "Error creating new bowler:",
        error.response ? error.response.data : error.message
      );
    }
  };


  const handleBatterModalConfirm = async (inputValue)=>
  {
    setIsBatterModalOpen(false);
    const MatchId = localStorage.getItem("MatchId");
    const BattingTeam = localStorage.getItem("battingTeam");
    const scoreBoardId1 = localStorage.getItem("scoreBoardId");
console.log("checking team bat id or name it must id",BattingTeam);

    try {
      const response = await axios.post(`${apiUrl}/api/newbatter`, {
        MatchId,
        newBatterName: inputValue, // Use inputValue directly
        BattingTeam,
        scoreBoardId1,
      });

      const { battingid } = response.data;
      localStorage.setItem("strikerId", battingid);
      console.log("battingid ID returned:", battingid);

      await GetData();
    } catch (error) {
      console.error(
        "Error creating new bowler:",
        error.response ? error.response.data : error.message
      );
    }
  }
  const getTextSize = (item) => {
    return item.length > 2 ? "text-xs" : "text-xl";
  };

  const GetTeamPlayers =async ()=>
  {
    const teambat = localStorage.getItem("battingTeam");
    const teambowl = localStorage.getItem("bowlingTeam");

    try {
    
      const response = await axios.get(`${apiUrl}/api/players/${teambat}/${teambowl}`);
      SetBattingTeamPlayers(response.data.teambatplayers);
      SetBowlingTeamPlayers(response.data.teambowlplayers);
      
    } catch (error) {
      console.error(
        "Error getting players:",
        error.response ? error.response.data : error.message
      );
    }
  }

  return (
    <div className="flex justify-around items-center ">
      <Modal
        message="Enter New Bowler name"
        onConfirm={handleModalConfirm}
        placeholder={"Shoaib Akhtar"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

    <Modal
        message="Enter New Batter name"
        placeholder={"e.g: Babar Azam"}
        onConfirm={handleBatterModalConfirm}
        isOpen={isBatterModalOpen}
        onClose={() => setIsBatterModalOpen(false)}
      />

      {/* Left players of Team1 */}
      <div className="w-[20%] flex items-start justify-start text-start gap-1 flex-col">
        {BattingTeamPlayers.map((thisplayer) => (
          <div
            key={thisplayer._id}
            className="text-left w-full rounded-lg p-2 text-xl bg-blue-600 shadow-md font-bold text-white"
          >
            {thisplayer.pName}
          </div>
        ))}
      </div>

      {/* Middle scoreboard */}
      <div>
        <div className="flex items-center justify-center text-2xl gap-1 text-white font-bold mt-3">
          <div>{TeamBat}</div>
          <div>{TeamRuns}</div>
          <div> - {TotalWickets}</div>
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          {[0, 1, 2, 3, 4, 5, 6].map((num) => (
            <Button
              key={num}
              className={
                "w-16 h-16 bg-blue-500 active:border-none rounded-full"
              }
              onClick={() => setRun(num)}
            >
              {num}
            </Button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 mt-3">
          <Checkbox
            id="wicket"
            label="W"
            checked={wicket}
            onChange={() => setWicket(!wicket)}
          />
          <Checkbox
            id="wide"
            label="WD"
            checked={wide}
            onChange={() => setWide(!wide)}
          />
          <Checkbox
            id="dot"
            label="D"
            checked={dot}
            onChange={() => setDot(!dot)}
          />
          <Checkbox
            id="noBall"
            label="Nb"
            checked={noBall}
            onChange={() => setNoBall(!noBall)}
          />
          <Checkbox
            id="bye"
            label="Bye"
            checked={bye}
            onChange={() => setBye(!bye)}
          />
          <Checkbox
            id="legBye"
            label="Leg Bye"
            checked={legBye}
            onChange={() => setLegBye(!legBye)}
          />
        </div>
        <div className="flex items-center justify-center gap-4 mt-5">
          <div className="flex items-center justify-center text-2xl gap-1 p-2 rounded text-white bg-blue-400 font-bold">
            <div>{Striker}</div>
            <div className="text-2xl gap-1 text-red-600 font-bold mr-4">*</div>
            <div className="text-2xl gap-1 text-white font-bold">
              {StrikerRuns}
            </div>
            <div className="text-sm gap-1 text-white font-bold">
              {StrikerBalls}
            </div>
          </div>
          <div className="flex items-center justify-center text-2xl gap-1 p-2 rounded text-white bg-blue-400 font-bold">
            <div>{nonStriker}</div>
            <div className="text-2xl gap-1 text-white font-bold">
              {nonStrikerRuns}
            </div>
            <div className="text-sm gap-1 text-white font-bold">
              {nonStrikerBalls}
            </div>
          </div>
        </div>

        <div className={"flex items-center justify-center m-2"}>
          <Button onClick={SwapBatsman}>Swap Batsman</Button>
        </div>

        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center gap-4 mt-5 p-4 rounded-lg bg-blue-400">
            <div className="flex flex-col items-center justify-center">
              <div className="text-2xl p-2 rounded text-white bg-blue-400 font-bold">
                {Bowler}
              </div>
              <div className="flex items-center justify-center gap-4 text-white font-bold text-xl">
                <div>
                  {BowlerOverNo}.{CurrentBall}
                </div>
                <div>
                  {BowlerWickets}-{BowlerRun}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {OverBalls.map((item, index) => (
                <div
                  key={index} // Use index as key here to ensure uniqueness
                  className={`w-8 h-8 rounded-full flex items-center justify-center bg-white text-blue-400 font-bold ${getTextSize(
                    item
                  )}`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-5">
          <Button
            className={"bg-blue-500 text-white rounded-lg p-2"}
            onClick={handleBallSubmission}
          >
            Submit Ball
          </Button>
        </div>
      </div>

      {/* Right players of Team2 */}
      <div className="w-[20%] flex items-start justify-start text-start gap-1 flex-col">
        {BowlingTeamPlayers.map((thisplayer) => (
          <div
            key={thisplayer._id}
            className="text-left w-full rounded-lg p-2 text-xl bg-blue-600 shadow-md font-bold text-white"
          >
            {thisplayer.pName}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScoreBoard;
