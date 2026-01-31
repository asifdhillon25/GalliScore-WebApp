import React from "react";
import Header from "../components/header.component";
import { TeamInput, Playercard } from "../components/Data.components";
import { useNavigate } from 'react-router-dom';

import { useState } from "react";
import axios from "axios";
import Button from "../components/Button.component";
const apiUrl = import.meta.env.VITE_API_URL;

function GetData() {
  const [Team1, SetTeam1] = useState("");
  const [Team2, SetTeam2] = useState("");
  const [Team1players, SetTeam1player] = useState([]);
  const [Team2players, SetTeam2player] = useState([]);
  const [newPlayerTeam1, setNewPlayerTeam1] = useState("");
  const [newPlayerTeam2, setNewPlayerTeam2] = useState("");
  const navigate = useNavigate();
  const [selectedTeam, setSelectedTeam] = useState('');


 

  const handleChange = (event) => {
    setSelectedTeam(event.target.value);
  };

  
  const addPlayer1 = () => {
    if (newPlayerTeam1) {
      SetTeam1player([...Team1players, newPlayerTeam1]);
      setNewPlayerTeam1("");
    }
  };

  const addPlayer2 = () => {
    if (newPlayerTeam2) {
      SetTeam2player([...Team2players, newPlayerTeam2]);
      setNewPlayerTeam2("");
    }
  };

  const deletet1player = (playerToDelete) => {
    const updatedPlayers = Team1players.filter(
      (player) => player !== playerToDelete
    );
    SetTeam1player(updatedPlayers);
  };

  const deletet2player = (playerToDelete) => {
    const updatedPlayers = Team2players.filter(
      (player) => player !== playerToDelete
    );
    SetTeam2player(updatedPlayers);
  };

  const SetData = async () => {
    try {
      
      // Ensure all variables are correctly defined before making the request
      if (!Team1 || !Team2 || !Array.isArray(Team1players) || !Array.isArray(Team2players)) {
        throw new Error('Invalid data provided.');
      }
  
      // Make the POST request to the backend API
      const response = await axios.post(`${apiUrl}/api/setDatabase`, {
        Team1: Team1,
        Team2: Team2,
        Team1players: Team1players,
        Team2players: Team2players,
        Toss:selectedTeam
      });
      
      const matchdata = response.data[0];
      console.log(response.data);
      console.log(matchdata._id)
      localStorage.setItem('matchId',matchdata._id);
      
      
      console.log('Data set successfully:', response.data); // Log success message if needed
      navigate('/OpeningData');

    } catch (error) {
      console.error('Error adding teams or players:', error.message || error);
    }
  };
  
  const setDatabase = async () => {
    try {
      // Send both requests in parallel to create teams
      const [response1, response2] = await Promise.all([
        axios.post(`${apiUrl}/Team/`, { tName: Team1 }),
        axios.post(`${apiUrl}/Team/`, { tName: Team2 })
      ]);
  
      // Extract IDs from responses
      const team1id = response1.data._id;
      const team2id = response2.data._id;
  
      // Create players for Team 1
      const PlayerResponse1 = await Promise.all(
        Team1players.map(player => 
          axios.post(`${apiUrl}/Player/`, { pName: player, pTeam: [team1id] })
        )
      );
  
      // Create players for Team 2
      const PlayerResponse2 = await Promise.all(
        Team2players.map(player => 
          axios.post(`${apiUrl}/Player/`, { pName: player, pTeam: [team2id] })
        )
      );
  console.log(PlayerResponse2);
      // Update Team 1 with players
      await Promise.all(
        PlayerResponse1.map(response =>
          axios.put(`${apiUrl}/Team/AddPlayer/${team1id}`, { itemId: response.data._id })
        )
      );
  
      // Update Team 2 with players
      await Promise.all(
        PlayerResponse2.map(response =>
        {
          console.log(response.data._id);
          return axios.put(`${apiUrl}/Team/AddPlayer/${team2id}`, { itemId: response.data._id })
        }
        
        )
      );
  
      console.log('Teams and players created successfully.');
  
    } catch (error) {
      console.error('Error adding teams or players:', error);
    }
  };
  

  return (
    <div className="h-svh bg-gradient-to-t from-cyan-500 to-blue-800 ">
      <Header />
      <div className="flex justify-center gap-10 text-white rounded-lg text-xl items-center bg-gradient-to-tr shadow-md m-5 p-2 rou from-cyan-500 to-blue-800">
        <TeamInput
          onChange={(e) => SetTeam1(e.target.value)}
          placeholder={"Enter your team name"}
        >
          Team 1:
        </TeamInput>
        <div>VS</div>
        <div>
          <div className="flex justify-center items-center gap-5 ">
            <TeamInput
              onChange={(e) => SetTeam2(e.target.value)}
              placeholder={"Enter your team name"}
            >
              Team 2:
            </TeamInput>
          </div>
        </div>
      </div>

      
      <div>
      <h2>Select the team that won the toss:</h2>
      <div>
        <input
          type="radio"
          id="team1"
          name="toss"
          value={Team1}
          checked={selectedTeam === Team1}
          onChange={handleChange}
        />
        <label htmlFor="team1">{Team1}</label>
      </div>
      <div>
        <input
          type="radio"
          id="Team2"
          name="toss"
          value={Team2}
          checked={selectedTeam === Team2}
          onChange={handleChange}
        />
        <label htmlFor="team2">{Team2}</label>
      </div>
    </div>


      <div className="flex justify-center gap-10 text-white rounded-lg text-xl items-center bg-gradient-to-tr shadow-md m-5 p-2  from-cyan-500 to-blue-800">
        <div>
          <input
            className="rounded-l-lg text-black p-2"
            placeholder="Enter Players for team1"
            type="text"
            onChange={(e) => setNewPlayerTeam1(e.target.value)}
            value={newPlayerTeam1}
          />
          <button
            className="rounded-r-lg bg-blue-700 p-2 cursor-pointer hover:bg-blue-900 active:scale-105 duration-75"
            onClick={addPlayer1}
          >
            Add
          </button>
        </div>
        <div>
          <input
            className="rounded-l-lg text-black p-2"
            placeholder="Enter Players for team1"
            type="text"
            onChange={(e) => setNewPlayerTeam2(e.target.value)}
            value={newPlayerTeam2}
          />
          <button
            className="rounded-r-lg bg-blue-700 p-2 cursor-pointer hover:bg-blue-900 active:scale-105 duration-75"
            onClick={addPlayer2}
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-around gap-10 text-white rounded-lg text-xl items-center  shadow-md m-5 p-2 ">
        <div className="flex flex-col  justify-start items-center">
          {Team1players.map((player, index) => (
            <Playercard onClick={() => deletet1player(player)} key={index}>
              {player}
            </Playercard>
          ))}
        </div>

        <div>
          <div className="flex flex-col  justify-start items-center">
            {Team2players.map((player, index) => (
              <Playercard onClick={() => deletet2player(player)} key={index}>
                {player}
              </Playercard>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <Button onClick={SetData}>Start Match</Button>
      </div>
    </div>
  );
}

export default GetData;
