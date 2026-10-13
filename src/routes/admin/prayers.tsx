import { createFileRoute } from "@tanstack/react-router";
import PrayerModeration from "@/pages/admin/PrayerModeration";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";

export const Route = createFileRoute("/admin/prayers")({
  component: () => (
    <ProtectedAdminRoute><PrayerModeration /></ProtectedAdminRoute>
  ),
});
