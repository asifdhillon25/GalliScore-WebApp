const express = require('express');
const app = express();
const mongoose=require('mongoose')
const listroute = require('./routes/routes.list.js');
const PlayerRoute = require('./routes/Players.route.js')
const TeamRoute = require('./routes/Team.route.js')
const Match = require('./routes/Match.route.js');
const MatchRecord = require('./routes/MatchRecord.route.js');
const OneOver = require('./routes/OneOver.route.js');
const SingleBall = require('./routes/SingleBAll.route.js');
const AllOverDetails  = require('./routes/AllOverDetails.js');
const endpoints =require('./endpoints/setData.js')
const addNewBowler=require('./endpoints/addbowler.js');
const addNewBatter=require('./endpoints/addbatter.js');
const GetMatchData =require('./endpoints/GetMatchData.js');
const Addinning =require('./endpoints/AddNewInning.js');
const GetPlayers =require('./endpoints/GetTeamPlayers.js');
const GetBowlingRecord =require('./endpoints/GetBowlingRecord.js');
const GetBattingRecord =require('./endpoints/GetBattingRecord.js');
const GetUserMatches =require('./endpoints/GetUserMatches.js');

const UserAuth = require('./endpoints/UserAuth.js');
const cors =require('cors');


// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cors({ 
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST','PUT','DELETE'],
    allowedHeaders: ['Content-Type']
  }));

//routes

app.use('/List',listroute);
app.use('/player',PlayerRoute);
app.use('/Team',TeamRoute);
app.use('/match',Match);
app.use('/matchrec',MatchRecord);
app.use('/ball',SingleBall);
app.use('/over',OneOver);
app.use('/overs',AllOverDetails);
app.use('/api',endpoints);
app.use('/api',addNewBowler);
app.use('/api',addNewBatter);
app.use('/api',GetMatchData);
app.use('/api',Addinning);
app.use('/api',GetPlayers);
app.use('/api',GetBowlingRecord);
app.use('/api',GetBattingRecord);
app.use('/api',UserAuth);
app.use('/api',GetUserMatches);






// Start the server

mongoose.connect('mongodb+srv://asifdhillon25:assa2531@mymongo.tykkbty.mongodb.net/mydatabase?retryWrites=true&w=majority').then( ()=>{
    console.log('connected to database')
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
}).catch( ()=>{
        console.log('connected to database failed');
})


