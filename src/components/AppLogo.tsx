import bibelbotLogo from "@/assets/biblebot-logo.png";
import bibelbotLogoWhite from "@/assets/logo-white-transparent.png";

interface AppLogoProps {
  className?: string;
  /** Force the white (dark-bg) variant regardless of theme */
  forceDark?: boolean;
  alt?: string;
}

/**
 * Renders the BibleBot logo. Automatically switches to the white variant
 * when the page is in dark mode. Use `forceDark` when the logo sits on a
 * background that is always dark (e.g. the footer).
 */
export const AppLogo = ({ className = "h-10 w-10", forceDark = false, alt = "BibleBot" }: AppLogoProps) => {
  return (
    <>
      {/* Default (light) logo – hidden in dark mode or when forceDark */}
      {!forceDark && (
        <img
          src={bibelbotLogo}
          alt={alt}
          className={`${className} dark:hidden`}
        />
      )}
      {/* White logo – shown in dark mode or when forceDark */}
      <img
        src={bibelbotLogoWhite}
        alt={alt}
        className={`${className} ${forceDark ? "" : "hidden dark:block"}`}
      />
    </>
  );
};