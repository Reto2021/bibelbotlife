import { createFileRoute } from "@tanstack/react-router";
import FeedbackAdmin from "@/pages/admin/FeedbackAdmin";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/feedback")({
  component: () => (
    <ProtectedAdminRoute><FeedbackAdmin /></ProtectedAdminRoute>
  ),
});
