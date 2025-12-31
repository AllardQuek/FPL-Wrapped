#!/bin/bash

# Script to standardize persona images using macOS built-in sips
# No external dependencies required!
#
# Usage:
#   bash scripts/standardize-persona-images-sips.sh

set -e

PERSONA_DIR="public/images/personas"
BACKUP_DIR="public/images/personas/backup_$(date +%Y%m%d_%H%M%S)"
TARGET_SIZE=400         # Square: 400x400
FORMAT="jpeg"

echo "🎨 Persona Image Standardization (using sips)"
echo "================================================"
echo "Format: $FORMAT"
echo "Target Size: ${TARGET_SIZE}x${TARGET_SIZE}"
echo ""

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
        width=$(sips -g pixelWidth "$img" | grep pixelWidth | awk '{print $2}')
        height=$(sips -g pixelHeight "$img" | grep pixelHeight | awk '{print $2}')
        format=$(sips -g format "$img" | grep format | awk '{print $2}')
        
        echo "    Original: ${width}x${height} (${format})"
        
        # Convert to JPEG if it's WebP
        if [ "$format" = "webp" ]; then
            echo "    Converting WebP to JPEG..."
            # sips can't directly convert webp, so we need a workaround
            # Create a temporary PNG first, then convert to JPEG
            temp_png="${img%.jpg}.png"
            sips -s format png "$img" --out "$temp_png" > /dev/null 2>&1
            mv "$temp_png" "$img"
        fi
        
        # Determine which dimension is smaller and resize accordingly
        if [ "$width" -lt "$height" ]; then
            # Width is smaller, so it's portrait - resize by width
            sips -z $TARGET_SIZE $TARGET_SIZE "$img" > /dev/null 2>&1
        else
            # Height is smaller or square - resize by height
            sips -z $TARGET_SIZE $TARGET_SIZE "$img" > /dev/null 2>&1
        fi
        
        # Convert to JPEG with specified quality
        sips -s format jpeg "$img" > /dev/null 2>&1
        
        # Get new file size
        file_size=$(du -h "$img" | awk '{print $1}')
        
        echo "    ✅ Standardized: ${TARGET_SIZE}x${TARGET_SIZE} (JPEG, $file_size)"
    fi
done

echo ""
echo "✅ Processing complete!"
echo ""

# Show results
echo "📊 Results:"
echo "-------------------------------------------"
for img in *.jpg; do
    if [ -f "$img" ]; then
        size=$(sips -g pixelWidth "$img" | grep pixelWidth | awk '{print $2}')
        height=$(sips -g pixelHeight "$img" | grep pixelHeight | awk '{print $2}')
        file_size=$(du -h "$img" | awk '{print $1}')
        echo "$img - ${size}x${height} - $file_size"
    fi
done

echo ""
echo "🎯 Next steps:"
echo "1. Review the standardized images"
echo "2. Test in the application"
echo "3. If satisfied, delete backup: rm -rf $BACKUP_DIR"
echo "4. If not satisfied, restore: cp $BACKUP_DIR/* $PERSONA_DIR/"
echo ""
