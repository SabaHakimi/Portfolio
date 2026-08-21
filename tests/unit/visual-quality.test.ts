import { describe, expect, it } from "vitest";
import {
  includesBloom,
  includesEnvironment,
  lowerVisualQuality,
  parseVisualEffectsMode,
  parseVisualQualityTier,
  raiseVisualQuality,
  recommendVisualQuality,
  shouldShowPerformanceDiagnostics,
  shouldUseBloom,
} from "@/lib/visual-quality";

describe("visual quality profiles", () => {
  it("selects a conservative profile for constrained hardware", () => {
    expect(
      recommendVisualQuality({
        deviceMemory: 4,
        devicePixelRatio: 2,
        hardwareConcurrency: 8,
      }),
    ).toBe("economy");
  });

  it("selects high quality only when the device signals support it", () => {
    expect(
      recommendVisualQuality({
        deviceMemory: 16,
        devicePixelRatio: 2,
        hardwareConcurrency: 12,
      }),
    ).toBe("high");
    expect(
      recommendVisualQuality({
        deviceMemory: 8,
        devicePixelRatio: 3,
        hardwareConcurrency: 12,
      }),
    ).toBe("balanced");
  });

  it("moves between adjacent tiers without exceeding the tier range", () => {
    expect(lowerVisualQuality("high")).toBe("balanced");
    expect(lowerVisualQuality("economy")).toBe("economy");
    expect(raiseVisualQuality("economy")).toBe("balanced");
    expect(raiseVisualQuality("high")).toBe("high");
  });

  it("accepts only supported development overrides", () => {
    expect(parseVisualQualityTier("high")).toBe("high");
    expect(parseVisualQualityTier("ultra")).toBeNull();
    expect(parseVisualEffectsMode("environment")).toBe("environment");
    expect(parseVisualEffectsMode("noise")).toBeNull();
  });

  it("isolates bloom and environment effect groups", () => {
    expect(includesBloom("bloom")).toBe(true);
    expect(includesBloom("environment")).toBe(false);
    expect(includesEnvironment("environment")).toBe(true);
    expect(includesEnvironment("off")).toBe(false);
  });

  it("removes the post-processing pass from the economy tier", () => {
    expect(shouldUseBloom("full", "economy")).toBe(false);
    expect(shouldUseBloom("bloom", "economy")).toBe(false);
    expect(shouldUseBloom("full", "balanced")).toBe(true);
    expect(shouldUseBloom("full", "high")).toBe(true);
  });

  it("shows diagnostics by default only during development", () => {
    expect(shouldShowPerformanceDiagnostics(null, true)).toBe(true);
    expect(shouldShowPerformanceDiagnostics(null, false)).toBe(false);
  });

  it("supports production opt-in and development opt-out", () => {
    expect(shouldShowPerformanceDiagnostics("1", false)).toBe(true);
    expect(shouldShowPerformanceDiagnostics("0", true)).toBe(false);
  });
});
