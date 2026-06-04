import { FormEvent, useEffect, useState } from "react";
import { apiRequest } from "../api/client";
import { Quiz } from "../types/models";

type Props = {
  onOpenHost: (roomCode: string) => void;
};

export function DashboardPage({ onOpenHost }: Props) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [title, setTitle] = useState("Мой первый квиз");
  const [description, setDescription] = useState("Описание квиза");
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [questionText, setQuestionText] = useState("Какой инструмент нужен для real-time взаимодействия?");
  const [optionA, setOptionA] = useState("Socket.IO");
  const [optionB, setOptionB] = useState("Paint");
  const [error, setError] = useState("");

  async function loadQuizzes() {
    const data = await apiRequest<Quiz[]>("/api/quizzes");
    setQuizzes(data);
    if (data[0]) {
      setSelectedQuizId(data[0].id);
    }
  }

  useEffect(() => {
    loadQuizzes().catch(() => setError("Не удалось загрузить квизы"));
  }, []);

  async function createQuiz(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      await apiRequest("/api/quizzes", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          category: "Общее",
          timePerQuestion: 20
        })
      });

      await loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания квиза");
    }
  }

  async function addQuestion(event: FormEvent) {
    event.preventDefault();

    if (!selectedQuizId) {
      setError("Сначала выберите квиз");
      return;
    }

    try {
      await apiRequest(`/api/quizzes/${selectedQuizId}/questions`, {
        method: "POST",
        body: JSON.stringify({
          text: questionText,
          type: "SINGLE_CHOICE",
          timeLimit: 20,
          points: 100,
          options: [
            { text: optionA, isCorrect: true },
            { text: optionB, isCorrect: false }
          ]
        })
      });

      await loadQuizzes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка добавления вопроса");
    }
  }

  async function startRoom(quizId: string) {
    const room = await apiRequest<{ code: string }>(`/api/rooms/quizzes/${quizId}/start`, {
      method: "POST"
    });

    onOpenHost(room.code);
  }

  return (
    <section className="grid">
      <div className="card">
        <h2>Создать квиз</h2>
        <form onSubmit={createQuiz} className="form">
          <label>Название</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />

          <label>Описание</label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />

          <button className="primary">Создать</button>
        </form>

        {error && <p className="error">{error}</p>}
      </div>

      <div className="card">
        <h2>Добавить вопрос</h2>
        <form onSubmit={addQuestion} className="form">
          <label>Квиз</label>
          <select value={selectedQuizId} onChange={(event) => setSelectedQuizId(event.target.value)}>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>

          <label>Текст вопроса</label>
          <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} />

          <label>Правильный вариант</label>
          <input value={optionA} onChange={(event) => setOptionA(event.target.value)} />

          <label>Неправильный вариант</label>
          <input value={optionB} onChange={(event) => setOptionB(event.target.value)} />

          <button className="primary">Добавить вопрос</button>
        </form>
      </div>

      <div className="card wide">
        <h2>Мои квизы</h2>

        {quizzes.length === 0 && <p className="muted">Пока нет квизов</p>}

        <div className="quiz-list">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-item">
              <div>
                <h3>{quiz.title}</h3>
                <p className="muted">{quiz.description}</p>
                <p>Вопросов: {quiz.questions.length}</p>
              </div>
              <button className="primary" onClick={() => startRoom(quiz.id)}>
                Запустить
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
