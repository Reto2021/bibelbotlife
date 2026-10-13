import { createFileRoute } from "@tanstack/react-router";
import GuideAIBibleStudy from "@/pages/GuideAIBibleStudy";

export const Route = createFileRoute("/guide/ai-bible-study")({
  component: GuideAIBibleStudy,
});
