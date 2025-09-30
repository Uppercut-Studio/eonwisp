# eσnwisp: Guardião da Etérea

![Eonwisp Logo](eonwisp.png)

> *"An eternal flicker of celestial energy - a spirit born of time itself, fragile in form, infinite in power."*

---

## 🚨 START HERE

**New to this project? Read in this order:**

1. **[ROOT_DIRECTIVE.md](ROOT_DIRECTIVE.md)** ← Mandatory rules & standards
2. **[GDD.md](GDD.md)** ← Game design & vision
3. **[Roadmap_Eonwisp_Backlog](Roadmap_Eonwisp_Backlog)** ← Current priorities

---

## Quick Navigation

| Document | Purpose |
|----------|---------|
| **[ROOT_DIRECTIVE.md](ROOT_DIRECTIVE.md)** | 🔒 Mandatory rules, code standards, legal, AI directives |
| **[GDD.md](GDD.md)** | 🎮 Complete game design document |
| **[GameConfig.js](js/config/GameConfig.js)** | ⚙️ All tunable parameters |
| **[EnemyTypes.js](js/config/EnemyTypes.js)** | 👾 Enemy definitions |
| **[Roadmap_Eonwisp_Backlog](Roadmap_Eonwisp_Backlog)** | 📋 Active tasks |

---

## What is eσnwisp?

Rogue-lite mobile action game with gyroscopic controls. Protect a cosmic core from 360° threats using tetherball/rope-dart mechanics.

**Platform:** Mobile (iOS/Android with accelerometer)  
**Genre:** Rogue-Lite Action/Defense  
**Style:** Abstract art inspired by Kandinsky  
**Target:** 60 FPS on mid-range devices

---

## Running the Game

```bash
# Local development
start-game.bat
# or: npx http-server -p 8080

# Mobile testing
start-sensor-debug.bat
```

---

## Project Structure

```
/css/          → Stylesheets
/js/
  /config/     → Game & enemy configuration
  /core/       → Core game state
  /systems/    → Rendering, pooling, behaviors
  /ui/         → UI components
  /utils/      → Utilities
```

---

## Code Standards

- **Files:** `kebab-case.js`
- **Classes:** `PascalCase`
- **Functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`

**See [ROOT_DIRECTIVE.md](ROOT_DIRECTIVE.md) for complete standards.**

---

## Legal

**© Uppercut Studio - All Rights Reserved**

See [ROOT_DIRECTIVE.md § Legal](ROOT_DIRECTIVE.md#5-legal--ownership) for full terms.
