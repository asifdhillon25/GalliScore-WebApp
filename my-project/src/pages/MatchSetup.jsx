import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Flag, Play, Users } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { playerName, teamName } from "../lib/format";
import { Button, Card, Field, PageHeader, inputClass } from "../components/ui";

const formats = [
  { value: "t10", label: "T10" },
  { value: "t20", label: "T20" },
  { value: "odi", label: "ODI" },
  { value: "custom", label: "Custom" },
];

export default function MatchSetup() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [createdMatch, setCreatedMatch] = useState(null);
  const [inning, setInning] = useState(null);
  const [form, setForm] = useState({
    title: "",
    team1: "",
    team2: "",
    venue: "",
    date: new Date().toISOString().slice(0, 16),
    format: "t20",
    oversPerInning: 20,
    maxOversPerBowler: 4,
    tossWinner: "",
    decision: "bat",
    strikerId: "",
    nonStrikerId: "",
    bowlerId: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [teamResponse, playerResponse, venueResponse] = await Promise.all([
          api.teams.list(),
          api.players.list(),
          api.venues.list(),
        ]);
        setTeams(teamResponse.data.teams || []);
        setPlayers(playerResponse.data.players || []);
        setVenues(venueResponse.data.venues || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedTeam1 = teams.find((team) => team._id === form.team1);
  const selectedTeam2 = teams.find((team) => team._id === form.team2);

  const teamPlayers = (team) => {
    const ids = new Set((team?.players || []).map((entry) => entry.player?._id || entry.player).filter(Boolean));
    const roster = players.filter((player) => ids.has(player._id));
    return roster.length > 0 ? roster : players;
  };

  const tossWinnerTeam = teams.find((team) => team._id === form.tossWinner);
  const battingTeamId = useMemo(() => {
    if (!form.tossWinner || !form.team1 || !form.team2) return "";
    const otherTeam = form.tossWinner === form.team1 ? form.team2 : form.team1;
    return form.decision === "bat" ? form.tossWinner : otherTeam;
  }, [form.tossWinner, form.team1, form.team2, form.decision]);
  const bowlingTeamId = battingTeamId === form.team1 ? form.team2 : form.team1;
  const battingTeam = teams.find((team) => team._id === battingTeamId);
  const bowlingTeam = teams.find((team) => team._id === bowlingTeamId);
  const battingPlayers = teamPlayers(battingTeam).slice(0, 11);
  const bowlingPlayers = teamPlayers(bowlingTeam).slice(0, 11);

  const update = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
  };

  const createMatch = async (event) => {
    event.preventDefault();
    if (form.team1 === form.team2) {
      toast.error("Choose two different teams");
      return;
    }

    setBusy(true);
    try {
      const title = form.title || `${teamName(selectedTeam1)} vs ${teamName(selectedTeam2)}`;
      const response = await api.matches.create({
        title,
        team1: form.team1,
        team2: form.team2,
        venue: form.venue || undefined,
        date: new Date(form.date).toISOString(),
        format: form.format,
        rules: {
          oversPerInning: Number(form.oversPerInning),
          maxOversPerBowler: Number(form.maxOversPerBowler),
        },
      });
      const match = response.data.match;
      await api.matches.start(match._id);
      setCreatedMatch(match);
      toast.success("Match created. Record the toss next.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const recordTossAndInitialize = async () => {
    if (!createdMatch || !form.tossWinner || !form.strikerId || !form.nonStrikerId || !form.bowlerId) {
      toast.error("Complete toss and opening players");
      return;
    }

    setBusy(true);
    try {
      await api.matches.toss(createdMatch._id, {
        wonBy: form.tossWinner,
        decision: form.decision,
        electedTo: form.decision === "bat" ? "bat" : "field",
      });

      const init = await api.scoring.initializeInning({
        matchId: createdMatch._id,
        inningNumber: 1,
        battingTeamId,
        bowlingTeamId,
        playingXI: {
          batting: battingPlayers.map((player, index) => ({
            player: player._id,
            battingPosition: index + 1,
            role: player.primaryRole || "player",
          })),
          bowling: bowlingPlayers.map((player, index) => ({
            player: player._id,
            bowlingOrder: index + 1,
          })),
        },
      });

      const started = await api.scoring.startInning(init.data.inning._id, {
        strikerId: form.strikerId,
        nonStrikerId: form.nonStrikerId,
        bowlerId: form.bowlerId,
      });

      setInning(started.data.inning);
      toast.success("Inning started");
      navigate(`/matches/${createdMatch._id}/scoring`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Match wizard"
        title="Create and start a match"
        description="This flow uses the current backend: create match, start match, record toss, initialize the innings, then score live."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Calendar />
            </span>
            <div>
              <h2 className="font-display text-2xl font-black">Fixture</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Choose teams, format, venue, and rules.</p>
            </div>
          </div>

          <form onSubmit={createMatch} className="grid gap-4 md:grid-cols-2">
            <Field label="Match title">
              <input className={inputClass} value={form.title} onChange={update("title")} placeholder="Optional" />
            </Field>
            <Field label="Date and time">
              <input className={inputClass} type="datetime-local" value={form.date} onChange={update("date")} required />
            </Field>
            <Field label="Team 1">
              <select className={inputClass} value={form.team1} onChange={update("team1")} required disabled={loading || createdMatch}>
                <option value="">Select team</option>
                {teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
              </select>
            </Field>
            <Field label="Team 2">
              <select className={inputClass} value={form.team2} onChange={update("team2")} required disabled={loading || createdMatch}>
                <option value="">Select team</option>
                {teams.map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
              </select>
            </Field>
            <Field label="Format">
              <select className={inputClass} value={form.format} onChange={update("format")} disabled={createdMatch}>
                {formats.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
              </select>
            </Field>
            <Field label="Venue">
              <select className={inputClass} value={form.venue} onChange={update("venue")} disabled={createdMatch}>
                <option value="">No venue</option>
                {venues.map((venue) => <option key={venue._id} value={venue._id}>{venue.name}</option>)}
              </select>
            </Field>
            <Field label="Overs per inning">
              <input className={inputClass} type="number" min="1" value={form.oversPerInning} onChange={update("oversPerInning")} disabled={createdMatch} />
            </Field>
            <Field label="Max overs per bowler">
              <input className={inputClass} type="number" min="1" value={form.maxOversPerBowler} onChange={update("maxOversPerBowler")} disabled={createdMatch} />
            </Field>
            <div className="md:col-span-2">
              <Button disabled={busy || createdMatch || teams.length < 2}>{busy ? "Creating..." : "Create match and move to toss"}</Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
              <Flag />
            </span>
            <div>
              <h2 className="font-display text-2xl font-black">Toss and innings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Available after fixture creation.</p>
            </div>
          </div>

          {!createdMatch ? (
            <p className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-white/10 dark:text-slate-300">
              Create the fixture first. Then choose toss winner, batting side, striker, non-striker, and opening bowler.
            </p>
          ) : (
            <div className="space-y-4">
              <Field label="Toss winner">
                <select className={inputClass} value={form.tossWinner} onChange={update("tossWinner")} required>
                  <option value="">Select toss winner</option>
                  {[selectedTeam1, selectedTeam2].filter(Boolean).map((team) => <option key={team._id} value={team._id}>{team.name}</option>)}
                </select>
              </Field>
              <Field label={`${teamName(tossWinnerTeam)} chose to`}>
                <select className={inputClass} value={form.decision} onChange={update("decision")}>
                  <option value="bat">Bat</option>
                  <option value="bowl">Bowl</option>
                </select>
              </Field>

              <div className="rounded-3xl bg-slate-100 p-4 text-sm dark:bg-white/10">
                <p className="font-black">First innings</p>
                <p className="mt-1 text-slate-500 dark:text-slate-400">
                  Batting: {teamName(battingTeam)} · Bowling: {teamName(bowlingTeam)}
                </p>
              </div>

              <Field label="Striker">
                <select className={inputClass} value={form.strikerId} onChange={update("strikerId")}>
                  <option value="">Select striker</option>
                  {battingPlayers.map((player) => <option key={player._id} value={player._id}>{playerName(player)}</option>)}
                </select>
              </Field>
              <Field label="Non-striker">
                <select className={inputClass} value={form.nonStrikerId} onChange={update("nonStrikerId")}>
                  <option value="">Select non-striker</option>
                  {battingPlayers.filter((player) => player._id !== form.strikerId).map((player) => <option key={player._id} value={player._id}>{playerName(player)}</option>)}
                </select>
              </Field>
              <Field label="Opening bowler">
                <select className={inputClass} value={form.bowlerId} onChange={update("bowlerId")}>
                  <option value="">Select bowler</option>
                  {bowlingPlayers.map((player) => <option key={player._id} value={player._id}>{playerName(player)}</option>)}
                </select>
              </Field>
              <Button className="w-full" onClick={recordTossAndInitialize} disabled={busy || inning}>
                <Play size={16} /> {busy ? "Starting..." : "Start live scoring"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center gap-3">
          <Users className="text-emerald-600" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Need squads first? Use the Teams and Players pages. Creating teams requires `team_manager` or `admin`; creating matches/scoring requires `scorer`, `team_manager`, or `admin` depending on the backend route.
          </p>
        </div>
      </Card>
    </>
  );
}
