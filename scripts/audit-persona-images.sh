#!/bin/bash

# Script to audit persona images and show what's missing
# Usage: bash scripts/audit-persona-images.sh

PERSONA_DIR="public/images/personas"
PERSONA_FILE="lib/analysis/persona.ts"

echo "🎭 Persona Image Audit"
echo "================================================"
echo ""

# Extract persona keys from persona.ts
echo "📋 Extracting personas from code..."
PERSONAS=$(grep -E "^\s+[A-Z]+:" "$PERSONA_FILE" | sed 's/://g' | sed 's/^[[:space:]]*//' | sort)

echo ""
echo "✅ Total personas defined in code:"
echo "$PERSONAS" | wc -l | xargs echo
echo ""

# List actual image files
echo "📁 Checking images directory..."
cd "$PERSONA_DIR" || exit 1

ACTUAL_COUNT=$(ls -1 *.jpg 2>/dev/null | wc -l | xargs)
echo "✅ Total image files found: $ACTUAL_COUNT"
echo ""

# Expected images from persona-images.ts mapping
echo "🔍 Expected images (from persona-images.ts):"
echo "-------------------------------------------"
grep -E "^\s+[A-Z]+:" ../../lib/constants/persona-images.ts | \
  sed "s/.*: '//" | sed "s/',//" | sort

echo ""
echo "📸 Actual images in directory:"
echo "-------------------------------------------"
ls -1 *.jpg 2>/dev/null | sort

echo ""
echo "❌ Missing images (expected but not found):"
echo "-------------------------------------------"

# Get expected filenames
EXPECTED_FILES=$(grep -E "^\s+[A-Z]+:" ../../lib/constants/persona-images.ts | \
  sed "s/.*: '//" | sed "s/',//" | sort)

for file in $EXPECTED_FILES; do
    if [ ! -f "$file" ]; then
        echo "   ⚠️  $file"
    fi
done

echo ""
echo "📊 Summary:"
echo "================================================"
PERSONAS_COUNT=$(echo "$PERSONAS" | wc -l | xargs)
EXPECTED_COUNT=$(echo "$EXPECTED_FILES" | wc -l | xargs)
MISSING_COUNT=$(echo "$EXPECTED_FILES" | while read f; do [ ! -f "$f" ] && echo "x"; done | wc -l | xargs)

echo "Personas defined: $PERSONAS_COUNT"
echo "Images expected:  $EXPECTED_COUNT"
echo "Images found:     $ACTUAL_COUNT"
echo "Images missing:   $MISSING_COUNT"
echo ""

if [ "$MISSING_COUNT" -eq 0 ]; then
    echo "✨ All persona images are present!"
else
    echo "⚠️  Please add the missing images above"
fi
