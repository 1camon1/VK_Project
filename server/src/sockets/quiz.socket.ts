import { Server, Socket } from "socket.io";
import { prisma } from "../config/prisma.js";

type JoinRoomPayload = {
  roomCode: string;
  nickname: string;
  userId?: string;
};

type SubmitAnswerPayload = {
  roomCode: string;
  participantId: string;
  questionId: string;
  selectedOptionIds: string[];
};

async function getLeaderboard(roomCode: string) {
  const room = await prisma.room.findUnique({
    where: { code: roomCode },
    include: {
      participants: {
        orderBy: { score: "desc" }
      }
    }
  });

  return room?.participants || [];
}

export function registerQuizSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join_room", async (payload: JoinRoomPayload) => {
      try {
        const room = await prisma.room.findUnique({
          where: { code: payload.roomCode },
          include: { quiz: true }
        });

        if (!room) {
          socket.emit("error_message", "Комната не найдена");
          return;
        }

        if (room.status === "FINISHED") {
          socket.emit("error_message", "Квиз уже завершён");
          return;
        }

        const participant = await prisma.roomParticipant.create({
          data: {
            roomId: room.id,
            nickname: payload.nickname || "Участник",
            userId: payload.userId || null
          }
        });

        socket.join(payload.roomCode);

        socket.emit("room_joined", {
          roomCode: payload.roomCode,
          participantId: participant.id,
          quizTitle: room.quiz.title
        });

        io.to(payload.roomCode).emit("participant_joined", {
          nickname: participant.nickname
        });

        io.to(payload.roomCode).emit("leaderboard_updated", await getLeaderboard(payload.roomCode));
      } catch (error) {
        console.error(error);
        socket.emit("error_message", "Ошибка подключения к комнате");
      }
    });

    socket.on("host_join_room", async ({ roomCode }) => {
      socket.join(roomCode);
      socket.emit("host_room_joined", { roomCode });
    });

    socket.on("start_quiz", async ({ roomCode }) => {
      const room = await prisma.room.update({
        where: { code: roomCode },
        data: {
          status: "ACTIVE",
          startedAt: new Date(),
          currentQuestionIndex: 0
        },
        include: {
          quiz: {
            include: {
              questions: {
                include: { options: true },
                orderBy: { order: "asc" }
              }
            }
          }
        }
      });

      const question = room.quiz.questions[0];

      if (!question) {
        io.to(roomCode).emit("error_message", "В квизе нет вопросов");
        return;
      }

      io.to(roomCode).emit("question_started", {
        index: 0,
        total: room.quiz.questions.length,
        question: {
          id: question.id,
          text: question.text,
          type: question.type,
          timeLimit: question.timeLimit,
          points: question.points,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text
          }))
        }
      });
    });

    socket.on("next_question", async ({ roomCode }) => {
      const room = await prisma.room.findUnique({
        where: { code: roomCode },
        include: {
          quiz: {
            include: {
              questions: {
                include: { options: true },
                orderBy: { order: "asc" }
              }
            }
          }
        }
      });

      if (!room) {
        socket.emit("error_message", "Комната не найдена");
        return;
      }

      const nextIndex = room.currentQuestionIndex + 1;

      if (nextIndex >= room.quiz.questions.length) {
        await prisma.room.update({
          where: { code: roomCode },
          data: {
            status: "FINISHED",
            finishedAt: new Date()
          }
        });

        io.to(roomCode).emit("quiz_finished", {
          leaderboard: await getLeaderboard(roomCode)
        });

        return;
      }

      const updatedRoom = await prisma.room.update({
        where: { code: roomCode },
        data: { currentQuestionIndex: nextIndex }
      });

      const question = room.quiz.questions[updatedRoom.currentQuestionIndex];

      io.to(roomCode).emit("question_started", {
        index: updatedRoom.currentQuestionIndex,
        total: room.quiz.questions.length,
        question: {
          id: question.id,
          text: question.text,
          type: question.type,
          timeLimit: question.timeLimit,
          points: question.points,
          options: question.options.map((option) => ({
            id: option.id,
            text: option.text
          }))
        }
      });
    });

    socket.on("submit_answer", async (payload: SubmitAnswerPayload) => {
      try {
        const question = await prisma.question.findUnique({
          where: { id: payload.questionId },
          include: { options: true }
        });

        if (!question) {
          socket.emit("error_message", "Вопрос не найден");
          return;
        }

        const correctIds = question.options
          .filter((option) => option.isCorrect)
          .map((option) => option.id)
          .sort();

        const selectedIds = [...payload.selectedOptionIds].sort();

        const isCorrect =
          correctIds.length === selectedIds.length &&
          correctIds.every((id, index) => id === selectedIds[index]);

        const earnedPoints = isCorrect ? question.points : 0;

        await prisma.participantAnswer.upsert({
          where: {
            participantId_questionId: {
              participantId: payload.participantId,
              questionId: payload.questionId
            }
          },
          update: {
            selectedOptionIds: JSON.stringify(payload.selectedOptionIds),
            isCorrect,
            earnedPoints
          },
          create: {
            participantId: payload.participantId,
            questionId: payload.questionId,
            selectedOptionIds: JSON.stringify(payload.selectedOptionIds),
            isCorrect,
            earnedPoints
          }
        });

        if (earnedPoints > 0) {
          await prisma.roomParticipant.update({
            where: { id: payload.participantId },
            data: {
              score: {
                increment: earnedPoints
              }
            }
          });
        }

        socket.emit("answer_result", {
          isCorrect,
          earnedPoints
        });

        io.to(payload.roomCode).emit("leaderboard_updated", await getLeaderboard(payload.roomCode));
      } catch (error) {
        console.error(error);
        socket.emit("error_message", "Ошибка при отправке ответа");
      }
    });

    socket.on("finish_quiz", async ({ roomCode }) => {
      await prisma.room.update({
        where: { code: roomCode },
        data: {
          status: "FINISHED",
          finishedAt: new Date()
        }
      });

      io.to(roomCode).emit("quiz_finished", {
        leaderboard: await getLeaderboard(roomCode)
      });
    });
  });
}
