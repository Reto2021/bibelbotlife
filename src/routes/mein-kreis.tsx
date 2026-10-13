import { createFileRoute } from "@tanstack/react-router";
import KreisPage from "@/pages/KreisPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/mein-kreis")({
  component: () => (
    <ProtectedRoute><KreisPage /></ProtectedRoute>
  ),
});
