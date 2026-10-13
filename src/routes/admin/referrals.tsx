import { createFileRoute } from "@tanstack/react-router";
import ReferralAdmin from "@/pages/admin/ReferralAdmin";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/referrals")({
  component: () => (
    <ProtectedAdminRoute><ReferralAdmin /></ProtectedAdminRoute>
  ),
});
