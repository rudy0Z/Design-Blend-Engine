import { useEffect } from "react";
import { Link, useLocation, useParams, Redirect } from "wouter";
import { Show, useUser } from "@clerk/react";
import { Loader2 } from "lucide-react";
import {
  useGetBlendInvite,
  getGetBlendInviteQueryKey,
  useGetMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function BlendInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, setLocation] = useLocation();
  const { user, isLoaded: userLoaded } = useUser();

  const { data: invite, isLoading: inviteLoading, error: inviteError } =
    useGetBlendInvite(token, {
      query: {
        enabled: !!token,
        queryKey: getGetBlendInviteQueryKey(token),
      },
    });
  const { data: myProfile, isLoading: profileLoading } = useGetMyProfile({
    query: {
      enabled: !!user,
      queryKey: getGetMyProfileQueryKey(),
    },
  });

  // Persist intent so the user can finish sign-in or take the quiz
  // and still come back to a real blend.
  useEffect(() => {
    if (invite) {
      try {
        localStorage.setItem(
          "designBlend.pendingInvite",
          JSON.stringify({ token, username: invite.username, savedAt: Date.now() }),
        );
      } catch {}
    }
  }, [invite, token]);

  useEffect(() => {
    if (invite && myProfile && invite.username !== myProfile.username) {
      try { localStorage.removeItem("designBlend.pendingInvite"); } catch {}
      setLocation(`/blend/${myProfile.username}/${invite.username}`);
    }
  }, [invite, myProfile, setLocation]);

  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (inviteError || !invite) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="text-destructive font-semibold" data-testid="text-invite-error">
              Invite not found or expired.
            </p>
            <Link href="/">
              <Button className="mt-6" variant="outline">Home</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Self-invite: just send to your own profile.
  if (myProfile && invite.username === myProfile.username) {
    return <Redirect to={`/profile/${myProfile.username}`} />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-sm text-muted-foreground tracking-wide uppercase mb-3">
            Blend invite
          </div>
          <h1
            className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground"
            data-testid="text-invite-title"
          >
            @{invite.username} wants to blend taste with you.
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            See where your design fingerprints overlap and where you diverge.
          </p>

          <div className="mt-10 rounded-xl border border-border bg-card p-8">
            <Show when="signed-out">
              <p className="text-sm text-foreground">
                Sign in or build a taste profile first, then we'll show you the blend.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href={`/sign-in?after=${encodeURIComponent(`${basePath}/blend/invite/${token}`)}`}>
                  <Button data-testid="button-sign-in-to-blend">Sign in</Button>
                </Link>
                <Link href="/capture">
                  <Button variant="outline" data-testid="button-capture-to-blend">
                    Build your taste profile
                  </Button>
                </Link>
              </div>
            </Show>
            <Show when="signed-in">
              {!userLoaded || profileLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : myProfile ? (
                <p className="text-sm text-muted-foreground" data-testid="text-redirecting">
                  Loading your blend…
                </p>
              ) : (
                <>
                  <p className="text-sm text-foreground">
                    You're signed in but haven't built a profile yet. Rate a few plates to generate one — then we'll compute your blend with @{invite.username}.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <Link href="/capture">
                      <Button data-testid="button-capture-to-blend">Build your taste profile</Button>
                    </Link>
                  </div>
                </>
              )}
            </Show>
          </div>
        </div>
      </div>
    </>
  );
}
