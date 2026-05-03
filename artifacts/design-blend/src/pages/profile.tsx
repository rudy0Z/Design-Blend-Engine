import { useState } from "react";
import { Link, useParams } from "wouter";
import { useUser } from "@clerk/react";
import { Loader2, Share2, Sparkles, Lock, Unlock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProfileByUsername,
  getGetProfileByUsernameQueryKey,
  useCreateBlendInvite,
  useUpdateProfilePrivacy,
  useGetMyProfile,
  getGetMyProfileQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import { ProfileCard } from "@/components/ProfileCard";
import { Header } from "@/components/Header";
import { usePageMeta } from "@/lib/meta";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const { user } = useUser();

  const { data: profile, isLoading, error } = useGetProfileByUsername(username, {
    query: {
      enabled: !!username,
      queryKey: getGetProfileByUsernameQueryKey(username),
    },
  });
  const { data: myProfile } = useGetMyProfile({
    query: { enabled: !!user, queryKey: getGetMyProfileQueryKey() },
  });

  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const createInvite = useCreateBlendInvite();
  const queryClient = useQueryClient();
  const updatePrivacy = useUpdateProfilePrivacy({
    mutation: {
      onSuccess: (updated) => {
        queryClient.setQueryData(
          getGetProfileByUsernameQueryKey(updated.username),
          updated,
        );
        queryClient.setQueryData(getGetMyProfileQueryKey(), updated);
      },
    },
  });

  const isMine = !!myProfile && !!profile && myProfile.id === profile.id;

  usePageMeta({
    title: profile
      ? `@${profile.username} — ${profile.archetypeTitle} · Design Blend`
      : "Design Blend",
    description: profile?.archetypeDescription,
    ogDescription: profile?.archetypeDescription,
    ogImage: profile
      ? `${window.location.origin}/api/og/profile/${profile.username}`
      : undefined,
  });

  function generateInvite() {
    createInvite.mutate(undefined as never, {
      onSuccess: (inv) => {
        const url = `${window.location.origin}${import.meta.env.BASE_URL}blend/invite/${inv.token}`;
        setInviteUrl(url);
        navigator.clipboard.writeText(url).catch(() => {});
        setActionMsg("Invite link copied to clipboard.");
      },
      onError: (e) =>
        setActionMsg(`Couldn't create invite: ${(e as Error).message}`),
    });
  }

  function togglePrivacy(next: boolean) {
    if (!profile) return;
    updatePrivacy.mutate(
      { username: profile.username, data: { isPublic: next } },
      {
        onSuccess: () => setActionMsg(next ? "Profile is now public." : "Profile is now private."),
        onError: (e) =>
          setActionMsg(`Couldn't update privacy: ${(e as Error).message}`),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !profile) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="text-destructive font-semibold" data-testid="text-profile-error">
              Profile not found.
            </p>
            <Link href="/quiz">
              <Button className="mt-6" data-testid="button-take-quiz">
                Take the quiz
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!profile.isPublic && !isMine) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md" data-testid="text-profile-private">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-4 font-semibold">This profile is private.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              @{profile.username} hasn't made their taste fingerprint public.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="text-sm text-muted-foreground tracking-wide uppercase mb-3">
            Designer profile
          </div>
          <h1
            className="text-3xl sm:text-5xl font-serif font-bold tracking-tight text-foreground"
            data-testid="text-profile-title"
          >
            @{profile.username}
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            {profile.archetypeTitle}
          </p>
          {profile.confidence < 0.6 && (
            <div
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-700 dark:text-amber-400"
              data-testid="text-low-confidence"
            >
              <Sparkles className="h-3 w-3" />
              Low-confidence read — take a few more questions to sharpen this fingerprint.
            </div>
          )}

          <div className="mt-10 grid lg:grid-cols-[auto,1fr] gap-10 items-start">
            <div className="flex justify-center lg:justify-start">
              <ProfileCard profile={profile} />
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Blend with this designer
                </h3>
                {isMine ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate a one-time link to share with another designer. When they open it, you'll see your blend.
                    </p>
                    <Button
                      onClick={generateInvite}
                      disabled={createInvite.isPending}
                      data-testid="button-generate-invite"
                    >
                      {createInvite.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                      Create blend invite
                    </Button>
                    {inviteUrl && (
                      <div className="mt-3 rounded-lg bg-muted p-3 text-xs font-mono break-all" data-testid="text-invite-url">
                        {inviteUrl}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Take the quiz to compare your taste with @{profile.username}.
                    </p>
                    {myProfile ? (
                      <Link href={`/blend/${myProfile.username}/${profile.username}`}>
                        <Button data-testid="button-blend-now">
                          <Sparkles className="h-4 w-4" />
                          Blend now
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/quiz">
                        <Button data-testid="button-take-quiz-to-blend">
                          Take the quiz
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>

              {isMine && (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Privacy
                  </h3>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      {profile.isPublic ? (
                        <Unlock className="h-4 w-4 text-primary" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span data-testid="text-privacy-state">
                        {profile.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                    <ToggleSwitch
                      checked={profile.isPublic}
                      onCheckedChange={togglePrivacy}
                      disabled={updatePrivacy.isPending}
                      data-testid="switch-privacy"
                    />
                  </div>
                </div>
              )}

              {actionMsg && (
                <p className="text-xs text-muted-foreground" data-testid="text-action-msg">
                  {actionMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
