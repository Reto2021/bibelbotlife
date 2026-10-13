import { createFileRoute } from "@tanstack/react-router";
import ForCelebrants from "@/pages/ForCelebrants";

export const Route = createFileRoute("/fuer-seelsorger")({
  component: ForCelebrants,
});
