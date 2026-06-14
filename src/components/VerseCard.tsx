import { forwardRef } from "react";

interface VerseCardProps {
  verseText: string;
  verseRef: string;
  explanation?: string;
  qrUrl?: string;
  // 1080x1920 for stories, 1080x1080 for square
  format?: "story" | "square";
}

/**
 * Visuelle Vers-Karte im Golden-Hour-Stil.
 * Wird via html-to-image als PNG exportiert (Story 1080×1920).
 */
export const VerseCard = forwardRef<HTMLDivElement, VerseCardProps>(
  ({ verseText, verseRef, explanation, qrUrl, format = "story" }, ref) => {
    const isStory = format === "story";
    return (
      <div
        ref={ref}
        style={{
          width: isStory ? 1080 : 1080,
          height: isStory ? 1920 : 1080,
          position: "relative",
          background:
            "linear-gradient(160deg, #F4E4C1 0%, #E8C896 35%, #C8883A 75%, #8B5A1F 100%)",
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: "#2A1810",
          overflow: "hidden",
          padding: isStory ? "140px 90px" : "100px 80px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Subtile Lichtkreise */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,236,200,0.5) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,220,160,0.4) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Header */}
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(42,24,16,0.7)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            zIndex: 1,
          }}
        >
          Dein Vers
        </div>

        {/* Vers */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", zIndex: 1 }}>
          <div
            style={{
              fontSize: verseText.length > 200 ? 56 : verseText.length > 120 ? 68 : 80,
              lineHeight: 1.35,
              fontStyle: "italic",
              color: "#2A1810",
              marginBottom: 60,
            }}
          >
            «{verseText}»
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#6B3410",
              letterSpacing: "0.02em",
            }}
          >
            {verseRef}
          </div>
          {explanation && (
            <div
              style={{
                marginTop: 60,
                fontSize: 34,
                lineHeight: 1.55,
                color: "rgba(42,24,16,0.85)",
                fontFamily: "Inter, sans-serif",
                fontStyle: "normal",
                fontWeight: 400,
              }}
            >
              {explanation}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
            marginTop: 40,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: "#2A1810",
                fontFamily: "Inter, sans-serif",
                letterSpacing: "-0.01em",
              }}
            >
              biblebot.life
            </div>
            <div
              style={{
                fontSize: 22,
                color: "rgba(42,24,16,0.65)",
                fontFamily: "Inter, sans-serif",
                marginTop: 8,
              }}
            >
              Dein persönlicher Bibel-Begleiter
            </div>
          </div>
          {qrUrl && (
            <img
              src={qrUrl}
              alt=""
              style={{
                width: 140,
                height: 140,
                borderRadius: 12,
                background: "#fff",
                padding: 8,
                boxShadow: "0 4px 20px rgba(42,24,16,0.15)",
              }}
              crossOrigin="anonymous"
            />
          )}
        </div>
      </div>
    );
  },
);

VerseCard.displayName = "VerseCard";
