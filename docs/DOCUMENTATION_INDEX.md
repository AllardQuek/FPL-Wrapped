# FPL Wrapped Documentation Index

Quick reference to all project documentation, organized by purpose and task.

---

## 🚀 Product Docs

- **[Wrapped Product README](wrapped/README.md) ⭐** - Canonical product docs for the original Wrapped experience.
- **[Chat Product README](chat/README.md) ⭐** - Canonical product docs for Elastic-powered chat and Telegram.
- **[Chat Architecture Hub](chat/architecture/README.md)** - Domain architecture docs for chat runtime, indexing, Agent Builder, charts, and Telegram.

## 🧠 Persona Engine (Core Logic)
*The "Brain" of FPL Wrapped. How we classify managers.*

- **[Manager Personas Reference](wrapped/engine/manager-personas.md) ⭐** - The "Source of Truth" for all 16+ personas.
- **[Behavioral Signals](wrapped/engine/behavioral-signals.md)** - How raw FPL data is translated into psychological signals.
- **[Algorithm V3 (Criteria-Based)](wrapped/engine/persona-algorithm-v3-criteria-based.md)** - Technical breakdown of the scoring engine.
- **[Algorithm Improvements](wrapped/engine/persona-algorithm-improvements.md)** - Evolution of the engine (Phase 1-3, including Centroid Scoring).
- **[Problem Analysis & Debugging](wrapped/engine/persona-problem-analysis.md)** - Post-mortems on clustering issues (e.g., "The Emery Fix").
- **[Distribution Strategy](wrapped/engine/persona-distribution-strategy.md)** - How we ensure a balanced and diverse user experience.
- **[Transfer Efficiency Grading](wrapped/engine/transfer-efficiency-grading.md)** - Grading system for transfer effectiveness.

## 🎨 UX & Design Systems
*Visual language, navigation, and user flow.*

- **[Design Decisions](wrapped/architecture/design-decisions.md)** - High-level architectural and design rationale.
- **[Navigation Enhancement](wrapped/ux/navigation-enhancement.md)** - Strategy for the "Wrapped" story flow and user engagement.
- **[Progress Bar Options](wrapped/ux/progress-bar-placement-options.md)** - UI/UX explorations for story progress tracking.
- **[Dynamic Season Summary](wrapped/ux/dynamic-season-summary.md)** - Logic for generating the personalized season narrative.
- **[Chat Interface Rationale](wrapped/ux/chat-interface-rationale.md)** - Design thinking behind the conversational query interface.

## 🛠 Implementation & Architecture
*Technical details and framework choices.*

- **[Navigation Implementation](wrapped/architecture/navigation-implementation.md)** - Code-level details of the navigation system.
- **[Next.js vs Vite](wrapped/architecture/nextjs-vite.md)** - Why we chose Next.js and the resulting architectural benefits.
- **[Archetypes](wrapped/architecture/archetypes.md)** - Early conceptual data structures and design thinking.
- **[API Wrapper Patterns](wrapped/architecture/api-wrappers.md)** - Rationale for thin HTTP wrappers, caching, and testability.
- **[Telegram Bot Architecture](wrapped/architecture/telegram-bot.md)** - Handling long-running tasks and webhook retries.
- **[Elasticsearch Denormalization](wrapped/architecture/elasticsearch-denormalization.md)** - Flattening nested fields for ES|QL compatibility.
- **[Scripts Standardization Guide](wrapped/scripts/STANDARDIZATION_GUIDE.md)** - Image naming and standardization process for script workflows.
- **[Scripts Image Audit Report](wrapped/scripts/IMAGE_AUDIT_REPORT.md)** - Current image audit output and findings.

## ✍️ Content & Copy
*The "Voice" of the application.*

- **[Manager Quotes](wrapped/content/quotes-managers.md)** - The specific personality-driven copy for each persona.
- **[Summary Quotes](wrapped/content/quotes-summary.md)** - Narrative copy used in the season summary cards.
- **[Persona Review](wrapped/engine/review-personas.md)** - Internal feedback and accuracy audits for persona assignments.

## 📚 Research & Reference
*Background knowledge and external resources.*

- **[Transfer Timing Psychology](wrapped/research/transfer-timing-psychology.md)** - Deep dive into "Early vs. Panic" transfer behavior.
- **[Resources & Assets](wrapped/research/resources.md)** - External links, image assets, and reference materials.

### 🔍 Elasticsearch & AI Integration
- **[Elastic Chat Product README](chat/README.md) ⭐** - End-to-end overview of chat capabilities, APIs, indexing workflows, Telegram integration, and Vega charting.
- **[Chat Architecture Hub](chat/architecture/README.md) ⭐** - Canonical architecture navigation for chat runtime, ES/indexing, Agent Builder, charts, and Telegram.
- **[System Overview](chat/architecture/system-flow.md)** - End-to-end system and sequence diagrams for web + Telegram chat.
- **[Elasticsearch & Indexing Architecture](chat/architecture/elasticsearch-indexing.md)** - Index responsibilities, execution lifecycle, and indexing API flow.
- **[Agent Builder Integration](chat/architecture/agent-builder.md)** - Tool/workflow boundaries and streaming event contract.
- **[Charts Storage & Rendering](chat/architecture/charts-storage-rendering.md)** - Visualization parsing, sanitization, storage, and Telegram chart-link flow.
- **[Telegram Integration Architecture](chat/architecture/telegram-integration.md)** - Webhook reliability model, bot runtime, and chart web-app integration.
- **[Indexing Strategy](chat/indexing/indexing-data.md)** - Technical approach to bulk indexing and incremental updates.
- **[Denormalization Example](chat/indexing/denormalization-example.md)** - Practical example of mapping transforms.
- **[ES|QL Query Tools](chat/es-tools/mini-league-agent-tools.md)** - Definitions for the Agentic AI tools.
- **[ES|QL Performance Review](chat/es-tools/mini-league-esql-review.md)** - Evaluation of ES|QL against standard queries.
- **[Requirements & Use Cases](chat/requirements/my-use-cases.md) (historical)** - Early business framing.
- **[Mini-League Implementation Plan](chat/requirements/plan.md) (historical)** - Earlier phase roadmap.
- **[Chat Feature Plan](chat/requirements/plan-chat.md) (historical)** - Earlier implementation/planning draft.
- **[High-Level AI Approaches](chat/indexing/high-level-approaches.md) (historical)** - Research transcript and ideation.

---

## 🛠 Task-Based Guide

| If you want to... | Go to... |
| :--- | :--- |
| **Debug a persona assignment** | [Problem Analysis](wrapped/engine/persona-problem-analysis.md) & [Algorithm Improvements](wrapped/engine/persona-algorithm-improvements.md) |
| **Add/Edit a Persona** | [Manager Personas](wrapped/engine/manager-personas.md) & [Manager Quotes](wrapped/content/quotes-managers.md) |
| **Change the Scoring Logic** | [Algorithm V3](wrapped/engine/persona-algorithm-v3-criteria-based.md) & `lib/analysis/persona/scoring.ts` |
| **Update the UI/UX Flow** | [Navigation Enhancement](wrapped/ux/navigation-enhancement.md) & [Design Decisions](wrapped/architecture/design-decisions.md) |
| **Understand Data Signals** | [Behavioral Signals](wrapped/engine/behavioral-signals.md) & [Transfer Timing Psychology](wrapped/research/transfer-timing-psychology.md) |
| **Implement AI Tools** | [ES\|QL Query Tools](chat/es-tools/mini-league-agent-tools.md) |

---

## 🔗 Quick Code Links

**Persona Logic**: [lib/analysis/persona/index.ts](../lib/analysis/persona/index.ts)  
**Scoring Engine**: [lib/analysis/persona/scoring.ts](../lib/analysis/persona/scoring.ts)  
**Persona Images**: [lib/constants/persona-images.ts](../lib/constants/persona-images.ts)  
**Persona UI**: [components/cards/PersonaCard.tsx](../components/cards/PersonaCard.tsx)  
**Telegram Bot**: [lib/chat/telegram-bot.ts](../lib/chat/telegram-bot.ts)

---

**Last Updated**: February 18, 2026
