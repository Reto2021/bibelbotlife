import { createFileRoute } from "@tanstack/react-router";
import SeoAdmin from "@/pages/admin/SeoAdmin";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/seo")({
  component: () => (
    <ProtectedAdminRoute><SeoAdmin /></ProtectedAdminRoute>
  ),
});
