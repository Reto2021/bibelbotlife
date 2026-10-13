import { createFileRoute } from "@tanstack/react-router";
import SplashPage from "@/pages/SplashPage";

export const Route = createFileRoute("/splash/$churchSlug")({
  component: SplashPage,
});
