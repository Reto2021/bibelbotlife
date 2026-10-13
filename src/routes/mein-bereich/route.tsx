import { createFileRoute } from "@tanstack/react-router";
import MeinBereich from "@/pages/MeinBereich";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/mein-bereich")({
  component: () => (
    <ProtectedRoute><MeinBereich /></ProtectedRoute>
  ),
});
