import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Moon, Sun, User, X } from "lucide-react";
import {
  getActiveAccount,
  getBackendStatus,
  getDesignerProfile,
  registerOrSignInAccount,
  signOutAccount,
  triggerOAuthSignIn,
  type AuthAccount,
} from "@/lib/backend-provider";
import { getTheme, setTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function Header() {
  const [location, setLocation] = useLocation();
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [account, setAccount] = useState<AuthAccount | null>(getActiveAccount);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const backend = getBackendStatus();

  useEffect(() => {
    setAccount(getActiveAccount());
  }, [location]);

  const myProfile = account ? getDesignerProfile(account.username) : null;
  const aura = myProfile?.versions[myProfile.versions.length - 1]?.data.auraColors ?? [
    "#FF5A36",
    "#F59E0B",
    "#FB7185",
  ];

  const navItems = [
    { href: "/", label: "Home", match: (p: string) => p === "/" },
    { href: "/capture", label: "Play", match: (p: string) => p.startsWith("/capture") },
    { href: "/catalog", label: "8 Worlds", match: (p: string) => p.startsWith("/catalog") },
    { href: "/blend/alba/kenji", label: "Blend", match: (p: string) => p.startsWith("/blend") },
  ];

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setBusy(true);
    try {
      const acct = await registerOrSignInAccount({
        mode: authMode,
        email,
        password,
        username: authMode === "signup" ? username : undefined,
        displayName: authMode === "signup" ? displayName : undefined,
      });
      setAccount(acct);
      setAuthModalOpen(false);
      const prof = getDesignerProfile(acct.username);
      if (prof) {
        setLocation(`/profile/${acct.username}`);
      } else {
        setLocation("/capture");
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="sticky top-3 z-40 px-3 sm:px-6 pointer-events-none">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          {/* Left Brand Emblem Capsule */}
          <Link
            href="/"
            className="pointer-events-auto liquid-dock spring-tap rounded-full pl-2.5 pr-4 py-2 flex items-center gap-2.5"
            data-testid="link-home"
          >
            <span
              style={{
                background: `conic-gradient(from 45deg, ${aura[0]}, ${aura[1]}, ${aura[2]}, ${aura[0]})`,
              }}
              className="h-6 w-6 rounded-full shadow-inner shrink-0"
            />
            <span className="font-display font-bold text-sm tracking-tight">Design Blend</span>
          </Link>

          {/* Center Floating Liquid-Glass Pill Tabs */}
          <nav
            aria-label="Primary"
            className="pointer-events-auto liquid-dock rounded-full p-1 flex items-center gap-0.5"
          >
            {navItems.map((item) => {
              const active = item.match(location);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-medium transition-colors",
                    active ? "text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="glass-nav-pill"
                      transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
                      className="absolute inset-0 rounded-full bg-foreground shadow-sm -z-10"
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Account + Tactile Daylight/Onyx Lens */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {account ? (
              <div className="liquid-dock rounded-full p-1 flex items-center gap-1">
                <Link
                  href={myProfile ? `/profile/${account.username}` : "/capture"}
                  className="spring-tap flex items-center gap-2 pl-2 pr-3 py-1 rounded-full text-xs font-semibold hover:bg-foreground/10"
                  data-testid="link-my-profile"
                >
                  <span
                    style={{ background: `linear-gradient(135deg, ${aura[0]}, ${aura[1]})` }}
                    className="h-4 w-4 rounded-full inline-block"
                  />
                  <span className="hidden sm:inline">@{account.username}</span>
                </Link>
                <button
                  type="button"
                  title="Sign out"
                  aria-label="Sign out"
                  onClick={async () => {
                    await signOutAccount();
                    setAccount(null);
                  }}
                  className="spring-tap h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="liquid-dock spring-tap rounded-full px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
                data-testid="button-open-auth"
              >
                <User className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Sign in</span>
              </button>
            )}

            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to Ceramic Daylight" : "Switch to Smoked Onyx"}
              onClick={() => {
                const next: Theme = theme === "dark" ? "light" : "dark";
                setTheme(next);
                setThemeState(next);
              }}
              className="liquid-dock spring-tap h-9 w-9 rounded-full flex items-center justify-center text-foreground"
              data-testid="button-toggle-theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Tactile Account & Permanent Profile Save Modal (Supabase Wired) */}
      <AnimatePresence>
        {authModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAuthModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", duration: 0.38, bounce: 0.14 }}
              onClick={(e) => e.stopPropagation()}
              className="slide-housing max-w-md w-full p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">
                    {authMode === "signup" ? "Save your taste forever" : "Welcome back"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {backend.supabaseReady
                      ? "Connected to Supabase Auth & Cloud Storage."
                      : "Supabase SDK wired — accounts save to your local preview vault until .env keys are added."}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setAuthModalOpen(false)}
                  className="spring-tap h-8 w-8 rounded-full bg-secondary flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 p-1 rounded-full bg-secondary text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError(null);
                  }}
                  className={cn(
                    "py-2 rounded-full transition-colors",
                    authMode === "signup" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
                  )}
                >
                  Create profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthError(null);
                  }}
                  className={cn(
                    "py-2 rounded-full transition-colors",
                    authMode === "signin" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground",
                  )}
                >
                  Sign in
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {authMode === "signup" && (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <span className="text-xs text-muted-foreground">Handle</span>
                      <input
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="rudra"
                        className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs text-muted-foreground">Your name</span>
                      <input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Rudra"
                        className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  </div>
                )}

                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Password</span>
                  <input
                    required
                    type="password"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full h-10 rounded-xl bg-secondary px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </label>

                {authError && (
                  <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-xl">
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="tactile-pill w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm"
                >
                  {busy
                    ? "Saving..."
                    : authMode === "signup"
                      ? "Create permanent profile"
                      : "Sign in to Design Blend"}
                </button>
              </form>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {(["google", "github"] as const).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    onClick={() =>
                      triggerOAuthSignIn(prov).catch((err) =>
                        setAuthError(err instanceof Error ? err.message : String(err)),
                      )
                    }
                    className="spring-tap h-9 rounded-full bg-secondary text-xs font-medium capitalize hover:bg-accent"
                  >
                    Continue with {prov}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
