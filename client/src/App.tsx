import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { apiRequest, getToken } from "./api/client";
import { User } from "./types/models";
import { HomePage } from "./pages/HomePage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { JoinPage } from "./pages/JoinPage";
import { HostPage } from "./pages/HostPage";
import { PlayPage } from "./pages/PlayPage";

type Page = "home" | "login" | "register" | "dashboard" | "join" | "host" | "play";

export function App() {
  const [page, setPage] = useState<Page>("home");
  const [user, setUser] = useState<User | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    if (!getToken()) return;

    apiRequest<User>("/api/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("token");
      });
  }, []);

  function handleLoginSuccess(nextUser: User) {
    setUser(nextUser);
    setPage("dashboard");
  }

  function handleOpenHost(code: string) {
    setRoomCode(code);
    setPage("host");
  }

  function handleJoin(code: string, nextNickname: string) {
    setRoomCode(code);
    setNickname(nextNickname);
    setPage("play");
  }

  return (
    <>
      <Header currentPage={page} onNavigate={(nextPage) => setPage(nextPage as Page)} isLoggedIn={Boolean(user)} />

      <main className="container">
        {page === "home" && <HomePage onNavigate={(nextPage) => setPage(nextPage as Page)} />}

        {page === "login" && <AuthPage mode="login" onSuccess={handleLoginSuccess} />}
        {page === "register" && <AuthPage mode="register" onSuccess={handleLoginSuccess} />}

        {page === "dashboard" && <DashboardPage onOpenHost={handleOpenHost} />}

        {page === "join" && <JoinPage onJoin={handleJoin} />}

        {page === "host" && <HostPage roomCode={roomCode} />}

        {page === "play" && <PlayPage roomCode={roomCode} nickname={nickname} />}
      </main>
    </>
  );
}
