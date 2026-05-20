import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CalendarClock, Trophy, Users } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { formatDate, scoreText, teamName } from "../lib/format";
import { Button, Card, EmptyState, MotionCard, PageHeader, StatCard } from "../components/ui";

export default function Dashboard() {
  const [data, setData] = useState({ matches: [], live: [], upcoming: [], teams: [], players: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [matches, live, upcoming, teams, players] = await Promise.all([
          api.matches.list("?limit=8"),
          api.matches.live(),
          api.matches.upcoming(),
          api.teams.list(),
          api.players.list(),
        ]);
        setData({
          matches: matches.data.matches || [],
          live: live.data.matches || [],
          upcoming: upcoming.data.matches || [],
          teams: teams.data.teams || [],
          players: players.data.players || [],
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const matches = data.matches;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Match operations"
        description="Pick up live games, prepare the next fixture, and keep your cricket data organized."
        actions={<Button as="span" onClick={() => {}} className="pointer-events-none">Backend synced</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Live matches" value={data.live.length} detail="Currently scoring" icon={<Activity />} />
        <StatCard label="Upcoming" value={data.upcoming.length} detail="Scheduled fixtures" icon={<CalendarClock />} />
        <StatCard label="Teams" value={data.teams.length} detail="Available squads" icon={<Trophy />} />
        <StatCard label="Players" value={data.players.length} detail="Registered players" icon={<Users />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-black">Recent matches</h2>
            <Link to="/matches/new">
              <Button>New match</Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading matches...</p>
          ) : matches.length === 0 ? (
            <EmptyState
              title="No matches yet"
              description="Create your first match, record the toss, initialize the innings, and start scoring ball by ball."
              action={<Link to="/matches/new"><Button>Create match</Button></Link>}
            />
          ) : (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <MotionCard key={match._id} delay={index * 0.03}>
                  <div className="rounded-3xl border border-slate-200 p-4 transition hover:border-emerald-400 dark:border-white/10">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{match.status}</p>
                        <h3 className="mt-1 text-lg font-black">{teamName(match.team1)} vs {teamName(match.team2)}</h3>
                        <p className="text-sm text-slate-500">{formatDate(match.date)} · {match.format}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {match.isLive || match.status?.startsWith("inning") ? (
                          <Link to={`/matches/${match._id}/scoring`}><Button>Score</Button></Link>
                        ) : null}
                        <Link to={`/matches/${match._id}/stats`}><Button variant="subtle">Stats</Button></Link>
                      </div>
                    </div>
                    {match.innings?.length > 0 && (
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {match.innings.map((inning) => (
                          <div key={inning._id || inning.id} className="rounded-2xl bg-slate-100 p-3 text-sm dark:bg-white/10">
                            <span className="font-black">{teamName(inning.battingTeam)}</span>
                            <span className="ml-2 text-slate-500">{scoreText(inning)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </MotionCard>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Quick start</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">1. Create teams and add players, or use existing squads.</p>
            <p className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">2. Schedule a match and record toss details.</p>
            <p className="rounded-2xl bg-slate-100 p-4 dark:bg-white/10">3. Initialize the innings and score every ball live.</p>
          </div>
        </Card>
      </div>
    </>
  );
}
