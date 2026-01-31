import React from 'react'
import { Link } from 'react-router-dom'
function Header() {
  return (
    <div className='flex justify-around items-center bg-gradient-to-r from-cyan-500 to-blue-500  p-2 text-xl text-white'>
      <div className=''>My Logo</div>
      <div>
        <nav>
            <ul className='flex justify-center items-center '>
            <Link to={"/"}><li className='mx-3 hover:scale-105 duration-100 '>Home</li></Link>
                <Link to={"/about"}><li className='mx-3 hover:scale-105 duration-100' >About</li></Link>
                <Link to = {"/scoreboard"}><li className='mx-3 hover:scale-105 duration-100' >scoreboard</li></Link>
                <Link to = {"/Signup"}><li className='mx-3 hover:scale-105 duration-100' >SignUp</li></Link>
                <Link to = {"/Login"}><li className='mx-3 hover:scale-105 duration-100' >Login</li></Link>
                
            </ul>
        </nav>
      </div>
    </div> 
  )
}

export default Header
