import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { LeaderboardItem } from "../types/models";

type Props = {
  roomCode: string;
};

export function HostPage({ roomCode }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [message, setMessage] = useState("Комната создана. Ждём участников.");

  useEffect(() => {
    socket.emit("host_join_room", { roomCode });

    socket.on("participant_joined", (payload: { nickname: string }) => {
      setMessage(`Подключился участник: ${payload.nickname}`);
    });

    socket.on("leaderboard_updated", (data: LeaderboardItem[]) => {
      setLeaderboard(data);
    });

    socket.on("quiz_finished", (payload: { leaderboard: LeaderboardItem[] }) => {
      setLeaderboard(payload.leaderboard);
      setMessage("Квиз завершён");
    });

    return () => {
      socket.off("participant_joined");
      socket.off("leaderboard_updated");
      socket.off("quiz_finished");
    };
  }, [roomCode]);

  function startQuiz() {
    socket.emit("start_quiz", { roomCode });
    setMessage("Квиз запущен");
  }

  function nextQuestion() {
    socket.emit("next_question", { roomCode });
    setMessage("Следующий вопрос отправлен участникам");
  }

  function finishQuiz() {
    socket.emit("finish_quiz", { roomCode });
  }

  return (
    <section className="grid">
      <div className="card">
        <h2>Панель организатора</h2>
        <p className="muted">Код комнаты</p>
        <div className="room-code">{roomCode}</div>

        <div className="actions vertical">
          <button className="primary" onClick={startQuiz}>Запустить квиз</button>
          <button onClick={nextQuestion}>Следующий вопрос</button>
          <button onClick={finishQuiz}>Завершить квиз</button>
        </div>

        <p>{message}</p>
      </div>

      <div className="card">
        <h2>Лидерборд</h2>
        {leaderboard.length === 0 && <p className="muted">Пока нет участников</p>}
        {leaderboard.map((item, index) => (
          <div className="leaderboard-row" key={item.id}>
            <span>{index + 1}. {item.nickname}</span>
            <strong>{item.score}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
