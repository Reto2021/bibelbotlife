import { createFileRoute } from "@tanstack/react-router";
import NewsletterAdmin from "@/pages/admin/NewsletterAdmin";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/newsletter")({
  component: () => (
    <ProtectedAdminRoute><NewsletterAdmin /></ProtectedAdminRoute>
  ),
});
