import { createFileRoute } from "@tanstack/react-router";
import Kreuzwege from "@/pages/Kreuzwege";

export const Route = createFileRoute("/kreuzwege/")({
  component: Kreuzwege,
});
