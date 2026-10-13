import { createFileRoute } from "@tanstack/react-router";
import Embed from "@/pages/Embed";

export const Route = createFileRoute("/embed")({
  component: Embed,
});
