/**
 * Convert HSL color values to Hex format
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string (e.g., "#ff0000")
 */
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Preset colors for voltage levels
 */
export const VOLTAGE_COLOUR_PRESET: Record<number, string> = {
  415: "#6fdd50",
  3300: "#8bb01c",
  6600: "#edbd0e",
  11000: "#e86033",
  22000: "#0eaaed",
};

/**
 * Generate a color mapping for an array of values
 * @param values - Array of values to map to colors
 * @param isVoltage - Whether the values are voltage levels
 * @returns Record mapping each value to a hex color
 */
export function generateColorMapping(
  values: (string | number)[],
  isVoltage: boolean = false
): Record<string | number, string> {
  const mapping: Record<string | number, string> = {};
  const differences = 12;

  for (let i = 0; i < values.length; i++) {
    // Use voltage preset if applicable
    if (isVoltage && typeof values[i] === "number" && values[i] in VOLTAGE_COLOUR_PRESET) {
      mapping[values[i]] = VOLTAGE_COLOUR_PRESET[values[i] as number];
      continue;
    }

    // Generate color based on position
    let percent = i / values.length;
    let angle = percent * 360;
    let mod = i % differences;
    angle = (angle + (360 / differences) * mod) % 360;
    mapping[values[i]] = hslToHex(angle, 80, 50);
  }

  return mapping;
}
