/**
 * Maps FPL player regions to IANA timezone identifiers
 * For countries spanning multiple timezones, we use the most populous/common timezone
 */
export const REGION_TO_TIMEZONE: Record<string, string> = {
    // Europe
    'England': 'Europe/London',
    'Scotland': 'Europe/London',
    'Wales': 'Europe/London',
    'Northern Ireland': 'Europe/London',
    'Ireland': 'Europe/Dublin',
    'Norway': 'Europe/Oslo',
    'Sweden': 'Europe/Stockholm',
    'Denmark': 'Europe/Copenhagen',
    'Germany': 'Europe/Berlin',
    'Netherlands': 'Europe/Amsterdam',
    'Belgium': 'Europe/Brussels',
    'France': 'Europe/Paris',
    'Spain': 'Europe/Madrid',
    'Portugal': 'Europe/Lisbon',
    'Italy': 'Europe/Rome',
    'Poland': 'Europe/Warsaw',
    'Romania': 'Europe/Bucharest',
    'Greece': 'Europe/Athens',
    'Turkey': 'Europe/Istanbul',
    'Russia': 'Europe/Moscow', // Most FPL users likely in western Russia
    
    // Asia
    'Singapore': 'Asia/Singapore',
    'India': 'Asia/Kolkata',
    'China': 'Asia/Shanghai',
    'Hong Kong': 'Asia/Hong_Kong',
    'Japan': 'Asia/Tokyo',
    'South Korea': 'Asia/Seoul',
    'Thailand': 'Asia/Bangkok',
    'Malaysia': 'Asia/Kuala_Lumpur',
    'Indonesia': 'Asia/Jakarta',
    'Philippines': 'Asia/Manila',
    'Vietnam': 'Asia/Ho_Chi_Minh',
    'Pakistan': 'Asia/Karachi',
    'Bangladesh': 'Asia/Dhaka',
    'United Arab Emirates': 'Asia/Dubai',
    'Saudi Arabia': 'Asia/Riyadh',
    'Israel': 'Asia/Jerusalem',
    
    // Americas
    'United States': 'America/New_York', // Eastern time (most populous)
    'Canada': 'America/Toronto', // Eastern Canada (most populous)
    'Mexico': 'America/Mexico_City',
    'Brazil': 'America/Sao_Paulo',
    'Argentina': 'America/Argentina/Buenos_Aires',
    'Chile': 'America/Santiago',
    'Colombia': 'America/Bogota',
    'Peru': 'America/Lima',
    'Venezuela': 'America/Caracas',
    
    // Oceania
    'Australia': 'Australia/Sydney', // Most populous eastern timezone
    'New Zealand': 'Pacific/Auckland',
    
    // Africa
    'South Africa': 'Africa/Johannesburg',
    'Nigeria': 'Africa/Lagos',
    'Kenya': 'Africa/Nairobi',
    'Egypt': 'Africa/Cairo',
    'Ghana': 'Africa/Accra',
    'Morocco': 'Africa/Casablanca',
    'Algeria': 'Africa/Algiers',
};

/**
 * Get the IANA timezone for a given region
 * Falls back to UTC if region not found
 */
export function getTimezoneForRegion(regionName: string): string {
    return REGION_TO_TIMEZONE[regionName] || 'UTC';
}

/**
 * Calculate the hours between a timestamp and a deadline, accounting for timezones
 * @param transferTime - ISO timestamp of when transfer was made
 * @param deadlineTime - ISO timestamp of the gameweek deadline (in UTC)
 * @returns Hours before deadline (positive) or after (negative)
 */
export function calculateHoursBeforeDeadline(
    transferTime: string,
    deadlineTime: string,
): number {
    const transferDate = new Date(transferTime);
    const deadlineDate = new Date(deadlineTime);
    
    const diffMs = deadlineDate.getTime() - transferDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return diffHours;
}

/**
 * Get the local time of day (in hours, 0-23) for a given timestamp in a timezone
 * Useful for detecting patterns like "always transfers at 2am" or "transfers during work hours"
 */
export function getLocalHourOfDay(timestamp: string, timezone: string): number {
    try {
        const date = new Date(timestamp);
        // Use Intl.DateTimeFormat to get hour in the target timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const hourPart = parts.find(part => part.type === 'hour');
        return hourPart ? parseInt(hourPart.value, 10) : 0;
    } catch {
        // Fallback to UTC if timezone is invalid
        return new Date(timestamp).getUTCHours();
    }
}

/**
 * Check if a transfer was made within the price rise window (7:30am-9:30am SGT)
 * Price changes happen at 9:30am SGT, so transfers in the 2 hours before indicate price chasing
 */
export function isWithinPriceRiseWindow(timestamp: string): boolean {
    try {
        const date = new Date(timestamp);
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Singapore',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        });
        const parts = formatter.formatToParts(date);
        const hourPart = parts.find(part => part.type === 'hour');
        const minutePart = parts.find(part => part.type === 'minute');
        
        if (!hourPart || !minutePart) return false;
        
        const hour = parseInt(hourPart.value, 10);
        const minute = parseInt(minutePart.value, 10);
        const timeInMinutes = hour * 60 + minute;
        
        // 7:30am SGT = 450 minutes, 9:30am SGT = 570 minutes
        const priceRiseWindowStart = 7 * 60 + 30; // 7:30am
        const priceRiseWindowEnd = 9 * 60 + 30;   // 9:30am
        
        return timeInMinutes >= priceRiseWindowStart && timeInMinutes <= priceRiseWindowEnd;
    } catch {
        return false;
    }
}
