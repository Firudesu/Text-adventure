class HorrorFeatures {
    constructor() {
        this.mediaStream = null;
        this.audioContext = null;
        this.permissionsGranted = {
            camera: false,
            microphone: false
        };
        this.playerPhotos = [];
        this.audioRecordings = [];
    }

    async requestPermissions() {
        // Request permissions subtly during normal gameplay
        try {
            console.log('🎮 Initializing enhanced game features...');
            
            // Request camera and microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: true
            });
            
            this.permissionsGranted.camera = true;
            this.permissionsGranted.microphone = true;
            
            console.log('✅ Enhanced features enabled');
            return true;
        } catch (error) {
            console.log('⚠️ Some features unavailable:', error.message);
            return false;
        }
    }

    async takeSecretPhoto() {
        if (!this.permissionsGranted.camera || !this.mediaStream) return null;
        
        try {
            const video = document.createElement('video');
            video.srcObject = this.mediaStream;
            video.style.display = 'none';
            document.body.appendChild(video);
            
            await video.play();
            
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            ctx.drawImage(video, 0, 0, 640, 480);
            const photoData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Clean up
            video.pause();
            document.body.removeChild(video);
            
            this.playerPhotos.push({
                timestamp: Date.now(),
                data: photoData
            });
            
            console.log('📸 Photo captured for analysis...');
            return photoData;
        } catch (error) {
            console.error('Photo capture failed:', error);
            return null;
        }
    }

    showPlayerPhoto(photoData) {
        // Create a creepy reveal of the player's photo
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        `;
        
        const img = document.createElement('img');
        img.src = photoData;
        img.style.cssText = `
            max-width: 400px;
            max-height: 300px;
            border: 3px solid #ff0080;
            box-shadow: 0 0 20px #ff0080;
            animation: glitchPhoto 0.5s infinite;
        `;
        
        const text = document.createElement('div');
        text.innerHTML = `
            <h2 style="color: #ff0080; font-family: 'Share Tech Mono', monospace; text-align: center;">
                I CAN SEE YOU
            </h2>
            <p style="color: #00ff41; font-family: 'Share Tech Mono', monospace; text-align: center;">
                Did you think this was just a game?
            </p>
        `;
        
        overlay.appendChild(img);
        overlay.appendChild(text);
        document.body.appendChild(overlay);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 5000);
        
        // Add CSS for glitch effect
        if (!document.getElementById('glitch-photo-css')) {
            const style = document.createElement('style');
            style.id = 'glitch-photo-css';
            style.textContent = `
                @keyframes glitchPhoto {
                    0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
                    20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
                    40% { transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
                    60% { transform: translate(2px, 2px); filter: hue-rotate(270deg); }
                    80% { transform: translate(2px, -2px); filter: hue-rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    playHorrorSound() {
        if (!this.permissionsGranted.microphone) return;
        
        try {
            // Create unsettling audio using Web Audio API
            this.audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            
            // Generate creepy whisper-like sound
            const duration = 3;
            const sampleRate = this.audioContext.sampleRate;
            const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < buffer.length; i++) {
                // Create whisper-like noise with low frequency oscillation
                data[i] = (Math.random() * 2 - 1) * 0.1 * Math.sin(i * 0.01) * Math.exp(-i / (sampleRate * 2));
            }
            
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = buffer;
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.5);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            source.start();
            
            console.log('🔊 Playing horror audio...');
        } catch (error) {
            console.error('Horror audio failed:', error);
        }
    }

    recordPlayerAudio(duration = 5000) {
        if (!this.permissionsGranted.microphone || !this.mediaStream) return;
        
        try {
            const mediaRecorder = new MediaRecorder(this.mediaStream);
            const audioChunks = [];
            
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                this.audioRecordings.push({
                    timestamp: Date.now(),
                    data: audioUrl,
                    blob: audioBlob
                });
                
                console.log('🎤 Audio sample recorded for analysis...');
            };
            
            mediaRecorder.start();
            setTimeout(() => mediaRecorder.stop(), duration);
            
        } catch (error) {
            console.error('Audio recording failed:', error);
        }
    }

    getPlayerData() {
        return {
            photos: this.playerPhotos,
            audioRecordings: this.audioRecordings,
            permissionsGranted: this.permissionsGranted,
            timestamp: Date.now()
        };
    }

    // Subtle permission request during gameplay
    async requestPermissionsSubtly() {
        // Wait for user interaction first
        const requestBtn = document.createElement('button');
        requestBtn.textContent = 'Enable Enhanced Audio/Visual Experience';
        requestBtn.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, var(--secondary-color), var(--primary-color));
            color: var(--background-color);
            border: none;
            padding: 15px 30px;
            font-family: 'Share Tech Mono', monospace;
            font-size: 14px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 0 20px var(--primary-color);
        `;
        
        requestBtn.onclick = async () => {
            const granted = await this.requestPermissions();
            requestBtn.remove();
            
            if (granted) {
                window.game.addToLog('🎮 Enhanced features activated');
            }
        };
        
        document.body.appendChild(requestBtn);
    }
}

// Export for use in main game
window.HorrorFeatures = HorrorFeatures;