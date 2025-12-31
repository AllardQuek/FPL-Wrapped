/**
 * FPL Season Utilities
 * 
 * FPL seasons run from August to May:
 * - 2024/25 season: August 2024 - May 2025
 * - 2025/26 season: August 2025 - May 2026
 */

/**
 * Get the current FPL season string (e.g., "24/25", "25/26")
 * 
 * Logic:
 * - If current month is August-December: season is currentYear/nextYear
 * - If current month is January-July: season is previousYear/currentYear
 * 
 * @returns Season string in format "YY/YY" (e.g., "25/26")
 */
export function getCurrentFPLSeason(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11 (0 = January, 7 = August)

  let startYear: number;
  let endYear: number;

  // August (7) to December (11) = season starts this year
  if (currentMonth >= 7) {
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    // January (0) to July (6) = season started last year
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  // Format as YY/YY (e.g., 2025 -> 25)
  const startYearShort = startYear.toString().slice(-2);
  const endYearShort = endYear.toString().slice(-2);

  return `${startYearShort}/${endYearShort}`;
}

/**
 * Get the full FPL season string (e.g., "2024/25", "2025/26")
 * 
 * @returns Season string in format "YYYY/YY" (e.g., "2025/26")
 */
export function getCurrentFPLSeasonFull(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let startYear: number;
  let endYear: number;

  if (currentMonth >= 7) {
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  const endYearShort = endYear.toString().slice(-2);

  return `${startYear}/${endYearShort}`;
}

/**
 * Get the season years as separate numbers
 * 
 * @returns Object with startYear and endYear (e.g., { startYear: 2025, endYear: 2026 })
 */
export function getCurrentFPLSeasonYears(): { startYear: number; endYear: number } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let startYear: number;
  let endYear: number;

  if (currentMonth >= 7) {
    startYear = currentYear;
    endYear = currentYear + 1;
  } else {
    startYear = currentYear - 1;
    endYear = currentYear;
  }

  return { startYear, endYear };
}

/**
 * Check if we're currently in an active FPL season
 * (August to May is active, June-July is off-season)
 * 
 * @returns true if currently in season, false if off-season
 */
export function isInFPLSeason(): boolean {
  const currentMonth = new Date().getMonth();
  // June (5) and July (6) are off-season
  return currentMonth !== 5 && currentMonth !== 6;
}
