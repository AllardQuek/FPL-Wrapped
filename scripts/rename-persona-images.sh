#!/bin/bash

# Script to rename persona image files to new naming convention
# Usage: bash scripts/rename-persona-images.sh

PERSONA_DIR="public/images/personas"

echo "🎭 Renaming persona images to new convention..."
echo "================================================"

cd "$PERSONA_DIR" || exit 1

# Function to safely rename if file exists
safe_rename() {
    local old_name=$1
    local new_name=$2
    
    if [ -f "$old_name" ]; then
        echo "✅ Renaming: $old_name → $new_name"
        mv "$old_name" "$new_name"
    else
        echo "⚠️  File not found: $old_name"
    fi
}

# Rename existing files to new convention
safe_rename "the-tinkerman.jpg" "pep-guardiola-overthinker.jpg"
safe_rename "the-reliable.jpg" "david-moyes-reliable.jpg"
safe_rename "the-wheeler-dealer.jpg" "harry-redknapp-wheeler-dealer.jpg"
safe_rename "the-pragmatist.jpg" "jose-mourinho-special-one.jpg"
safe_rename "jose-mourinho-pragmatist.jpg" "jose-mourinho-special-one.jpg"
safe_rename "the-romantic.jpg" "jurgen-klopp-heavy-metal.jpg"
safe_rename "the-innovator.jpg" "ruben-amorim-stubborn-one.jpg"
safe_rename "ruben-amorim-tactical-genius.jpg" "ruben-amorim-stubborn-one.jpg"
safe_rename "the-steady-hand.jpg" "sean-dyche-survivalist.jpg"
safe_rename "the-goat.jpg" "alex-ferguson-goat.jpg"
safe_rename "the-chaos-agent.jpg" "ange-postecoglou-all-outer.jpg"
safe_rename "the-philosopher.jpg" "arsene-wenger-professor.jpg"

# Fix typo in Mikel's name
safe_rename "mike-arteta.jpg" "mikel-arteta-process-manager.jpg"

# Rename new additions
safe_rename "arne-slot.jpg" "arne-slot-optimizer.jpg"
safe_rename "carlo-ancelotti.jpg" "carlo-ancelotti-calm-conductor.jpg"
safe_rename "diego-simeone.jpg" "diego-simeone-warrior.jpg"

echo ""
echo "✨ Renaming complete!"
echo ""
echo "📋 Missing persona images (need to be added):"
echo "   - unai-emery-methodical.jpg"
echo "   - sam-allardyce-fireman.jpg"
echo "   - marcelo-bielsa-extremist.jpg"
echo "   - antonio-conte-driller.jpg"
echo "   - erik-ten-hag-rebuilder.jpg"
echo ""
echo "Current files in $PERSONA_DIR:"
ls -1 *.jpg 2>/dev/null || echo "No .jpg files found"
