import { FormEvent, useState } from "react";
import { apiRequest, setToken } from "../api/client";
import { User } from "../types/models";

type Props = {
  mode: "login" | "register";
  onSuccess: (user: User) => void;
};

export function AuthPage({ mode, onSuccess }: Props) {
  const [name, setName] = useState("Организатор");
  const [email, setEmail] = useState(mode === "login" ? "organizer@test.com" : "");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState<"ORGANIZER" | "PARTICIPANT">("ORGANIZER");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const result = await apiRequest<{ token: string; user: User }>(
        mode === "login" ? "/api/auth/login" : "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(
            mode === "login"
              ? { email, password }
              : { name, email, password, role }
          )
        }
      );

      setToken(result.token);
      onSuccess(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <section className="narrow">
      <div className="card">
        <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>

        <form onSubmit={submit} className="form">
          {mode === "register" && (
            <>
              <label>Имя</label>
              <input value={name} onChange={(event) => setName(event.target.value)} />

              <label>Роль</label>
              <select value={role} onChange={(event) => setRole(event.target.value as "ORGANIZER" | "PARTICIPANT")}>
                <option value="ORGANIZER">Организатор</option>
                <option value="PARTICIPANT">Участник</option>
              </select>
            </>
          )}

          <label>Email</label>
          <input value={email} onChange={(event) => setEmail(event.target.value)} />

          <label>Пароль</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />

          {error && <p className="error">{error}</p>}

          <button className="primary" type="submit">
            {mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
      </div>
    </section>
  );
}
