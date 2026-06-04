import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { generateRoomCode } from "../utils/generateRoomCode.js";

export const roomRouter = Router();

roomRouter.post("/quizzes/:quizId/start", authMiddleware, async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.quizId },
    include: { questions: true }
  });

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  if (quiz.questions.length === 0) {
    return res.status(400).json({ message: "Quiz should contain at least one question" });
  }

  let code = generateRoomCode();
  let existingRoom = await prisma.room.findUnique({ where: { code } });

  while (existingRoom) {
    code = generateRoomCode();
    existingRoom = await prisma.room.findUnique({ where: { code } });
  }

  const room = await prisma.room.create({
    data: {
      quizId: quiz.id,
      code,
      status: "WAITING"
    },
    include: {
      quiz: true
    }
  });

  return res.status(201).json(room);
});

roomRouter.get("/:code", async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { code: req.params.code },
    include: {
      quiz: {
        include: {
          questions: {
            include: { options: true },
            orderBy: { order: "asc" }
          }
        }
      },
      participants: {
        orderBy: { score: "desc" }
      }
    }
  });

  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  return res.json(room);
});
