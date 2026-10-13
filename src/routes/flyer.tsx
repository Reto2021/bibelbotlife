import { createFileRoute } from "@tanstack/react-router";
import Flyer from "@/pages/Flyer";

export const Route = createFileRoute("/flyer")({
  component: Flyer,
});
