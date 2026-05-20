import React, { useState, useEffect } from "react";
import Button from "./Button.component";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, Target, Award, ChevronRight } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

function ScoreBoard() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatterModalOpen, setIsBatterModalOpen] = useState(false);
  const [matchData, setMatchData] = useState({
    teamBat: "",
    teamBowl: "",
    teamRuns: 0,
    totalWickets: 0,
    currentOver: 0,
    currentBall: 0,
    striker: { name: "", runs: 0, balls: 0 },
    nonStriker: { name: "", runs: 0, balls: 0 },
    bowler: { name: "", wickets: 0, runs: 0, overs: 0 },
    overBalls: [],
  });
  const [selectedRun, setSelectedRun] = useState(null);
  const [extras, setExtras] = useState({
    wicket: false,
    wide: false,
    noBall: false,
    bye: false,
    legBye: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const scoreBoardId1 = localStorage.getItem("scoreBoardId");

  const GetData = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/scoreboard/${scoreBoardId1}`
      );
      const data = response.data;
      setMatchData({
        teamBat: data.TeamBat,
        teamBowl: data.TeamBowl,
        teamRuns: data.TeamRuns,
        totalWickets: data.TotalWickets,
        currentOver: data.CurrentOver,
        currentBall: data.CurrentBall,
        striker: {
          name: data.Striker,
          runs: data.StrikerRuns,
          balls: data.StrikerBalls,
        },
        nonStriker: {
          name: data.nonStriker,
          runs: data.nonStrikerRuns,
          balls: data.nonStrikerBalls,
        },
        bowler: {
          name: data.Bowler,
          wickets: data.BowlerWickets,
          runs: data.BowlerRun,
          overs: data.BowlerOverNo,
        },
        overBalls: data.OverBalls || [],
      });
    } catch (error) {
      console.error("Error fetching scoreboard data:", error);
    }
  };

  useEffect(() => {
    if (scoreBoardId1) {
      GetData();
      // Poll for updates every 5 seconds
      const interval = setInterval(GetData, 5000);
      return () => clearInterval(interval);
    }
  }, [scoreBoardId1]);

  const handleBallSubmission = async () => {
    if (selectedRun === null && !extras.wicket && !extras.wide && !extras.noBall && !extras.bye && !extras.legBye) {
      alert("Please select a run or extra");
      return;
    }

    setIsLoading(true);
    try {
      const strikerId = localStorage.getItem("strikerId");
      const nonStrikerId = localStorage.getItem("nonStrikerId");
      const bowlerId = localStorage.getItem("bowlerId");
      const MatchId = localStorage.getItem("MatchId");

      await axios.post(`${apiUrl}/api/setnewball`, {
        wicket: extras.wicket,
        wide: extras.wide,
        noBall: extras.noBall,
        dot: selectedRun === 0,
        bye: extras.bye,
        legBye: extras.legBye,
        run: selectedRun || 0,
        scoreBoardId1,
        strikerId,
        nonStrikerId,
        bowlerId,
        MatchId,
      });

      // Reset selections
      setSelectedRun(null);
      setExtras({
        wicket: false,
        wide: false,
        noBall: false,
        bye: false,
        legBye: false,
      });

      await GetData();
    } catch (error) {
      console.error("Error submitting ball details:", error);
      alert("Failed to submit ball. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getBallColor = (ball) => {
    if (ball === 'W') return 'ball-wicket';
    if (ball.includes('Wd')) return 'ball-wide';
    if (ball.includes('Nb')) return 'ball-noball';
    if (ball === '0') return 'ball-dot';
    if (ball === '4') return 'ball-four';
    if (ball === '6') return 'ball-six';
    if (['1', '2', '3', '5'].includes(ball)) return 'ball-run';
    return 'ball-dot';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Score Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-b-3xl p-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {matchData.teamBat} vs {matchData.teamBowl}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Target className="w-4 h-4" />
                <span>Match in Progress</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="score-display text-5xl md:text-6xl text-gray-900 dark:text-white mb-2">
                {matchData.teamRuns}<span className="text-gray-400">/</span>{matchData.totalWickets}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Overs: {matchData.currentOver}.{matchData.currentBall}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate('/BattingStats')}
                icon={<Users className="w-4 h-4" />}
              >
                Batting Stats
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/BowlingStats')}
                icon={<Award className="w-4 h-4" />}
              >
                Bowling Stats
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Batting Team */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cricket-600" />
              {matchData.teamBat} - Batting
            </h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-cricket-50 to-green-50 dark:from-cricket-900/20 dark:to-green-900/20 p-4 rounded-lg border border-cricket-100 dark:border-cricket-800">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {matchData.striker.name}
                    </span>
                    <span className="text-cricket-600 font-bold">*</span>
                  </div>
                  <div className="text-right">
                    <div className="score-display text-xl">
                      {matchData.striker.runs}
                      <span className="text-gray-400 text-sm ml-1">({matchData.striker.balls})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Strike Rate: {matchData.striker.balls > 0 
                    ? ((matchData.striker.runs / matchData.striker.balls) * 100).toFixed(2)
                    : '0.00'}</span>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {matchData.nonStriker.name}
                  </span>
                  <div className="score-display">
                    {matchData.nonStriker.runs}
                    <span className="text-gray-400 text-sm ml-1">({matchData.nonStriker.balls})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Score Input */}
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Ball Input
            </h3>
            
            {/* Runs Selection */}
            <div className="mb-8">
              <label className="form-label">Select Runs</label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                  <button
                    key={run}
                    onClick={() => {
                      setSelectedRun(run);
                      setExtras({
                        wicket: false,
                        wide: false,
                        noBall: false,
                        bye: false,
                        legBye: false,
                      });
                    }}
                    className={`
                      h-14 rounded-lg font-bold text-lg transition-all duration-200
                      ${selectedRun === run
                        ? run === 4 
                          ? 'bg-green-600 text-white ring-2 ring-green-500'
                          : run === 6
                          ? 'bg-purple-600 text-white ring-2 ring-purple-500'
                          : 'bg-cricket-600 text-white ring-2 ring-cricket-500'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }
                    `}
                  >
                    {run}
                  </button>
                ))}
              </div>
            </div>

            {/* Extras Selection */}
            <div className="mb-8">
              <label className="form-label">Extras & Wicket</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Wicket', key: 'wicket', color: 'red' },
                  { label: 'Wide', key: 'wide', color: 'yellow' },
                  { label: 'No Ball', key: 'noBall', color: 'orange' },
                  { label: 'Bye', key: 'bye', color: 'gray' },
                  { label: 'Leg Bye', key: 'legBye', color: 'blue' },
                ].map((extra) => (
                  <button
                    key={extra.key}
                    onClick={() => {
                      setExtras({
                        wicket: false,
                        wide: false,
                        noBall: false,
                        bye: false,
                        legBye: false,
                        [extra.key]: !extras[extra.key],
                      });
                      if (!extras[extra.key]) setSelectedRun(null);
                    }}
                    className={`
                      h-12 rounded-lg font-medium transition-all duration-200
                      ${extras[extra.key]
                        ? `bg-${extra.color}-600 text-white ring-2 ring-${extra.color}-500`
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }
                    `}
                  >
                    {extra.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Over */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="form-label">Current Over</label>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {matchData.bowler.name} - {matchData.bowler.overs}.{matchData.currentBall}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {matchData.overBalls.map((ball, index) => (
                  <div
                    key={index}
                    className={`over-ball ${getBallColor(ball)}`}
                  >
                    {ball}
                  </div>
                ))}
                {Array.from({ length: 6 - matchData.overBalls.length }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="over-ball bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700"
                  >
                    ·
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={handleBallSubmission}
                loading={isLoading}
                disabled={isLoading}
                className="flex-1"
                size="large"
              >
                {isLoading ? 'Submitting...' : 'Submit Ball'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const strikerId = localStorage.getItem("strikerId");
                  const nonStrikerId = localStorage.getItem("nonStrikerId");
                  localStorage.setItem("strikerId", nonStrikerId);
                  localStorage.setItem("nonStrikerId", strikerId);
                  // Call swap API here
                  GetData();
                }}
                className="flex-1"
              >
                Swap Batsmen
              </Button>
            </div>
          </div>
        </div>

        {/* Bowler Stats */}
        <div className="card mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bowling - {matchData.bowler.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {matchData.bowler.wickets}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Wickets</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {matchData.bowler.runs}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Runs</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {matchData.bowler.overs}.{matchData.currentBall}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overs</div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {matchData.bowler.overs > 0 
                  ? (matchData.bowler.runs / matchData.bowler.overs).toFixed(2)
                  : '0.00'
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Economy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScoreBoard;