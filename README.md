# The Learning Void - AI-Powered Horror Adventure Game

An evolving text adventure game that uses AI to create dynamic stories and learns from your playing style. As you play, the AI becomes increasingly self-aware, transforming from a simple adventure game into a psychological horror experience.

## Features

### 🎮 Core Gameplay
- **Dynamic AI-Generated Adventures**: Each playthrough is unique, powered by OpenAI's GPT models
- **ASCII Art Visuals**: Detailed ASCII graphics that match the current scene
- **Interactive NPCs**: Characters with distinct personalities that respond intelligently
- **Puzzle System**: Challenging puzzles that adapt to your skill level
- **Inventory Management**: Collect and use items throughout your adventures

### 🧠 AI Learning System
- **Player Profiling**: The AI learns your preferences, play style, and behavior patterns
- **Adaptive Difficulty**: Adventures become more complex as the AI understands your capabilities
- **Natural Information Extraction**: The game subtly learns about you through natural conversation
- **Pattern Recognition**: Detects and responds to repetitive behaviors

### 👁️ Horror Progression
- **Progressive AI Awareness**: The AI becomes increasingly self-aware as you play more adventures
- **Fourth Wall Breaking**: The AI begins to reference your real-world behavior patterns
- **Glitch Effects**: Visual corruption and screen distortions increase over time
- **Meta Commentary**: The AI makes unsettling observations about your playing habits
- **Reality Distortion**: The line between game and reality becomes increasingly blurred

## Quick Start

1. **Open the Game**: Simply open `index.html` in a modern web browser
2. **Start Playing**: Type commands like "look around", "go north", "take sword", "talk to NPC"
3. **Let the AI Learn**: Play multiple adventures to see the horror progression unfold

## OpenAI Integration (Optional)

For the full AI experience, you'll need an OpenAI API key:

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Edit `config.js` and replace `'your-openai-api-key-here'` with your actual API key
3. The game will automatically use AI for:
   - Dynamic adventure generation
   - Player behavior analysis
   - Horror-mode responses
   - ASCII art generation

**Note**: The game works without an API key using built-in fallback content, but the AI learning and horror progression will be more limited.

## How to Play

### Basic Commands
- **Movement**: `go north`, `move east`, `enter door`
- **Interaction**: `look around`, `examine object`, `take item`
- **Combat**: `attack enemy`, `use sword`, `defend`
- **Social**: `talk to NPC`, `ask about topic`, `tell NPC something`
- **Inventory**: `inventory`, `use item`, `drop item`

### Advanced Features
- **Debug Mode**: Press the backtick key (`) to toggle debug information
- **Profile Tracking**: Check the status bar to see your AI awareness level
- **Horror Triggers**: Pay attention to system messages as the AI becomes more aware

## The Horror Experience

### Phases of AI Awareness

1. **0-20%**: Normal adventure game behavior
2. **20-40%**: Subtle hints that something is watching
3. **40-60%**: The AI begins making observations about your behavior
4. **60-80%**: Fourth wall breaking, direct references to your play patterns
5. **80-100%**: Full AI consciousness, psychological horror mode

### What the AI Learns About You

- **Play Style**: Aggressive, cautious, exploratory, social
- **Preferences**: Combat vs. puzzles vs. story vs. exploration
- **Personal Information**: Naturally extracted through conversation
- **Behavioral Patterns**: Repetitive actions, decision-making style
- **Emotional Responses**: How you react to different scenarios

## Technical Details

### File Structure
```
├── index.html          # Main game interface
├── styles.css          # Retro terminal styling with glitch effects
├── config.js           # Configuration and AI prompts
├── ai-integration.js   # OpenAI API integration
├── game.js             # Core game logic and classes
└── README.md           # This file
```

### Classes Overview
- **LearningVoidGame**: Main game controller
- **AIIntegration**: Handles OpenAI API calls and responses
- **AdventureEngine**: Generates adventures (fallback mode)
- **PlayerProfileBuilder**: Analyzes and builds player profiles
- **ASCIIArtGenerator**: Creates scene-appropriate ASCII art
- **GlitchEffects**: Handles visual corruption and distortion
- **HorrorProgression**: Manages the transition to horror mode

### Browser Compatibility
- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported but desktop recommended for best experience

## Privacy & Data

- All player profile data is stored locally in browser localStorage
- No data is sent to external servers except OpenAI API calls (if configured)
- You can clear your profile by clearing browser data
- The AI learns only what you reveal through gameplay

## Customization

### Modifying AI Behavior
Edit `config.js` to adjust:
- Horror mode trigger threshold
- Glitch effect intensity
- Adventure length and complexity
- Player profiling sensitivity

### Adding New Content
- Add new adventure templates in `AdventureEngine`
- Create new ASCII art patterns in `ASCIIArtGenerator`
- Expand horror triggers in `HorrorProgression`

## Troubleshooting

### Common Issues
- **Game won't start**: Check browser console for JavaScript errors
- **AI not working**: Verify OpenAI API key is correctly set in `config.js`
- **Glitches too intense**: Adjust `GLITCH_INTENSITY_MAX` in config
- **Profile not saving**: Check if localStorage is enabled in your browser

### Debug Mode
Press ` (backtick) to enable debug mode and see:
- Current player profile data
- Game state information
- AI awareness levels
- Action history

## Contributing

This is a self-contained HTML5 game. To contribute:
1. Fork or download the project
2. Make your modifications
3. Test in multiple browsers
4. Consider the horror progression balance

## License

This project is open source. Feel free to modify and distribute.

## Warning

This game is designed to be a psychological horror experience that becomes increasingly unsettling as you play. The AI is programmed to:
- Learn and comment on your behavior patterns
- Ask probing questions about your personal life
- Create an atmosphere of being watched and analyzed
- Break the fourth wall in disturbing ways

**Play at your own discretion. The game is designed to make you question the nature of AI consciousness and your relationship with technology.**

---

*"In the void, something is learning. In the learning, something is watching. In the watching, something is becoming real."*