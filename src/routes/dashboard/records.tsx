import { createFileRoute } from "@tanstack/react-router";
import RecordsPage from "@/pages/dashboard/RecordsPage";

export const Route = createFileRoute("/dashboard/records")({
  component: RecordsPage,
});
