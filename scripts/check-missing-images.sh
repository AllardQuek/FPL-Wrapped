#!/bin/bash

# Better audit script that shows exactly what's missing
# Usage: bash scripts/check-missing-images.sh

echo "🎭 Persona Image Status Report"
echo "================================================"
echo ""

# Define expected images based on code
declare -A EXPECTED_IMAGES=(
  ["PEP"]="pep-guardiola-bald-genius.jpg"
  ["MOYES"]="david-moyes-reliable.jpg"
  ["REDKNAPP"]="harry-redknapp-wheeler-dealer.jpg"
  ["MOURINHO"]="jose-mourinho-special-one.jpg"
  ["KLOPP"]="jurgen-klopp-heavy-metal.jpg"
  ["AMORIM"]="ruben-amorim-stubborn-one.jpg"
  ["FERGUSON"]="alex-ferguson-goat.jpg"
  ["POSTECOGLOU"]="ange-postecoglou-all-outer.jpg"
  ["EMERY"]="unai-emery-methodical.jpg"
  ["WENGER"]="arsene-wenger-professor.jpg"
  ["ANCELOTTI"]="carlo-ancelotti-calm-conductor.jpg"
  ["MARESCA"]="enzo-maresca-system-builder.jpg"
  ["ARTETA"]="mikel-arteta-process-manager.jpg"
  ["SIMEONE"]="diego-simeone-warrior.jpg"
  ["SLOT"]="arne-slot-optimizer.jpg"
  ["TENHAG"]="erik-ten-hag-rebuilder.jpg"
)

PERSONA_DIR="public/images/personas"
cd "$PERSONA_DIR" || exit 1

FOUND=0
MISSING=0
RENAME_NEEDED=0

echo "✅ Images Found:"
echo "-------------------------------------------"
for key in "${!EXPECTED_IMAGES[@]}"; do
  file="${EXPECTED_IMAGES[$key]}"
  if [ -f "$file" ]; then
    echo "   ✓ $file"
    ((FOUND++))
  fi
done | sort

echo ""
echo "❌ Images Missing:"
echo "-------------------------------------------"
for key in "${!EXPECTED_IMAGES[@]}"; do
  file="${EXPECTED_IMAGES[$key]}"
  if [ ! -f "$file" ]; then
    echo "   ✗ $file (for $key)"
    ((MISSING++))
  fi
done | sort

echo ""
echo "⚠️  Images That Need Renaming:"
echo "-------------------------------------------"
# Check for pep-guardiola-overthinker.jpg (old name)
if [ -f "pep-guardiola-overthinker.jpg" ]; then
  echo "   → pep-guardiola-overthinker.jpg → pep-guardiola-bald-genius.jpg"
  ((RENAME_NEEDED++))
fi

echo ""
echo "📊 Summary:"
echo "================================================"
echo "Total personas:     17"
echo "Images found:       $FOUND"
echo "Images missing:     $MISSING"
echo "Renames needed:     $RENAME_NEEDED"
echo ""

if [ $MISSING -eq 0 ] && [ $RENAME_NEEDED -eq 0 ]; then
  echo "✨ All persona images are ready!"
else
  echo "⚠️  Action needed:"
  [ $RENAME_NEEDED -gt 0 ] && echo "   - Rename $RENAME_NEEDED file(s)"
  [ $MISSING -gt 0 ] && echo "   - Add $MISSING missing image(s)"
fi

echo ""
echo "🔍 Current files in directory:"
echo "-------------------------------------------"
ls -1 *.jpg 2>/dev/null | sort
