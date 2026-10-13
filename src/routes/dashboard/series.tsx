import { createFileRoute } from "@tanstack/react-router";
import SeriesPage from "@/pages/dashboard/SeriesPage";

export const Route = createFileRoute("/dashboard/series")({
  component: SeriesPage,
});
