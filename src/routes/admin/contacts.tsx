import { createFileRoute } from "@tanstack/react-router";
import ContactsAdmin from "@/pages/admin/ContactsAdmin";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/contacts")({
  component: () => (
    <ProtectedAdminRoute><ContactsAdmin /></ProtectedAdminRoute>
  ),
});
