import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/header.component";
import MatchCard from "./MatchCard";
function Home() {
  return (
    <div className="h-svh bg-gradient-to-t from-cyan-500 to-blue-800 ">
      <Header />
      <Link to={"/Login"}>
        {" "}
        <div className="flex  m-10 rounded-lg p-10 shadow-md hover:scale-105 duration-75 cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500  text-white justify-center items-center font-bold  text-3xl">
          Start Match
        </div>
      </Link>

      
    </div>
  );
}

export default Home;
