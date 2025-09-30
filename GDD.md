# eσnwisp: Guardião da Etérea
## Game Design Document v0.1

**Developer:** Uppercut Studio  
**Last Updated:** 2025-09-30

> **Note:** For technical standards and rules, see [ROOT_DIRECTIVE.md](ROOT_DIRECTIVE.md)

---

## Table of Contents

1. [Game Identity](#game-identity)
2. [Core Concept](#core-concept)
3. [Gameplay Mechanics](#gameplay-mechanics)
4. [Systems](#systems)
5. [Content](#content)
6. [Player Experience](#player-experience)
7. [Monetization](#monetization)
8. [References](#references)

---

## Game Identity

### Title & Etymology

**eσnwisp: Guardião da Etérea** (Eonwisp: Guardian of Etheria)

#### Eon (αἰών)
- **Origin:** Greek αἰών (aiṓn)
- **Meaning:** Age, eternity, vital force, cosmic time
- **Modern Use:** An immeasurably long period of time, used in cosmology and fantasy to imply timelessness, cycles, or primordial origin
- **Symbolic Meaning:** A being that exists across time or is born from a cosmic era

#### Wisp
- **Origin:** Old English wīsp, from Proto-Germanic wispaz
- **Original Meaning:** A small bundle or twist of hay, smoke, or flame
- **Modern Use:** A thin, delicate trail or strand of smoke, light, or spirit; can refer to ghostly light like "will-o'-the-wisp"
- **Symbolic Meaning:** An ephemeral force of light or energy in motion—elusive but powerful, like the plasma or ethereal whip

#### Combined Meaning
**"An eternal flicker of celestial energy"**

Or more poetically: *"A spirit born of time itself, fragile in form, infinite in power."*

### Lore

**eσnwisp (The Guardian)**  
The vigilant protector connected to the core by invisible force in celestial symbiosis. An eσn protects the Aether that originates creation of entire universes. Success transforms the guardian into the eternal protective divinity of that universe.

**etérea (Primordial Energy)**  
The entity that permeates and connects everything—the matrix of space and creation. In its fragile core lies the ether from which universes are conceived. Pure potential awaiting transformation into reality. The starting point of all existence.

---

## Core Concept

Mobile action game using accelerometer controls. Protect a fragile cosmic core from 360° threats using tetherball/rope-dart physics.

**Core Loop:** Tilt device → Control whip → Defend core → Collect power-ups → Survive waves → Achieve high scores

**Key Mechanics:**
- Circular trajectory with momentum
- Precision timing and rhythm
- Centripetal force simulation
- Audio-visual feedback synesthesia

**Progression:** Rogue-lite with procedural biomes, persistent upgrades, and unlockable content.


---

## Gameplay Mechanics

### Tetherball/Rope-Dart Physics

The player considers the speed and acceleration of the device's tilt to determine the force and reach of the whip, creating a realistic and dynamic "TETHERBALL" movement.

#### Control Mechanics
- The gesture consists of tilting the mobile device
- Gyroscope acceleration delta defines the force and reach of the whip movement
- **Fast tilts** result in powerful and extended attacks
- **Gentle tilts** result in quick and precise short-range strikes

#### Audio-Visual Feedback
- Whip movement generates a unique sound based on acceleration and applied force
- Creates an audiovisual experience that engages players in the game world
- Faster movements produce higher tones, mimicking the sound of a real whip in action
- Connects the force of the attack with its audio tone

### 360-Degree Defense

Players must protect the central sphere from objects and enemies approaching from 360 degrees around them. The versatile whip movement allows players to effectively ward off threats from any direction.

---

## Control System

### Primary Control: Accelerometer

The player tilts the device to control the whip:

**Input Mapping:**
- **Tilt Speed:** Determines whip velocity
- **Tilt Acceleration:** Determines attack force
- **Tilt Direction:** Controls whip direction in 360°

**Response Characteristics:**
- Immediate and responsive
- Realistic physics simulation
- Momentum-based movement
- Centripetal force simulation

### Secondary Control: Virtual Joystick

Fallback control method for devices without accelerometer or player preference:
- On-screen virtual joystick
- Touch-based directional input
- Maintains core gameplay feel

### Configuration
All control parameters are defined in `js/config/GameConfig.js`:
- Accelerometer multiplier
- Deadzone settings
- Axis inversion options
- Control mode selection

---

## Power-Up System

### Overview

Throughout the game, players can collect power-ups that appear after defeating enemies or hitting certain objects.

### Power-Up Types

Power-ups come in various types, improving different aspects of the whip and defense system:

#### Offensive Enhancements
- Increase whip force
- Increase whip speed
- Extend whip reach
- Multiple whip extensions
- Special attacks

#### Defensive Enhancements
- Temporary shields
- Core healing
- Damage reduction
- Invulnerability periods

### Design Philosophy

The power-up system is designed to:
- Encourage experimentation
- Promote strategic thinking
- Allow players to customize their playstyle
- Adapt to current biome challenges

### Future Expansion

Based on user feedback and data analysis, new power-ups will be introduced in future updates to expand the variety of available playstyles.

---

## Combo System

### Mechanics

Chaining successful whip attacks in rapid succession increases the combo meter, multiplying the score obtained in subsequent attacks.

### Importance

Maintaining combos is vital for achieving high scores:
- Higher multipliers lead to greater rewards
- Chance to unlock rare power-ups
- Rewards players who master whip movements and timing
- Provides a sense of accomplishment and mastery

### Combo Mastery System

To further encourage players to pursue high combos, a "Combo Mastery" system can be introduced:
- Additional rewards for impressive combo sequences
- Recognition and achievements
- Leaderboard categories for combo specialists

---

## Enemy Design

### Diversity

**eσnwisp** features a diverse variety of enemy types, each with:
- Unique patterns
- Locomotion methods
- Attack types
- Defense mechanisms

### Movement Patterns

Enemies can move in intricate patterns, requiring players to:
- Adapt their strategy
- Plan ahead
- Anticipate attacks
- Intercept effectively

### Progressive Difficulty

To provide a sense of progression and challenge:
- New enemy types introduced as players advance through different biomes
- Fresh encounters and gameplay experiences
- Increasing complexity and coordination requirements

### Boss Battles

Boss battles feature formidable adversaries with:
- Distinct attack patterns
- Exploitable weaknesses
- Multi-phase encounters
- Unique visual and audio design

Players must discover and exploit these weak points to defeat bosses and advance further in the game.

### Audio Cues

Each enemy emits distinct sounds, helping players:
- Anticipate attacks without relying solely on visual elements
- Enhance immersion and responsiveness
- React to off-screen threats
- Develop audio-based strategies

---

## Audio Design

### Philosophy

Audio design is meticulously crafted to complement the game's fast-paced gameplay and abstract artistic aesthetic.

### Enemy Audio Cues

Each enemy emits distinct sounds:
- Helps players anticipate attacks
- Provides meaningful feedback
- Enhances immersion and responsiveness
- Enables audio-based threat detection

### Whip Audio Feedback

The whip tone corresponds to its force and speed:
- Provides immersive and dynamic audio experience
- Faster whip movements produce higher tones
- Mimics the sound of a real whip in action
- Satisfying feedback for powerful attacks and high combos

### Spatial Audio

To add depth to the game's sound experience:
- Effects are spatially arranged
- Provides sense of directionality for incoming attacks
- Enhances immersion
- Helps players react quickly to threats

### Musical Scale

The game uses the A minor scale frequencies for whip sounds:
```
110 Hz, 123.47 Hz, 130.81 Hz, 146.83 Hz, 164.81 Hz, 174.61 Hz, 196 Hz, 220 Hz,
246.94 Hz, 261.63 Hz, 293.66 Hz, 329.63 Hz, 349.23 Hz, 392 Hz, 440 Hz, 493.88 Hz,
523.25 Hz, 587.33 Hz, 659.25 Hz, 698.46 Hz, 783.99 Hz, 880 Hz
```

This creates a musical, harmonious experience that ties gameplay to audio in a synesthetic way.

---

## Social Features

### Leaderboards

The leaderboard displays top player scores in three tabs:
- **Local:** Device-specific scores
- **Friends:** Connected friends' scores
- **Global:** Worldwide rankings

This provides players with:
- Sense of accomplishment
- Motivation to improve performance
- Competitive drive

### Social Media Integration

Players can connect their game accounts to social media platforms to:
- Share achievements
- Share high scores
- Share gameplay highlights
- Foster community and friendly competition

### Score Sharing

Players can share high scores and achievements on various platforms:
- Twitter
- Instagram
- Facebook
- WhatsApp

**Legitimacy System:**
- Unique IDs embedded in shared images
- Ensures authenticity of achievements
- Prevents score manipulation

---

## Monetization

### Free-to-Play Core

The core experience of **eσnwisp** is available for free:
- Ensures accessibility to a wide audience
- Encourages more players to engage with the game
- No pay-to-win mechanics
- Fair competitive environment

### PRO Mode

Available as a **one-time purchase**, providing:

#### Additional Features
- Learning page with tutorials
- Detailed statistics and analytics
- Personalized tips to enhance understanding
- Enhanced player experience

#### Special Status
- **"Seal of Approval"** badge
- **"Loyal Supporter"** status

#### Exclusive Benefits
- Early access to new games from the development team
- Opportunity to participate in surveys and polls
- Influence future updates and features
- Exclusive events and challenges
- Special in-game items or power-ups

### Fair Monetization Philosophy

- No aggressive monetization tactics
- No energy systems or artificial wait times
- No loot boxes or gambling mechanics
- Respect for player time and investment
- Support development while maintaining integrity

---

## Platform & Technical

### Target Platform

**eσnwisp** is designed exclusively for modern mobile devices equipped with gyroscopic screens.

### Supported Devices
- **iOS:** iPhone and iPad with gyroscope
- **Android:** Devices with accelerometer/gyroscope support

### Optimization

The game is optimized to run smoothly on a variety of devices:
- Wide range of iOS devices
- Wide range of Android devices
- Ensures players can enjoy engaging gameplay regardless of hardware specifications

### Performance Targets
- **Frame Rate:** 60 FPS on mid-range devices
- **Battery Efficiency:** Optimized power consumption
- **Memory Usage:** Efficient resource management
- **Load Times:** Fast startup and level transitions

### Technical Requirements
- Gyroscope/accelerometer sensor
- Touch screen
- Audio output
- Internet connection (for leaderboards and social features)

---

## Mood & References

### Reference Games
- **#Archero2** - Mobile action mechanics and progression
- **#VampireSurvivors** - Wave survival and power-up systems
- **#Hades** - Rogue-lite progression with narrative depth
- **#HeadSpace** - Meditative and philosophical approach

### Artistic References
- **#Kandinsky** - Abstract visual art style and color theory
- **#MidnightGospel** - Philosophical narrative layering
- **#AllanWatts** - Philosophical depth and meditation

### Visual Style
- Abstract futuristic aesthetic
- Inspired by Kandinsky's abstract paintings
- Vibrant colors and geometric shapes
- Dynamic particle effects
- Ethereal glow and energy effects

### Philosophical Themes
- Cosmic guardianship
- Fragility of creation
- Protection and sacrifice
- Time and eternity
- Balance and harmony
- Meditation and mindfulness

---

## Conclusion

**eσnwisp: Guardião da Etérea** offers an enchanting combination of:
- Gyroscopic controls
- Abstract artistic aesthetic
- Unique gameplay mechanics

Players will be captivated by the challenge of protecting the central sphere while exploring diverse and visually stunning biomes.

### Key Promises
- Fair monetization
- Engaging leaderboards
- Personalized tips
- Immersive audio design
- Exciting and rewarding mobile gaming experience

### Target Audience

**eσnwisp** is designed to attract players seeking:
- Artistic adventures
- High score competition
- Inclusive and supportive gaming community
- Philosophical and meditative experiences
- Innovative mobile gameplay

### Post-Launch Commitment

The development team is committed to continuously improving the game through post-launch updates:
- New biomes
- New enemies
- New power-ups
- New features based on player feedback and data analysis

### Vision

With its distinctive combination of:
- Gameplay mechanics
- Audiovisual experience
- Social integration

**eσnwisp** aims to become a beloved title in the mobile gaming landscape, uniting players from around the world in pursuit of high scores and artistic exploration.

---

*This document is a living document and will be updated as the game evolves.*

**For technical implementation details, see:**
- [`ROOT_DIRECTIVE.md`](ROOT_DIRECTIVE.md) - Project standards and rules
- [`js/config/GameConfig.js`](js/config/GameConfig.js) - Tunable parameters
- [`js/config/EnemyTypes.js`](js/config/EnemyTypes.js) - Enemy definitions
