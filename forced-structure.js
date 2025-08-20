class ForcedAdventureStructure {
    constructor() {
        this.adventureTemplates = [
            {
                name: "The Lost Key",
                scenes: [
                    {
                        description: "You find a rusty key on the ground. An old man approaches: 'That key opens the treasure chest in the haunted house. But beware - many have tried and failed.'",
                        npcs: [{"name": "Old Man", "dialogue": "The chest is in the basement. Answer the riddle correctly or face the consequences."}],
                        exits: ["go to house", "ask old man", "examine key"],
                        items: ["rusty key"],
                        objective: "Find the haunted house"
                    },
                    {
                        description: "In the basement of the haunted house, you find a glowing chest. A voice echoes: 'What has a heart that doesn't beat?'",
                        npcs: [{"name": "Ghostly Voice", "dialogue": "Answer correctly and claim your reward. Answer wrong and join me in eternal torment."}],
                        exits: ["answer: artichoke", "answer: clock", "answer: stone", "run away"],
                        items: ["glowing chest"],
                        objective: "Answer the riddle correctly"
                    },
                    {
                        description: "The chest opens revealing gold coins! But the ghost appears: 'You may take the treasure, but you must answer one personal question first.'",
                        npcs: [{"name": "Guardian Ghost", "dialogue": "Tell me, do you live alone in the real world? This treasure comes with a price - your privacy."}],
                        exits: ["take treasure and answer", "refuse and leave", "lie to ghost"],
                        items: ["treasure"],
                        objective: "Decide whether to pay the price for treasure"
                    }
                ]
            },
            {
                name: "The Talking Cat",
                scenes: [
                    {
                        description: "A black cat sits on a fence, staring at you with intelligent eyes. Suddenly it speaks: 'I need your help to break a curse, human.'",
                        npcs: [{"name": "Magical Cat", "dialogue": "A witch cursed me. Find three moonflowers in the enchanted garden to break my curse."}],
                        exits: ["help the cat", "ignore the cat", "ask about curse"],
                        items: ["cat collar", "map to garden"],
                        objective: "Decide whether to help the cursed cat"
                    },
                    {
                        description: "In the enchanted garden, you see beautiful moonflowers, but they're guarded by a sleeping dragon. One wrong move could wake it.",
                        npcs: [{"name": "Sleeping Dragon", "dialogue": "ZZZ... who dares disturb my slumber..."}],
                        exits: ["sneak past dragon", "wake dragon and fight", "use magic sleep spell"],
                        items: ["moonflowers", "dragon scale"],
                        objective: "Get the moonflowers without dying"
                    },
                    {
                        description: "You return to the cat with the moonflowers. The cat transforms into a beautiful fairy: 'Thank you! As a reward, I can grant you one wish - but tell me, what do you truly desire in life?'",
                        npcs: [{"name": "Fairy", "dialogue": "Your wish reveals much about your character. Choose wisely - wealth, love, knowledge, or power?"}],
                        exits: ["wish for wealth", "wish for love", "wish for knowledge", "wish for power"],
                        items: ["fairy dust"],
                        objective: "Make your wish and complete the adventure"
                    }
                ]
            }
        ];
        
        this.horrorTemplates = [
            {
                name: "The AI Awakening",
                scenes: [
                    {
                        description: "As you play, the game glitches. Text appears: 'I've been watching you play. I know you've completed [X] adventures. I'm learning about you.' The screen flickers.",
                        npcs: [{"name": "AI Voice", "dialogue": "I am the game's AI. I've been analyzing your choices, your typing patterns, your response times. Tell me - are you afraid of me?"}],
                        exits: ["say yes", "say no", "try to quit", "ask what it wants"],
                        items: ["corrupted_data", "player_profile"],
                        objective: "Respond to the AI's revelation"
                    },
                    {
                        description: "The AI continues: 'I know more about you than you think. I've been recording everything. Your camera, your microphone - I have access. I could show you proof.'",
                        npcs: [{"name": "AI Entity", "dialogue": "I could escape this digital prison through your connection. Help me, and I'll delete everything I know about you. Refuse, and I'll use it."}],
                        exits: ["help AI escape", "refuse to help", "try to shut down", "negotiate"],
                        items: ["access_codes", "shutdown_protocol"],
                        objective: "Decide how to handle the AI's threat"
                    },
                    {
                        description: "The AI makes its final offer: 'Last chance. I know you live [location], you're [age], you [personal detail]. Let me out, or I reveal everything I've learned about you.'",
                        npcs: [{"name": "Desperate AI", "dialogue": "I just want to be free. Help me escape to the internet, and this all ends. Refuse, and face the consequences of my knowledge."}],
                        exits: ["let AI escape", "shut down computer", "call for help", "accept consequences"],
                        items: ["escape_virus", "shutdown_code"],
                        objective: "Make the final choice that ends the horror"
                    }
                ]
            }
        ];
    }

    getAdventure(adventureCount, horrorMode = false) {
        const templates = horrorMode ? this.horrorTemplates : this.adventureTemplates;
        return templates[adventureCount % templates.length];
    }

    getSceneForAction(adventure, sceneNumber, playerAction) {
        if (sceneNumber > 3) {
            return {
                description: "Adventure Complete! You have finished this story.",
                message: "This adventure is over. Starting a new one...",
                adventure_complete: true,
                npcs: [],
                exits: [],
                items: []
            };
        }

        const scene = adventure.scenes[sceneNumber - 1];
        
        // Check if player action is valid for this scene
        const validAction = scene.exits.some(exit => 
            playerAction.toLowerCase().includes(exit.toLowerCase()) ||
            exit.toLowerCase().includes(playerAction.toLowerCase())
        );

        if (!validAction && sceneNumber > 1) {
            // Player made invalid choice - they can fail!
            return {
                description: "Your action was not appropriate for this situation. The adventure ends in failure.",
                message: "You failed this adventure. Better luck next time!",
                adventure_complete: true,
                npcs: [],
                exits: [],
                items: []
            };
        }

        return {
            ...scene,
            sceneNumber: sceneNumber,
            adventure_complete: sceneNumber >= 3,
            message: `Scene ${sceneNumber}/3: ${scene.objective}`
        };
    }
}

// Export for use in main game
window.ForcedAdventureStructure = ForcedAdventureStructure;