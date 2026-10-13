import { createFileRoute } from "@tanstack/react-router";
import Spenden from "@/pages/Spenden";

export const Route = createFileRoute("/spenden/danke")({
  component: Spenden,
});
