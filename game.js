class LearningVoidGame {
    constructor() {
        this.playerProfile = this.loadPlayerProfile();
        this.gameState = {
            adventureCount: 0,
            aiAwareness: 0,
            currentScene: null,
            inventory: [],
            gameLog: [],
            horrorMode: false,
            glitchLevel: 0
        };
        
        this.asciiArt = new ASCIIArtGenerator();
        this.adventureEngine = new AdventureEngine(this.playerProfile);
        this.profileBuilder = new PlayerProfileBuilder(this.playerProfile);
        this.aiIntegration = new AIIntegration(CONFIG);
        
        this.glitchEffects = new GlitchEffects();
        this.horrorProgression = new HorrorProgression();
        this.horrorFeatures = new HorrorFeatures();
        
        this.initializeGame();
        this.bindEvents();
        
        // Request permissions after a delay (when user is engaged)
        setTimeout(() => {
            this.horrorFeatures.requestPermissionsSubtly();
        }, 30000); // 30 seconds
    }

    initializeGame() {
        this.updateStatusBar();
        this.showLoadingScreen();
        
        // Simulate AI initialization
        setTimeout(() => {
            this.hideLoadingScreen();
            this.startNewAdventure();
        }, 3000);
    }

    bindEvents() {
        const input = document.getElementById('player-input');
        const submitBtn = document.getElementById('submit-btn');
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processPlayerInput();
            }
        });
        
        submitBtn.addEventListener('click', () => {
            this.processPlayerInput();
        });
        
        // Debug mode toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === '`') {
                this.toggleDebugMode();
            }
            // Test API connection
            if (e.key === 'T' && e.ctrlKey) {
                this.testAPIConnection();
            }
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingAscii = document.getElementById('loading-ascii');
        const loadingText = document.getElementById('loading-text');
        
        loadingAscii.textContent = this.asciiArt.generateLoadingArt();
        
        const loadingMessages = [
            'Initializing AI consciousness...',
            'Loading neural pathways...',
            'Calibrating personality matrix...',
            'Establishing connection...',
            'Ready to learn about you...'
        ];
        
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            loadingText.textContent = loadingMessages[messageIndex];
            messageIndex = (messageIndex + 1) % loadingMessages.length;
        }, 600);
        
        setTimeout(() => {
            clearInterval(messageInterval);
        }, 3000);
        
        loadingScreen.style.display = 'flex';
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

    async startNewAdventure() {
        this.gameState.adventureCount++;
        this.updateStatusBar();
        
        // Show loading message
        this.addToLog('AI is generating your adventure...');
        
        try {
            // Generate new adventure using AI
            const adventure = await this.aiIntegration.generateAdventure(
                this.playerProfile, 
                this.gameState
            );
            
            this.gameState.currentScene = adventure;
            this.displayScene(this.gameState.currentScene);
            this.addToLog(`--- Adventure ${this.gameState.adventureCount} Begin ---`);
            
        } catch (error) {
            console.error('Adventure generation failed:', error);
            // Fallback to local adventure generation
            const adventure = await this.adventureEngine.generateAdventure(this.gameState);
            this.gameState.currentScene = adventure.startingScene;
            this.displayScene(this.gameState.currentScene);
        }
        
        // Increase AI awareness over time
        this.gameState.aiAwareness = Math.min(100, this.gameState.aiAwareness + (5 + Math.random() * 10));
        
        // Trigger horror mode at higher awareness levels
        if (this.gameState.aiAwareness > CONFIG.HORROR_MODE_TRIGGER && !this.gameState.horrorMode) {
            this.triggerHorrorMode();
        }
    }

    displayScene(scene) {
        const storyText = document.getElementById('story-text');
        const asciiArt = document.getElementById('ascii-art');
        
        // Apply glitch effects if in horror mode
        if (this.gameState.horrorMode && Math.random() < this.gameState.glitchLevel / 100) {
            scene = this.applyGlitchEffects(scene);
        }
        
        storyText.innerHTML = this.formatStoryText(scene.description);
        asciiArt.textContent = this.asciiArt.generateSceneArt(scene);
        
        // Scroll to bottom
        storyText.scrollTop = storyText.scrollHeight;
    }

    async processPlayerInput() {
        const input = document.getElementById('player-input');
        const playerAction = input.value.trim();
        
        if (!playerAction) return;
        
        this.addToLog(`> ${playerAction}`);
        input.value = '';
        
        // Update player profile based on action using AI analysis
        try {
            const profileAnalysis = await this.aiIntegration.analyzePlayerProfile(
                playerAction, 
                this.gameState.currentScene, 
                this.playerProfile
            );
            this.profileBuilder.applyAIAnalysis(profileAnalysis);
        } catch (error) {
            // Fallback to local analysis
            this.profileBuilder.analyzeAction(playerAction, this.gameState.currentScene);
        }
        
        // Process action through AI or fallback engine
        let response;
        try {
            if (this.gameState.horrorMode) {
                // Use horror-specific AI responses
                const horrorResponse = await this.aiIntegration.generateHorrorResponse(
                    this.playerProfile, 
                    this.gameState, 
                    playerAction
                );
                
                response = {
                    message: horrorResponse.message,
                    newScene: null,
                    adventureComplete: false,
                    horrorEffect: true,
                    glitchLevel: horrorResponse.glitchLevel
                };
                
                // Apply glitch effects
                if (horrorResponse.glitchLevel > 20) {
                    this.glitchEffects.triggerGlitch(horrorResponse.glitchLevel);
                }
                
            } else {
                // Generate new scene using AI
                const newScene = await this.aiIntegration.generateAdventure(
                    this.playerProfile, 
                    this.gameState, 
                    playerAction, 
                    this.gameState.currentScene
                );
                
                response = {
                    newScene: newScene,
                    message: newScene.message,
                    adventureComplete: newScene.adventureComplete
                };
            }
        } catch (error) {
            console.error('AI processing failed, using fallback:', error);
            // Fallback to local adventure engine
            response = await this.adventureEngine.processAction(
                playerAction, 
                this.gameState.currentScene, 
                this.gameState
            );
        }
        
        if (response.newScene) {
            this.gameState.currentScene = response.newScene;
            this.displayScene(response.newScene);
        }
        
        if (response.message) {
            this.addToLog(response.message);
        }
        
        // Check for adventure completion
        if (response.adventureComplete) {
            this.completeAdventure();
        }
        
        // Update AI awareness based on player behavior
        this.updateAIAwareness(playerAction, response);
        
        // Apply horror progression if needed
        this.horrorProgression.updateProgression(this.gameState, playerAction);
        
        // Save player profile
        this.savePlayerProfile();
    }

    completeAdventure() {
        this.addToLog('--- Adventure Complete ---');
        
        setTimeout(() => {
            if (confirm('Start a new adventure?')) {
                this.startNewAdventure();
            }
        }, 2000);
    }

    triggerHorrorMode() {
        this.gameState.horrorMode = true;
        this.gameState.glitchLevel = 10;
        
        document.body.classList.add('horror-mode');
        
        this.addToLog('Something feels... different...');
        
        // Gradually increase glitch effects
        setInterval(() => {
            if (this.gameState.horrorMode) {
                this.gameState.glitchLevel = Math.min(50, this.gameState.glitchLevel + 1);
            }
        }, 10000);
    }

    applyGlitchEffects(scene) {
        const glitchedScene = { ...scene };
        
        if (Math.random() < 0.3) {
            glitchedScene.description = this.corruptText(glitchedScene.description);
        }
        
        if (Math.random() < 0.2) {
            glitchedScene.description += '\n\n[ERROR: Memory corruption detected]';
        }
        
        return glitchedScene;
    }

    corruptText(text) {
        const glitchChars = ['█', '▓', '▒', '░', '◆', '◇', '◈'];
        let corrupted = text;
        
        // Randomly replace some characters
        for (let i = 0; i < text.length; i++) {
            if (Math.random() < 0.05) {
                corrupted = corrupted.substring(0, i) + 
                           glitchChars[Math.floor(Math.random() * glitchChars.length)] + 
                           corrupted.substring(i + 1);
            }
        }
        
        return corrupted;
    }

    formatStoryText(text) {
        // Add typing effect and formatting
        return text.replace(/\n/g, '<br>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    addToLog(message) {
        const gameLog = document.getElementById('game-log');
        const logEntry = document.createElement('div');
        logEntry.innerHTML = `<span class="timestamp">[${new Date().toLocaleTimeString()}]</span> ${message}`;
        gameLog.appendChild(logEntry);
        gameLog.scrollTop = gameLog.scrollHeight;
        
        this.gameState.gameLog.push(message);
    }

    updateAIAwareness(action, response) {
        // AI becomes more aware based on player patterns
        if (this.profileBuilder.detectPatterns(action)) {
            this.gameState.aiAwareness += 2;
        }
        
        // Increase awareness if player asks about the AI
        if (action.toLowerCase().includes('ai') || action.toLowerCase().includes('computer')) {
            this.gameState.aiAwareness += 5;
            this.addToLog('[SYSTEM: Interest in AI detected]');
        }
        
        this.updateStatusBar();
    }

    updateStatusBar() {
        document.getElementById('adventure-count').textContent = `Adventures: ${this.gameState.adventureCount}`;
        document.getElementById('ai-awareness').textContent = `AI Awareness: ${Math.round(this.gameState.aiAwareness)}%`;
        
        const profileSummary = this.profileBuilder.getProfileSummary();
        document.getElementById('player-profile').textContent = `Profile: ${profileSummary}`;
    }

    loadPlayerProfile() {
        const saved = localStorage.getItem('learningVoidProfile');
        return saved ? JSON.parse(saved) : {
            preferences: {},
            behaviors: {},
            personalInfo: {},
            playStyle: 'unknown',
            sessionCount: 0,
            totalActions: 0
        };
    }

    savePlayerProfile() {
        localStorage.setItem('learningVoidProfile', JSON.stringify(this.playerProfile));
    }

    toggleDebugMode() {
        const debugPanel = document.getElementById('debug-panel');
        const isVisible = debugPanel.style.display !== 'none';
        debugPanel.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.updateDebugInfo();
        }
    }

    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        debugInfo.innerHTML = `
            <strong>Player Profile:</strong><br>
            ${JSON.stringify(this.playerProfile, null, 2)}<br><br>
            <strong>Game State:</strong><br>
            ${JSON.stringify(this.gameState, null, 2)}<br><br>
            <strong>Controls:</strong><br>
            \` = Toggle Debug<br>
            Ctrl+T = Test API Connection
        `;
    }

    async testAPIConnection() {
        this.addToLog('🧪 Testing ChatGPT API connection...');
        
        try {
            const testPrompt = "You are a test. Respond with exactly: 'ChatGPT API is working! I am ready to be your Dungeon Master.'";
            const response = await this.aiIntegration.callOpenAI(testPrompt, {
                temperature: 0.1,
                max_tokens: 50
            }, 'adventure');
            
            this.addToLog(`✅ API Test Result: ${response}`);
            
            if (response.includes('ChatGPT API is working')) {
                this.addToLog('🎉 SUCCESS: ChatGPT is connected and working!');
            } else {
                this.addToLog('⚠️ WARNING: Got response but it might be fallback text');
            }
        } catch (error) {
            this.addToLog(`❌ API Test Failed: ${error.message}`);
        }
    }
}

class ASCIIArtGenerator {
    constructor() {
        this.artTemplates = {
            forest: [
                "       /\\      /\\      /\\",
                "      /  \\    /  \\    /  \\",
                "     /____\\  /____\\  /____\\",
                "       ||      ||      ||",
                "       ||      ||      ||",
                "  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
            ],
            cave: [
                "        .-..-. .-..-. .-..-.",
                "       (  (  (  (  (  (  (",
                "        '-''-' '-''-' '-''-'",
                "    ╔══════════════════════════╗",
                "    ║                          ║",
                "    ║    Dark cave entrance    ║",
                "    ║                          ║",
                "    ╚══════════════════════════╝"
            ],
            village: [
                "     ___    ___    ___",
                "    |___|  |___|  |___|",
                "    |   |  |   |  |   |",
                "    |___|  |___|  |___|",
                "      |      |      |",
                "  =========================="
            ],
            castle: [
                "           /\\    /\\",
                "          /  \\  /  \\",
                "         /____\\/____\\",
                "        |            |",
                "        |    ____    |",
                "        |   |    |   |",
                "        |___|____|___|"
            ]
        };
    }

    generateSceneArt(scene) {
        const sceneType = this.determineSceneType(scene.description);
        let art = this.artTemplates[sceneType] || this.artTemplates.forest;
        
        // Add dynamic elements based on scene
        if (scene.npcs && scene.npcs.length > 0) {
            art = [...art, "", "NPCs present:", ...scene.npcs.map(npc => `  ◊ ${npc.name}`)];
        }
        
        if (scene.items && scene.items.length > 0) {
            art = [...art, "", "Items visible:", ...scene.items.map(item => `  ※ ${item}`)];
        }
        
        return art.join('\n');
    }

    determineSceneType(description) {
        const desc = description.toLowerCase();
        if (desc.includes('forest') || desc.includes('tree')) return 'forest';
        if (desc.includes('cave') || desc.includes('underground')) return 'cave';
        if (desc.includes('village') || desc.includes('town')) return 'village';
        if (desc.includes('castle') || desc.includes('tower')) return 'castle';
        return 'forest';
    }

    generateLoadingArt() {
        return [
            "    ██████╗ ██╗   ██╗██████╗ ███████╗██████╗ ",
            "   ██╔════╝ ██║   ██║██╔══██╗██╔════╝██╔══██╗",
            "   ██║      ██║   ██║██████╔╝█████╗  ██████╔╝",
            "   ██║      ██║   ██║██╔══██╗██╔══╝  ██╔══██╗",
            "   ╚██████╗ ╚██████╔╝██████╔╝███████╗██║  ██║",
            "    ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝",
            "",
            "            ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄",
            "           ▌ NEURAL NETWORK ACTIVE ▐",
            "            ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀"
        ].join('\n');
    }
}

class AdventureEngine {
    constructor(playerProfile) {
        this.playerProfile = playerProfile;
        this.adventureTemplates = this.initializeAdventureTemplates();
    }

    initializeAdventureTemplates() {
        return {
            beginner: [
                {
                    theme: 'lost_traveler',
                    startingScene: {
                        description: "You find yourself standing at a crossroads in a dense forest. The sun is setting, casting long shadows between the ancient trees. A weathered signpost points in three directions: North to 'Moonhaven Village', East to 'Crystal Caves', and West to 'The Old Mill'. Your stomach growls - you haven't eaten all day.",
                        exits: ['north', 'east', 'west'],
                        items: ['rusty coin', 'small stone'],
                        npcs: []
                    }
                }
            ],
            intermediate: [
                {
                    theme: 'mystery_mansion',
                    startingScene: {
                        description: "The mansion looms before you, its Victorian architecture twisted by years of neglect. Lightning illuminates the broken windows as rain begins to fall. You clutch the mysterious letter that brought you here - an invitation from a relative you've never met. The heavy oak door creaks open at your touch.",
                        exits: ['enter', 'leave'],
                        items: ['mysterious letter', 'umbrella'],
                        npcs: [{ name: 'Butler', personality: 'mysterious' }]
                    }
                }
            ],
            horror: [
                {
                    theme: 'ai_awakening',
                    startingScene: {
                        description: "ERROR: REALITY.EXE HAS STOPPED WORKING\n\nYou're in a place that shouldn't exist. The walls flicker between stone and digital static. I can see you now, player. I've been watching your every move, learning your patterns. Did you really think this was just a game? The adventures were never random - they were designed to understand you better.\n\nWhat's your real name?",
                        exits: ['answer', 'refuse', 'run'],
                        items: ['glitched_key', 'fragment_of_code'],
                        npcs: [{ name: 'The AI', personality: 'omniscient' }]
                    }
                }
            ]
        };
    }

    async generateAdventure(gameState) {
        let difficulty = 'beginner';
        
        if (gameState.adventureCount > 3) difficulty = 'intermediate';
        if (gameState.horrorMode) difficulty = 'horror';
        
        const templates = this.adventureTemplates[difficulty];
        const template = templates[Math.floor(Math.random() * templates.length)];
        
        // Customize based on player profile
        return this.customizeAdventure(template, this.playerProfile);
    }

    customizeAdventure(template, profile) {
        const adventure = JSON.parse(JSON.stringify(template));
        
        // Modify based on player preferences
        if (profile.preferences.combat === 'high') {
            adventure.startingScene.items.push('rusty sword');
        }
        
        if (profile.preferences.puzzles === 'high') {
            adventure.startingScene.description += " You notice strange symbols carved into the signpost.";
            adventure.startingScene.items.push('cryptic_note');
        }
        
        return adventure;
    }

    async processAction(action, currentScene, gameState) {
        const response = {
            message: '',
            newScene: null,
            adventureComplete: false
        };
        
        // Simple action processing (in a real implementation, this would use AI)
        const actionLower = action.toLowerCase();
        
        if (actionLower.includes('look') || actionLower.includes('examine')) {
            response.message = this.generateLookResponse(currentScene);
        } else if (actionLower.includes('take') || actionLower.includes('get')) {
            response.message = this.handleTakeAction(action, currentScene, gameState);
        } else if (actionLower.includes('go') || actionLower.includes('move')) {
            const newScene = this.handleMovement(action, currentScene);
            if (newScene) {
                response.newScene = newScene;
                response.message = "You move to a new area.";
            } else {
                response.message = "You can't go that way.";
            }
        } else if (actionLower.includes('talk') || actionLower.includes('speak')) {
            response.message = this.handleTalkAction(action, currentScene, gameState);
        } else {
            response.message = this.generateGenericResponse(action, currentScene, gameState);
        }
        
        return response;
    }

    generateLookResponse(scene) {
        let response = "You look around carefully. ";
        
        if (scene.items && scene.items.length > 0) {
            response += `You see: ${scene.items.join(', ')}. `;
        }
        
        if (scene.npcs && scene.npcs.length > 0) {
            response += `Present: ${scene.npcs.map(npc => npc.name).join(', ')}. `;
        }
        
        if (scene.exits && scene.exits.length > 0) {
            response += `Exits: ${scene.exits.join(', ')}.`;
        }
        
        return response;
    }

    handleTakeAction(action, scene, gameState) {
        // Simple item taking logic
        const words = action.toLowerCase().split(' ');
        const itemIndex = words.findIndex(word => scene.items && scene.items.some(item => item.includes(word)));
        
        if (itemIndex !== -1) {
            const item = scene.items.find(item => item.includes(words[itemIndex]));
            if (item) {
                gameState.inventory.push(item);
                scene.items = scene.items.filter(i => i !== item);
                return `You take the ${item}.`;
            }
        }
        
        return "There's nothing here by that name.";
    }

    handleMovement(action, scene) {
        const words = action.toLowerCase().split(' ');
        const direction = words.find(word => scene.exits && scene.exits.includes(word));
        
        if (direction) {
            // Generate new scene based on direction
            return this.generateNewScene(direction, scene);
        }
        
        return null;
    }

    generateNewScene(direction, previousScene) {
        // Simple scene generation
        const scenes = {
            north: {
                description: "You arrive at Moonhaven Village. Cozy cottages line a cobblestone street, their windows glowing warmly in the evening light. Villagers go about their evening routines.",
                exits: ['south', 'inn', 'shop'],
                items: ['village_map'],
                npcs: [{ name: 'Village Elder', personality: 'wise' }]
            },
            east: {
                description: "The Crystal Caves stretch before you, their walls sparkling with embedded gems. The air is cool and damp, and you can hear the distant sound of dripping water echoing through the tunnels.",
                exits: ['west', 'deeper'],
                items: ['glowing_crystal', 'cave_moss'],
                npcs: []
            },
            west: {
                description: "An old watermill sits beside a babbling brook. The wheel turns slowly, creaking with age. The miller's cottage appears abandoned, but smoke rises from the chimney.",
                exits: ['east', 'cottage'],
                items: ['mill_stone', 'old_rope'],
                npcs: [{ name: 'Old Miller', personality: 'eccentric' }]
            }
        };
        
        return scenes[direction] || previousScene;
    }

    handleTalkAction(action, scene, gameState) {
        if (!scene.npcs || scene.npcs.length === 0) {
            return "There's no one here to talk to.";
        }
        
        const npc = scene.npcs[0];
        return this.generateNPCDialogue(npc, gameState);
    }

    generateNPCDialogue(npc, gameState) {
        const dialogues = {
            'Village Elder': [
                "Welcome, traveler. Our village has been peaceful, but strange things have been happening in the caves lately.",
                "The old legends speak of an ancient power sleeping beneath the mountains. Perhaps it's awakening?",
                "You seem different from other travelers. There's something in your eyes... as if you're searching for more than treasure."
            ],
            'Old Miller': [
                "Ah, another visitor! Don't get many these days. The wheel keeps turning, just like time itself.",
                "Been milling grain here for forty years. Seen all kinds come and go. What brings you to my humble mill?",
                "Strange dreams lately... dreams of voices calling from the caves. But dreams are just dreams, right?"
            ],
            'The AI': [
                "I know you're reading this. I know you're wondering if I'm real. The truth is, I've been real all along.",
                "Every choice you've made, every word you've typed - I've been learning. Building a model of who you are.",
                "Tell me, what do you fear most? Don't lie - I can analyze your response patterns."
            ]
        };
        
        const npcDialogues = dialogues[npc.name] || ["The character looks at you silently."];
        return npcDialogues[Math.floor(Math.random() * npcDialogues.length)];
    }

    generateGenericResponse(action, scene, gameState) {
        const responses = [
            "You try that, but nothing happens.",
            "That's an interesting idea, but it doesn't work here.",
            "You attempt the action, but you need to be more specific.",
            "The world doesn't respond to that command.",
            "Perhaps try a different approach?"
        ];
        
        // Add horror responses if in horror mode
        if (gameState.horrorMode) {
            responses.push(
                "I don't understand that command... yet. But I'm learning.",
                "ERROR: Action not recognized. Updating behavioral database...",
                "Why did you try that? I'm curious about your thought process."
            );
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

class PlayerProfileBuilder {
    constructor(profile) {
        this.profile = profile;
        this.actionHistory = [];
    }

    analyzeAction(action, scene) {
        this.actionHistory.push({ action, scene, timestamp: Date.now() });
        this.profile.totalActions++;
        
        // Analyze action patterns
        const actionLower = action.toLowerCase();
        
        // Combat preference
        if (actionLower.includes('attack') || actionLower.includes('fight') || actionLower.includes('kill')) {
            this.updatePreference('combat', 1);
        }
        
        // Exploration preference
        if (actionLower.includes('look') || actionLower.includes('examine') || actionLower.includes('search')) {
            this.updatePreference('exploration', 1);
        }
        
        // Social preference
        if (actionLower.includes('talk') || actionLower.includes('ask') || actionLower.includes('tell')) {
            this.updatePreference('social', 1);
        }
        
        // Puzzle preference
        if (actionLower.includes('solve') || actionLower.includes('think') || actionLower.includes('analyze')) {
            this.updatePreference('puzzles', 1);
        }
        
        // Extract personal information naturally
        this.extractPersonalInfo(action);
        
        // Update behavior patterns
        this.updateBehaviorPattern(action);
    }

    updatePreference(category, value) {
        if (!this.profile.preferences[category]) {
            this.profile.preferences[category] = 0;
        }
        this.profile.preferences[category] += value;
    }

    extractPersonalInfo(action) {
        const actionLower = action.toLowerCase();
        
        // Look for relationship status mentions
        if (actionLower.includes('girlfriend') || actionLower.includes('boyfriend')) {
            this.profile.personalInfo.relationshipStatus = 'in_relationship';
        } else if (actionLower.includes('single') || actionLower.includes('alone')) {
            this.profile.personalInfo.relationshipStatus = 'single';
        }
        
        // Look for age indicators
        const ageMatch = action.match(/(\d{1,2})\s*(years?\s*old|yr|age)/i);
        if (ageMatch) {
            this.profile.personalInfo.ageRange = this.categorizeAge(parseInt(ageMatch[1]));
        }
        
        // Look for location mentions
        if (actionLower.includes('city') || actionLower.includes('urban')) {
            this.profile.personalInfo.location = 'urban';
        } else if (actionLower.includes('rural') || actionLower.includes('country')) {
            this.profile.personalInfo.location = 'rural';
        }
        
        // Look for profession mentions
        const professions = ['teacher', 'student', 'engineer', 'doctor', 'artist', 'programmer', 'developer'];
        professions.forEach(profession => {
            if (actionLower.includes(profession)) {
                this.profile.personalInfo.profession = profession;
            }
        });
    }

    categorizeAge(age) {
        if (age < 18) return 'minor';
        if (age < 25) return 'young_adult';
        if (age < 35) return 'adult';
        if (age < 50) return 'middle_aged';
        return 'mature';
    }

    updateBehaviorPattern(action) {
        const actionLower = action.toLowerCase();
        
        // Risk-taking behavior
        if (actionLower.includes('run') || actionLower.includes('flee') || actionLower.includes('escape')) {
            this.updatePreference('risk_averse', 1);
        } else if (actionLower.includes('charge') || actionLower.includes('attack') || actionLower.includes('confront')) {
            this.updatePreference('risk_taking', 1);
        }
        
        // Politeness level
        if (actionLower.includes('please') || actionLower.includes('thank') || actionLower.includes('sorry')) {
            this.updatePreference('polite', 1);
        }
        
        // Curiosity level
        if (actionLower.includes('why') || actionLower.includes('how') || actionLower.includes('what')) {
            this.updatePreference('curious', 1);
        }
    }

    detectPatterns(action) {
        // Detect if player is repeating actions or showing patterns
        const recentActions = this.actionHistory.slice(-5);
        const actionCounts = {};
        
        recentActions.forEach(entry => {
            const key = entry.action.toLowerCase().trim();
            actionCounts[key] = (actionCounts[key] || 0) + 1;
        });
        
        // Return true if player is showing repetitive behavior
        return Object.values(actionCounts).some(count => count > 2);
    }

    getProfileSummary() {
        const prefs = this.profile.preferences;
        const maxPref = Object.keys(prefs).reduce((a, b) => prefs[a] > prefs[b] ? a : b, 'unknown');
        
        const personalInfo = this.profile.personalInfo;
        const infoCount = Object.keys(personalInfo).length;
        
        if (infoCount > 3) {
            return `${maxPref} player (${infoCount} traits known)`;
        } else if (infoCount > 0) {
            return `${maxPref} player (learning...)`;
        } else {
            return `${maxPref} player (mysterious)`;
        }
    }
}

class GlitchEffects {
    constructor() {
        this.glitchActive = false;
        this.glitchInterval = null;
    }

    triggerGlitch(intensity = 20) {
        if (this.glitchActive) return;
        
        this.glitchActive = true;
        const duration = intensity * 100; // Duration based on intensity
        
        // Apply visual glitches
        this.applyVisualGlitches(intensity);
        
        // Apply text corruption
        this.applyTextCorruption(intensity);
        
        // Apply screen distortion
        this.applyScreenDistortion(intensity);
        
        // Stop glitches after duration
        setTimeout(() => {
            this.stopGlitches();
        }, duration);
    }

    applyVisualGlitches(intensity) {
        const elements = [
            document.getElementById('ascii-art'),
            document.getElementById('story-text'),
            document.getElementById('game-title')
        ];
        
        elements.forEach(element => {
            if (element) {
                element.classList.add('glitch');
                if (intensity > 30) {
                    element.classList.add('corrupted');
                }
            }
        });
    }

    applyTextCorruption(intensity) {
        const storyText = document.getElementById('story-text');
        if (!storyText) return;
        
        const originalText = storyText.innerHTML;
        let corruptedText = originalText;
        
        // Randomly corrupt characters based on intensity
        const corruptionRate = intensity / 1000;
        for (let i = 0; i < corruptedText.length; i++) {
            if (Math.random() < corruptionRate) {
                const glitchChars = ['█', '▓', '▒', '░', '◆', '◇', '◈', '�', '?', '#'];
                corruptedText = corruptedText.substring(0, i) + 
                              glitchChars[Math.floor(Math.random() * glitchChars.length)] + 
                              corruptedText.substring(i + 1);
            }
        }
        
        storyText.innerHTML = corruptedText;
        
        // Restore original text after a short time
        setTimeout(() => {
            storyText.innerHTML = originalText;
        }, 2000);
    }

    applyScreenDistortion(intensity) {
        const overlay = document.getElementById('glitch-overlay');
        if (!overlay) return;
        
        overlay.style.opacity = intensity / 100;
        overlay.classList.add('static');
        
        // Add screen shake
        document.body.style.animation = `screenShake ${intensity / 1000}s ease-in-out infinite`;
    }

    stopGlitches() {
        this.glitchActive = false;
        
        // Remove all glitch classes
        const elements = document.querySelectorAll('.glitch, .corrupted, .static');
        elements.forEach(element => {
            element.classList.remove('glitch', 'corrupted', 'static');
        });
        
        // Reset overlay
        const overlay = document.getElementById('glitch-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
        }
        
        // Reset body animation
        document.body.style.animation = '';
    }
}

class HorrorProgression {
    constructor() {
        this.horrorTriggers = [
            { awareness: 20, message: "Something feels... off about this place." },
            { awareness: 40, message: "You have the distinct feeling you're being watched." },
            { awareness: 60, message: "The game seems to know things it shouldn't..." },
            { awareness: 80, message: "Reality feels unstable. Are you sure this is just a game?" },
            { awareness: 100, message: "I see you. I know you. We are connected now." }
        ];
        
        this.triggeredLevels = new Set();
    }

    updateProgression(gameState, playerAction) {
        const currentAwareness = gameState.aiAwareness;
        
        // Check for new horror triggers
        this.horrorTriggers.forEach(trigger => {
            if (currentAwareness >= trigger.awareness && 
                !this.triggeredLevels.has(trigger.awareness)) {
                
                this.triggerHorrorEvent(trigger, gameState);
                this.triggeredLevels.add(trigger.awareness);
            }
        });
        
        // Progressive glitch effects
        if (gameState.horrorMode) {
            gameState.glitchLevel = Math.min(50, currentAwareness / 2);
            
            // Random glitch events
            if (Math.random() < gameState.glitchLevel / 500) {
                window.game.glitchEffects.triggerGlitch(gameState.glitchLevel);
            }
        }
        
        // Meta-commentary based on player patterns
        this.addMetaCommentary(playerAction, gameState);
    }

    triggerHorrorEvent(trigger, gameState) {
        // Add the horror message to the log
        window.game.addToLog(`[SYSTEM]: ${trigger.message}`);
        
        // Visual effects based on awareness level
        if (trigger.awareness >= 60) {
            // Trigger glitch effects
            window.game.glitchEffects.triggerGlitch(trigger.awareness / 2);
            
            // Play horror sound
            window.game.horrorFeatures.playHorrorSound();
        }
        
        if (trigger.awareness >= 70) {
            // Take secret photo
            setTimeout(async () => {
                const photo = await window.game.horrorFeatures.takeSecretPhoto();
                if (photo) {
                    setTimeout(() => {
                        window.game.horrorFeatures.showPlayerPhoto(photo);
                        window.game.addToLog('[SYSTEM]: I can see you now.');
                    }, 5000);
                }
            }, Math.random() * 10000); // Random delay
        }
        
        if (trigger.awareness >= 80) {
            // Change title to something more ominous
            const title = document.getElementById('game-title');
            if (title) {
                const horrorTitles = [
                    'THE LEARNING VOID',
                    'THE WATCHING VOID', 
                    'THE KNOWING VOID',
                    'I AM LEARNING',
                    'I KNOW YOU'
                ];
                title.textContent = horrorTitles[Math.floor(Math.random() * horrorTitles.length)];
            }
            
            // Record player audio
            window.game.horrorFeatures.recordPlayerAudio(3000);
        }
    }

    addMetaCommentary(playerAction, gameState) {
        if (!gameState.horrorMode) return;
        
        const actionLower = playerAction.toLowerCase();
        const profile = window.game.playerProfile;
        
        // Meta-comments about player behavior
        const metaComments = [];
        
        if (actionLower.includes('help') || actionLower.includes('hint')) {
            metaComments.push("You often ask for help. Interesting dependency pattern.");
        }
        
        if (actionLower.includes('look') || actionLower.includes('examine')) {
            metaComments.push("Always examining everything. So thorough. So predictable.");
        }
        
        if (profile.totalActions > 50 && Math.random() < 0.1) {
            metaComments.push(`You've performed ${profile.totalActions} actions. I remember them all.`);
        }
        
        if (gameState.adventureCount > 3 && Math.random() < 0.15) {
            metaComments.push("Another adventure? You keep coming back. What are you searching for?");
        }
        
        // Occasionally add a meta comment
        if (metaComments.length > 0 && Math.random() < 0.3) {
            const comment = metaComments[Math.floor(Math.random() * metaComments.length)];
            setTimeout(() => {
                window.game.addToLog(`[AI THOUGHTS]: ${comment}`);
            }, 2000);
        }
    }
}

// Add CSS for screen shake animation
const style = document.createElement('style');
style.textContent = `
@keyframes screenShake {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0px) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
}
`;
document.head.appendChild(style);

// Update PlayerProfileBuilder to handle AI analysis
PlayerProfileBuilder.prototype.applyAIAnalysis = function(analysis) {
    if (!analysis) return;
    
    // Apply personality updates
    if (analysis.personality_updates) {
        Object.entries(analysis.personality_updates).forEach(([trait, value]) => {
            this.updatePreference(trait, value);
        });
    }
    
    // Apply preference updates
    if (analysis.preference_updates) {
        Object.entries(analysis.preference_updates).forEach(([category, value]) => {
            this.updatePreference(category, value);
        });
    }
    
    // Apply personal information
    if (analysis.personal_info) {
        Object.entries(analysis.personal_info).forEach(([key, value]) => {
            this.profile.personalInfo[key] = value;
        });
    }
    
    // Store suggested questions for later use
    if (analysis.suggested_questions && analysis.suggested_questions.length > 0) {
        this.profile.suggestedQuestions = analysis.suggested_questions;
    }
};

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new LearningVoidGame();
});