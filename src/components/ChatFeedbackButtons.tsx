import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Props = {
  conversationId: string | null;
  messageContent: string;
  /** Index of the assistant message in the local array — used to dedupe per render. */
  messageIndex: number;
};

/**
 * Feedback buttons (👍 / 👎) shown under each assistant message.
 * Looks up the matching DB row by content + conversation_id (latest assistant message wins on ties).
 * Only rendered for authenticated users; anonymous chats have no DB rows to attach feedback to.
 */
export function ChatFeedbackButtons({ conversationId, messageContent, messageIndex }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState<-1 | 1 | null>(null);
  const [loading, setLoading] = useState<-1 | 1 | null>(null);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);

  // Resolve the DB message id for this assistant message
  useEffect(() => {
    let cancelled = false;
    if (!user || !conversationId || !messageContent) return;

    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, content")
        .eq("conversation_id", conversationId)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(20);

      if (cancelled || !data) return;
      // Find an exact match — fall back to startsWith for streaming-truncation differences
      const exact = data.find((m) => m.content === messageContent);
      const partial =
        exact ??
        data.find((m) => m.content.startsWith(messageContent.slice(0, 200)));
      if (partial) {
        setMessageId(partial.id);
        // Fetch existing feedback if any
        const { data: fb } = await supabase
          .from("chat_feedback")
          .select("rating")
          .eq("message_id", partial.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && fb) setRating(fb.rating as -1 | 1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, conversationId, messageContent, messageIndex]);

  if (!user || !conversationId) return null;

  const submit = async (newRating: -1 | 1, withComment?: string) => {
    if (!messageId) {
      toast({
        title: t("feedback.notReady", "Feedback noch nicht bereit"),
        description: t("feedback.notReadyDesc", "Bitte einen Moment warten, bis die Nachricht gespeichert ist."),
      });
      return;
    }
    setLoading(newRating);
    const { error } = await supabase.from("chat_feedback").upsert(
      {
        message_id: messageId,
        conversation_id: conversationId,
        user_id: user.id,
        rating: newRating,
        comment: withComment ?? null,
      },
      { onConflict: "message_id,user_id" }
    );
    setLoading(null);
    if (error) {
      toast({
        title: t("feedback.error", "Fehler"),
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setRating(newRating);
    if (newRating === 1) {
      toast({ title: t("feedback.thanks", "Danke für dein Feedback!") });
    } else {
      setShowCommentBox(true);
    }
  };

  const submitComment = async () => {
    if (!comment.trim()) {
      setShowCommentBox(false);
      return;
    }
    await submit(-1, comment.trim());
    setShowCommentBox(false);
    setComment("");
    toast({ title: t("feedback.thanksDetail", "Danke! Wir schauen uns das an.") });
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        <button
          onClick={() => submit(1)}
          disabled={loading !== null}
          aria-label={t("feedback.helpful", "Hilfreich")}
          title={t("feedback.helpful", "Hilfreich")}
          className={`flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
            rating === 1
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          {loading === 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsUp className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => submit(-1)}
          disabled={loading !== null}
          aria-label={t("feedback.notHelpful", "Nicht hilfreich")}
          title={t("feedback.notHelpful", "Nicht hilfreich")}
          className={`flex items-center justify-center h-7 w-7 rounded-md transition-colors ${
            rating === -1
              ? "bg-destructive/15 text-destructive"
              : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          }`}
        >
          {loading === -1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ThumbsDown className="h-3.5 w-3.5" />}
        </button>
      </div>
      {showCommentBox && (
        <div className="flex items-center gap-1.5 mt-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitComment();
            }}
            placeholder={t("feedback.placeholder", "Was war nicht passend? (optional)")}
            className="flex-1 text-xs px-2 py-1.5 rounded-md bg-background border border-input focus:outline-none focus:ring-1 focus:ring-primary"
            maxLength={500}
            autoFocus
          />
          <button
            onClick={submitComment}
            className="text-xs px-2 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t("feedback.send", "Senden")}
          </button>
        </div>
      )}
    </div>
  );
}
