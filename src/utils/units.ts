import { MeasurementUnit } from "../types";

export function convertFromMeters(meters: number, unit: MeasurementUnit): number {
  if (isNaN(meters)) return 0;
  switch (unit) {
    case "cm":
      return Math.round(meters * 100);
    case "ft":
      return Number((meters * 3.28084).toFixed(2));
    case "in":
      return Math.round(meters * 39.3701);
    case "m":
    default:
      return Number(meters.toFixed(2));
  }
}

export function convertToMeters(value: number, unit: MeasurementUnit): number {
  if (isNaN(value)) return 0;
  switch (unit) {
    case "cm":
      return Number((value / 100).toFixed(2));
    case "ft":
      return Number((value / 3.28084).toFixed(2));
    case "in":
      return Number((value / 39.3701).toFixed(2));
    case "m":
    default:
      return Number(value.toFixed(2));
  }
}

export function formatDistance(meters: number, unit: MeasurementUnit, showUnit = true): string {
  const converted = convertFromMeters(meters, unit);
  if (!showUnit) return String(converted);

  switch (unit) {
    case "cm":
      return `${converted} cm`;
    case "ft":
      return `${converted} ft`;
    case "in":
      return `${converted} in`;
    case "m":
    default:
      return `${converted}m`;
  }
}

export function formatArea(widthMeters: number, lengthMeters: number, unit: MeasurementUnit): string {
  const sqMeters = widthMeters * lengthMeters;
  switch (unit) {
    case "cm": {
      const sqCm = (widthMeters * 100) * (lengthMeters * 100);
      return `${sqCm.toLocaleString()} cm²`;
    }
    case "ft": {
      const sqFt = sqMeters * 10.7639;
      return `${sqFt.toFixed(1)} sq ft`;
    }
    case "in": {
      const sqIn = sqMeters * 1550.003;
      return `${Math.round(sqIn).toLocaleString()} sq in`;
    }
    case "m":
    default:
      return `${sqMeters.toFixed(1)} m²`;
  }
}
