# FPL Wrapped Documentation Index

Quick reference to all project documentation, organized by purpose and task.

---

## 🧠 Persona Engine (Core Logic)
*The "Brain" of FPL Wrapped. How we classify managers.*

- **[Manager Personas Reference](engine/manager-personas.md) ⭐** - The "Source of Truth" for all 16+ personas.
- **[Behavioral Signals](engine/behavioral-signals.md)** - How raw FPL data is translated into psychological signals.
- **[Algorithm V3 (Criteria-Based)](engine/persona-algorithm-v3-criteria-based.md)** - Technical breakdown of the scoring engine.
- **[Algorithm Improvements](engine/persona-algorithm-improvements.md)** - Evolution of the engine (Phase 1-3, including Centroid Scoring).
- **[Problem Analysis & Debugging](engine/persona-problem-analysis.md)** - Post-mortems on clustering issues (e.g., "The Emery Fix").
- **[Distribution Strategy](engine/persona-distribution-strategy.md)** - How we ensure a balanced and diverse user experience.

## 🎨 UX & Design Systems
*Visual language, navigation, and user flow.*

- **[Design Decisions](architecture/design-decisions.md)** - High-level architectural and design rationale.
- **[Navigation Enhancement](ux/navigation-enhancement.md)** - Strategy for the "Wrapped" story flow and user engagement.
- **[Progress Bar Options](ux/progress-bar-placement-options.md)** - UI/UX explorations for story progress tracking.
- **[Dynamic Season Summary](ux/dynamic-season-summary.md)** - Logic for generating the personalized season narrative.

## 🛠 Implementation & Architecture
*Technical details and framework choices.*

- **[Navigation Implementation](architecture/navigation-implementation.md)** - Code-level details of the navigation system.
- **[Next.js vs Vite](architecture/nextjs-vite.md)** - Why we chose Next.js and the resulting architectural benefits.
- **[Archetypes](architecture/archetypes.md)** - Early conceptual data structures and design thinking.
 - **[API Wrapper Patterns](architecture/api-wrappers.md)** - Rationale for thin HTTP wrappers, caching, and testability.

## ✍️ Content & Copy
*The "Voice" of the application.*

- **[Manager Quotes](content/quotes-managers.md)** - The specific personality-driven copy for each persona.
- **[Summary Quotes](content/quotes-summary.md)** - Narrative copy used in the season summary cards.
- **[Persona Review](engine/review-personas.md)** - Internal feedback and accuracy audits for persona assignments.

## 📚 Research & Reference
*Background knowledge and external resources.*

- **[Transfer Timing Psychology](research/transfer-timing-psychology.md)** - Deep dive into "Early vs. Panic" transfer behavior.
- **[Resources & Assets](research/resources.md)** - External links, image assets, and reference materials.

---

## 🛠 Task-Based Guide

| If you want to... | Go to... |
| :--- | :--- |
| **Debug a persona assignment** | [Problem Analysis](engine/persona-problem-analysis.md) & [Algorithm Improvements](engine/persona-algorithm-improvements.md) |
| **Add/Edit a Persona** | [Manager Personas](engine/manager-personas.md) & [Manager Quotes](content/quotes-managers.md) |
| **Change the Scoring Logic** | [Algorithm V3](engine/persona-algorithm-v3-criteria-based.md) & `lib/analysis/persona/scoring.ts` |
| **Update the UI/UX Flow** | [Navigation Enhancement](ux/navigation-enhancement.md) & [Design Decisions](architecture/design-decisions.md) |
| **Understand Data Signals** | [Behavioral Signals](engine/behavioral-signals.md) & [Transfer Timing Psychology](research/transfer-timing-psychology.md) |

---

## 🔗 Quick Code Links

**Persona Logic**: [lib/analysis/persona/index.ts](../lib/analysis/persona/index.ts)  
**Scoring Engine**: [lib/analysis/persona/scoring.ts](../lib/analysis/persona/scoring.ts)  
**Persona Images**: [lib/constants/persona-images.ts](../lib/constants/persona-images.ts)  
**Persona UI**: [components/cards/PersonaCard.tsx](../components/cards/PersonaCard.tsx)

---

**Last Updated**: January 1, 2026
