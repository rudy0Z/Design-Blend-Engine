import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function getAfter(): string {
  if (typeof window === "undefined") return basePath || "/";
  const param = new URLSearchParams(window.location.search).get("after");
  return param && param.startsWith(basePath || "/") ? param : basePath || "/";
}

export default function SignInPage() {
  const after = getAfter();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up?after=${encodeURIComponent(after)}`}
        forceRedirectUrl={after}
        fallbackRedirectUrl={after}
      />
    </div>
  );
}
