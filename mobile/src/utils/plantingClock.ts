import type { PlantingWindow } from "../types/cropCalendar";

export function plantingClock(window: PlantingWindow) {
  const startDays = new Date(
    Date.UTC(2024, window.start_month, 0),
  ).getUTCDate();
  const endDays = new Date(Date.UTC(2024, window.end_month, 0)).getUTCDate();
  const startAngle =
    (window.start_month - 1 + (window.start_day - 1) / startDays) * 30;
  const end = (window.end_month - 1 + window.end_day / endDays) * 30;
  const sweep = window.all_year ? 360 : (end - startAngle + 360) % 360 || 360;
  return { startAngle, endAngle: (startAngle + sweep) % 360, sweep };
}
