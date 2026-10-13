import { createFileRoute } from "@tanstack/react-router";
import ServicesCalendar from "@/pages/dashboard/ServicesCalendar";

export const Route = createFileRoute("/dashboard/services")({
  component: ServicesCalendar,
});
