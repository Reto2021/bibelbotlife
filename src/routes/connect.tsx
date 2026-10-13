import { createFileRoute } from "@tanstack/react-router";
import ConnectChatGPT from "@/pages/ConnectChatGPT";

export const Route = createFileRoute("/connect")({
  component: ConnectChatGPT,
});
