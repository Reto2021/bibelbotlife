import { createFileRoute } from "@tanstack/react-router";
import InvoicesPage from "@/pages/dashboard/InvoicesPage";

export const Route = createFileRoute("/dashboard/invoices")({
  component: InvoicesPage,
});
