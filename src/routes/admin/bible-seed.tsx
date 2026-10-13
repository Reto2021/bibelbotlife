import { createFileRoute } from "@tanstack/react-router";
import BibleSeedStatus from "@/pages/admin/BibleSeedStatus";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/bible-seed")({
  component: () => (
    <ProtectedAdminRoute><BibleSeedStatus /></ProtectedAdminRoute>
  ),
});
