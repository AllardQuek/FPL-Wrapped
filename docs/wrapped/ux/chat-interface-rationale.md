# FPL Wrapped Chat UI: Design Rationale

This document outlines the design decisions, technical trade-offs, and user experience philosophy behind the FPL Wrapped Chat interface.

## 🎨 Aesthetic Philosophy: "The Spotify Wrapped Effect"

The primary goal of FPL Wrapped is to transform cold, analytical data into an engaging personal narrative. For the chat interface, this meant moving away from the "GPT-style" clinical white space towards a more immersive, "high-fidelity" gameday atmosphere.

### 1. Visual Immersion
- **Background**: We utilize the `gradient-bg` (FPL Deep Purple to Magenta) to maintain brand continuity from the home page.
- **Particles**: Floating particles add subtle micro-motion, making the page feel "alive" even when the user isn't typing.
- **Glassmorphism**: By using `glass-card` styling (blur + semi-transparent borders) for AI responses, we create a sense of depth. The assistant doesn't just "output text"; it exists within the gameday command center.

### 2. Behavioral Persona Integration
FPL isn't just about points; it's about the manager's identity (e.g., knee-jerker, template slave).
- **Manager Archetypes**: We map your league's managers to global tactical profiles. The archetypes (Pep, Arteta, etc.) serve as interactive scouting filters for **FPL CHAT**.
- **Consolidated Branding**: Instead of a global fixed header, "FPL CHAT" is now the primary, hero-style identity integrated directly into the discovery feed, creating a more immersive and less redundant experience.
- **Sticky Status**: A subtle season indicator pins to the top during scrolling to maintain context without wasting vertical space.

---

## ⚙️ Technical Rationale: Custom SSE vs. Vercel AI SDK

During development, we considered using the [Vercel AI SDK](https://sdk.vercel.ai/) but decided to stick with a **Manual Server-Sent Events (SSE)** implementation for the following reasons:

### 1. Compatibility with Elastic Agent Builder
The Elastic Agent Builder API uses a proprietary SSE event protocol (e.g., `conversation_id_set`, `round_complete`, `reasoning`). 
- **The SDK Trap**: While the AI SDK is excellent for OpenAI/Anthropic/Google protocols, mapping Elastic's unique multi-round agent events to the SDK's internal schema would have introduced more "glue code" than the manual parser currently occupies.

### 2. Fine-Grained Stream Control
Manual SSE allows us to intercept specific event types (like `reasoning`) and update the UI state *before* the main completion even begins. This enables the "Live Manager Insight" feature.

---

## 🏃 Active Feedback: The "Manager Logic" UX

We replaced the static "Processing Data" spinner with a dynamic **Live Manager Insight** stream.

### Rationale:
- **Perceived Latency**: Agent reasoning can take time. We show the exact tool names (e.g., "SQL Query") directly in the loading header to provide real-time transparency.
- **Minimalist Focus**: "Manager Logic" (raw thought logs) and "System Operations" (tool details) are collapsed by default. This keeps the interface clean while maintaining full transparency for power users who want to audit the AI's logic.
- **Unified Loading State**:
    - **Strategizing**: Initial state while the engine brainstorms.
    - **[Tool Name]**: Active state when a specific operation (Search, Query, Data fetch) is in progress.

---

## ♿ Accessibility & Contrast

Dark mode interfaces often suffer from poor legibility.
- **Contrast Ratios**: We've committed to a minimum of 4.5:1 (WCAG AA) for all primary and secondary text.
- **Adaptive Opacity**: Instead of using mid-tone grays (which look muddy on purple/black), we use white with varying opacity (`text-white/70`). This ensures colors "blend" with the background while remaining crisp.
