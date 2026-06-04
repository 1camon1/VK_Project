import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { authRouter } from "./routes/auth.routes.js";
import { quizRouter } from "./routes/quiz.routes.js";
import { roomRouter } from "./routes/room.routes.js";
import { registerQuizSocket } from "./sockets/quiz.socket.js";

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "VK Quiz MVP API is running"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/rooms", roomRouter);

registerQuizSocket(io);

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
