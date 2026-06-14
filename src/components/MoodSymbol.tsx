import { forwardRef } from "react";

export type MoodId = "dankbar" | "aengstlich" | "traurig" | "suchend" | "hoffnungsvoll" | "muede";

interface MoodSymbolProps {
  mood: MoodId;
  size?: number;
}

/**
 * Stilisierte, abstrakte Symbole im Golden-Hour-Stil für jede Stimmung.
 * Keine Fotos, keine Gesichter — reine, warme Geometrie.
 */
export const MoodSymbol = forwardRef<SVGSVGElement, MoodSymbolProps>(
  ({ mood, size = 120 }, ref) => {
    const s = size;
    const c = s / 2;
    const goldLight = "rgba(255, 230, 180, 0.55)";
    const goldMid = "rgba(232, 200, 150, 0.45)";
    const goldDark = "rgba(139, 90, 31, 0.35)";

    switch (mood) {
      case "dankbar":
        // Aufgehende Sonne mit warmen Strahlen
        return (
          <svg ref={ref} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={c} cy={c} r={s * 0.22} fill={goldLight} />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
              const rad = (deg * Math.PI) / 180;
              const x1 = c + Math.cos(rad) * s * 0.32;
              const y1 = c + Math.sin(rad) * s * 0.32;
              const x2 = c + Math.cos(rad) * s * 0.46;
              const y2 = c + Math.sin(rad) * s * 0.46;
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={i % 2 === 0 ? goldLight : goldMid}
                  strokeWidth={s * 0.025}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        );

      case "aengstlich":
        // Kleines Licht in der Dunkelheit — Kerzenflamme
        return (
          <svg ref={ref} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Gloriole */}
            <circle cx={c} cy={c - s * 0.05} r={s * 0.38} fill={goldMid} opacity={0.3} />
            {/* Flamme-Körper */}
            <ellipse cx={c} cy={c - s * 0.08} rx={s * 0.12} ry={s * 0.22} fill={goldLight} />
            {/* Flammen-Kern */}
            <ellipse cx={c} cy={c - s * 0.05} rx={s * 0.06} ry={s * 0.14} fill="rgba(255,245,220,0.8)" />
          </svg>
        );

      case "traurig":
        // Regentropfen die in warmes Licht übergehen
        return (
          <svg ref={ref} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((xRel, i) => (
              <ellipse
                key={i}
                cx={s * xRel}
                cy={s * (0.25 + i * 0.12)}
                rx={s * 0.04}
                ry={s * 0.06}
                fill={i < 2 ? goldDark : goldMid}
                opacity={0.5 + i * 0.1}
              />
            ))}
            {/* Licht am Horizont */}
            <ellipse cx={c} cy={s * 0.82} rx={s * 0.35} ry={s * 0.08} fill={goldLight} opacity={0.4} />
          </svg>
        );

      case "suchend":
        // Leitstern / Kompass-Nadel
        return (
          <svg ref={ref} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Kreis */}
            <circle cx={c} cy={c} r={s * 0.32} fill="none" stroke={goldMid} strokeWidth={s * 0.02} />
            {/* Nadel */}
            <polygon
              points={`${c},${s * 0.18} ${c - s * 0.08},${c + s * 0.1} ${c + s * 0.08},${c + s * 0.1}`}
              fill={goldLight}
            />
            <polygon
              points={`${c},${s * 0.82} ${c - s * 0.06},${c - s * 0.08} ${c + s * 0.06},${c - s * 0.08}`}
              fill={goldDark}
            />
            {/* Zentrum */}
            <circle cx={c} cy={c} r={s * 0.04} fill={goldLight} />
          </svg>
        );

      case "hoffnungsvoll":
        // Sonnenstrahl bricht durch
        return (
          <svg ref={ref} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Strahlen von oben links */}
            <polygon points={`0,0 ${s * 0.6},0 0,${s * 0.45}`} fill={goldLight} opacity={0.25} />
            <polygon points={`0,0 ${s * 0.35},0 0,${s * 0.25}`} fill={goldLight} opacity={0.4} />
            {/* Licht-Punkt */}
            <circle cx={s * 0.18} cy={s * 0.18} r={s * 0.14} fill={goldLight} opacity={0.5} />
          </svg>
        );

      case "muede":
        // Mond über ruhigem Wasser
        return (
          <svg ref={ref} width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            {/* Mond */}
            <circle cx={c - s * 0.06} cy={c - s * 0.15} r={s * 0.2} fill={goldMid} />
            <circle cx={c + s * 0.02} cy={c - s * 0.18} r={s * 0.18} fill="rgba(244,228,193,0.85)" />
            {/* Wasserlinien */}
            {[0.58, 0.68, 0.78].map((y, i) => (
              <ellipse
                key={i}
                cx={c}
                cy={s * y}
                rx={s * (0.3 - i * 0.05)}
                ry={s * 0.015}
                fill={goldDark}
                opacity={0.4}
              />
            ))}
          </svg>
        );

      default:
        return null;
    }
  }
);

MoodSymbol.displayName = "MoodSymbol";
