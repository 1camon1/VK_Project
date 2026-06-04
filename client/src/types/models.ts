export type UserRole = "ORGANIZER" | "PARTICIPANT";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AnswerOption = {
  id: string;
  text: string;
  isCorrect?: boolean;
};

export type Question = {
  id: string;
  text: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  timeLimit: number;
  points: number;
  options: AnswerOption[];
};

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  timePerQuestion: number;
  questions: Question[];
};

export type LeaderboardItem = {
  id: string;
  nickname: string;
  score: number;
};
