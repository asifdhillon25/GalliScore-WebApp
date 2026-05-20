const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

const readSession = () => {
  try {
    return JSON.parse(localStorage.getItem("galliscore.auth") || "{}");
  } catch {
    return {};
  }
};

export async function apiRequest(path, options = {}) {
  const session = readSession();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage = Array.isArray(payload.errors)
      ? payload.errors.map((item) => item.message).join(", ")
      : "";
    const error = new Error(validationMessage || payload.message || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  auth: {
    login: (body) => apiRequest("/api/auth/login", { method: "POST", body }),
    register: (body) => apiRequest("/api/auth/register", { method: "POST", body }),
    profile: () => apiRequest("/api/auth/profile"),
    logout: () => apiRequest("/api/auth/logout", { method: "POST" }),
  },
  matches: {
    list: (query = "") => apiRequest(`/api/matches${query}`),
    live: () => apiRequest("/api/matches/live"),
    upcoming: () => apiRequest("/api/matches/upcoming"),
    byId: (id) => apiRequest(`/api/matches/${id}`),
    create: (body) => apiRequest("/api/matches", { method: "POST", body }),
    start: (id) => apiRequest(`/api/matches/${id}/start`, { method: "POST" }),
    toss: (id, body) => apiRequest(`/api/matches/${id}/toss`, { method: "POST", body }),
    end: (id, body) => apiRequest(`/api/matches/${id}/end`, { method: "POST", body }),
    stats: (id) => apiRequest(`/api/matches/${id}/stats`),
  },
  scoring: {
    initializeInning: (body) => apiRequest("/api/scoring/inning/initialize", { method: "POST", body }),
    startInning: (inningId, body) => apiRequest(`/api/scoring/inning/${inningId}/start`, { method: "POST", body }),
    state: (matchId) => apiRequest(`/api/scoring/match/${matchId}/state`),
    scoreBall: (inningId, body) => apiRequest(`/api/scoring/inning/${inningId}/ball`, { method: "POST", body }),
    undo: (inningId) => apiRequest(`/api/scoring/inning/${inningId}/undo`, { method: "POST" }),
    updateBatsmen: (inningId, body) => apiRequest(`/api/scoring/inning/${inningId}/batsmen`, { method: "PUT", body }),
    updateBowler: (inningId, body) => apiRequest(`/api/scoring/inning/${inningId}/bowler`, { method: "PUT", body }),
    commentary: (matchId) => apiRequest(`/api/scoring/match/${matchId}/commentary`),
  },
  innings: {
    summary: (id) => apiRequest(`/api/innings/${id}/summary`),
  },
  teams: {
    list: () => apiRequest("/api/teams?limit=100"),
    create: (body) => apiRequest("/api/teams", { method: "POST", body }),
  },
  players: {
    list: () => apiRequest("/api/players?limit=200"),
    create: (body) => apiRequest("/api/players", { method: "POST", body }),
  },
  venues: {
    list: () => apiRequest("/api/venues?limit=100"),
    create: (body) => apiRequest("/api/venues", { method: "POST", body }),
  },
};

export function getApiUrl() {
  return API_URL;
}
