import rawCatalog from "../../../../catalog/v1.json";
import {
  ARCHETYPES,
  computeBlend,
  computeDriftDiff,
  computeProfileVersion,
  type AxisLoadings,
  type BlendData,
  type CraftKey,
  type CraftLoadings,
  type DriftDiff,
  type PlateRef,
  type ProfileVersionData,
  type Signal,
} from "@workspace/taste-engine";
import {
  getSupabaseUser,
  isSupabaseConfigured,
  signInWithSupabaseOAuth,
  signInWithSupabasePassword,
  signOutSupabase,
  signUpWithSupabase,
  supabase,
  uploadUserReferenceImage,
} from "./supabase-slot";

export type StudioPlate = PlateRef & {
  subtitle: string;
  canonicalRef: string;
  creditLine: string;
  sourceUrl: string | null;
  licenseNote: string;
  altText: string;
  specimenKind: string;
  palette: [string, string, string];
  tags: string[];
};

export type StudioCategory = {
  id: string;
  label: string;
  description: string;
  styles: string[];
};

export type StudioField = {
  id: string;
  label: string;
  coverHint: string;
  categories: StudioCategory[];
};

export type StudioCatalog = {
  version: string;
  modelVersion: string;
  fields: StudioField[];
  plates: StudioPlate[];
};

export type ReferenceAnchor = {
  id: string;
  title: string;
  creatorCredit: string;
  url: string;
  imageUrl?: string;
  fieldId: string;
  note: string;
};

export type StoredProfileSnapshot = {
  version: number;
  createdAt: string;
  data: ProfileVersionData;
  signalsSnapshot: Signal[];
};

export type DesignerRecord = {
  username: string;
  displayName: string;
  disciplineLine: string;
  email?: string;
  location: string;
  isPublic: boolean;
  isSeededDemo?: boolean;
  signals: Signal[];
  anchors: ReferenceAnchor[];
  versions: StoredProfileSnapshot[];
};

export type AuthAccount = {
  email: string;
  username: string;
  displayName: string;
  provider: "supabase" | "local-preview";
};

const STORAGE_KEY = "design_blend_v3_vault";
const ACTIVE_ACCOUNT_KEY = "design_blend_v3_account";

function hydrateCatalog(): StudioCatalog {
  const c = rawCatalog as typeof rawCatalog;
  const fieldByCategory = new Map<string, string>();
  const fields: StudioField[] = c.fields.map((f) => {
    for (const cat of f.categories) fieldByCategory.set(cat.id, f.id);
    return {
      id: f.id,
      label: f.label,
      coverHint: f.cover_hint,
      categories: f.categories,
    };
  });

  const plates: StudioPlate[] = c.plates.map((p) => {
    const raw = p as Record<string, unknown>;
    return {
      id: p.id,
      styleId: p.style_id,
      categoryId: p.category_id,
      fieldId: (raw.field_id as string) ?? fieldByCategory.get(p.category_id) ?? "ui-ux",
      label: (raw.label as string) ?? p.style_id,
      subtitle: (raw.subtitle as string) ?? "",
      canonicalRef: (raw.canonical_ref as string) ?? "",
      imageUrl: p.image_url,
      creditLine: p.credit_line,
      sourceUrl: p.source_url,
      licenseNote: p.license_note,
      altText: p.alt_text,
      specimenKind: (raw.specimen_kind as string) ?? "strict_grid",
      palette: ((raw.palette as [string, string, string]) ?? ["#14151B", "#F5F3EE", "#FF5A36"]),
      pairGroupId: (raw.pair_group_id as string | null) ?? null,
      craftDimension: (raw.craft_dimension as CraftKey | null) ?? null,
      diagnosticKind:
        (raw.diagnostic_kind as PlateRef["diagnosticKind"]) ?? "canonical",
      axisLoadings: p.axis_loadings as AxisLoadings,
      craftLoadings: (raw.craft_loadings as CraftLoadings | undefined) ?? undefined,
      tags: p.tags,
    };
  });

  return {
    version: c._meta.version,
    modelVersion: "taste-engine-2.0.0",
    fields,
    plates,
  };
}

export const STUDIO_CATALOG: StudioCatalog = hydrateCatalog();

function makeSeededDesigners(plates: StudioPlate[]): Record<string, DesignerRecord> {
  const build = (
    username: string,
    displayName: string,
    disciplineLine: string,
    location: string,
    v1Signals: Signal[],
    v2ExtraSignals: Signal[] | null,
    anchors: ReferenceAnchor[],
  ): DesignerRecord => {
    const v1Data = computeProfileVersion(v1Signals, plates);
    const versions: StoredProfileSnapshot[] = [
      {
        version: 1,
        createdAt: "2026-10-18T14:20:00.000Z",
        data: v1Data,
        signalsSnapshot: v1Signals,
      },
    ];
    let finalSignals = v1Signals;
    if (v2ExtraSignals && v2ExtraSignals.length > 0) {
      finalSignals = [...v1Signals, ...v2ExtraSignals];
      const v2Data = computeProfileVersion(finalSignals, plates);
      versions.push({
        version: 2,
        createdAt: "2026-11-09T19:05:00.000Z",
        data: v2Data,
        signalsSnapshot: finalSignals,
      });
    }
    return {
      username,
      displayName,
      disciplineLine,
      location,
      isPublic: true,
      isSeededDemo: true,
      signals: finalSignals,
      anchors,
      versions,
    };
  };

  // 1. @alba — Architect & Interface Systems, Zürich
  const albaV1: Signal[] = [
    { plateId: "pl_arch_ando", mode: "pair", value: 96, sequence: 1, critiqueTags: ["surgical_grid"] },
    { plateId: "pl_arch_mies", mode: "rate", value: 94, sequence: 2, critiqueTags: ["surgical_grid"] },
    { plateId: "pl_ms_tactile_instrument", mode: "rate", value: 95, sequence: 3, critiqueTags: ["honest_material"] },
    { plateId: "pl_ui_dark_editorial", mode: "pair", value: 92, sequence: 4 },
    { plateId: "pl_ui_aurora_slop", mode: "pair", value: 6, sequence: 5, critiqueTags: ["ai_slop"] },
    { plateId: "pl_gd_swiss_intl", mode: "rate", value: 96, sequence: 6, critiqueTags: ["timeless_type"] },
    { plateId: "pl_photo_sugimoto", mode: "rate", value: 93, sequence: 7 },
    { plateId: "pl_fash_quiet", mode: "rate", value: 90, sequence: 8 },
    { plateId: "pl_craft_density_operator", mode: "rank", value: 95, sequence: 9 },
    { plateId: "pl_arch_led_slop", mode: "rate", value: 5, sequence: 10, critiqueTags: ["ai_slop"] },
    { plateId: "pl_gd_clay_slop", mode: "rate", value: 8, sequence: 11, critiqueTags: ["ai_slop"] },
  ];
  const albaV2Add: Signal[] = [
    { plateId: "pl_fash_boro", mode: "rate", value: 91, sequence: 12, critiqueTags: ["honest_material"] },
    { plateId: "pl_gd_risograph", mode: "rate", value: 89, sequence: 13, critiqueTags: ["earned_tension"] },
  ];

  // 2. @marlow — Fashion, Street Flash & Punk Print, London
  const marlowV1: Signal[] = [
    { plateId: "pl_fash_avant", mode: "pair", value: 97, sequence: 1, critiqueTags: ["earned_tension"] },
    { plateId: "pl_fash_margiela", mode: "rate", value: 95, sequence: 2, critiqueTags: ["honest_material"] },
    { plateId: "pl_photo_moriyama", mode: "pair", value: 96, sequence: 3, critiqueTags: ["earned_tension"] },
    { plateId: "pl_photo_flash", mode: "rate", value: 94, sequence: 4 },
    { plateId: "pl_gd_punk_zine", mode: "rate", value: 96, sequence: 5 },
    { plateId: "pl_gd_editorial_expressive", mode: "rate", value: 93, sequence: 6 },
    { plateId: "pl_bt_experimental_type", mode: "rate", value: 95, sequence: 7 },
    { plateId: "pl_arch_milan", mode: "rate", value: 88, sequence: 8 },
    { plateId: "pl_ui_dashboard_dense", mode: "rate", value: 14, sequence: 9, critiqueTags: ["sterile_cold"] },
    { plateId: "pl_fash_logo_slop", mode: "rate", value: 4, sequence: 10, critiqueTags: ["visual_noise"] },
    { plateId: "pl_photo_hdr_slop", mode: "rate", value: 5, sequence: 11, critiqueTags: ["ai_slop"] },
  ];

  // 3. @kenji — Industrial Hardware, Timber & Motion Physics, Tokyo
  const kenjiV1: Signal[] = [
    { plateId: "pl_ms_tactile_instrument", mode: "rate", value: 98, sequence: 1, critiqueTags: ["honest_material"] },
    { plateId: "pl_ind_transparent", mode: "rate", value: 94, sequence: 2, critiqueTags: ["earned_tension"] },
    { plateId: "pl_arch_kuma", mode: "rate", value: 96, sequence: 3, critiqueTags: ["honest_material"] },
    { plateId: "pl_fash_pleats", mode: "rate", value: 95, sequence: 4 },
    { plateId: "pl_fash_techwear", mode: "rate", value: 92, sequence: 5 },
    { plateId: "pl_ms_micro_physics", mode: "rate", value: 96, sequence: 6 },
    { plateId: "pl_gd_japanese_poster", mode: "rate", value: 95, sequence: 7 },
    { plateId: "pl_craft_surface_hardware", mode: "rank", value: 96, sequence: 8 },
    { plateId: "pl_ind_gamer_slop", mode: "rate", value: 4, sequence: 9, critiqueTags: ["visual_noise"] },
    { plateId: "pl_ui_aurora_slop", mode: "rate", value: 9, sequence: 10, critiqueTags: ["ai_slop"] },
  ];

  // 4. @sora — Cinema, Interior Quietude & Book Craft, Copenhagen
  const soraV1: Signal[] = [
    { plateId: "pl_photo_wkw", mode: "rate", value: 97, sequence: 1, critiqueTags: ["earned_tension"] },
    { plateId: "pl_arch_wabi", mode: "rate", value: 96, sequence: 2, critiqueTags: ["honest_material"] },
    { plateId: "pl_ind_eames", mode: "rate", value: 94, sequence: 3 },
    { plateId: "pl_fash_quiet", mode: "rate", value: 96, sequence: 4, critiqueTags: ["timeless_type"] },
    { plateId: "pl_gd_book_typography", mode: "rate", value: 95, sequence: 5 },
    { plateId: "pl_gd_packaging_minimal", mode: "rate", value: 93, sequence: 6 },
    { plateId: "pl_ui_flat_minimal", mode: "rate", value: 91, sequence: 7 },
    { plateId: "pl_craft_density_gallery", mode: "rank", value: 95, sequence: 8 },
    { plateId: "pl_craft_type_serif", mode: "rank", value: 96, sequence: 9 },
    { plateId: "pl_photo_hdr_slop", mode: "rate", value: 6, sequence: 10, critiqueTags: ["ai_slop"] },
  ];

  // 5. @mateo — Spatial Color, Parametric Form & Cast Resin, Mexico City
  const mateoV1: Signal[] = [
    { plateId: "pl_arch_barragan", mode: "rate", value: 98, sequence: 1, critiqueTags: ["earned_tension"] },
    { plateId: "pl_arch_parametric", mode: "rate", value: 92, sequence: 2 },
    { plateId: "pl_ind_resin", mode: "rate", value: 95, sequence: 3, critiqueTags: ["honest_material"] },
    { plateId: "pl_ms_generative_graphic", mode: "rate", value: 94, sequence: 4 },
    { plateId: "pl_fash_iris", mode: "rate", value: 93, sequence: 5 },
    { plateId: "pl_bt_dynamic_identity", mode: "rate", value: 91, sequence: 6 },
    { plateId: "pl_ui_glassmorphism", mode: "rate", value: 88, sequence: 7 },
    { plateId: "pl_craft_surface_glass", mode: "rank", value: 95, sequence: 8 },
    { plateId: "pl_arch_led_slop", mode: "rate", value: 7, sequence: 9, critiqueTags: ["ai_slop"] },
  ];

  return {
    alba: build(
      "alba",
      "Alba Lindqvist",
      "Architecture & Spatial Systems",
      "Zürich",
      albaV1,
      albaV2Add,
      [
        {
          id: "anc_alba_1",
          title: "Therme Vals — Peter Zumthor",
          creatorCredit: "Quartzite Stone & Steam · 1996",
          url: "https://7132.com/en/therme",
          fieldId: "architecture",
          note: "Stone, water, and shadow doing what ornament never could.",
        },
      ],
    ),
    marlow: build(
      "marlow",
      "Marlow Vance",
      "Avant-Garde Fashion & Print",
      "London",
      marlowV1,
      null,
      [
        {
          id: "anc_marlow_1",
          title: "Six Magazine — Comme des Garçons (1988)",
          creatorCredit: "Rei Kawakubo & Inoue Tsuguya",
          url: "https://www.commedesgarcons.com",
          fieldId: "fashion",
          note: "A fashion magazine with zero clothes and zero words — pure attitude.",
        },
      ],
    ),
    kenji: build(
      "kenji",
      "Kenji Takahashi",
      "Industrial Objects & Motion",
      "Tokyo",
      kenjiV1,
      null,
      [
        {
          id: "anc_kenji_1",
          title: "TP–7 Field Recorder Motorized Reel",
          creatorCredit: "teenage engineering",
          url: "https://teenage.engineering/products/tp-7",
          fieldId: "industrial",
          note: "You physically grab the spinning metal reel with your finger to pause audio.",
        },
      ],
    ),
    sora: build(
      "sora",
      "Sora Lindholm",
      "Film Direction & Quiet Spaces",
      "Copenhagen",
      soraV1,
      null,
      [
        {
          id: "anc_sora_1",
          title: "In the Mood for Love — Frame Stills",
          creatorCredit: "Wong Kar-wai & Christopher Doyle · 2000",
          url: "https://www.criterion.com",
          fieldId: "photography",
          note: "Every doorway frame holds an entire unspoken story.",
        },
      ],
    ),
    mateo: build(
      "mateo",
      "Mateo Reyes",
      "Chromatic Architecture & 3D",
      "Mexico City",
      mateoV1,
      null,
      [
        {
          id: "anc_mateo_1",
          title: "Cuadra San Cristóbal",
          creatorCredit: "Luis Barragán · 1968",
          url: "https://www.barragan-foundation.org",
          fieldId: "architecture",
          note: "Fearless color at architectural scale under harsh sunlight.",
        },
      ],
    ),
  };
}

type PersistedState = {
  designers: Record<string, DesignerRecord>;
  invites: Record<string, { inviter: string; contextField: string | null; createdAt: string }>;
  accounts: Record<string, { email: string; passwordHash: string; username: string; displayName: string }>;
};

let memoryFallback: PersistedState | null = null;

function readState(): PersistedState {
  const seeded = makeSeededDesigners(STUDIO_CATALOG.plates);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: PersistedState = { designers: seeded, invites: {}, accounts: {} };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      designers: { ...seeded, ...parsed.designers },
      invites: parsed.invites ?? {},
      accounts: parsed.accounts ?? {},
    };
  } catch {
    if (!memoryFallback) {
      memoryFallback = { designers: seeded, invites: {}, accounts: {} };
    }
    return memoryFallback;
  }
}

function writeState(state: PersistedState): void {
  memoryFallback = state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota restrictions
  }
}

export function getActiveAccount(): AuthAccount | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthAccount;
  } catch {
    return null;
  }
}

export function getActiveHandle(): string | null {
  return getActiveAccount()?.username ?? null;
}

export function setActiveAccount(account: AuthAccount | null): void {
  try {
    if (account) window.localStorage.setItem(ACTIVE_ACCOUNT_KEY, JSON.stringify(account));
    else window.localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  } catch {
    // Ignore
  }
}

export function setActiveHandle(handle: string | null): void {
  if (!handle) {
    setActiveAccount(null);
    return;
  }
  const state = readState();
  const d = state.designers[handle.toLowerCase()];
  setActiveAccount({
    email: d?.email ?? `${handle.toLowerCase()}@studio.local`,
    username: handle.toLowerCase(),
    displayName: d?.displayName ?? handle,
    provider: isSupabaseConfigured() ? "supabase" : "local-preview",
  });
}

export async function registerOrSignInAccount(input: {
  mode: "signup" | "signin";
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}): Promise<AuthAccount> {
  const email = input.email.trim().toLowerCase();
  const cleanHandle = (
    input.username?.trim().toLowerCase() ||
    email.split("@")[0] ||
    "creative"
  )
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 28);

  if (isSupabaseConfigured()) {
    if (input.mode === "signup") {
      const { data, error } = await signUpWithSupabase(email, input.password, {
        username: cleanHandle,
        display_name: input.displayName?.trim() || cleanHandle,
      });
      if (error) throw error;
      const acct: AuthAccount = {
        email,
        username: cleanHandle,
        displayName: input.displayName?.trim() || data.user?.user_metadata?.display_name || cleanHandle,
        provider: "supabase",
      };
      setActiveAccount(acct);
      return acct;
    } else {
      const { data, error } = await signInWithSupabasePassword(email, input.password);
      if (error) throw error;
      const meta = data.user?.user_metadata ?? {};
      const acct: AuthAccount = {
        email,
        username: (meta.username as string) || cleanHandle,
        displayName: (meta.display_name as string) || cleanHandle,
        provider: "supabase",
      };
      setActiveAccount(acct);
      return acct;
    }
  }

  // Local development preview vault (mirrors exact Supabase Auth contract)
  const state = readState();
  if (input.mode === "signin") {
    const existing = state.accounts[email];
    if (!existing) {
      throw new Error("No account found with that email yet. Switch to Create Account.");
    }
    const acct: AuthAccount = {
      email,
      username: existing.username,
      displayName: existing.displayName,
      provider: "local-preview",
    };
    setActiveAccount(acct);
    return acct;
  }

  state.accounts[email] = {
    email,
    passwordHash: btoa(input.password),
    username: cleanHandle,
    displayName: input.displayName?.trim() || cleanHandle,
  };
  writeState(state);
  const acct: AuthAccount = {
    email,
    username: cleanHandle,
    displayName: input.displayName?.trim() || cleanHandle,
    provider: "local-preview",
  };
  setActiveAccount(acct);
  return acct;
}

export async function triggerOAuthSignIn(provider: "google" | "github") {
  if (isSupabaseConfigured()) {
    await signInWithSupabaseOAuth(provider);
    return;
  }
  throw new Error(
    `Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to activate live ${provider} OAuth.`,
  );
}

export async function signOutAccount() {
  await signOutSupabase();
  setActiveAccount(null);
}

export { uploadUserReferenceImage };

export function getBackendStatus(): {
  mode: "supabase" | "studio-local";
  label: string;
  supabaseReady: boolean;
} {
  if (isSupabaseConfigured()) {
    return { mode: "supabase", label: "Supabase Cloud Active", supabaseReady: true };
  }
  return {
    mode: "studio-local",
    label: "Preview Vault · Supabase Wired",
    supabaseReady: false,
  };
}

export function listPublicDesigners(): DesignerRecord[] {
  const state = readState();
  return Object.values(state.designers).filter((d) => d.isPublic);
}

export function getDesignerProfile(username: string): DesignerRecord | null {
  const key = username.trim().toLowerCase();
  const state = readState();
  return state.designers[key] ?? null;
}

export function getArchetypeDetails(archetypeId: string) {
  return (
    ARCHETYPES.find((a) => a.id === archetypeId) ?? {
      id: archetypeId,
      title: "The Polymath",
      description: "Your eye moves across disciplines without obeying a single style tribe.",
      color: "#FF5A36",
      famousExamples: ["Charles & Ray Eames", "Rei Kawakubo"],
      conditions: {},
    }
  );
}

export async function saveCompletedCapture(input: {
  username: string;
  displayName: string;
  disciplineLine: string;
  email?: string;
  password?: string;
  location?: string;
  newSignals: Signal[];
  newAnchor?: Omit<ReferenceAnchor, "id"> | null;
  isPublic?: boolean;
}): Promise<DesignerRecord> {
  const cleanHandle =
    input.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 28) || `creative-${Math.floor(100 + Math.random() * 900)}`;

  if (input.email && input.password) {
    await registerOrSignInAccount({
      mode: "signup",
      email: input.email,
      password: input.password,
      username: cleanHandle,
      displayName: input.displayName || cleanHandle,
    }).catch(() => {
      // If already signed up, sign in silently
      return registerOrSignInAccount({
        mode: "signin",
        email: input.email!,
        password: input.password!,
      });
    });
  }

  const state = readState();
  const existing = state.designers[cleanHandle];

  const baseSeq = existing
    ? existing.signals.reduce((m, s) => Math.max(m, s.sequence), 0) + 1
    : 1;

  const normalizedNew: Signal[] = input.newSignals.map((s, idx) => ({
    ...s,
    sequence: baseSeq + idx,
  }));

  const combinedSignals = existing
    ? [...existing.signals, ...normalizedNew]
    : normalizedNew;

  const computed = computeProfileVersion(combinedSignals, STUDIO_CATALOG.plates);
  const nextVersionNumber = existing ? existing.versions.length + 1 : 1;

  const snapshot: StoredProfileSnapshot = {
    version: nextVersionNumber,
    createdAt: new Date().toISOString(),
    data: computed,
    signalsSnapshot: combinedSignals,
  };

  const anchors: ReferenceAnchor[] = existing ? [...existing.anchors] : [];
  if (input.newAnchor && input.newAnchor.title.trim()) {
    anchors.unshift({
      id: `anc_${Date.now().toString(36)}`,
      ...input.newAnchor,
    });
  }

  const record: DesignerRecord = {
    username: cleanHandle,
    displayName: input.displayName.trim() || existing?.displayName || cleanHandle,
    disciplineLine:
      input.disciplineLine.trim() || existing?.disciplineLine || "Creative Practitioner",
    email: input.email?.trim() || existing?.email,
    location: input.location?.trim() || existing?.location || "",
    isPublic: input.isPublic ?? existing?.isPublic ?? true,
    isSeededDemo: false,
    signals: combinedSignals,
    anchors,
    versions: existing ? [...existing.versions, snapshot] : [snapshot],
  };

  // Sync straight into Supabase tables when configured!
  if (supabase) {
    try {
      const supaUser = await getSupabaseUser();
      const userId = supaUser?.id ?? null;

      const { data: profRow } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            username: record.username,
            display_name: record.displayName,
            discipline_line: record.disciplineLine,
            is_public: record.isPublic,
          },
          { onConflict: "username" },
        )
        .select("id")
        .single();

      const { data: sessionRow } = await supabase
        .from("capture_sessions")
        .insert({
          user_id: userId,
          completed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (sessionRow?.id && normalizedNew.length > 0) {
        await supabase.from("plate_responses").insert(
          normalizedNew.map((s) => ({
            user_id: userId,
            session_id: sessionRow.id,
            plate_id: s.plateId,
            mode: s.mode,
            value: s.value,
            critique_tags: s.critiqueTags ?? [],
            sequence: s.sequence,
          })),
        );
      }

      if (profRow?.id) {
        const { data: verRow } = await supabase
          .from("profile_versions")
          .insert({
            profile_id: profRow.id,
            user_id: userId,
            version: nextVersionNumber,
            axes: computed.axes,
            axis_coverage: computed.axisCoverage,
            overall_coverage: computed.overallCoverage,
            craft_profile: computed.craftProfile,
            field_slices: computed.fieldSlices,
            category_affinity: computed.categoryAffinity,
            style_vector: computed.styleVector,
            top_plates: computed.topPlates,
            negative_anchors: computed.negativeAnchors,
            critique_signature: computed.critiqueCounts,
            creative_range: computed.creativeRange,
            archetype: computed.archetype,
            rated_count: computed.ratedCount,
            model_version: computed.modelVersion,
            catalog_version: STUDIO_CATALOG.version,
            is_published: true,
          })
          .select("id")
          .single();

        if (verRow?.id) {
          await supabase
            .from("profiles")
            .update({ current_version_id: verRow.id })
            .eq("id", profRow.id);
        }
      }
    } catch (err) {
      console.warn("[Supabase Sync] Saved locally; cloud sync deferred:", err);
    }
  }

  state.designers[cleanHandle] = record;
  writeState(state);
  setActiveHandle(cleanHandle);
  return record;
}

export function toggleProfilePrivacy(username: string, isPublic: boolean): DesignerRecord | null {
  const key = username.trim().toLowerCase();
  const state = readState();
  const target = state.designers[key];
  if (!target) return null;
  target.isPublic = isPublic;
  writeState(state);
  return { ...target };
}

export function getProfileDrift(record: DesignerRecord): DriftDiff | null {
  if (record.versions.length < 2) return null;
  const prev = record.versions[record.versions.length - 2].data;
  const curr = record.versions[record.versions.length - 1].data;
  return computeDriftDiff(prev, curr);
}

export function computeStudioBlend(handleA: string, handleB: string): {
  designerA: DesignerRecord;
  designerB: DesignerRecord;
  versionA: number;
  versionB: number;
  blend: BlendData;
} | null {
  const a = getDesignerProfile(handleA);
  const b = getDesignerProfile(handleB);
  if (!a || !b) return null;
  const verA = a.versions[a.versions.length - 1];
  const verB = b.versions[b.versions.length - 1];
  const blend = computeBlend(
    verA.data,
    verB.data,
    a.signals,
    b.signals,
    STUDIO_CATALOG.plates,
  );
  return {
    designerA: a,
    designerB: b,
    versionA: verA.version,
    versionB: verB.version,
    blend,
  };
}

export function createStudioInvite(inviterHandle: string, contextField: string | null = null): string {
  const state = readState();
  const token = `${inviterHandle.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`;
  state.invites[token] = {
    inviter: inviterHandle.toLowerCase(),
    contextField,
    createdAt: new Date().toISOString(),
  };
  writeState(state);
  if (supabase) {
    const sb = supabase;
    const inv = state.designers[inviterHandle.toLowerCase()];
    if (inv) {
      sb.from("profiles")
        .select("id")
        .eq("username", inv.username)
        .single()
        .then(({ data }) => {
          if (data?.id) {
            sb.from("blend_invites").insert({
              token,
              inviter_profile_id: data.id,
              context_field: contextField,
            });
          }
        });
    }
  }
  return token;
}

export function resolveStudioInvite(token: string): {
  inviter: DesignerRecord;
  contextField: string | null;
} | null {
  const state = readState();
  const entry = state.invites[token];
  if (entry) {
    const inv = state.designers[entry.inviter];
    if (inv) return { inviter: inv, contextField: entry.contextField };
  }
  const dashIdx = token.lastIndexOf("-");
  if (dashIdx > 0) {
    const maybeHandle = token.slice(0, dashIdx).toLowerCase();
    const inv = state.designers[maybeHandle];
    if (inv) return { inviter: inv, contextField: null };
  }
  return null;
}
