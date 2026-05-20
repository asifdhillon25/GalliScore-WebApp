export const teamName = (team) => team?.shortName || team?.name || "TBA";

export const playerName = (player) =>
  player?.displayName || [player?.firstName, player?.lastName].filter(Boolean).join(" ") || "Player";

export const scoreText = (inning) => {
  if (!inning) return "0/0";
  return `${inning.runs || 0}/${inning.wickets || 0}`;
};

export const oversText = (inning) => {
  if (!inning) return "0.0";
  return `${inning.overs || 0}.${inning.balls || 0}`;
};

export const formatDate = (value) => {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};
