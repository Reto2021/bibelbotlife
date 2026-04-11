import QRCode from "react-qr-code";
import bibelbotLogo from "@/assets/biblebot-logo.png";

interface BrandedQRCodeProps {
  value: string;
  size?: number;
  logoUrl?: string;
  logoSize?: number;
}

/**
 * QR code with the BibleBot logo always centered on top.
 * Uses error correction level "H" (30% recoverable) so the logo
 * can safely cover the centre without breaking scannability.
 * The BibleBot logo is ALWAYS used for brand consistency.
 */
export const BrandedQRCode = ({
  value,
  size = 200,
  logoUrl: _logoUrl,
  logoSize,
}: BrandedQRCodeProps) => {
  // Always use BibleBot logo — brand consistency
  const logo = bibelbotLogo;
  const lSize = logoSize || Math.round(size * 0.22);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <QRCode
        value={value}
        size={size}
        level="H"
        style={{ width: "100%", height: "100%" }}
      />
      <img
        src={logo}
        alt="BibleBot"
        className="absolute rounded-md bg-white p-0.5"
        style={{
          width: lSize,
          height: lSize,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
};
