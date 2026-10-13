import { createFileRoute } from "@tanstack/react-router";
import CrossLandingPage from "@/pages/CrossLandingPage";

export const Route = createFileRoute("/gipfelkreuze")({
  component: () => <CrossLandingPage type="gipfelkreuze" />,
});
