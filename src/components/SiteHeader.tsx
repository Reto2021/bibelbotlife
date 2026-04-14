import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu, X as XIcon, HandHeart, GraduationCap, Building2, HeartHandshake,
  Send, FileText, ShieldCheck, LogIn, LogOut, User, Shield, Users, MessageCircle, Heart
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { resetBibleBotChat, openBibleBotChat } from "@/lib/chat-events";

const TELEGRAM_LINK = "https://t.me/meinbibelbot";

export function SiteHeader() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/" || location.pathname === "/index") {
      e.preventDefault();
      resetBibleBotChat();
    }
    // If on another page, the Link navigates to "/" normally
  };

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
        >
          <AppLogo className="h-10 w-10 lg:h-14 lg:w-14" />
          <div className="flex w-max flex-col">
            <span className="text-lg lg:text-xl font-bold text-foreground leading-tight">
              BibleBot<span className="text-sm lg:text-base font-normal text-muted-foreground dark:text-amber-400">.Life</span>
            </span>
            <span className="hidden pl-[1px] text-[9px] font-medium tracking-[0.18em] uppercase text-muted-foreground/70 dark:text-amber-400/70 lg:block">
              Everyday Sunday
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1 lg:gap-2">
          {/* Desktop links */}
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link to="/gebetswand">
              <HandHeart className="h-4 w-4 mr-1" />
              {t("nav.prayerWall")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link to="/bibelquiz">
              <GraduationCap className="h-4 w-4 mr-1" />
              {t("nav.bibleQuiz")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link to="/for-churches">
              <Building2 className="h-4 w-4 mr-1" />
              {t("institutions.badge")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link to="/fuer-seelsorger">
              <HeartHandshake className="h-4 w-4 mr-1" />
              {t("nav.forCelebrants")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
            <Link to="/spenden">
              <Heart className="h-4 w-4 mr-1" />
              {t("nav.donate", "Spenden")}
            </Link>
          </Button>
          <LanguageSwitcher />
          <DarkModeToggle />
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
                  <Link to="/admin">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
                <Link to="/mein-bereich">
                  <User className="h-4 w-4 mr-1" />
                  {t("meinBereichNav")}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-1" />
                {t("auth.logout")}
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-1" />
                {t("auth.loginShort")}
              </Link>
            </Button>
          )}
          <Button
            className="hidden lg:inline-flex"
            size="sm"
            onClick={() => {
              if (location.pathname !== "/") {
                navigate("/");
                setTimeout(() => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" }), 300);
              } else {
                document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("nav.openChat")}
          </Button>
          <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
            <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer">
              <Send className="h-4 w-4 mr-2" />
              Telegram
            </a>
          </Button>
          {/* Mobile/tablet hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {/* Mobile/tablet menu dropdown */}
      <div
        className={`lg:hidden border-t border-border bg-card/95 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
          <Link
            to="/churches"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Users className="h-4 w-4 text-primary" />
            {t("church.directoryBadge")}
          </Link>
          <Link
            to="/gebetswand"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HandHeart className="h-4 w-4 text-primary" />
            {t("nav.prayerWall")}
          </Link>
          <Link
            to="/bibelquiz"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <GraduationCap className="h-4 w-4 text-primary" />
            {t("nav.bibleQuiz")}
          </Link>
          <Link
            to="/for-churches"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Building2 className="h-4 w-4 text-primary" />
            {t("institutions.badge")}
          </Link>
          <Link
            to="/fuer-seelsorger"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <HeartHandshake className="h-4 w-4 text-primary" />
            {t("nav.forCelebrantsMobile")}
          </Link>
          <Link
            to="/spenden"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Heart className="h-4 w-4 text-primary" />
            {t("nav.donate", "Spenden")}
          </Link>
          <Link
            to="/impressum"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText className="h-4 w-4" />
            {t("footer.impressum")}
          </Link>
          <Link
            to="/datenschutz"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ShieldCheck className="h-4 w-4" />
            {t("footer.datenschutz")}
          </Link>
          {user ? (
            <>
              <Link
                to="/mein-bereich"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <User className="h-4 w-4 text-primary" />
                {t("meinBereichNav")}
              </Link>
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4 text-primary" />
                {t("auth.logout")}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn className="h-4 w-4 text-primary" />
              {t("auth.loginShort")}
            </Link>
          )}
          <div className="pt-2 pb-1 flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false);
                if (location.pathname !== "/") {
                  navigate("/");
                  setTimeout(() => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" }), 300);
                } else {
                  document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t("nav.openChat")}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>
                <Send className="h-4 w-4 mr-2" />
                Telegram Bot
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
