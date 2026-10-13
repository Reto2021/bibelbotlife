import { createFileRoute } from "@tanstack/react-router";
import VerseCardShare from "@/pages/VerseCardShare";

export const Route = createFileRoute("/v/$id")({
  component: VerseCardShare,
});
