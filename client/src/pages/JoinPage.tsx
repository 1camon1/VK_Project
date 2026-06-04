import { FormEvent, useState } from "react";

type Props = {
  onJoin: (roomCode: string, nickname: string) => void;
};

export function JoinPage({ onJoin }: Props) {
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("Участник");

  function submit(event: FormEvent) {
    event.preventDefault();
    onJoin(roomCode.trim(), nickname.trim());
  }

  return (
    <section className="narrow">
      <div className="card">
        <h2>Подключиться к квизу</h2>
        <form onSubmit={submit} className="form">
          <label>Код комнаты</label>
          <input
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value)}
            placeholder="Например: 482193"
          />

          <label>Никнейм</label>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />

          <button className="primary">Войти в комнату</button>
        </form>
      </div>
    </section>
  );
}
