import type { Lang } from "./types";

export interface RegionRecommendation {
  state: string;
  recommendedLanguages: Lang[];
  detectedVia: "gps" | "manual" | "default";
}

// Configurable region-to-language mappings
export const REGION_LANGUAGE_MAP: Record<string, { label: string; languages: Lang[] }> = {
  karnataka: {
    label: "Karnataka",
    languages: ["kn", "en", "hi"],
  },
  maharashtra: {
    label: "Maharashtra",
    languages: ["mr", "hi", "en"],
  },
  tamilnadu: {
    label: "Tamil Nadu",
    languages: ["ta", "en", "hi"],
  },
  telangana: {
    label: "Telangana / Andhra Pradesh",
    languages: ["te", "en", "hi"],
  },
  westbengal: {
    label: "West Bengal",
    languages: ["bn", "en", "hi"],
  },
  gujarat: {
    label: "Gujarat",
    languages: ["gu", "hi", "en"],
  },
  delhi_ncr: {
    label: "Delhi / NCR / Uttar Pradesh / Bihar",
    languages: ["hi", "hinglish", "en"],
  },
  rajasthan_mp: {
    label: "Rajasthan / Madhya Pradesh",
    languages: ["hi", "en"],
  },
};

/**
 * Approximate GPS coordinates bounding box to Indian state
 * Coordinates are processed locally and discarded immediately.
 */
export function approximateStateFromCoords(lat: number, lon: number): string {
  // Karnataka (approx 11.5°N - 18.5°N, 74.0°E - 78.6°E)
  if (lat >= 11.5 && lat <= 18.5 && lon >= 74.0 && lon <= 78.6) {
    return "karnataka";
  }
  // Maharashtra (approx 15.6°N - 22.1°N, 72.6°E - 80.9°E)
  if (lat >= 15.6 && lat <= 22.1 && lon >= 72.6 && lon <= 80.9) {
    return "maharashtra";
  }
  // Tamil Nadu (approx 8.0°N - 13.5°N, 76.2°E - 80.4°E)
  if (lat >= 8.0 && lat <= 13.5 && lon >= 76.2 && lon <= 80.4) {
    return "tamilnadu";
  }
  // Gujarat (approx 20.1°N - 24.7°N, 68.1°E - 74.5°E)
  if (lat >= 20.1 && lat <= 24.7 && lon >= 68.1 && lon <= 74.5) {
    return "gujarat";
  }
  // West Bengal (approx 21.5°N - 27.3°N, 85.8°E - 89.9°E)
  if (lat >= 21.5 && lat <= 27.3 && lon >= 85.8 && lon <= 89.9) {
    return "westbengal";
  }
  // Telangana / Andhra Pradesh (approx 12.6°N - 19.9°N, 76.7°E - 84.8°E)
  if (lat >= 12.6 && lat <= 19.9 && lon >= 76.7 && lon <= 84.8) {
    return "telangana";
  }
  // Default to Hindi belt (Delhi/NCR, UP, MP)
  return "delhi_ncr";
}

/**
 * Requests location with explicit user permission, converts to approximate region,
 * and discards exact coordinates.
 */
export async function detectRegion(): Promise<RegionRecommendation> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return {
      state: "delhi_ncr",
      recommendedLanguages: REGION_LANGUAGE_MAP.delhi_ncr.languages,
      detectedVia: "default",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const regionKey = approximateStateFromCoords(latitude, longitude);
        const match = REGION_LANGUAGE_MAP[regionKey] || REGION_LANGUAGE_MAP.delhi_ncr;
        resolve({
          state: regionKey,
          recommendedLanguages: match.languages,
          detectedVia: "gps",
        });
      },
      () => {
        // Fallback on permission denied or error
        resolve({
          state: "delhi_ncr",
          recommendedLanguages: REGION_LANGUAGE_MAP.delhi_ncr.languages,
          detectedVia: "default",
        });
      },
      { timeout: 7000, enableHighAccuracy: false }
    );
  });
}
