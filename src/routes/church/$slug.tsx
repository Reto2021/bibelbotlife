import { createFileRoute } from "@tanstack/react-router";
import ChurchPartner from "@/pages/ChurchPartner";

export const Route = createFileRoute("/church/$slug")({
  component: ChurchPartner,
});
