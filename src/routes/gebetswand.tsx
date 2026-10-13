import { createFileRoute } from "@tanstack/react-router";
import PrayerWall from "@/pages/PrayerWall";

export const Route = createFileRoute("/gebetswand")({
  component: PrayerWall,
});
