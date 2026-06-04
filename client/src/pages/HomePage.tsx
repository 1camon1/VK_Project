type Props = {
  onNavigate: (page: string) => void;
};

export function HomePage({ onNavigate }: Props) {
  return (
    <section className="hero">
      <div>
        <p className="badge">Интерактивные квизы в реальном времени</p>
        <h1>Платформа для live-опросов и викторин на мероприятиях</h1>
        <p className="muted">
          Организатор создаёт квиз и запускает комнату, участники подключаются по коду и отвечают на вопросы одновременно.
        </p>

        <div className="actions">
          <button className="primary" onClick={() => onNavigate("register")}>
            Начать
          </button>
          <button onClick={() => onNavigate("join")}>
            Ввести код комнаты
          </button>
        </div>
      </div>

      <div className="card preview-card">
        <h3>Как это работает</h3>
        <ol>
          <li>Создайте квиз</li>
          <li>Запустите комнату</li>
          <li>Участники вводят код</li>
          <li>Все видят вопросы в реальном времени</li>
          <li>В конце появляется лидерборд</li>
        </ol>
      </div>
    </section>
  );
}
