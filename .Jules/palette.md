## 2025-05-15 - Smart Paste for External IDs
**Learning:** Users frequently treat URL-embedded IDs as the primary way to share their profile. When an app asks for a specific numeric ID (like an FPL Team ID), providing "Smart Paste" logic that automatically extracts the ID from a pasted URL reduces cognitive load and eliminates manual editing.
**Action:** Look for opportunities to implement "Smart Paste" whenever a system-specific ID is required that also exists as part of a canonical URL.

## 2025-05-15 - Focus Indicators on Interactive Icons
**Learning:** Small interactive icons (like Info or Help icons) often have `focus:outline-none` applied to avoid default browser rings, but this makes keyboard navigation impossible.
**Action:** Always ensure `focus-visible` styles are explicitly defined for all interactive elements, especially small icon buttons.
