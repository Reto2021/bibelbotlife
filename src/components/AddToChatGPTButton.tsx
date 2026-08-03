import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bot, Check, Copy, ExternalLink } from "lucide-react";

const MCP_PATH = "/functions/v1/mcp";
const CHATGPT_URL = "https://chatgpt.com";

export function getMcpUrl(): string {
  const base = import.meta.env.VITE_SUPABASE_URL ?? window.location.origin;
  return `${base.replace(/\/$/, "")}${MCP_PATH}`;
}

export function getConfigTomlSnippet(name = "biblebotlife"): string {
  return `[mcp_servers.${name}]\nurl = "${getMcpUrl()}"\nauth = "oauth"`;
}

type AddToChatGPTButtonProps = {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
  onCopy?: () => void;
};

export function AddToChatGPTButton({
  variant = "default",
  size = "default",
  className,
  showLabel = true,
  onCopy,
}: AddToChatGPTButtonProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const mcpUrl = getMcpUrl();
    const toml = getConfigTomlSnippet();

    try {
      await navigator.clipboard.writeText(`${mcpUrl}\n\n${toml}`);
      setCopied(true);
      toast({
        title: "Für ChatGPT kopiert",
        description: "URL und config.toml-Eintrag liegen in der Zwischenablage. Öffne ChatGPT und füge den Server ein.",
      });
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch {
      toast({
        title: "Kopieren nicht möglich",
        description: "Bitte markiere die URL manuell.",
        variant: "destructive",
      });
      return;
    }

    // Open ChatGPT so the user can paste the URL immediately.
    setTimeout(() => {
      window.open(CHATGPT_URL, "_blank", "noopener,noreferrer");
    }, 300);
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleClick}>
      {copied ? <Check className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      {showLabel && <span className="ml-2">{copied ? "Kopiert" : "Add to ChatGPT"}</span>}
      {!showLabel && copied && <span className="sr-only">Kopiert</span>}
      {!showLabel && !copied && <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-70" />}
    </Button>
  );
}

export function CopyMcpUrlButton({ className }: { className?: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getMcpUrl());
      setCopied(true);
      toast({ title: "URL kopiert", description: "Füge sie in deinem MCP-Client ein." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kopieren nicht möglich", description: "Bitte markiere die URL manuell.", variant: "destructive" });
    }
  };

  return (
    <Button variant="outline" size="sm" className={className} onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="ml-2">{copied ? "Kopiert" : "URL kopieren"}</span>
    </Button>
  );
}
