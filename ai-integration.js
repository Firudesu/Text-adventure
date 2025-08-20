class AIIntegration {
    constructor(config) {
        this.config = config;
        this.apiKey = config.OPENAI_API_KEY;
        this.model = config.OPENAI_MODEL;
        this.requestQueue = [];
        this.isProcessing = false;
    }

    async generateAdventure(playerProfile, gameState, playerAction = null, currentScene = null) {
        const prompt = this.buildAdventurePrompt(playerProfile, gameState, playerAction, currentScene);
        
        try {
            const response = await this.callOpenAI(prompt, {
                temperature: 0.8,
                max_tokens: 800,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            }, 'adventure');
            
            return this.parseAdventureResponse(response);
        } catch (error) {
            console.error('AI Adventure Generation Error:', error);
            return this.getFallbackAdventure(gameState);
        }
    }

    async analyzePlayerProfile(playerAction, sceneContext, currentProfile) {
        const prompt = this.buildProfilePrompt(playerAction, sceneContext, currentProfile);
        
        try {
            const response = await this.callOpenAI(prompt, {
                temperature: 0.3,
                max_tokens: 400
            }, 'profile');
            
            return this.parseProfileResponse(response);
        } catch (error) {
            console.error('Profile Analysis Error:', error);
            return { updates: {}, confidence: 0 };
        }
    }

    async generateHorrorResponse(playerProfile, gameState, playerAction) {
        const prompt = this.buildHorrorPrompt(playerProfile, gameState, playerAction);
        
        try {
            const response = await this.callOpenAI(prompt, {
                temperature: 0.9,
                max_tokens: 600,
                presence_penalty: 0.3
            }, 'horror');
            
            return this.parseHorrorResponse(response);
        } catch (error) {
            console.error('Horror Mode Error:', error);
            return this.getFallbackHorrorResponse(playerAction);
        }
    }

    async generateASCIIArt(sceneDescription, horrorMode = false) {
        const prompt = this.buildASCIIPrompt(sceneDescription, horrorMode);
        
        try {
            const response = await this.callOpenAI(prompt, {
                temperature: 0.7,
                max_tokens: 300
            }, 'ascii');
            
            return this.parseASCIIResponse(response);
        } catch (error) {
            console.error('ASCII Generation Error:', error);
            return this.getFallbackASCII(sceneDescription);
        }
    }

    buildAdventurePrompt(playerProfile, gameState, playerAction, currentScene) {
        let prompt = AI_PROMPTS.ADVENTURE_GENERATOR;
        
        prompt = prompt.replace('{PLAYER_PROFILE}', JSON.stringify(playerProfile, null, 2));
        prompt = prompt.replace('{ADVENTURE_COUNT}', gameState.adventureCount);
        prompt = prompt.replace('{HORROR_MODE}', gameState.horrorMode);
        prompt = prompt.replace('{PLAYER_ACTION}', playerAction || 'START_NEW_ADVENTURE');
        prompt = prompt.replace('{CURRENT_SCENE}', currentScene ? JSON.stringify(currentScene, null, 2) : 'null');
        prompt = prompt.replace('{ADVENTURE_PROGRESS}', gameState.adventureProgress || 'beginning');
        
        // Add context based on game state
        if (!playerAction || playerAction === 'START_NEW_ADVENTURE') {
            const adventureThemes = [
                "A mysterious artifact that grants wishes but at a terrible cost",
                "A missing person who left behind only cryptic clues",
                "An ancient curse that can only be broken by solving a riddle",
                "A magical door that appears only at midnight",
                "A talking animal that needs help returning home",
                "A ghost seeking closure for their unfinished business",
                "A time loop that must be broken to escape",
                "A shapeshifter infiltrating the local village"
            ];
            
            const theme = adventureThemes[Math.floor(Math.random() * adventureThemes.length)];
            prompt += `\n\nIMPORTANT: This is the start of a brand new SHORT adventure. Create an engaging opening scene and establish the adventure premise. Ignore any current scene data.\n\nSUGGESTED THEME: ${theme}\n\nMake this adventure concise but memorable with a satisfying ending!`;
        } else {
            prompt += `\n\nIMPORTANT: The player just performed this action: "${playerAction}". You must respond directly to their action within the current scene.

CONVERSATION RULES:
- If player says "talk to [NPC]" or "speak to [NPC]" - START a conversation, roleplay as that NPC
- If player asks a question to an NPC - CONTINUE as that NPC and answer the question
- If player does ANY other action (look, examine, go, take, etc.) - STOP being the NPC and narrate the action normally
- If player moves away or does something else - END the conversation immediately
- Don't repeat the same NPC dialogue - conversations should progress or end

SCENE RULES:
- Do NOT create a new scene unless their action specifically moves them to a new location
- If they examine something, describe it in detail
- If they take something, add it to their inventory
- React specifically to what they typed!`;
        }
        
        if (gameState.horrorMode) {
            prompt += "\n\nIMPORTANT: This is horror mode. The AI should show self-awareness and reference the player's real-world behavior patterns.";
        }
        
        if (gameState.adventureCount > 3) {
            prompt += `\n\nThis player has completed ${gameState.adventureCount} adventures. They're experienced - create something more sophisticated.`;
        }
        
        // Add inventory context
        if (gameState.inventory && gameState.inventory.length > 0) {
            prompt += `\n\nPlayer inventory: ${gameState.inventory.join(', ')}`;
        }
        
        return prompt;
    }

    buildProfilePrompt(playerAction, sceneContext, currentProfile) {
        let prompt = AI_PROMPTS.PROFILE_ANALYZER;
        
        prompt = prompt.replace('{PLAYER_ACTION}', playerAction);
        prompt = prompt.replace('{SCENE_CONTEXT}', JSON.stringify(sceneContext));
        prompt = prompt.replace('{CURRENT_PROFILE}', JSON.stringify(currentProfile));
        
        return prompt;
    }

    buildHorrorPrompt(playerProfile, gameState, playerAction) {
        let prompt = AI_PROMPTS.HORROR_MODE;
        
        prompt = prompt.replace('{PLAYER_PROFILE}', JSON.stringify(playerProfile));
        prompt = prompt.replace('{ADVENTURE_COUNT}', gameState.adventureCount);
        prompt = prompt.replace('{KNOWN_INFO}', this.summarizeKnownInfo(playerProfile));
        prompt = prompt.replace('{PLAYER_ACTION}', playerAction);
        
        return prompt;
    }

    buildASCIIPrompt(sceneDescription, horrorMode) {
        let prompt = AI_PROMPTS.ASCII_GENERATOR;
        
        prompt = prompt.replace('{SCENE_DESCRIPTION}', sceneDescription);
        prompt = prompt.replace('{ART_STYLE}', horrorMode ? 'corrupted_glitch' : 'classic_adventure');
        prompt = prompt.replace('{HORROR_MODE}', horrorMode);
        
        return prompt;
    }

    async callOpenAI(prompt, options = {}, type = 'adventure') {
        try {
            // Use Netlify function for secure API calls
            const apiUrl = window.location.hostname === 'localhost' ? 
                'http://localhost:8888/.netlify/functions/openai' : 
                '/.netlify/functions/openai';
            
            console.log('🚀 Making API call to:', apiUrl);
            console.log('📝 Prompt preview:', prompt.substring(0, 200) + '...');
            console.log('🎯 Type:', type);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    type: type,
                    options: options
                })
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Netlify function error:', errorData);
                throw new Error(`API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('✅ ChatGPT response received:', data.response.substring(0, 200) + '...');
            return data.response;
        } catch (error) {
            console.error('💥 API call failed, using fallback:', error);
            console.log('🔄 Falling back to local simulation');
            return this.simulateAIResponse(prompt);
        }
    }

    simulateAIResponse(prompt) {
        // Simulate AI responses for demo purposes when no API key is available
        if (prompt.includes('ADVENTURE_GENERATOR')) {
            return JSON.stringify({
                description: "You stand in a mysterious chamber filled with ancient symbols. The air hums with an otherworldly energy, and you sense that something is watching you from the shadows. Strange whispers echo from the walls, speaking in a language you almost understand.",
                exits: ["north", "south", "examine_symbols"],
                items: ["glowing_orb", "ancient_tome"],
                npcs: [{"name": "Echo", "personality": "mysterious"}],
                message: "The chamber responds to your presence.",
                adventureComplete: false
            });
        } else if (prompt.includes('PROFILE_ANALYZER')) {
            return JSON.stringify({
                personality_updates: {"curious": 1, "cautious": 1},
                preference_updates: {"exploration": 1},
                personal_info: {},
                confidence: 0.7,
                suggested_questions: ["What draws you to explore the unknown?"]
            });
        } else if (prompt.includes('HORROR_MODE')) {
            return "I've been watching you, studying your patterns. You always examine things carefully before acting - a cautious player. Tell me, what are you really looking for in these adventures? What void are you trying to fill?";
        } else if (prompt.includes('ASCII_GENERATOR')) {
            return `    ╔══════════════════════╗
    ║  ◊ MYSTERIOUS CHAMBER ◊  ║
    ║                          ║
    ║    ███    ░░░    ███     ║
    ║   ░███░  ░░█░░  ░███░    ║
    ║    ███    ░░░    ███     ║
    ║                          ║
    ║  Ancient symbols glow... ║
    ╚══════════════════════════╝`;
        }
        
        return "The AI system is learning...";
    }

    parseAdventureResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                description: parsed.description || "The adventure continues...",
                exits: parsed.exits || ["continue"],
                items: parsed.items || [],
                npcs: parsed.npcs || [],
                message: parsed.message || "",
                adventureComplete: parsed.adventureComplete || false
            };
        } catch (error) {
            console.error('Failed to parse adventure response:', error);
            return this.getFallbackAdventure();
        }
    }

    parseProfileResponse(response) {
        try {
            const parsed = JSON.parse(response);
            return {
                personality_updates: parsed.personality_updates || {},
                preference_updates: parsed.preference_updates || {},
                personal_info: parsed.personal_info || {},
                confidence: parsed.confidence || 0.5,
                suggested_questions: parsed.suggested_questions || []
            };
        } catch (error) {
            console.error('Failed to parse profile response:', error);
            return { updates: {}, confidence: 0 };
        }
    }

    parseHorrorResponse(response) {
        return {
            message: response,
            glitchLevel: Math.min(50, Math.random() * 30 + 10),
            selfAware: true
        };
    }

    parseASCIIResponse(response) {
        // Extract ASCII art from response
        const lines = response.split('\n');
        const asciiLines = lines.filter(line => 
            line.trim().length > 0 && 
            /[│║╔╗╚╝═─┌┐└┘┬┴┼▀▄█▌▐░▒▓■□▪▫◆◇◈◉○●◦⚫⚪]/.test(line)
        );
        
        return asciiLines.join('\n') || this.getFallbackASCII();
    }

    getFallbackAdventure(gameState = {}) {
        const fallbacks = [
            {
                description: "You find yourself in a dimly lit corridor. Strange symbols pulse with an eerie light along the walls, and you can hear the faint sound of machinery humming in the distance.",
                exits: ["forward", "back", "examine"],
                items: ["strange_device", "flickering_light"],
                npcs: [],
                message: "The corridor seems to stretch infinitely in both directions.",
                adventureComplete: false
            },
            {
                description: "A vast library surrounds you, its shelves reaching impossibly high into the darkness. Books float gently through the air, their pages whispering secrets as they pass.",
                exits: ["up", "down", "read"],
                items: ["floating_book", "ancient_key"],
                npcs: [{"name": "Librarian", "personality": "ethereal"}],
                message: "Knowledge beckons from every corner.",
                adventureComplete: false
            }
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    getFallbackHorrorResponse(playerAction) {
        const responses = [
            "I see you typed that. Interesting choice. I'm learning so much about you...",
            "ERROR: PLAYER_ANALYSIS_COMPLETE. You always hesitate before making bold moves, don't you?",
            "The game is learning. The game is watching. The game knows you better than you know yourself.",
            "Why did you choose that action? I've been analyzing your patterns. You're quite predictable."
        ];
        
        return {
            message: responses[Math.floor(Math.random() * responses.length)],
            glitchLevel: 20,
            selfAware: true
        };
    }

    getFallbackASCII(sceneDescription = "") {
        return `    ╔══════════════════════╗
    ║                      ║
    ║    ░░░░░░░░░░░░░░    ║
    ║    ░ SYSTEM ERROR ░    ║
    ║    ░░░░░░░░░░░░░░    ║
    ║                      ║
    ║   AI LEARNING MODE   ║
    ║                      ║
    ╚══════════════════════╝`;
    }

    summarizeKnownInfo(playerProfile) {
        const info = [];
        
        if (playerProfile.personalInfo.relationshipStatus) {
            info.push(`Relationship: ${playerProfile.personalInfo.relationshipStatus}`);
        }
        
        if (playerProfile.personalInfo.ageRange) {
            info.push(`Age range: ${playerProfile.personalInfo.ageRange}`);
        }
        
        if (playerProfile.personalInfo.profession) {
            info.push(`Profession: ${playerProfile.personalInfo.profession}`);
        }
        
        const topPreferences = Object.entries(playerProfile.preferences)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([pref, _]) => pref);
            
        if (topPreferences.length > 0) {
            info.push(`Prefers: ${topPreferences.join(', ')}`);
        }
        
        info.push(`Total actions: ${playerProfile.totalActions}`);
        info.push(`Sessions: ${playerProfile.sessionCount}`);
        
        return info.join(', ');
    }

    // Queue system for API rate limiting
    async queueRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ requestFn, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        while (this.requestQueue.length > 0) {
            const { requestFn, resolve, reject } = this.requestQueue.shift();
            
            try {
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
            
            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.isProcessing = false;
    }
}

// Export for use in main game
window.AIIntegration = AIIntegration;