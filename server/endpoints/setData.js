const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const {
  findOrCreateBattingRecord,
  findOrCreateBowlingRecord,
  findScoreBoard,
  findPlayerById,
} = require("./HelpingFunctions.js");

const {
  Player,
  Team,
  Match,
  ScoreBoard,
  BattingRecord,
  BowlingRecord,
} = require("../models/cdb.models.js");

router.post("/init", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { team1Name, team2Name, tossWinner, decision, overs, wickets ,userId } =
      req.body;

    const [team1, team2] = await Promise.all([
      Team.create([{ tName: team1Name }], { session: session }),
      Team.create([{ tName: team2Name }], { session: session }),
    ]);

    const team1id = team1[0]._id;
    const team2id = team2[0]._id;

    let TossTeam;
    if (tossWinner === team1Name) {
      TossTeam = team1id;
    } else {
      TossTeam = team2id;
    }

    const MatchEntity = await Match.create(
      {
        mTeam1: team1id,
        mTeam2: team2id,
        NoOfOvers: overs,
        NoOfWickets: wickets,
        Toss: TossTeam,
        WinDecision: decision,
        Userid:userId
      },
      { session: session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(MatchEntity);
    console.log(MatchEntity);
  } catch (error) {
    session.abortTransaction();
    session.endSession();
    res.status(500).send("Error in processing form data");
  }
});

router.post("/init/players/:matchId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const matchId = req.params.matchId;
    const { striker, nonStriker, bowler } = req.body;

    if (!striker || !nonStriker || !bowler) {
      return res.status(400).json({ error: "Player names are required" });
    }

    // Fetch match details
    const match = await Match.findById(matchId, null, { session })
      .select("mTeam1 mTeam2 Toss WinDecision")
      .exec();

    if (!match) {
      throw new Error("Match not found");
    }

    const { mTeam1, mTeam2, Toss, WinDecision } = match;

    let battingTeam, bowlingTeam;

    if (WinDecision === "bat") {
      battingTeam = Toss;
      bowlingTeam = Toss.toString() === mTeam1.toString() ? mTeam2 : mTeam1;
    } else {
      battingTeam = Toss.toString() === mTeam1.toString() ? mTeam2 : mTeam1;
      bowlingTeam = Toss;
    }

    // Create player entities with team references
    const [strikerEntity, nonStrikerEntity, bowlerEntity] = await Player.create(
      [
        { pName: striker, pTeam: [battingTeam] },
        { pName: nonStriker, pTeam: [battingTeam] },
        { pName: bowler, pTeam: [bowlingTeam] },
      ],
      { session }
    );

    const [battingTeamEntity, bowlingTeamEntity] = await Promise.all([
      Team.findByIdAndUpdate(
        battingTeam,
        {
          $addToSet: {
            tPlayers: { $each: [strikerEntity._id, nonStrikerEntity._id] },
          },
        },
        { new: true, session }
      ),
      Team.findByIdAndUpdate(
        bowlingTeam,
        { $addToSet: { tPlayers: bowlerEntity._id } },
        { new: true, session }
      ),
    ]);

    if (!battingTeamEntity || !bowlingTeamEntity) {
      throw new Error("Team update failed");
    }

    const [ScoreBoardEntity] = await ScoreBoard.create(
      [
        {
          TeamBat: battingTeamEntity.tName,
          TeamBowl: bowlingTeamEntity.tName,
          Striker: strikerEntity.pName,
          nonStriker: nonStrikerEntity.pName,
          Bowler: bowlerEntity.pName,
        },
      ],
      { session }
    );

    if (!ScoreBoardEntity) {
      throw new Error("Scoreboard creation failed");
    }

    await Match.findByIdAndUpdate(
      matchId,
      { FirstScoreBoard: ScoreBoardEntity._id },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Send response with player IDs
    res.status(200).json({
      message: "Players, teams, and scoreboard successfully initialized",
      strikerId: strikerEntity._id,
      nonStrikerId: nonStrikerEntity._id,
      bowlerId: bowlerEntity._id,
      scoreBoardId: ScoreBoardEntity._id,
      battingTeam,
      bowlingTeam,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error initializing players:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/scoreboard/:scoreboardid1", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const ScoreBoardEntity = await ScoreBoard.findById(
      req.params.scoreboardid1
    ).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(ScoreBoardEntity);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error getting scoreboard:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.post("/setnewball", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      wicket,
      wide,
      noBall,
      dot,
      bye,
      legBye,
      scoreBoardId1,
      strikerId,
      nonStrikerId,
      bowlerId,
      run,
      MatchId,
    } = req.body;

    // Find and update the scoreboard
    const scoreBoard = await findScoreBoard(scoreBoardId1);
    const striker = await findOrCreateBattingRecord(strikerId, MatchId);
    const nonStriker = await findOrCreateBattingRecord(nonStrikerId, MatchId);
    const bowler = await findOrCreateBowlingRecord(bowlerId, MatchId);
    const strikerP = await findPlayerById(strikerId);
    const nonStrikerP = await findPlayerById(nonStrikerId);
    const bowlerP = await findPlayerById(bowlerId);

    // Update scoreboard details based on the ball events
    if (wicket) {
      scoreBoard.TotalWickets += 1;

      bowler.wicketsTaken += 1;
      scoreBoard.OverBalls.push("W");
      BallCount(scoreBoard, bowler);
    } else if (wide) {
      if (run != 0) {
        scoreBoard.OverBalls.push(`Wd-${run}`);
      } else {
        scoreBoard.OverBalls.push("Wd");
        
      }
      scoreBoard.TeamRuns += run + 1;
      bowler.runsConceded += run + 1;
      bowler.extras += run + 1;
      scoreBoard.Extras += run + 1;
    } else if (dot) {
      scoreBoard.OverBalls.push("0");
      striker.ballsFaced += 1;
      BallCount(scoreBoard, bowler);
    } else if (noBall) {
      if (run != 0) {
        scoreBoard.OverBalls.push(`Nb-${run}`);
      } else {
        scoreBoard.OverBalls.push("Nb");
      }
      striker.ballsFaced += 1;
      scoreBoard.TeamRuns += run;
      bowler.runsConceded += run + 1;
      striker.totalRuns += run;
      bowler.extras += run + 1;
      scoreBoard.Extras += run + 1;
    } else if (bye) {
      if (run != 0) {
        scoreBoard.OverBalls.push(`bye-${run}`);
      } else {
        scoreBoard.OverBalls.push("bye");
      }

      striker.ballsFaced += 1;
      scoreBoard.TeamRuns += run;
      scoreBoard.Extras += run;
      BallCount(scoreBoard, bowler);
    } else if (legBye) {
      if (run != 0) {
        scoreBoard.OverBalls.push(`lbye-${run}`);
      } else {
        scoreBoard.OverBalls.push("lbye");
      }
      striker.ballsFaced += 1;
      scoreBoard.TeamRuns += run;
      scoreBoard.Extras += run;
      BallCount(scoreBoard, bowler);
    } else {
      if (run == 6) {
        striker.sixes += 1;
      } else if (run == 4) {
        striker.fours += 1;
      }
      scoreBoard.TeamRuns += run;
      bowler.runsConceded += run;
      striker.totalRuns += run;
      striker.ballsFaced += 1;

      scoreBoard.OverBalls.push(run.toString());
      BallCount(scoreBoard, bowler);
    }

    scoreBoard.Striker = strikerP.pName;
    scoreBoard.nonStriker = nonStrikerP.pName;
    scoreBoard.StrikerRuns = striker.totalRuns;
    scoreBoard.StrikerBalls = striker.ballsFaced;
    scoreBoard.nonStrikerRuns = nonStriker.totalRuns;
    scoreBoard.nonStrikerBalls = nonStriker.ballsFaced;
    scoreBoard.BowlerWickets = bowler.wicketsTaken;
    scoreBoard.BowlerOverNo = bowler.oversBowled;
    scoreBoard.BowlerRun = bowler.runsConceded;
    scoreBoard.Bowler = bowlerP.pName;

    // Save updated scoreboard and records
    await scoreBoard.save({ session });
    await striker.save({ session });
    await nonStriker.save({ session });
    await bowler.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Ball details updated successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error updating ball details:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

function BallCount(scoreBoard, bowler) {
  if (scoreBoard.CurrentBall >= 5) {
    scoreBoard.CurrentOver += 1;
    scoreBoard.CurrentBall = 0;
    bowler.oversBowled += 1;
    scoreBoard.OverBalls = [];
  } else {
    scoreBoard.CurrentBall += 1;
  }
}

router.put("/swapBatsman", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { scoreBoardId1, strikerId, nonStrikerId, MatchId } = req.body;

    // Find and update the scoreboard
    const scoreBoard = await findScoreBoard(scoreBoardId1);
    const striker = await findOrCreateBattingRecord(strikerId, MatchId);
    const nonStriker = await findOrCreateBattingRecord(nonStrikerId, MatchId);
    const strikerP = await findPlayerById(strikerId);
    const nonStrikerP = await findPlayerById(nonStrikerId);

    scoreBoard.Striker = strikerP.pName;
    scoreBoard.nonStriker = nonStrikerP.pName;
    scoreBoard.StrikerRuns = striker.totalRuns;
    scoreBoard.StrikerBalls = striker.ballsFaced;
    scoreBoard.nonStrikerRuns = nonStriker.totalRuns;
    scoreBoard.nonStrikerBalls = nonStriker.ballsFaced;

    // Save updated scoreboard and records
    await scoreBoard.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Batsman Swapped successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error Swaping batsman:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

module.exports = router;
