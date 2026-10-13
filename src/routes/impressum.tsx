import { createFileRoute } from "@tanstack/react-router";
import Impressum from "@/pages/Impressum";

export const Route = createFileRoute("/impressum")({
  component: Impressum,
});
