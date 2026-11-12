import { useRef, useState } from "react";
import type { StudioPlate } from "@/lib/backend-provider";
import { cn } from "@/lib/utils";

type Props = {
  plate: StudioPlate;
  className?: string;
  compact?: boolean;
  interactiveTilt?: boolean;
  loupeEnabled?: boolean;
};

/**
 * Tactile Collector Slide Artwork Renderer across all 8 Creative Worlds.
 * Supports smooth 3D pointer-tracked specular sheen AND an optical 2x glass
 * magnifier loupe (inspired by Design Spells: Preview).
 */
export function PlateSpecimen({
  plate,
  className,
  compact = false,
  interactiveTilt = false,
  loupeEnabled = false,
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number; active: boolean }>({
    x: 0.5,
    y: 0.5,
    active: false,
  });

  const [bg, fg, acc] = plate.palette ?? ["#14151B", "#F5F3EE", "#FF5A36"];

  const tiltStyle =
    interactiveTilt && pointer.active && !loupeEnabled
      ? {
          transform: `perspective(900px) rotateX(${(0.5 - pointer.y) * 9}deg) rotateY(${(pointer.x - 0.5) * 11}deg) scale3d(1.012, 1.012, 1.012)`,
          transition: "transform 90ms ease-out",
        }
      : {
          transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
          transition: "transform 420ms cubic-bezier(0.23, 1, 0.32, 1)",
        };

  const content =
    plate.imageUrl && !imgFailed ? (
      <img
        src={plate.imageUrl}
        alt={plate.altText}
        loading="lazy"
        onError={() => setImgFailed(true)}
        className="h-full w-full object-cover"
      />
    ) : (
      renderWorldArtwork(plate.specimenKind, bg, fg, acc, compact)
    );

  return (
    <div
      ref={containerRef}
      style={{ backgroundColor: bg, color: fg, ...tiltStyle }}
      role="img"
      aria-label={plate.altText}
      onPointerMove={(e) => {
        if (!interactiveTilt && !loupeEnabled) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPointer({
          x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
          y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
          active: true,
        });
      }}
      onPointerLeave={() => setPointer((p) => ({ ...p, active: false }))}
      className={cn(
        "relative overflow-hidden select-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]",
        compact ? "aspect-[4/3] rounded-xl" : "aspect-[4/3] rounded-2xl",
        loupeEnabled && "cursor-none",
        className,
      )}
    >
      {content}

      {/* Specular Rim & Sheen following pointer */}
      {interactiveTilt && pointer.active && !loupeEnabled && (
        <div
          style={{
            background: `radial-gradient(360px circle at ${pointer.x * 100}% ${pointer.y * 100}%, rgba(255,255,255,0.18), transparent 65%)`,
          }}
          className="pointer-events-none absolute inset-0 z-20"
        />
      )}

      {/* Optical 2.1x Glass Magnifier Loupe (Design Spells: Preview) */}
      {loupeEnabled && pointer.active && (
        <div
          style={{
            left: `${pointer.x * 100}%`,
            top: `${pointer.y * 100}%`,
          }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full overflow-hidden z-30 border-2 border-white/80 shadow-[0_18px_38px_rgba(0,0,0,0.65),inset_0_2px_8px_rgba(255,255,255,0.55)]"
        >
          <div
            style={{
              backgroundColor: bg,
              color: fg,
              width: "220%",
              height: "220%",
              transform: `translate(${-(pointer.x * 54)}%, ${-(pointer.y * 54)}%)`,
            }}
            className="w-full h-full"
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

function renderWorldArtwork(
  kind: string,
  bg: string,
  fg: string,
  acc: string,
  compact: boolean,
) {
  // === TUNER STRIP 1: SPACE & BREATHING ROOM ===
  if (kind.startsWith("craft_density_")) {
    const pole = Number(kind.split("_").pop() ?? "50");
    const gap = pole > 80 ? 4 : pole > 55 ? 8 : pole > 25 ? 15 : 26;
    const pad = pole > 80 ? 10 : pole > 55 ? 16 : pole > 25 ? 24 : 34;
    const tracks = [
      ["01", "Concrete & Morning Fog", "3:42"],
      ["02", "Cedar Louver Study", "4:18"],
      ["03", "Midnight Shibuya 35mm", "2:55"],
      ["04", "Brushed Aluminum Detent", "5:04"],
      ["05", "Unlined Cashmere Drape", "3:19"],
    ];
    return (
      <div
        style={{ padding: compact ? pad * 0.65 : pad }}
        className="h-full w-full flex flex-col justify-between"
      >
        <div className="flex items-center justify-between pb-1.5 border-b border-current/15">
          <span className="text-xs font-medium opacity-75">Studio Playlist</span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: acc }}>
            {pole > 80 ? "4px tight" : pole > 55 ? "8px crisp" : pole > 25 ? "16px airy" : "32px calm"}
          </span>
        </div>
        <div style={{ gap: compact ? Math.max(2, gap * 0.6) : gap }} className="flex flex-col my-auto py-1">
          {tracks.slice(0, pole < 20 ? 2 : pole < 50 ? 3 : 5).map(([num, title, dur]) => (
            <div key={num} className="flex items-center justify-between text-xs border-b border-current/10 pb-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-[10px] opacity-45 tabular-nums">{num}</span>
                <span className="truncate font-medium">{title}</span>
              </div>
              <span className="font-mono text-[10.5px] opacity-65 tabular-nums">{dur}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // === TUNER STRIP 2: TYPE PERSONALITY ===
  if (kind.startsWith("craft_type_")) {
    const mode = kind.replace("craft_type_", "");
    const headingStyle =
      mode === "serif"
        ? { fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" as const }
        : mode === "mono"
          ? { fontFamily: "var(--app-font-mono)" }
          : { fontFamily: "var(--app-font-display)" };
    return (
      <div className="h-full w-full p-6 flex flex-col justify-between">
        <span className="text-xs opacity-60">Autumn Exhibition</span>
        <div className="space-y-2">
          <div
            style={headingStyle}
            className={cn(
              "leading-[0.96]",
              mode === "kinetic"
                ? "text-3xl sm:text-4xl font-extrabold uppercase tracking-widest scale-y-125 origin-left"
                : mode === "mono"
                  ? "text-xl sm:text-2xl font-semibold tracking-tight uppercase"
                  : "text-3xl sm:text-4xl font-semibold tracking-tight",
            )}
          >
            Light Shapes Everything
          </div>
          <p className="text-xs opacity-70 max-w-[28ch]">
            Same words, four completely different creative voices.
          </p>
        </div>
        <span className="text-[11px] font-medium" style={{ color: acc }}>
          {mode === "grotesk"
            ? "Clean Neo-Grotesk"
            : mode === "mono"
              ? "Engineered Mono"
              : mode === "serif"
                ? "Literary Serif"
                : "Sculptural Display"}
        </span>
      </div>
    );
  }

  // === TUNER STRIP 3: MATERIAL & TACTILITY ===
  if (kind.startsWith("craft_surface_")) {
    const surface = kind.replace("craft_surface_", "");
    return (
      <div className="h-full w-full p-5 flex items-center justify-center relative">
        {surface === "glass" && (
          <>
            <div className="absolute w-32 h-32 rounded-full blur-2xl opacity-60 -top-3 -left-2" style={{ backgroundColor: acc }} />
            <div className="absolute w-28 h-28 rounded-full bg-indigo-500/45 blur-2xl bottom-0 right-2" />
          </>
        )}
        <div
          className={cn(
            "w-full max-w-[235px] p-4 flex flex-col gap-3 relative z-10",
            surface === "wire" && "border border-current rounded-none",
            surface === "vellum" && "rounded-xl border border-current/15 bg-black/[0.03] shadow-xs",
            surface === "glass" &&
              "rounded-2xl border border-white/30 bg-white/12 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_16px_32px_rgba(0,0,0,0.35)]",
            surface === "hardware" &&
              "rounded-2xl border border-black/20 bg-[#ECE9E0] text-[#151514] shadow-[0_6px_0_#A6A297,0_14px_24px_rgba(0,0,0,0.28),inset_0_1px_0_#FFF]",
          )}
        >
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
            <span>SYNTH // A1</span>
            <span style={{ color: acc }}>48kHz</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {["TAPE", "PLAY", "LOOP"].map((lbl, idx) => (
              <div
                key={lbl}
                className={cn(
                  "text-center font-mono text-[10px] py-2",
                  surface === "wire" && "border border-current",
                  surface === "vellum" && "rounded-md border border-current/20 bg-white/60",
                  surface === "glass" && "rounded-lg border border-white/25 bg-white/15",
                  surface === "hardware" &&
                    "rounded-lg border border-black/20 bg-[#FAF8F4] shadow-[0_3px_0_#9E9A90] font-semibold",
                )}
                style={idx === 1 ? { color: acc } : undefined}
              >
                {lbl}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // === ARCHITECTURE, INDUSTRIAL, PHOTOGRAPHY, FASHION, UI, GRAPHIC, BRAND, MOTION ===
  switch (kind) {
    // ARCHITECTURE
    case "arch_ando":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#17181C" />
          <polygon points="0,0 148,0 148,240 0,240" fill="#23252B" />
          <polygon points="164,0 320,0 320,240 164,240" fill="#1E2026" />
          {/* Glowing cruciform concrete light slit */}
          <rect x="152" y="18" width="8" height="204" fill="#FEF3C7" />
          <rect x="86" y="88" width="140" height="7" fill="#FEF3C7" />
          <polygon points="152,222 160,222 238,240 74,240" fill={acc} fillOpacity="0.32" />
          {[42, 96, 180, 260].map((x) =>
            [45, 145, 195].map((y) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#0B0C0E" opacity="0.55" />
            )),
          )}
        </svg>
      );

    case "arch_timber":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          {Array.from({ length: 14 }).map((_, i) => (
            <rect
              key={i}
              x={18 + i * 21}
              y="16"
              width="11"
              height="208"
              rx="1.5"
              fill={i % 3 === 0 ? acc : fg}
              fillOpacity={0.28 + (i % 4) * 0.16}
            />
          ))}
          <rect x="0" y="72" width="320" height="14" fill={acc} fillOpacity="0.85" />
          <rect x="0" y="152" width="320" height="14" fill={fg} fillOpacity="0.75" />
        </svg>
      );

    case "arch_mies":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#DCE5EC" />
          <rect x="24" y="64" width="272" height="10" fill="#111315" />
          <rect x="36" y="74" width="248" height="98" fill="#38BDF8" fillOpacity="0.28" />
          {[44, 118, 202, 276].map((x) => (
            <rect key={x} x={x} y="74" width="5" height="98" fill="#111315" />
          ))}
          <rect x="18" y="172" width="284" height="16" fill="#E7E2D8" stroke="#111315" strokeWidth="1.5" />
        </svg>
      );

    case "arch_curve":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          {Array.from({ length: 10 }).map((_, i) => (
            <path
              key={i}
              d={`M -10 ${210 - i * 8} C ${95 + i * 6} ${20 + i * 11}, ${210 - i * 5} ${190 - i * 9}, 330 ${85 + i * 7}`}
              fill="none"
              stroke={i === 3 ? acc : fg}
              strokeWidth={i === 3 ? "3" : "1.4"}
              strokeOpacity={i === 3 ? 0.95 : 0.25 + i * 0.05}
            />
          ))}
        </svg>
      );

    case "arch_wabi":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#DFD8CA" />
          <path d="M 105 210 L 105 95 A 55 55 0 0 1 215 95 L 215 210 Z" fill="#C9BFA9" />
          <rect x="64" y="176" width="82" height="34" fill="#8C7B65" />
          <polygon points="160,42 215,95 215,210 172,210" fill="#EFECE4" fillOpacity="0.55" />
        </svg>
      );

    case "arch_milan":
      return (
        <div className="h-full w-full p-5 flex items-center justify-between relative overflow-hidden" style={{ background: "linear-gradient(135deg, #2A101B 0%, #12232E 100%)" }}>
          <div className="w-24 h-36 rounded-t-full border-2 border-amber-300/60 bg-rose-900/55 shadow-lg" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 via-fuchsia-400 to-amber-100 blur-[1px] shadow-[0_0_32px_rgba(245,158,11,0.55)]" />
          <div className="w-24 h-28 border border-amber-200/40 bg-emerald-950/75 p-3 flex items-end text-[10px] text-amber-100">
            MILANO
          </div>
        </div>
      );

    case "arch_barragan":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#1D4ED8" />
          <polygon points="0,42 214,42 214,240 0,240" fill="#E04D70" />
          <polygon points="178,86 320,52 320,240 178,240" fill="#F59E0B" />
          <rect x="82" y="102" width="54" height="138" fill="#7F1D1D" />
          <rect x="0" y="206" width="320" height="34" fill="#38BDF8" fillOpacity="0.82" />
        </svg>
      );

    case "arch_slop":
      return (
        <div className="h-full w-full p-4 flex flex-col justify-between bg-[#242730] text-white relative overflow-hidden">
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-purple-600 shadow-[0_0_22px_#D946EF]" />
          <div className="text-center font-bold text-sm text-fuchsia-300">
            LUXURY LED STUDIO VIBES
          </div>
          <div className="h-8 w-full bg-repeating-linear-gradient bg-zinc-500/35 rounded border border-white/15" />
        </div>
      );

    // INDUSTRIAL & HARDWARE
    case "ind_clear_pcb":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#121418" />
          <rect x="44" y="24" width="232" height="192" rx="22" fill="#1F242D" stroke="rgba(255,255,255,0.38)" strokeWidth="2" />
          <circle cx="132" cy="120" r="46" fill="none" stroke="#F3F4F6" strokeWidth="8" strokeDasharray="52 14" />
          <rect x="200" y="54" width="46" height="82" rx="6" fill="none" stroke="#F59E0B" strokeWidth="2" />
          <circle cx="62" cy="42" r="4" fill="#9CA3AF" />
          <circle cx="258" cy="42" r="4" fill="#9CA3AF" />
          <circle cx="62" cy="198" r="4" fill="#9CA3AF" />
          <circle cx="258" cy="198" r="4" fill="#EF4444" />
        </svg>
      );

    case "ind_pebble":
      return (
        <div className="h-full w-full flex items-center justify-center bg-[#ECEAE4]">
          <div className="w-36 h-36 rounded-[44px] bg-[#F7F6F2] shadow-[0_20px_38px_rgba(0,0,0,0.12),inset_0_2px_4px_#FFF] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-400/60" />
          </div>
        </div>
      );

    case "ind_gamer_slop":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#090A0F" />
          <polygon points="160,24 235,68 212,210 108,210 85,68" fill="#18181B" stroke="#22C55E" strokeWidth="3" />
          <polygon points="130,85 190,85 160,145" fill="#EC4899" />
          <line x1="95" y1="115" x2="225" y2="115" stroke="#06B6D4" strokeWidth="4" />
        </svg>
      );

    case "ind_plywood":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#F3ECE2" />
          <path d="M 88 62 C 88 32, 232 32, 232 62 C 232 115, 205 128, 205 142 C 240 150, 244 192, 160 192 C 76 192, 80 150, 115 142 C 115 128, 88 115, 88 62 Z" fill="#6B3418" />
          <path d="M 106 72 C 106 52, 214 52, 214 72 C 214 102, 194 112, 160 112 C 126 112, 106 102, 106 72 Z" fill="#231F1D" />
        </svg>
      );

    case "ind_chrome_tube":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#E6E9EF" />
          <path d="M 96 48 L 96 138 L 218 138 L 218 198 L 96 198" fill="none" stroke="#334155" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="92" y="64" width="128" height="24" rx="3" fill="#111827" />
          <rect x="92" y="128" width="130" height="16" rx="3" fill="#2563EB" />
        </svg>
      );

    case "ind_raw_pine":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#F5EFE4" />
          <rect x="64" y="88" width="192" height="18" fill="#D9A968" stroke="#292118" strokeWidth="1.5" />
          <rect x="84" y="106" width="18" height="92" fill="#C99653" stroke="#292118" strokeWidth="1.5" />
          <rect x="218" y="106" width="18" height="92" fill="#C99653" stroke="#292118" strokeWidth="1.5" />
          <line x1="102" y1="120" x2="218" y2="184" stroke="#292118" strokeWidth="4" />
        </svg>
      );

    case "ind_resin_glow":
      return (
        <div className="h-full w-full flex items-center justify-center bg-[#1F1209]">
          <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-amber-200/90 via-orange-500/85 to-amber-900/90 shadow-[0_0_54px_rgba(249,115,22,0.55),inset_0_2px_12px_rgba(255,255,255,0.65)]" />
        </div>
      );

    // PHOTOGRAPHY & FILM
    case "photo_trix":
      return (
        <div className="h-full w-full bg-[#0B0B0B] relative overflow-hidden flex items-center justify-center">
          <div className="w-44 h-44 rounded-full bg-white/90 blur-md -rotate-12 translate-x-6" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-black/80" />
          <div className="relative z-10 text-white font-display font-extrabold text-3xl -rotate-6 tracking-tighter mix-blend-difference">
            SHINJUKU 02:14
          </div>
        </div>
      );

    case "photo_seascape":
      return (
        <div className="h-full w-full flex flex-col">
          <div className="h-1/2 w-full bg-gradient-to-b from-[#CBD2DB] to-[#E2E6EC]" />
          <div className="h-1/2 w-full bg-gradient-to-b from-[#333B48] to-[#171B22]" />
        </div>
      );

    case "photo_flash":
      return (
        <div className="h-full w-full bg-[#EFEAE0] flex items-center justify-center relative">
          <div className="w-28 h-36 bg-[#181615] translate-x-2.5 translate-y-2.5 rounded-sm opacity-85" />
          <div className="absolute w-28 h-36 bg-[#D9483B] border-2 border-white shadow-sm flex items-end p-2.5 text-white font-bold text-xs">
            RAW FLASH
          </div>
        </div>
      );

    case "photo_hdr_slop":
      return (
        <div className="h-full w-full bg-gradient-to-tr from-cyan-600 via-slate-800 to-orange-500 flex items-center justify-center p-4 text-center">
          <div className="rounded-full w-24 h-24 bg-gradient-to-b from-orange-300 to-cyan-400 shadow-[0_0_32px_#F97316] flex items-center justify-center text-xs font-extrabold text-slate-950">
            HDR +100
          </div>
        </div>
      );

    case "photo_wkw":
      return (
        <div className="h-full w-full bg-[#06241C] relative overflow-hidden flex items-center justify-between p-6">
          <div className="w-24 h-24 rounded-full bg-amber-300/75 blur-xl" />
          <div className="w-20 h-32 rounded-full bg-red-500/65 blur-lg" />
          <div className="absolute inset-x-0 top-1/2 h-px bg-amber-200/30" />
          <span className="relative z-10 font-mono text-[11px] text-amber-200 tracking-widest">
            2046 // TUNGSTEN
          </span>
        </div>
      );

    case "photo_symmetry":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#F5E4D6" />
          <line x1="0" y1="0" x2="115" y2="82" stroke="#1F1916" strokeWidth="1.5" />
          <line x1="320" y1="0" x2="205" y2="82" stroke="#1F1916" strokeWidth="1.5" />
          <line x1="0" y1="240" x2="115" y2="158" stroke="#1F1916" strokeWidth="1.5" />
          <line x1="320" y1="240" x2="205" y2="158" stroke="#1F1916" strokeWidth="1.5" />
          <rect x="115" y="82" width="90" height="76" fill="#DC2626" stroke="#1F1916" strokeWidth="2" />
          <rect x="148" y="106" width="24" height="52" fill="#F5E4D6" />
        </svg>
      );

    case "photo_eggleston":
      return (
        <div className="h-full w-full bg-[#2563EB] flex flex-col justify-end p-5 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-48 h-36 rounded-tl-[48px] bg-[#B91C1C]" />
          <div className="relative z-10 bg-[#FCEBD2] text-[#7F1D1D] px-3 py-1.5 rounded self-start font-display font-bold text-sm shadow">
            MEMPHIS · KODACHROME
          </div>
        </div>
      );

    case "photo_penn":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#EAE6DF" />
          <polygon points="145,172 285,205 245,222 125,184" fill="#141413" fillOpacity="0.22" />
          <rect x="125" y="148" width="70" height="44" fill="#FAF8F4" stroke="#141413" strokeWidth="1.2" />
          <circle cx="160" cy="112" r="34" fill="#B45309" />
        </svg>
      );

    // FASHION & MATERIAL
    case "fash_avant":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#111114" />
          <path d="M 155 28 C 215 34, 252 92, 232 162 C 218 206, 102 218, 76 174 C 54 134, 96 22, 155 28 Z" fill="#F3F2EE" />
          <path d="M 134 46 C 188 52, 214 106, 198 188 L 106 188 Z" fill="#1B1B1F" />
        </svg>
      );

    case "fash_quiet":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#EFEAE2" />
          <path d="M 118 28 L 202 28 L 222 212 L 166 212 L 160 116 L 154 212 L 98 212 Z" fill="#3A3028" />
          <line x1="160" y1="28" x2="160" y2="116" stroke="#EFEAE2" strokeWidth="1.5" />
        </svg>
      );

    case "fash_tech":
      return (
        <div className="h-full w-full bg-[#13161A] p-4 flex flex-col justify-between text-zinc-200 font-mono text-[10px]">
          <div className="flex justify-between items-center border-b border-emerald-400/35 pb-1.5">
            <span className="text-emerald-400">3L GORE-TEX PRO</span>
            <span>WATERPROOF</span>
          </div>
          <div className="my-auto flex items-center justify-center gap-3">
            <div className="h-20 w-2 bg-emerald-400 rounded-full" />
            <div className="border border-zinc-600 px-3 py-2 rounded bg-zinc-900">
              FIDLOCK® MAGNETIC SLING
            </div>
          </div>
          <div className="opacity-50">SEAM-TAPED ARTICULATION</div>
        </div>
      );

    case "fash_slop":
      return (
        <div className="h-full w-full bg-zinc-900 p-4 flex flex-wrap items-center justify-center gap-2 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded bg-yellow-400 text-black font-extrabold text-xs rotate-[-6deg]"
            >
              HYPE™ LOGO
            </span>
          ))}
        </div>
      );

    case "fash_boro":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#172554" />
          <rect x="44" y="34" width="118" height="92" fill="#1E3A8A" />
          <rect x="138" y="92" width="134" height="112" fill="#2563EB" fillOpacity="0.55" />
          {Array.from({ length: 7 }).map((_, r) => (
            <line
              key={r}
              x1="36"
              y1={48 + r * 24}
              x2="284"
              y2={48 + r * 24}
              stroke="#F8FAFC"
              strokeWidth="1.8"
              strokeDasharray="6 6"
            />
          ))}
        </svg>
      );

    case "fash_pleat":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#F4F3EF" />
          {Array.from({ length: 16 }).map((_, i) => (
            <polygon
              key={i}
              points={`${20 + i * 18},32 ${29 + i * 18},24 ${29 + i * 18},212 ${20 + i * 18},204`}
              fill={i % 2 === 0 ? "#18181B" : acc}
              fillOpacity={i % 2 === 0 ? 0.88 : 0.78}
            />
          ))}
        </svg>
      );

    case "fash_biomimetic":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill="#0B1120" />
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse
              key={i}
              cx="160"
              cy="120"
              rx={28 + i * 9}
              ry={92 - i * 5}
              fill="none"
              stroke="#7DD3FC"
              strokeOpacity={0.75 - i * 0.04}
              strokeWidth="1.2"
            />
          ))}
        </svg>
      );

    case "fash_margiela":
      return (
        <div className="h-full w-full bg-[#F2EFE9] flex items-center justify-center p-6">
          <div className="w-48 h-28 bg-[#FAF9F5] border border-neutral-300 relative flex items-center justify-center p-3">
            {/* 4 iconic white corner tack stitches */}
            <span className="absolute -top-1.5 -left-1.5 w-4 h-1 bg-neutral-800 rotate-45" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-1 bg-neutral-800 -rotate-45" />
            <span className="absolute -bottom-1.5 -left-1.5 w-4 h-1 bg-neutral-800 -rotate-45" />
            <span className="absolute -bottom-1.5 -right-1.5 w-4 h-1 bg-neutral-800 rotate-45" />
            <div className="font-mono text-[11px] tracking-[0.25em] text-neutral-500 text-center leading-relaxed">
              0 1 2 3 4 5 6 7 8 9
              <br />
              10 <strong className="rounded-full border border-neutral-900 text-neutral-900 px-1.5">11</strong> 12 13 14
            </div>
          </div>
        </div>
      );

    // EXISTING UI, GRAPHIC, BRAND & MOTION PLATES
    case "dark_command":
      return (
        <div className="h-full w-full p-4 flex flex-col justify-between text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: acc }} />
              <span className="font-medium opacity-85">Active Sprint</span>
            </div>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10">⌘K</span>
          </div>
          <div className="space-y-1.5 my-auto">
            {[
              ["Spring gesture handoff", "0.4ms", true],
              ["Optical kerning pass", "Done", false],
              ["Shared blend shader", "Live", false],
            ].map(([title, tag, active]) => (
              <div
                key={String(title)}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg border",
                  active ? "border-white/25 bg-white/[0.08]" : "border-white/[0.06] opacity-65",
                )}
              >
                <span className="truncate font-medium">{title}</span>
                <span className="font-mono text-[10px] opacity-70 tabular-nums">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case "purple_slop":
      return (
        <div className="h-full w-full p-4 flex flex-col items-center justify-center text-center relative overflow-hidden text-white">
          <div className="absolute -top-8 -left-6 w-40 h-40 rounded-full bg-fuchsia-500/60 blur-2xl" />
          <div className="absolute -bottom-10 -right-6 w-44 h-44 rounded-full bg-cyan-400/50 blur-2xl" />
          <span className="relative z-10 text-[10px] px-3 py-0.5 rounded-full bg-white/15 border border-white/30 mb-2">
            Next-Gen AI Magic 3.0
          </span>
          <div className="relative z-10 font-extrabold text-lg leading-tight">
            10x Your Workflow Synergy Instantly
          </div>
          <div className="relative z-10 mt-3 px-4 py-1.5 rounded-full text-[11px] font-bold bg-violet-500 shadow-[0_0_24px_rgba(168,85,247,0.9)]">
            Start Free Forever
          </div>
        </div>
      );

    case "surgical_minimal":
      return (
        <div className="h-full w-full p-6 flex flex-col justify-between">
          <span className="text-xs opacity-45">Draft 04</span>
          <div className="font-display text-2xl sm:text-3xl tracking-tight leading-tight">
            Keep removing until every remaining line earns its breath.
          </div>
          <div className="h-px w-12 bg-current opacity-25" />
        </div>
      );

    case "frosted_glass":
      return (
        <div className="h-full w-full p-4 flex items-center justify-center relative overflow-hidden">
          <div className="absolute w-32 h-32 rounded-full bg-sky-400/60 blur-xl -left-2 top-2" />
          <div className="absolute w-28 h-28 rounded-full bg-amber-300/65 blur-xl right-3 bottom-1" />
          <div className="relative z-10 w-[84%] rounded-2xl border border-white/70 bg-white/45 backdrop-blur-md p-4 shadow-lg">
            <div className="text-[11px] font-medium opacity-75">Spatial Audio</div>
            <div className="mt-1 font-display font-bold text-base">Studio Reference Monitor</div>
            <div className="mt-3 h-1.5 rounded-full bg-black/10 overflow-hidden">
              <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: acc }} />
            </div>
          </div>
        </div>
      );

    case "bento_modular":
      return (
        <div className="h-full w-full p-3.5 grid grid-cols-3 grid-rows-2 gap-2">
          <div className="col-span-2 rounded-xl bg-white/[0.08] border border-white/15 p-3 flex flex-col justify-between">
            <span className="text-[10px] opacity-60">Frame Rate</span>
            <span className="font-display font-bold text-xl tabular-nums">120 fps</span>
          </div>
          <div className="rounded-xl p-3 flex flex-col justify-between text-white" style={{ backgroundColor: acc }}>
            <span className="text-[10px]">Sync</span>
            <span className="font-bold text-sm">Live</span>
          </div>
          <div className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 text-xs flex items-end">
            8 Worlds
          </div>
          <div className="col-span-2 rounded-xl bg-white/[0.06] border border-white/10 p-2.5 flex items-center justify-between text-xs">
            <span>Nested Radii</span>
            <span className="opacity-65">R=16 / r=10</span>
          </div>
        </div>
      );

    case "dense_telemetry":
      return (
        <div className="h-full w-full p-3 font-mono text-[10px] flex flex-col justify-between">
          <div className="flex justify-between border-b border-white/15 pb-1">
            <span style={{ color: acc }}>DESK // LIVE</span>
            <span className="tabular-nums">2,741.80 +1.4%</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 my-1">
            {[
              ["BID", "2741.7"],
              ["ASK", "2741.8"],
              ["VOL", "84.2K"],
              ["DELTA", "+0.84"],
              ["VWAP", "2736.1"],
              ["PING", "4ms"],
            ].map(([k, v]) => (
              <div key={k} className="border border-white/10 px-1.5 py-1 rounded bg-white/[0.03]">
                <div className="text-[8px] opacity-50">{k}</div>
                <div className="tabular-nums font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "soft_pastel":
      return (
        <div className="h-full w-full p-5 flex flex-col justify-between">
          <div className="rounded-full self-start px-3 py-1 text-[11px] font-semibold bg-white/85 shadow-2xs">
            Sunday Poolside
          </div>
          <div className="rounded-3xl bg-white/90 p-4 space-y-2 shadow-sm">
            <div className="font-display font-bold text-lg">Drop a track in the mix</div>
            <div
              className="inline-block rounded-full px-4 py-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: acc }}
            >
              Tune In
            </div>
          </div>
        </div>
      );

    case "brutalist_web":
      return (
        <div className="h-full w-full p-3 font-mono text-[10.5px] flex flex-col justify-between border-4 border-current">
          <div className="flex justify-between border-b-2 border-current pb-1 font-bold">
            <span>/ARCHIVE/INDEX</span>
            <span style={{ color: acc }}>[HTML]</span>
          </div>
          <div className="space-y-1 underline" style={{ color: acc }}>
            <div>manifesto_raw_dom.html</div>
            <div>zero_decoration.css</div>
          </div>
          <div className="border-t-2 border-current pt-1 text-[9px]">PURE STRUCTURE</div>
        </div>
      );

    case "swiss_poster":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          <circle cx="235" cy="120" r="76" fill="none" stroke={acc} strokeWidth="22" />
          <circle cx="235" cy="120" r="34" fill={fg} />
          <text x="24" y="66" fill={fg} fontFamily="sans-serif" fontWeight="800" fontSize="25" letterSpacing="-1">
            tonhalle
          </text>
          <text x="24" y="92" fill={fg} fontFamily="sans-serif" fontWeight="800" fontSize="25" letterSpacing="-1">
            zürich
          </text>
        </svg>
      );

    case "punk_zine":
      return (
        <div className="h-full w-full p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="self-start px-2.5 py-1 font-mono font-bold text-sm uppercase -rotate-3" style={{ backgroundColor: fg, color: bg }}>
            RIP THE GRID
          </div>
          <div className="self-center px-3.5 py-1.5 font-display font-extrabold text-2xl uppercase rotate-2" style={{ backgroundColor: acc, color: "#FFF" }}>
            XEROX PRESS
          </div>
          <div className="self-end px-2 py-0.5 font-mono text-[10px] uppercase -rotate-2" style={{ backgroundColor: fg, color: bg }}>
            ISSUE #07
          </div>
        </div>
      );

    case "japanese_ma":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          <circle cx="160" cy="108" r="54" fill={acc} />
          <polygon points="106,162 160,108 214,162" fill={fg} />
          <rect x="133" y="162" width="54" height="26" fill="none" stroke={fg} strokeWidth="2.5" />
        </svg>
      );

    case "maximal_scher":
      return (
        <div className="h-full w-full p-4 flex flex-col justify-between overflow-hidden font-display font-black uppercase leading-[0.85]">
          <div className="text-3xl tracking-tighter -rotate-2">BRING IN</div>
          <div className="text-2xl tracking-tight rotate-2" style={{ color: acc }}>
            THE RHYTHM
          </div>
          <div className="text-3xl tracking-tighter -rotate-1 border-t-4 border-current pt-1">
            PUBLIC STAGE
          </div>
        </div>
      );

    case "book_canon":
      return (
        <div className="h-full w-full p-4 flex items-center justify-center">
          <div className="w-full h-full grid grid-cols-2 rounded border border-current/25 bg-white/50 shadow-xs">
            <div className="border-r border-current/20 p-3.5 flex flex-col justify-between">
              <span className="italic text-[10px] opacity-60">De Architectura</span>
              <div className="space-y-1.5">
                <div className="h-1.5 w-full bg-current/20" />
                <div className="h-1.5 w-11/12 bg-current/20" />
                <div className="h-1.5 w-4/5 bg-current/20" />
              </div>
              <span className="text-[9px] opacity-45">14</span>
            </div>
            <div className="p-3.5 flex flex-col justify-between">
              <span className="font-semibold text-sm" style={{ color: acc }}>
                I. Proportion
              </span>
              <p className="text-[10px] leading-relaxed opacity-85">
                Outer and foot margins breathe in quiet golden harmony.
              </p>
              <span className="self-end text-[9px]">15</span>
            </div>
          </div>
        </div>
      );

    case "raygun_spread":
      return (
        <div className="h-full w-full p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="font-display font-extrabold text-4xl tracking-tighter leading-[0.8] -ml-1">
            SHATTER
          </div>
          <div className="text-[11px] font-bold uppercase rotate-6 self-end px-2.5 py-1" style={{ backgroundColor: acc, color: "#FFF" }}>
            NO COLUMNS
          </div>
        </div>
      );

    case "risograph_grain":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          <circle cx="140" cy="120" r="64" fill={fg} fillOpacity="0.82" />
          <circle cx="182" cy="124" r="64" fill={acc} fillOpacity="0.72" />
        </svg>
      );

    case "apothecary_label":
      return (
        <div className="h-full w-full p-5 flex items-center justify-center">
          <div className="w-full border border-current/45 p-3.5 text-[10px] space-y-1.5">
            <div className="font-display font-bold text-base border-b border-current/35 pb-1">
              Hinoki &amp; Cedar Bark 09
            </div>
            <div className="flex justify-between">
              <span>BATCH</span>
              <span className="font-mono">2026-B14</span>
            </div>
          </div>
        </div>
      );

    case "geometric_symbol":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          <path d="M160 56 A64 64 0 1 0 224 120 L160 120 Z" fill={fg} />
          <circle cx="192" cy="88" r="18" fill={acc} />
        </svg>
      );

    case "dynamic_brand":
      return (
        <div className="h-full w-full p-4 grid grid-cols-3 gap-2.5">
          {[18, 42, 74, 90, 32, 60].map((deg, idx) => (
            <div key={idx} className="rounded-lg border border-white/15 flex items-center justify-center p-2">
              <div style={{ transform: `rotate(${deg}deg)`, borderColor: idx === 2 ? acc : fg }} className="w-7 h-7 border-2 rounded-xs" />
            </div>
          ))}
        </div>
      );

    case "custom_lettering":
      return (
        <div className="h-full w-full p-5 flex flex-col items-center justify-center text-center border-4 border-double border-current/35">
          <div style={{ fontFamily: "Georgia, serif", color: acc }} className="italic text-3xl sm:text-4xl">
            L&apos;Atelier d&apos;Or
          </div>
        </div>
      );

    case "experimental_warp":
      return (
        <div className="h-full w-full p-5 flex flex-col justify-between overflow-hidden">
          <div className="font-display font-extrabold text-5xl tracking-widest scale-y-150 origin-top leading-none">
            WARP
          </div>
          <div className="font-display text-2xl opacity-80" style={{ color: acc }}>
            type as sculpture
          </div>
        </div>
      );

    case "spring_physics":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          <line x1="32" y1="76" x2="288" y2="76" stroke={fg} strokeOpacity="0.25" strokeDasharray="4 4" />
          <path d="M 32 190 C 78 76, 118 74, 288 76" fill="none" stroke={acc} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "zero_latency":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          <polyline points="32,184 134,184 134,70 288,70" fill="none" stroke={fg} strokeWidth="4" />
          <circle cx="134" cy="70" r="6" fill={acc} />
        </svg>
      );

    case "clay_slop":
      return (
        <div className="h-full w-full p-4 flex flex-col items-center justify-center gap-2 text-center">
          <div className="flex gap-3 items-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-300 to-pink-600 shadow-lg" />
            <div className="w-16 h-16 rounded-3xl rotate-12 bg-gradient-to-br from-violet-300 to-indigo-600 shadow-lg" />
          </div>
          <span className="font-bold text-xs text-fuchsia-900 mt-1">Puffy 3D Startup Mascots</span>
        </div>
      );

    case "braun_te_dial":
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          <circle cx="160" cy="120" r="68" fill="#F6F5F0" stroke={fg} strokeOpacity="0.18" strokeWidth="2" />
          {Array.from({ length: 24 }).map((_, idx) => {
            const angle = (idx * 15 * Math.PI) / 180;
            const r1 = 76;
            const r2 = idx % 3 === 0 ? 85 : 80;
            return (
              <line
                key={idx}
                x1={160 + Math.cos(angle) * r1}
                y1={120 + Math.sin(angle) * r1}
                x2={160 + Math.cos(angle) * r2}
                y2={120 + Math.sin(angle) * r2}
                stroke={fg}
                strokeOpacity={idx % 3 === 0 ? 0.8 : 0.35}
                strokeWidth="1.5"
              />
            );
          })}
          <line x1="160" y1="120" x2="202" y2="78" stroke={acc} strokeWidth="4" strokeLinecap="round" />
          <circle cx="160" cy="120" r="6" fill={fg} />
        </svg>
      );

    case "generative_field":
    default:
      return (
        <svg viewBox="0 0 320 240" className="h-full w-full">
          <rect width="320" height="240" fill={bg} />
          {Array.from({ length: 10 }).map((_, i) => (
            <path
              key={i}
              d={`M 12 ${30 + i * 20} Q ${115 + i * 8} ${8 + i * 25}, 308 ${38 + i * 18}`}
              fill="none"
              stroke={i === 4 ? acc : fg}
              strokeOpacity={i === 4 ? 0.95 : 0.3}
              strokeWidth={i === 4 ? "2.5" : "1.2"}
            />
          ))}
        </svg>
      );
  }
}
