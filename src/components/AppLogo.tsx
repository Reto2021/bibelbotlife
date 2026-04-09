import bibelbotLogo from "@/assets/biblebot-logo.png";
import bibelbotLogoWhite from "@/assets/logo-white-transparent.png";

interface AppLogoProps {
  className?: string;
  /**
   * Invert the theme-based logo selection. Use when the component sits on
   * a background that uses the opposite color (e.g. `bg-foreground`).
   * In that case the light-mode background is dark and vice-versa.
   */
  invertTheme?: boolean;
  alt?: string;
}

/**
 * Renders the BibleBot logo. Automatically switches to the white variant
 * when the page is in dark mode (or light mode + invertTheme).
 */
export const AppLogo = ({ className = "h-10 w-10", invertTheme = false, alt = "BibleBot" }: AppLogoProps) => {
  // Normal: dark logo in light mode, white logo in dark mode.
  // invertTheme: white logo in light mode, dark logo in dark mode.
  const darkClasses = invertTheme ? "dark:block" : "dark:hidden";
  const whiteClasses = invertTheme ? "dark:hidden" : "hidden dark:block";

  return (
    <>
      <img src={bibelbotLogo} alt={alt} className={`${className} ${darkClasses}`} />
      <img src={bibelbotLogoWhite} alt={alt} className={`${className} ${whiteClasses}`} />
    </>
  );
};