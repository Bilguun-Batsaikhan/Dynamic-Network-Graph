export const zonePalette = [
  {
    zone: "Internet",
    fill: "rgba(239, 68, 68, 0.20)",
    stroke: "rgba(239, 68, 68, 1.0)",
  }, // Red
  {
    zone: "DMZ",
    fill: "rgba(249, 115, 22, 0.18)",
    stroke: "rgba(249, 115, 22, 1.0)",
  }, // Orange
  {
    zone: "TPI",
    fill: "rgba(253, 224, 71, 0.18)",
    stroke: "rgba(234, 179, 8, 1.0)",
  }, // Yellow
  {
    zone: "ISZ",
    fill: "rgba(34, 197, 94, 0.16)",
    stroke: "rgba(34, 197, 94, 1.0)",
  }, // Green
  {
    zone: "Margherita",
    fill: "rgba(186, 230, 253, 0.25)",
    stroke: "rgba(14, 165, 233, 0.9)",
  }, // Light Blue
  {
    zone: "Private Cloud",
    fill: "rgba(30, 58, 138, 0.15)",
    stroke: "rgba(30, 58, 138, 1.0)",
  }, // Dark Blue
  {
    zone: "Public Cloud",
    fill: "rgba(224, 242, 254, 0.30)",
    stroke: "rgba(125, 211, 252, 0.8)",
  }, // Very Light Blue
];

export const zoneColorByName = new Map();

export function initZoneColors(root) {
  // root.children are the zones (SZ-1, SZ-2, ...)
  (root.children ?? []).forEach((z, i) => {
    zoneColorByName.set(z.name, zonePalette[i % zonePalette.length]);
  });
}

export function zoneColor(name) {
  return zoneColorByName.get(name) ?? zonePalette[0];
}
