# Persona Images Audit Report

## Issues Found

### 1. **Inconsistent File Formats**
- **Mixed formats**: Some images are JPEG, others are WebP (despite .jpg extension)
- **WebP images disguised as JPEG**: 10 files have `.jpg` extension but are actually WebP format
- **True JPEG images**: Only 6 files are actual JPEG format

#### Format Breakdown:
- **WebP files** (10): ange-postecoglou, arne-slot, carlo-ancelotti, diego-simeone, erik-ten-hag, jose-mourinho, mikel-arteta, pep-guardiola, unai-emery
- **JPEG files** (6): alex-ferguson, arsene-wenger, david-moyes, enzo-maresca, harry-redknapp, jurgen-klopp, ruben-amorim

### 2. **Inconsistent Dimensions**
Images have wildly different sizes, which will affect loading performance and display consistency:

| Image | Dimensions | Aspect Ratio |
|-------|------------|--------------|
| alex-ferguson | 202x250 | ~0.8 (portrait) |
| ange-postecoglou | 300x390 | ~0.77 (portrait) |
| arne-slot | 300x390 | ~0.77 (portrait) |
| **arsene-wenger** | **780x780** | **1.0 (square)** ⚠️ |
| carlo-ancelotti | 324x324 | 1.0 (square) |
| david-moyes | 225x225 | 1.0 (square) |
| diego-simeone | 300x390 | ~0.77 (portrait) |
| enzo-maresca | 201x251 | ~0.8 (portrait) |
| erik-ten-hag | 300x390 | ~0.77 (portrait) |
| harry-redknapp | 225x225 | 1.0 (square) |
| jose-mourinho | 286x286 | 1.0 (square) |
| jurgen-klopp | 225x225 | 1.0 (square) |
| mikel-arteta | 300x390 | ~0.77 (portrait) |
| pep-guardiola | 250x250 | 1.0 (square) |
| ruben-amorim | 199x253 | ~0.79 (portrait) |
| unai-emery | 300x390 | ~0.77 (portrait) |

### 3. **Inconsistent File Sizes**
- **Smallest**: 8KB (multiple JPEG files)
- **Largest**: 128KB (arsene-wenger) - 16x larger than smallest!
- **Most WebP files**: 12-32KB

### 4. **Quality Issues**
- Very small dimensions (199-250px) may appear pixelated on modern displays
- Arsene Wenger at 780x780 is oversized compared to others
- Mixed aspect ratios (square vs portrait) will cause layout inconsistencies

## Recommendations

### Option 1: Standardize to Square Format (Recommended for UI consistency)
**Target**: 400x400px, JPEG format, ~50KB file size
- ✅ Consistent with circular avatar design
- ✅ Better for both PersonaCard (128px) and SummaryCard (96-128px)
- ✅ Simple cropping - focus on face
- ✅ Good balance of quality and file size

### Option 2: Standardize to Portrait Format
**Target**: 400x520px (portrait), JPEG format, ~60KB file size
- ✅ More professional headshot look
- ⚠️ May need adjustment to circular displays
- ✅ Better for future rectangular card designs

### Option 3: Convert to WebP with Standardization
**Target**: 400x400px, WebP format, ~20-30KB file size
- ✅ Smallest file sizes (better performance)
- ✅ Better compression than JPEG
- ⚠️ Need to rename .jpg to .webp
- ⚠️ Slightly less browser compatibility (though 95%+ support)

## Recommended Actions

1. **Standardize format**: Convert all to JPEG or all to WebP (not mixed)
2. **Standardize dimensions**: 400x400px square (or 400x520px portrait)
3. **Optimize compression**: Target 40-60KB for JPEG, 20-30KB for WebP
4. **Background removal**: Consider removing backgrounds for cleaner look
5. **Face centering**: Ensure all faces are centered in the frame
6. **Color correction**: Normalize brightness/contrast across all images

## Implementation Script Needed

A script that:
1. Converts all images to target format
2. Resizes to standard dimensions
3. Applies face detection to center faces
4. Optimizes compression
5. Optionally removes backgrounds
