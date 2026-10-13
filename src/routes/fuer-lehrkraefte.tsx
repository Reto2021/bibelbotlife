import { createFileRoute } from "@tanstack/react-router";
import ForTeachers from "@/pages/ForTeachers";

export const Route = createFileRoute("/fuer-lehrkraefte")({
  component: ForTeachers,
});
