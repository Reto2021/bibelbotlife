import { createFileRoute } from "@tanstack/react-router";
import ReferralPartner from "@/pages/ReferralPartner";

export const Route = createFileRoute("/partner/$code")({
  component: ReferralPartner,
});
