import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import html2canvas from "html2canvas";
import { Show, useUser } from "@clerk/react";
import { Loader2, Download, Share2, RotateCcw, Check } from "lucide-react";
import {
  useCompleteQuizSession,
  useSaveProfile,
  useGetMyProfile,
  getGetMyProfileQueryKey,
  type Profile,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileCard } from "@/components/ProfileCard";
import { Header } from "@/components/Header";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function QuizResultsPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState(false);

  const complete = useCompleteQuizSession();
  const saveProfile = useSaveProfile();
  const { data: myProfile } = useGetMyProfile({
    query: { enabled: !!user, queryKey: getGetMyProfileQueryKey() },
  });

  useEffect(() => {
    if (!sessionId || profile) return;
    complete.mutate(
      { id: sessionId },
      {
        onSuccess: (p) => {
          setProfile(p);
          setUsername(p.username);
        },
        onError: (e) => setError((e as Error).message ?? "Failed to load profile"),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Already-saved-as-mine: show as saved.
  useEffect(() => {
    if (myProfile && profile && myProfile.id === profile.id) {
      setSaved(true);
    }
  }, [myProfile, profile]);

  function claimUsername() {
    if (!sessionId || !username.trim()) return;
    saveProfile.mutate(
      { data: { sessionId, username: username.trim().toLowerCase() } },
      {
        onSuccess: (p) => {
          setProfile(p);
          setSaved(true);
          setActionMsg(`Saved as @${p.username}.`);
          // Honor a pending blend invite captured before the user signed up.
          try {
            const raw = localStorage.getItem("designBlend.pendingInvite");
            if (raw) {
              const pending = JSON.parse(raw) as { username?: string };
              if (pending?.username && pending.username !== p.username) {
                localStorage.removeItem("designBlend.pendingInvite");
                setLocation(`/blend/${p.username}/${pending.username}`);
              }
            }
          } catch {}
        },
        onError: (e) =>
          setActionMsg(`Couldn't save: ${(e as Error).message ?? "unknown error"}`),
      },
    );
  }

  async function downloadCard() {
    if (!cardRef.current || !profile) return;
    setExporting(true);
    setActionMsg(null);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `design-blend-${profile.username}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setActionMsg("Card downloaded.");
    } catch (err) {
      setActionMsg(
        `Couldn't export card: ${(err as Error)?.message ?? "unknown error"}`,
      );
    } finally {
      setExporting(false);
    }
  }

  async function copyLink() {
    if (!profile) return;
    const url = saved
      ? `${window.location.origin}${import.meta.env.BASE_URL}profile/${profile.username}`
      : `${window.location.origin}${import.meta.env.BASE_URL}quiz/results/${sessionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setActionMsg("Link copied to clipboard.");
    } catch {
      setActionMsg("Couldn't copy link — please copy from the address bar.");
    }
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="text-destructive font-semibold" data-testid="text-results-error">
              Couldn't load your profile.
            </p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <Link href="/quiz">
              <Button className="mt-6" data-testid="button-restart-quiz">
                Restart quiz
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground" data-testid="text-results-loading">
          Computing your taste fingerprint…
        </p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-sm text-muted-foreground tracking-wide uppercase mb-3">Step 3 of 3</div>
          <h1
            className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground"
            data-testid="text-results-title"
          >
            Here's your taste fingerprint.
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Save the card. Share it. Blend it with another designer.
          </p>

          <div className="mt-10 grid lg:grid-cols-[auto,1fr] gap-10 items-start">
            <div className="flex justify-center lg:justify-start">
              <ProfileCard ref={cardRef} profile={profile} />
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Save your profile
                </h3>
                <Show when="signed-out">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an account to claim a username, get a public profile link, and unlock the Blend mechanic.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/sign-up?after=${encodeURIComponent(`${basePath}/quiz/results/${sessionId}`)}`}>
                      <Button data-testid="button-sign-up-save">Sign up to save</Button>
                    </Link>
                    <Link href={`/sign-in?after=${encodeURIComponent(`${basePath}/quiz/results/${sessionId}`)}`}>
                      <Button variant="outline" data-testid="button-sign-in-save">Sign in</Button>
                    </Link>
                  </div>
                </Show>
                <Show when="signed-in">
                  {saved ? (
                    <div className="flex items-center gap-2 text-sm text-foreground" data-testid="text-saved-state">
                      <Check className="h-4 w-4 text-primary" />
                      Saved as <span className="font-medium">@{profile.username}</span>.
                      <Link
                        href={`/profile/${profile.username}`}
                        className="ml-2 text-primary underline"
                        data-testid="link-view-public-profile"
                      >
                        View public profile
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor="username-input" className="text-xs text-muted-foreground">
                        Pick a username
                      </Label>
                      <div className="mt-2 flex gap-2">
                        <Input
                          id="username-input"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="your-handle"
                          data-testid="input-username"
                          className="font-mono"
                        />
                        <Button
                          onClick={claimUsername}
                          disabled={saveProfile.isPending || !username.trim()}
                          data-testid="button-save-profile"
                        >
                          {saveProfile.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : null}
                          Save
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Lowercase letters, digits, and dashes. 2–31 chars.
                      </p>
                    </>
                  )}
                </Show>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={downloadCard}
                    disabled={exporting}
                    data-testid="button-download-card"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Download card
                  </Button>
                  <Button variant="outline" onClick={copyLink} data-testid="button-copy-link">
                    <Share2 className="h-4 w-4" />
                    Copy link
                  </Button>
                  <Link href="/quiz">
                    <Button variant="outline" data-testid="button-retake">
                      <RotateCcw className="h-4 w-4" />
                      Retake
                    </Button>
                  </Link>
                </div>
                {actionMsg && (
                  <p
                    className="mt-3 text-xs text-muted-foreground"
                    data-testid="text-action-msg"
                  >
                    {actionMsg}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Profile details
                </h3>
                <dl className="space-y-2 text-sm">
                  <Row k="Username" v={`@${profile.username}`} testid="row-username" />
                  <Row k="Archetype" v={profile.archetypeTitle} testid="row-archetype" />
                  <Row
                    k="Confidence"
                    v={`${Math.round((profile.confidence ?? 0) * 100)}%`}
                    testid="row-confidence"
                  />
                  <Row
                    k="Top styles"
                    v={String(profile.topStyles?.length ?? 0)}
                    testid="row-topstyles-count"
                  />
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ k, v, testid }: { k: string; v: string; testid: string }) {
  return (
    <div className="flex justify-between gap-4" data-testid={testid}>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-foreground font-medium">{v}</dd>
    </div>
  );
}
