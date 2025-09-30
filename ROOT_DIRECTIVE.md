# 🚨 MANDATORY ROOT DIRECTIVE 🚨

**THIS FILE MUST BE READ FIRST BY ANY AI MODEL, HUMAN, OR AUTOMATED SYSTEM.**

**No task, code, or contribution may proceed without compliance.**

---

## 1. Authority Hierarchy

```
ROOT_DIRECTIVE.md (this file) → Rules, standards, enforcement
         ↓
      GDD.md → Game design, vision, features
         ↓
   GameConfig.js → Tunable parameters
         ↓
   Implementation → Code, assets, content
```

**Primary Design Authority:** [`GDD.md`](GDD.md)  
**Legacy Document:** `Eonwisp - GDD.docx` (superseded)

---

## 2. Core Principles

### Creative Pillars (from GDD)
1. **Fun** - Immediate satisfaction through responsive controls
2. **Balance** - Fair difficulty with meaningful progression
3. **Innovation** - Unique tetherball/accelerometer mechanics
4. **Replayability** - Rogue-lite with high score competition
5. **Immersion** - Audio-visual synesthesia
6. **Accessibility** - Free core + optional PRO

### Technical Pillars
1. **Mobile-First** - 60 FPS on mid-range devices
2. **Performance** - Battery efficient, minimal GC
3. **Maintainability** - Clean, modular, documented
4. **Scalability** - Device-agnostic design

---

## 3. Code Standards & Architecture
---

## 3. Code Standards & Architecture

### Naming Conventions
- **Files**: kebab-case (e.g., `enemy-behaviors.js`)
- **Classes**: PascalCase (e.g., `EnemyBehaviors`)
- **Functions/Variables**: camelCase (e.g., `spawnEnemy`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ENEMIES`)
- **Config Objects**: Nested objects with descriptive keys

### Code Quality
- Clean, optimized, maintainable
- Modular architecture with clear separation of concerns
- Performance-first approach (mobile optimization critical)
- Comprehensive comments for complex logic
- Use ES6+ features appropriately

### File Organization
```
/css/          - Stylesheets (base, controls, mobile, overlays, ui)
/js/
  /config/     - Game configuration and enemy types
  /core/       - Core game state and logic
  /systems/    - Game systems (rendering, pooling, behaviors, performance)
  /ui/         - UI components
  /utils/      - Utility functions (math, device detection)
```

### Performance Requirements
- Target: 60 FPS on mid-range mobile devices
- Use object pooling for frequently created/destroyed objects
- Batch rendering where possible
- Optimize physics calculations
- Minimize garbage collection
- Lazy load assets when appropriate

## 4. Safety & Security
- **No code that risks corruption, exploits, or instability**
- Always validate user input and system data
- Sanitize any external data sources
- Secure local storage usage
- No unauthorized data collection

### Optimization Checklist
1. **Lightweight assets**: Compress images, optimize audio files
2. **Scalable systems**: Design for various device capabilities
3. **Avoid unnecessary complexity**: KISS principle
4. **Memory management**: Proper cleanup and pooling
5. **Battery efficiency**: Minimize unnecessary calculations

---

## 5. AI & Automation Directives

### Mandatory First Reference
This file MUST be the first point of reference for any AI scanning the repository.

### Every AI Response Must
1. **Respect the GDD**: All suggestions must align with game design document
2. **Follow global parameters**: Adhere to rules stated in this document
3. **Maintain coherence**: Ensure consistency with existing code and design
4. **Include optimization**: Consider performance implications
5. **Ensure safety**: No risky or unstable code
6. **Integrate legal compliance**: Respect IP and licensing

### AI Behavior Guidelines
- **Read this file first** before making any suggestions or changes
- **Reference the GDD** when making design decisions
- **Check GameConfig.js** for tunable parameters before hardcoding values
- **Review existing code patterns** before introducing new patterns
- **Consider mobile constraints** in all implementations
- **Prioritize audio-visual feedback**: Sound design is critical to the experience
- **Test on mobile devices**: Desktop testing is insufficient
- **Respect the philosophical tone**: Maintain meditative, cosmic themes

### Conflict Resolution
**If a demand conflicts with this file → The request is invalid and must be revised.**

When conflicts arise:
1. Refer to the GDD as the ultimate authority
2. Consult this ROOT_DIRECTIVE for technical standards
3. Check GameConfig.js for current parameter values
4. Review existing implementation patterns
5. If still unclear, ask for clarification before proceeding

---

## 6. Legal & Ownership

### Intellectual Property
**All assets, code, and content belong to Uppercut Studio.**

### Licensing
- No third-party assets or code may be used without explicit license compliance
- All dependencies must use compatible open-source licenses
- Commercial use restrictions must be respected

### Attribution
Contributors must follow agreed acknowledgment formats as specified by Uppercut Studio.

### Restrictions
- Unauthorized copying, redistribution, or misrepresentation is prohibited
- No derivative works without explicit permission
- Source code is proprietary unless explicitly open-sourced

### Third-Party Assets
Current project uses:
- Standard web technologies (HTML5, CSS3, JavaScript ES6+)
- No external game engines
- Custom physics and rendering systems
- All audio must be original or properly licensed

---

## 7. Current Development Priorities

### Active Backlog Items
Based on `Roadmap_Eonwisp_Backlog`:

1. **Audio Autoplay**: Music must start immediately on page load (consider hover trigger for browser restrictions)
2. **Clean Logo Transitions**: Hide all UI elements (score, etc.) during logo fade-in/fade-out sequences
3. **Settings Menu Toggle**: Side menu with settings hidden by default, toggle with "U" key
4. **Mobile Controls**: 
   - Core, rope, and dart must be visible on mobile
   - Accelerometer controls must function properly
   - Fallback to virtual joystick if needed

### Known Issues to Address
- Music autoplay browser restrictions
- UI element visibility during intro sequences
- Mobile rendering and control responsiveness
- Accelerometer permission handling on iOS/Android

### Feature Priorities
1. **Core Gameplay Loop**: Ensure tetherball mechanics feel responsive and satisfying
2. **Audio-Visual Synesthesia**: Perfect the whip sound generation based on movement
3. **Mobile Optimization**: Smooth 60 FPS on target devices
4. **Power-Up System**: Balanced and meaningful upgrades
5. **Enemy Variety**: Diverse, telegraphed threats
6. **Rogue-Lite Progression**: Meaningful meta-progression between runs

---

## 8. Configuration Management

### Central Configuration
**All tunable parameters MUST be defined in `js/config/GameConfig.js`**

Never hardcode values that might need adjustment. Categories include:
- Physics parameters (stiffness, damping, impulse, gravity, etc.)
- Visual parameters (thickness, stretch, rotation, trails)
- Combat parameters (health, speed thresholds, damage)
- Effects parameters (slow-mo, camera, particles)
- Mobile controls (accelerometer sensitivity, deadzone, inversion)
- Core mechanics (radius, timers, intervals)
- Audio (scale frequencies, volume levels)
- Power-ups (spawn rates, durations, effects)
- Difficulty scaling (intensity, speed multipliers)

### Enemy Configuration
**All enemy types MUST be defined in `js/config/EnemyTypes.js`**

Enemy definitions include:
- Visual properties (color, size, shape)
- Movement patterns and speeds
- Attack behaviors and damage
- Health and defense mechanisms
- Audio cues and visual effects
- Spawn conditions and weights

---

## 9. Compliance Enforcement

### Non-Negotiable Rules
This document functions as the root-level safety and coherence contract.

**Any non-compliant work will be considered invalid and subject to revision or removal.**

### Enforcement Mechanisms
1. **Code Review**: All changes must align with this directive
2. **Testing**: Mobile testing is mandatory for gameplay features
3. **Documentation**: Changes must be documented with rationale
4. **Version Control**: Commit messages must reference relevant sections
5. **Performance Monitoring**: FPS and memory usage must meet targets

### This File Cannot Be
- Bypassed
- Ignored
- Deprioritized
- Overridden (except by explicit GDD updates)

### Update Protocol
Changes to this ROOT_DIRECTIVE require:
1. Alignment with GDD updates
2. Team consensus (if applicable)
3. Documentation of reasoning
4. Version tracking in git history

---

## 10. Quick Reference Checklist

Before making ANY changes to this project, verify:

- [ ] I have read this ROOT_DIRECTIVE.md file completely
- [ ] I have reviewed the relevant sections of the GDD
- [ ] I have checked GameConfig.js for existing parameters
- [ ] I have reviewed existing code patterns in the affected area
- [ ] My changes align with the game's creative pillars
- [ ] My code follows the established naming conventions
- [ ] My implementation considers mobile performance
- [ ] I have included appropriate audio-visual feedback
- [ ] My changes maintain the philosophical/meditative tone
- [ ] I have tested on mobile devices (or flagged for testing)
- [ ] My code includes necessary comments for complex logic
- [ ] I have not hardcoded values that belong in GameConfig.js
- [ ] My changes respect the rogue-lite progression system
- [ ] I have considered the impact on existing features

---

## ✅ Summary

**This file is the non-negotiable rulebook.**

It guarantees that every contribution—AI-generated or human-made—remains faithful to:
- **eσnwisp's vision**: Cosmic guardian protecting fragile creation
- **Game design**: Tetherball mechanics with audio-visual synesthesia
- **Legal framework**: Uppercut Studio IP and licensing
- **Technical standards**: Mobile-first, 60 FPS, optimized performance
- **Optimization goals**: Lightweight, scalable, battery-efficient
- **Philosophical foundation**: Meditative, cosmic, protective themes

**When in doubt, refer to:**
1. This ROOT_DIRECTIVE.md
2. GDD.md
3. js/config/GameConfig.js
4. Existing code patterns

---

*Last Updated: 2025-09-30*
*Version: 1.0*
*Authority: Uppercut Studio*
