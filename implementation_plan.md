# Implementation Plan: Mystic Abilities HUD Guidance

## Goal
Guide users to configure Mystic Abilities first if they are active in the rules but not yet selected.

## Components
### 1. `CreationGuidance.tsx` (`src/components/creation/`)
- A fixed banner at the bottom (above HUD).
- Checks `rules.mysticAbilities.active` and `!hasMysticTrait`.
- Dismissible via `X` button.
- Styling: Amber/Gold gradient, Sparkles icon, "Oracle's Advice".

### 2. `CreationHUD.tsx` (`src/components/CreationHUD.tsx`)
- Integrates `CreationGuidance` inside the main fragment.
- Component renders only in Creation Mode (controlled by `MainLayout`).

### 3. `MainLayout.tsx` (`src/components/layout/MainLayout.tsx`)
- Adds conditional highlighting (amber pulse + dot) to the "Détails & Equipement" tab button (Page 2).
- Logic matches `CreationGuidance` but persists until the condition is resolved (trait added).

## Status
- [x] Implementation Complete (v2.56.47)
- [x] Build Verified
