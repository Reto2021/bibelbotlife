import { createFileRoute } from "@tanstack/react-router";
import LessonsPage from "@/pages/dashboard/LessonsPage";

export const Route = createFileRoute("/dashboard/lessons")({
  component: LessonsPage,
});
