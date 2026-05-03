import { shadcn } from "@clerk/themes";

export function buildAppearance(basePath: string) {
  return {
    theme: shadcn,
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    },
    variables: {
      colorPrimary: "#ff5a36",
      colorForeground: "#0d0d12",
      colorMutedForeground: "#6b6b76",
      colorDanger: "#dc2626",
      colorBackground: "#ffffff",
      colorInput: "#ffffff",
      colorInputForeground: "#0d0d12",
      colorNeutral: "#1a1a1f",
      fontFamily: "Inter, system-ui, sans-serif",
      borderRadius: "0.75rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox:
        "bg-card text-card-foreground rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-xl",
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: "text-foreground font-serif",
      headerSubtitle: "text-muted-foreground",
      socialButtonsBlockButtonText: "text-foreground",
      formFieldLabel: "text-foreground",
      footerActionLink: "text-primary",
      footerActionText: "text-muted-foreground",
      dividerText: "text-muted-foreground",
      identityPreviewEditButton: "text-primary",
      formFieldSuccessText: "text-foreground",
      alertText: "text-foreground",
      logoBox: "mx-auto",
      logoImage: "h-10",
      socialButtonsBlockButton: "border border-border hover:bg-muted",
      formButtonPrimary:
        "bg-primary text-primary-foreground hover:bg-primary/90",
      formFieldInput: "bg-input text-foreground border border-border",
      footerAction: "text-muted-foreground",
      dividerLine: "bg-border",
      alert: "border border-border bg-card",
      otpCodeFieldInput: "bg-input text-foreground border border-border",
      formFieldRow: "",
      main: "",
    },
  };
}
