import { createFileRoute } from "@tanstack/react-router";
import ConfirmationWriter from "@/pages/mein-bereich/ConfirmationWriter";

export const Route = createFileRoute("/mein-bereich/konfirmation")({
  component: ConfirmationWriter,
});
