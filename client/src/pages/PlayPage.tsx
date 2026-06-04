import { useEffect, useState } from "react";
import { socket } from "../socket/socket";
import { LeaderboardItem, Question } from "../types/models";

type Props = {
  roomCode: string;
  nickname: string;
};

export function PlayPage({ roomCode, nickname }: Props) {
  const [participantId, setParticipantId] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [message, setMessage] = useState("Подключаемся к комнате...");

  useEffect(() => {
    socket.emit("join_room", { roomCode, nickname });

    socket.on("room_joined", (payload: { participantId: string; quizTitle: string }) => {
      setParticipantId(payload.participantId);
      setQuizTitle(payload.quizTitle);
      setMessage("Вы подключились. Ожидайте начала квиза.");
    });

    socket.on("question_started", (payload: { question: Question; index: number; total: number }) => {
      setQuestion(payload.question);
      setSelectedOptions([]);
      setMessage(`Вопрос ${payload.index + 1} из ${payload.total}`);
    });

    socket.on("answer_result", (payload: { isCorrect: boolean; earnedPoints: number }) => {
      setMessage(payload.isCorrect ? `Правильно! +${payload.earnedPoints}` : "Неправильно");
    });

    socket.on("leaderboard_updated", (data: LeaderboardItem[]) => {
      setLeaderboard(data);
    });

    socket.on("quiz_finished", (payload: { leaderboard: LeaderboardItem[] }) => {
      setQuestion(null);
      setLeaderboard(payload.leaderboard);
      setMessage("Квиз завершён");
    });

    socket.on("error_message", (error: string) => {
      setMessage(error);
    });

    return () => {
      socket.off("room_joined");
      socket.off("question_started");
      socket.off("answer_result");
      socket.off("leaderboard_updated");
      socket.off("quiz_finished");
      socket.off("error_message");
    };
  }, [roomCode, nickname]);

  function toggleOption(optionId: string) {
    if (!question) return;

    if (question.type === "SINGLE_CHOICE") {
      setSelectedOptions([optionId]);
      return;
    }

    setSelectedOptions((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    );
  }

  function submitAnswer() {
    if (!question || !participantId || selectedOptions.length === 0) {
      return;
    }

    socket.emit("submit_answer", {
      roomCode,
      participantId,
      questionId: question.id,
      selectedOptionIds: selectedOptions
    });
  }

  return (
    <section className="grid">
      <div className="card">
        <p className="badge">{quizTitle || "Квиз"}</p>
        <h2>{message}</h2>

        {question ? (
          <>
            <h3>{question.text}</h3>

            <div className="options">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  className={selectedOptions.includes(option.id) ? "option selected" : "option"}
                  onClick={() => toggleOption(option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>

            <button className="primary" onClick={submitAnswer}>
              Ответить
            </button>
          </>
        ) : (
          <p className="muted">Когда организатор запустит вопрос, он появится здесь.</p>
        )}
      </div>

      <div className="card">
        <h2>Лидерборд</h2>
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
