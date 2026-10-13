import { createFileRoute } from "@tanstack/react-router";
import BibleQuiz from "@/pages/BibleQuiz";

export const Route = createFileRoute("/bibelquiz")({
  component: BibleQuiz,
});
