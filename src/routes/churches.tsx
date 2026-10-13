import { createFileRoute } from "@tanstack/react-router";
import ChurchDirectory from "@/pages/ChurchDirectory";

export const Route = createFileRoute("/churches")({
  component: ChurchDirectory,
});
