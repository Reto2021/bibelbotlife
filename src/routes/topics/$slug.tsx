import { createFileRoute } from "@tanstack/react-router";
import TopicPage from "@/pages/TopicPage";

export const Route = createFileRoute("/topics/$slug")({
  component: TopicPage,
});
