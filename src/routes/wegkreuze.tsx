import { createFileRoute } from "@tanstack/react-router";
import CrossLandingPage from "@/pages/CrossLandingPage";

export const Route = createFileRoute("/wegkreuze")({
  component: () => <CrossLandingPage type="wegkreuze" />,
});
