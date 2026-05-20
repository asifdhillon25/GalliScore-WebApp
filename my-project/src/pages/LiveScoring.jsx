import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { RotateCcw, Send, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { oversText, playerName, scoreText, teamName } from "../lib/format";
import { Button, Card, Field, PageHeader, StatCard, inputClass } from "../components/ui";

const runOptions = [0, 1, 2, 3, 4, 5, 6];
const deliveryTypes = [
  { value: "normal", label: "Legal" },
  { value: "wide", label: "Wide" },
  { value: "no_ball", label: "No ball" },
  { value: "bye", label: "Bye" },
  { value: "leg_bye", label: "Leg bye" },
  { value: "dead_ball", label: "Dead ball" },
];

const dismissalTypes = ["bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket"];

export default function LiveScoring() {
  const { matchId } = useParams();
  const [state, setState] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ball, setBall] = useState({
    runs: 0,
    deliveryType: "normal",
    isWicket: false,
    dismissalType: "bowled",
    description: "",
  });

  const load = async () => {
    try {
      const [scoringState, ballByBall] = await Promise.all([
        api.scoring.state(matchId),
        api.scoring.commentary(matchId),
      ]);
      setState(scoringState.data);
      setCommentary(ballByBall.data.ballByBall || []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [matchId]);

  const currentInning = state?.currentInning;
  const currentOver = state?.currentOver;
  const match = state?.match;
  const striker = currentInning?.currentBatsmen?.striker;
  const nonStriker = currentInning?.currentBatsmen?.nonStriker;
  const bowler = currentInning?.currentBowler;

  const nextBallMeta = useMemo(() => {
    const overNumber = (currentInning?.overs || 0) + 1;
    const ballNumber = Math.min((currentInning?.balls || 0) + 1, 6);
    return { overNumber, ballNumber };
  }, [currentInning]);

  const extras = {
    wides: ball.deliveryType === "wide" ? 1 : 0,
    noBalls: ball.deliveryType === "no_ball" ? 1 : 0,
    byes: ball.deliveryType === "bye" ? ball.runs : 0,
    legByes: ball.deliveryType === "leg_bye" ? ball.runs : 0,
  };

  const scoreBall = async () => {
    if (!currentInning || !striker || !nonStriker || !bowler) {
      toast.error("Current inning is not ready for scoring");
      return;
    }
    setBusy(true);
    try {
      await api.scoring.scoreBall(currentInning._id, {
        overNumber: nextBallMeta.overNumber,
        ballNumber: nextBallMeta.ballNumber,
        runs: Number(ball.runs),
        batsman: striker._id,
        bowler: bowler._id,
        nonStriker: nonStriker._id,
        deliveryType: ball.deliveryType,
        isWicket: ball.isWicket,
        dismissal: ball.isWicket ? { type: ball.dismissalType } : undefined,
        extras,
        description: ball.description,
      });
      toast.success("Ball scored");
      setBall({ runs: 0, deliveryType: "normal", isWicket: false, dismissalType: "bowled", description: "" });
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const undoBall = async () => {
    if (!currentInning) return;
    setBusy(true);
    try {
      await api.scoring.undo(currentInning._id);
      toast.success("Last ball undone");
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const updateBowler = async (event) => {
    try {
      await api.scoring.updateBowler(currentInning._id, { bowlerId: event.target.value });
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <PageHeader eyebrow="Live" title="Loading scoring state..." />;
  }

  if (!currentInning) {
    return (
      <>
        <PageHeader eyebrow="Live scoring" title="No active innings" description="Initialize and start an innings from the match setup flow before scoring." />
        <Link to="/matches/new"><Button>Start match setup</Button></Link>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Live scoring"
        title={`${teamName(match?.team1)} vs ${teamName(match?.team2)}`}
        description={`${teamName(currentInning.battingTeam)} batting · ${teamName(currentInning.bowlingTeam)} bowling`}
        actions={<Link to={`/matches/${matchId}/stats`}><Button variant="subtle">View stats</Button></Link>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Score" value={scoreText(currentInning)} detail={`${oversText(currentInning)} overs`} icon={<Trophy />} />
        <StatCard label="Run rate" value={(state.matchSituation?.currentRunRate || 0).toFixed(2)} detail="Current RR" />
        <StatCard label="Target" value={state.matchSituation?.target || "-"} detail={`${state.matchSituation?.runsNeeded || 0} needed`} />
        <StatCard label="Balls left" value={state.matchSituation?.ballsRemaining ?? "-"} detail={`${state.matchSituation?.wicketsRemaining ?? 0} wickets left`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.72fr]">
        <Card>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-emerald-50 p-4 dark:bg-emerald-400/10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Striker</p>
              <p className="mt-2 text-xl font-black">{playerName(striker)}</p>
            </div>
            <div className="rounded-3xl bg-slate-100 p-4 dark:bg-white/10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Non-striker</p>
              <p className="mt-2 text-xl font-black">{playerName(nonStriker)}</p>
            </div>
            <div className="rounded-3xl bg-sky-50 p-4 dark:bg-sky-400/10">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Bowler</p>
              <p className="mt-2 text-xl font-black">{playerName(bowler)}</p>
            </div>
          </div>

          {!bowler && (
            <div className="mt-4">
              <Field label="Choose next bowler">
                <select className={inputClass} onChange={updateBowler} defaultValue="">
                  <option value="">Select bowler</option>
                  {state.availableBowlers.map((player) => <option key={player._id} value={player._id}>{playerName(player)}</option>)}
                </select>
              </Field>
            </div>
          )}

          <div className="mt-6">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Over {nextBallMeta.overNumber}, ball {nextBallMeta.ballNumber}
            </p>
            <div className="grid grid-cols-4 gap-3 md:grid-cols-7">
              {runOptions.map((run) => (
                <button
                  key={run}
                  className={`h-16 rounded-3xl text-xl font-black transition ${
                    Number(ball.runs) === run
                      ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200"
                  }`}
                  onClick={() => setBall((current) => ({ ...current, runs: run }))}
                >
                  {run}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Delivery">
              <select className={inputClass} value={ball.deliveryType} onChange={(event) => setBall((current) => ({ ...current, deliveryType: event.target.value }))}>
                {deliveryTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </Field>
            <Field label="Description">
              <input className={inputClass} value={ball.description} onChange={(event) => setBall((current) => ({ ...current, description: event.target.value }))} placeholder="Optional commentary" />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
              <input type="checkbox" checked={ball.isWicket} onChange={(event) => setBall((current) => ({ ...current, isWicket: event.target.checked }))} />
              Wicket
            </label>
            {ball.isWicket && (
              <select className={`${inputClass} max-w-xs`} value={ball.dismissalType} onChange={(event) => setBall((current) => ({ ...current, dismissalType: event.target.value }))}>
                {dismissalTypes.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
              </select>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={scoreBall} disabled={busy}>
              <Send size={16} /> {busy ? "Submitting..." : "Submit ball"}
            </Button>
            <Button variant="subtle" onClick={undoBall} disabled={busy}>
              <RotateCcw size={16} /> Undo last ball
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Ball by ball</h2>
          <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
            {commentary.length === 0 ? (
              <p className="text-sm text-slate-500">No balls recorded yet.</p>
            ) : commentary.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="rounded-2xl bg-slate-100 p-3 text-sm dark:bg-white/10">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-black">{item.over}.{item.ball}</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-black ${item.isWicket ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"}`}>
                    {item.isWicket ? "W" : item.runs}
                  </span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
