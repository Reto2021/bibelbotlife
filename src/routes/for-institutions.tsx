import { createFileRoute } from "@tanstack/react-router";
import ForInstitutions from "@/pages/ForInstitutions";

export const Route = createFileRoute("/for-institutions")({
  component: ForInstitutions,
});
