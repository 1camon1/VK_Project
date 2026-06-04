import bcrypt from "bcryptjs";
import { PrismaClient, QuestionType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.participantAnswer.deleteMany();
  await prisma.roomParticipant.deleteMany();
  await prisma.room.deleteMany();
  await prisma.answerOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  const organizer = await prisma.user.create({
    data: {
      name: "Организатор",
      email: "organizer@test.com",
      passwordHash,
      role: UserRole.ORGANIZER
    }
  });

  await prisma.user.create({
    data: {
      name: "Участник",
      email: "participant@test.com",
      passwordHash,
      role: UserRole.PARTICIPANT
    }
  });

  const quiz = await prisma.quiz.create({
    data: {
      title: "Тестовый квиз VK",
      description: "Демонстрационный квиз для проверки работы MVP",
      category: "IT",
      timePerQuestion: 20,
      createdById: organizer.id
    }
  });

  const q1 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: "Что используется для обмена событиями в реальном времени?",
      type: QuestionType.SINGLE_CHOICE,
      order: 1,
      points: 100,
      timeLimit: 20
    }
  });

  await prisma.answerOption.createMany({
    data: [
      { questionId: q1.id, text: "Socket.IO", isCorrect: true },
      { questionId: q1.id, text: "HTML", isCorrect: false },
      { questionId: q1.id, text: "CSS", isCorrect: false },
      { questionId: q1.id, text: "SQLite", isCorrect: false }
    ]
  });

  const q2 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      text: "Какие технологии относятся к frontend-разработке?",
      type: QuestionType.MULTIPLE_CHOICE,
      order: 2,
      points: 100,
      timeLimit: 25
    }
  });

  await prisma.answerOption.createMany({
    data: [
      { questionId: q2.id, text: "React", isCorrect: true },
      { questionId: q2.id, text: "CSS", isCorrect: true },
      { questionId: q2.id, text: "Express", isCorrect: false },
      { questionId: q2.id, text: "Node.js", isCorrect: false }
    ]
  });

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
