import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type Props = {
  /** Question that was asked (last user message) */
  questionText: string;
  /** Assistant answer being rated */
  answerText: string;
  language: string;
};

const SESSION_KEY = "bibelbot-session-id";
function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

/**
 * Compact 👍 / 👎 buttons under each assistant message.
 * Works for both authenticated and anonymous users.
 * Negative ratings open a comment box for context.
 */
export function ChatFeedbackButtons({ questionText, answerText, language }: Props) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState<-1 | 1 | null>(null);
  const [loading, setLoading] = useState<-1 | 1 | null>(null);
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  // Reset rating when the answer changes
  useEffect(() => {
    setRating(null);
    setFeedbackId(null);
    setShowCommentBox(false);
    setComment("");
  }, [answerText]);

  const submit = async (newRating: -1 | 1, withComment?: string) => {
    setLoading(newRating);
    const payload = {
      rating: newRating,
      comment: withComment ?? null,
      question_text: questionText.slice(0, 2000),
      answer_text: answerText.slice(0, 4000),
      language,
      user_id: user?.id ?? null,
      session_id: user ? null : getSessionId(),
    };

    let result;
    if (feedbackId) {
      result = await supabase.from("chat_feedback").update(payload).eq("id", feedbackId);
    } else {
      result = await supabase.from("chat_feedback").insert(payload).select("id").single();
      if (!result.error && result.data) setFeedbackId(result.data.id);
    }

    setLoading(null);
    if (result.error) {
      toast({
        title: t("feedback.error", "Fehler"),
        description: result.error.message,
        variant: "destructive",
      });
      return;
    }
    setRating(newRating);
    if (newRating === 1) {
      toast({ title: t("feedback.thanks", "Danke für dein Feedback!") });
    } else if (!withComment) {
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
