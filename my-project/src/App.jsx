import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AppLayout from "./components/AppLayout";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import MatchSetup from "./pages/MatchSetup";
import LiveScoring from "./pages/LiveScoring";
import MatchStats from "./pages/MatchStats";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import Venues from "./pages/Venues";
import { useSelector } from "react-redux";

function ProtectedRoute({ children }) {
  const token = useSelector((state) => state.auth.token);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/Login" element={<Navigate to="/login" replace />} />
        <Route path="/SignUp" element={<Navigate to="/signup" replace />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="matches/new" element={<MatchSetup />} />
          <Route path="matches/:matchId/scoring" element={<LiveScoring />} />
          <Route path="matches/:matchId/stats" element={<MatchStats />} />
          <Route path="teams" element={<Teams />} />
          <Route path="players" element={<Players />} />
          <Route path="venues" element={<Venues />} />

          <Route path="OpeningData" element={<Navigate to="/matches/new" replace />} />
          <Route path="scoreboard" element={<Dashboard />} />
          <Route path="Scoreboard" element={<Dashboard />} />
          <Route path="UserPage" element={<Dashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgb(15 23 42)",
            color: "#fff",
            border: "1px solid rgb(51 65 85)",
          },
        }}
      />
    </>
  );
}
