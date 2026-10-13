import { createFileRoute } from "@tanstack/react-router";
import CrossModeration from "@/pages/admin/CrossModeration";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/kreuzwege")({
  component: () => (
    <ProtectedAdminRoute><CrossModeration /></ProtectedAdminRoute>
  ),
});
