import { createFileRoute } from "@tanstack/react-router";
import Spenden from "@/pages/Spenden";

export const Route = createFileRoute("/spenden/")({
  component: Spenden,
});
