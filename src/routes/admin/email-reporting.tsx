import { createFileRoute } from "@tanstack/react-router";
import EmailReporting from "@/pages/admin/EmailReporting";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/email-reporting")({
  component: () => (
    <ProtectedAdminRoute><EmailReporting /></ProtectedAdminRoute>
  ),
});
