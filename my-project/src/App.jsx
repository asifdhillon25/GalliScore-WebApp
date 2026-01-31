import React from "react"
import { Route, Routes } from "react-router-dom"
import Home from "./pages/home"
import About from "./pages/about"
import GetData from "./pages/GetData"
import Scoreboard from "./pages/scoreboard"
import OpeningData from "./pages/OpeningData"
import InitPlayers from "./pages/InitPlayers"
import SecondInning from "./pages/SecondInning"
import BowlingStats from "./pages/BowlingStats"
import BattingStats from "./pages/BattingStats"
import SignUp from "./pages/SignUp"
import Login from "./pages/Login"
import UserPage from "./pages/UserPage"
export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/about' element={<About />}/>
     <Route path='/scoreboard' element={<Scoreboard />}/>
     <Route path='/GetData' element={<GetData />}/>
     <Route path='/OpeningData' element={<OpeningData />}/>
     <Route path='/InitPlayers' element={<InitPlayers />}/>
     <Route path='/SecondInning' element={<SecondInning/>}/>
     <Route path='/BowlingStats' element={<BowlingStats/>}/>
     <Route path='/BattingStats' element={<BattingStats/>}/>
     <Route path='/SignUp' element={<SignUp/>}/>
     <Route path='/Login' element={<Login/>}/>
     <Route path='/UserPage' element={<UserPage/>}/>
   
     
    </Routes>
  )
}
