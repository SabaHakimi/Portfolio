export const visualQualityTiers = ["economy", "balanced", "high"] as const;

export type VisualQualityTier = (typeof visualQualityTiers)[number];

export const visualEffectsModes = [
  "full",
  "bloom",
  "environment",
  "off",
] as const;

export type VisualEffectsMode = (typeof visualEffectsModes)[number];

export type VisualQualityProfile = {
  readonly dpr: readonly [number, number];
  readonly particleCount: number;
  readonly pulseCount: number;
  readonly bloomIntensity: number;
  readonly bloomResolutionScale: number;
};

export const visualQualityProfiles: Record<
  VisualQualityTier,
  VisualQualityProfile
> = {
  economy: {
    dpr: [1, 1],
    particleCount: 96,
    pulseCount: 5,
    bloomIntensity: 0,
    bloomResolutionScale: 0.25,
  },
  balanced: {
    dpr: [1, 1.35],
    particleCount: 220,
    pulseCount: 11,
    bloomIntensity: 0.34,
    bloomResolutionScale: 0.5,
  },
  high: {
    dpr: [1, 1.65],
    particleCount: 360,
    pulseCount: 18,
    bloomIntensity: 0.43,
    bloomResolutionScale: 0.65,
  },
};

export type DeviceQualitySignals = {
  readonly deviceMemory?: number;
  readonly devicePixelRatio: number;
  readonly hardwareConcurrency: number;
};

export function recommendVisualQuality({
  deviceMemory,
  devicePixelRatio,
  hardwareConcurrency,
}: DeviceQualitySignals): VisualQualityTier {
  if (
    hardwareConcurrency <= 4 ||
    (deviceMemory !== undefined && deviceMemory <= 4)
  ) {
    return "economy";
  }

  if (
    hardwareConcurrency >= 10 &&
    (deviceMemory === undefined || deviceMemory >= 8) &&
    devicePixelRatio <= 2.25
  ) {
    return "high";
  }

  return "balanced";
}

export function lowerVisualQuality(
  tier: VisualQualityTier,
): VisualQualityTier {
  if (tier === "high") return "balanced";
  return "economy";
}

export function raiseVisualQuality(
  tier: VisualQualityTier,
): VisualQualityTier {
  if (tier === "economy") return "balanced";
  return "high";
}

export function parseVisualQualityTier(
  value: string | null,
): VisualQualityTier | null {
  return visualQualityTiers.find((tier) => tier === value) ?? null;
}

export function parseVisualEffectsMode(
  value: string | null,
): VisualEffectsMode | null {
  return visualEffectsModes.find((mode) => mode === value) ?? null;
}

export function includesBloom(mode: VisualEffectsMode) {
  return mode === "full" || mode === "bloom";
}

export function includesEnvironment(mode: VisualEffectsMode) {
  return mode === "full" || mode === "environment";
}

export function shouldUseBloom(
  mode: VisualEffectsMode,
  tier: VisualQualityTier,
) {
  return tier !== "economy" && includesBloom(mode);
}

export function shouldShowPerformanceDiagnostics(
  value: string | null,
  development: boolean,
) {
  if (value === "1") return true;
  if (value === "0") return false;
  return development;
}
