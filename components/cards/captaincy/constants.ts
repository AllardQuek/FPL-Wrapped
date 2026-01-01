/**
 * Calculate accuracy color based on performance (for DARK background)
 * 80%+ = Excellent (bright green), 60-79% = Good (cyan), 40-59% = Average (yellow), <40% = Poor (lighter red for contrast)
 */
export const getAccuracyColor = (rate: number) => {
  if (rate >= 80) return 'text-[#00ff87]'; // Excellent - bright green
  if (rate >= 60) return 'text-[#37ffef]'; // Good - cyan
  if (rate >= 40) return 'text-[#fbbf24]'; // Average - yellow/amber
  return 'text-[#ff6b9d]'; // Poor - lighter/brighter red for dark background
};

/**
 * Calculate herd factor color and percentage (for LIGHT background)
 * Lower is better (independent thinking), higher means following the crowd
 */
export const getHerdColor = (percentage: number) => {
  if (percentage >= 80) return 'text-[#dc2626]'; // Very template - darker red for light bg
  if (percentage >= 60) return 'text-[#d97706]'; // Mostly template - darker amber/orange for light bg
  if (percentage >= 40) return 'text-[#0891b2]'; // Balanced - darker cyan for light bg
  return 'text-[#059669]'; // Differential captaincy - darker green for light bg
};
