import { createFileRoute } from "@tanstack/react-router";
import Datenschutz from "@/pages/Datenschutz";

export const Route = createFileRoute("/datenschutz")({
  component: Datenschutz,
});
