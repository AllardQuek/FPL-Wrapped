#!/bin/bash

# Script to standardize persona images
# This script converts all images to a consistent format, size, and quality
#
# Requirements:
#   - ImageMagick (brew install imagemagick)
#   - cwebp (brew install webp) - if using WebP format
#
# Usage:
#   bash scripts/standardize-persona-images.sh [format]
#   format: 'jpeg' (default) or 'webp'

set -e

PERSONA_DIR="public/images/personas"
BACKUP_DIR="public/images/personas/backup_$(date +%Y%m%d_%H%M%S)"
TARGET_SIZE="400x400"  # Square format for circular avatars
QUALITY=85              # JPEG quality (1-100)
FORMAT="${1:-jpeg}"     # Default to JPEG

echo "🎨 Persona Image Standardization"
echo "================================================"
echo "Format: $FORMAT"
echo "Target Size: $TARGET_SIZE"
echo "Quality: $QUALITY"
echo ""

# Check for ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ Error: ImageMagick is not installed"
    echo "Install with: brew install imagemagick"
    exit 1
fi

if [ "$FORMAT" == "webp" ] && ! command -v cwebp &> /dev/null; then
    echo "❌ Error: cwebp is not installed"
    echo "Install with: brew install webp"
    exit 1
fi

# Create backup directory
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp "$PERSONA_DIR"/*.jpg "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup created at: $BACKUP_DIR"
echo ""

# Process each image
echo "🔄 Processing images..."
cd "$PERSONA_DIR" || exit 1

for img in *.jpg; do
    if [ -f "$img" ]; then
        echo "  Processing: $img"
        
        # Get original dimensions
        original_dims=$(identify -format "%wx%h" "$img" 2>/dev/null || echo "unknown")
        
        if [ "$FORMAT" == "webp" ]; then
            # Convert to WebP
            temp_output="${img%.jpg}.webp"
            
            # Use ImageMagick to resize and center, then convert to WebP
            convert "$img" \
                -resize "${TARGET_SIZE}^" \
                -gravity center \
                -extent "$TARGET_SIZE" \
                -quality $QUALITY \
                "$temp_output"
            
            echo "    ✅ Converted: $original_dims → $TARGET_SIZE (WebP)"
        else
            # Process as JPEG
            temp_file="${img}.tmp"
            
            # Resize and center crop to square
            convert "$img" \
                -resize "${TARGET_SIZE}^" \
                -gravity center \
                -extent "$TARGET_SIZE" \
                -quality $QUALITY \
                -strip \
                "$temp_file"
            
            # Replace original
            mv "$temp_file" "$img"
            
            echo "    ✅ Standardized: $original_dims → $TARGET_SIZE (JPEG)"
        fi
    fi
done

echo ""
echo "✅ Processing complete!"
echo ""

# Show results
echo "📊 Results:"
echo "-------------------------------------------"

if [ "$FORMAT" == "webp" ]; then
    echo "ℹ️  Images converted to WebP format"
    echo "⚠️  Don't forget to:"
    echo "   1. Rename .jpg files to .webp"
    echo "   2. Update persona-images.ts mappings"
    echo ""
    ls -lh *.webp 2>/dev/null | tail -n +2 | awk '{print $9, "-", $5}'
else
    ls -lh *.jpg | tail -n +2 | awk '{print $9, "-", $5}'
fi

echo ""
echo "🎯 Next steps:"
echo "1. Review the standardized images"
echo "2. If satisfied, delete backup: rm -rf $BACKUP_DIR"
echo "3. If not satisfied, restore: cp $BACKUP_DIR/* $PERSONA_DIR/"
echo ""
