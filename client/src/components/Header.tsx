import { clearToken } from "../api/client";

type Props = {
  currentPage: string;
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
};

export function Header({ currentPage, onNavigate, isLoggedIn }: Props) {
  function logout() {
    clearToken();
    onNavigate("home");
    window.location.reload();
  }

  return (
    <header className="header">
      <button className="logo" onClick={() => onNavigate("home")}>
        VK Quiz MVP
      </button>

      <nav className="nav">
        <button className={currentPage === "home" ? "active" : ""} onClick={() => onNavigate("home")}>
          Главная
        </button>
        <button className={currentPage === "join" ? "active" : ""} onClick={() => onNavigate("join")}>
          Подключиться
        </button>

        {isLoggedIn ? (
          <>
            <button className={currentPage === "dashboard" ? "active" : ""} onClick={() => onNavigate("dashboard")}>
              Кабинет
            </button>
            <button onClick={logout}>Выйти</button>
          </>
        ) : (
          <>
            <button className={currentPage === "login" ? "active" : ""} onClick={() => onNavigate("login")}>
              Вход
            </button>
            <button className={currentPage === "register" ? "active" : ""} onClick={() => onNavigate("register")}>
              Регистрация
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
