import { createFileRoute } from "@tanstack/react-router";
import ForChurches from "@/pages/ForChurches";

export const Route = createFileRoute("/for-churches")({
  component: ForChurches,
});
