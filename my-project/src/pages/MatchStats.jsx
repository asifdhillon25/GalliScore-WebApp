import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Activity, BarChart3, ListChecks } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { scoreText, teamName } from "../lib/format";
import { Button, Card, PageHeader, StatCard } from "../components/ui";

export default function MatchStats() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [commentary, setCommentary] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [matchResponse, statsResponse, commentaryResponse] = await Promise.all([
          api.matches.byId(matchId),
          api.matches.stats(matchId),
          api.scoring.commentary(matchId),
        ]);
        setMatch(matchResponse.data.match);
        setStats(statsResponse.data.statistics);
        setCommentary(commentaryResponse.data.ballByBall || []);
      } catch (error) {
        toast.error(error.message);
      }
    }
    load();
  }, [matchId]);

  return (
    <>
      <PageHeader
        eyebrow="Match center"
        title={match ? `${teamName(match.team1)} vs ${teamName(match.team2)}` : "Match stats"}
        description={match?.resultDescription || "Review innings, partnerships, fall of wickets, and commentary."}
        actions={<Link to={`/matches/${matchId}/scoring`}><Button>Open scoring</Button></Link>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Team 1" value={stats?.team1 ? `${stats.team1.runs}/${stats.team1.wickets}` : "-"} detail={`${stats?.team1?.overs || 0} overs`} icon={<BarChart3 />} />
        <StatCard label="Team 2" value={stats?.team2 ? `${stats.team2.runs}/${stats.team2.wickets}` : "-"} detail={`${stats?.team2?.overs || 0} overs`} icon={<BarChart3 />} />
        <StatCard label="Partnerships" value={stats?.partnerships?.length || 0} detail="Recorded stands" icon={<Activity />} />
        <StatCard label="Wickets" value={stats?.fallOfWickets?.length || 0} detail="Fall of wickets" icon={<ListChecks />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <h2 className="font-display text-2xl font-black">Innings</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(match?.innings || []).map((inning) => (
              <div key={inning._id} className="rounded-3xl border border-slate-200 p-4 dark:border-white/10">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Inning {inning.inningNumber}</p>
                <p className="mt-2 text-xl font-black">{teamName(inning.battingTeam)}</p>
                <p className="mt-1 text-3xl font-black text-emerald-600">{scoreText(inning)}</p>
                <p className="text-sm text-slate-500">{inning.overs}.{inning.balls} overs · extras {inning.extras?.total || 0}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 font-display text-2xl font-black">Top partnerships</h2>
          <div className="mt-4 space-y-3">
            {(stats?.partnerships || []).slice(0, 8).map((partnership, index) => (
              <div key={index} className="flex items-center justify-between rounded-2xl bg-slate-100 p-4 text-sm dark:bg-white/10">
                <span>Partnership {index + 1}</span>
                <span className="font-black">{partnership.runs || 0} runs · {partnership.balls || 0} balls</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-black">Commentary</h2>
          <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {commentary.length === 0 ? (
              <p className="text-sm text-slate-500">No commentary yet.</p>
            ) : commentary.map((item, index) => (
              <div key={`${item.timestamp}-${index}`} className="rounded-2xl bg-slate-100 p-3 text-sm dark:bg-white/10">
                <div className="flex justify-between">
                  <span className="font-black">{item.over}.{item.ball}</span>
                  <span>{item.isWicket ? "Wicket" : `${item.runs} run${item.runs === 1 ? "" : "s"}`}</span>
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
