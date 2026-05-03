import { Link } from "wouter";
import { Show, useUser, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { useGetMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: myProfile } = useGetMyProfile({
    query: { enabled: !!user, queryKey: getGetMyProfileQueryKey() },
  });

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium"
          data-testid="link-home"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-primary" />
          <span className="tracking-wide uppercase">Design Blend</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Show when="signed-in">
            {myProfile && (
              <Link href={`/profile/${myProfile.username}`}>
                <Button variant="ghost" size="sm" data-testid="link-my-profile">
                  @{myProfile.username}
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              data-testid="button-sign-out"
            >
              Sign out
            </Button>
          </Show>
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" data-testid="link-sign-in">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" data-testid="link-sign-up">
                Sign up
              </Button>
            </Link>
          </Show>
        </nav>
      </div>
    </header>
  );
}
