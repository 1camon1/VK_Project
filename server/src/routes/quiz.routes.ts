import { Router } from "express";
import { QuestionType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware.js";

export const quizRouter = Router();

quizRouter.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const quizzes = await prisma.quiz.findMany({
    where: { createdById: req.user!.userId },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json(quizzes);
});

quizRouter.get("/:id", authMiddleware, async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.id },
    include: {
      questions: {
        include: { options: true },
        orderBy: { order: "asc" }
      }
    }
  });

  if (!quiz) {
    return res.status(404).json({ message: "Quiz not found" });
  }

  return res.json(quiz);
});

quizRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  const { title, description, category, timePerQuestion } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  const quiz = await prisma.quiz.create({
    data: {
      title,
      description,
      category,
      timePerQuestion: Number(timePerQuestion) || 20,
      createdById: req.user!.userId
    }
  });

  return res.status(201).json(quiz);
});

quizRouter.post("/:quizId/questions", authMiddleware, async (req, res) => {
  const { text, type, timeLimit, points, options } = req.body;
  const { quizId } = req.params;

  if (!text || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: "Question text and at least 2 options are required" });
  }

  const currentQuestionsCount = await prisma.question.count({
    where: { quizId }
  });

  const question = await prisma.question.create({
    data: {
      quizId,
      text,
      type: type === "MULTIPLE_CHOICE" ? QuestionType.MULTIPLE_CHOICE : QuestionType.SINGLE_CHOICE,
      timeLimit: Number(timeLimit) || 20,
      points: Number(points) || 100,
      order: currentQuestionsCount + 1,
      options: {
        create: options.map((option: { text: string; isCorrect: boolean }) => ({
          text: option.text,
          isCorrect: Boolean(option.isCorrect)
        }))
      }
    },
    include: {
      options: true
    }
  });

  return res.status(201).json(question);
});

quizRouter.delete("/:id", authMiddleware, async (req, res) => {
  await prisma.quiz.delete({
    where: { id: req.params.id }
  });

  return res.json({ message: "Quiz deleted" });
});
