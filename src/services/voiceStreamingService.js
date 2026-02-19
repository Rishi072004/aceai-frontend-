/**
 * ULTRA-LOW LATENCY VOICE STREAMING SERVICE
 * 
 * Frontend WebSocket client for real-time voice interview streaming
 * Connects to backend WebSocket, streams microphone audio, receives live transcripts
 */

/**
 * STEP 1: Capture Audio from Microphone
 * Uses MediaRecorder to continuously capture audio chunks
 */
export class VoiceStreamingService {
  constructor() {
    this.ws = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.isConnected = false;
    this.isStreaming = false;
    
    // Event callbacks
    this.onPartialTranscript = null;
    this.onFinalTranscript = null;
    this.onAIResponseChunk = null;
    this.onAIResponseComplete = null;
    this.onError = null;
    this.onConnectionChange = null;
  }

  /**
   * STEP 2: Connect to Backend WebSocket
   * Establish persistent bidirectional connection
   */
  connect(token, chatId, mode, jobContext) {
    return new Promise((resolve, reject) => {
      try {
        const apiUrl = (import.meta.env?.VITE_API_BASE_URL) || (import.meta.env?.VITE_API_URL) || 'http://localhost:5000';
        const wsUrl = apiUrl.replace(/^http/, 'ws') + '/api/voice-stream';
        
        console.log('🔌 Connecting to voice stream WebSocket...');
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;
          
          if (this.onConnectionChange) {
            this.onConnectionChange(true);
          }

          // Initialize streaming session
          this.ws.send(JSON.stringify({
            type: 'start_stream',
            token,
            chatId,
            mode,
            jobContext
          }));

          resolve();
        };

        /**
         * STEP 3: Handle Incoming Messages
         * Process real-time transcripts, AI responses, audio
         */
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'stream_ready':
                console.log('🎙️  Voice stream ready');
                break;

              case 'transcript_partial':
                // Live transcript as user speaks
                console.log('📝 Partial:', data.text);
                if (this.onPartialTranscript) {
                  this.onPartialTranscript(data.text);
                }
                break;

              case 'transcript_final':
                // Complete sentence after pause
                console.log('✅ Final:', data.text);
                if (this.onFinalTranscript) {
                  this.onFinalTranscript(data.text);
                }
                break;

              case 'ai_response_chunk':
                // Streaming AI text (token by token)
                if (this.onAIResponseChunk) {
                  this.onAIResponseChunk(data.content);
                }
                break;

              case 'ai_response_complete':
                // Complete AI response with audio
                console.log('🤖 AI Response:', data.feedback, '+', data.question);
                if (this.onAIResponseComplete) {
                  this.onAIResponseComplete({
                    feedback: data.feedback,
                    question: data.question,
                    fullResponse: data.fullResponse,
                    audioBase64: data.audioBase64,
                    hasAudio: data.hasAudio
                  });
                }
                break;

              case 'error':
                console.error('❌ Server error:', data.message);
                if (this.onError) {
                  this.onError(data.message);
                }
                break;

              case 'pong':
                // Keepalive response
                break;

              default:
                console.log('Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnected = false;
          
          if (this.onConnectionChange) {
            this.onConnectionChange(false);
          }
          
          if (this.onError) {
            this.onError('Connection error');
          }
          
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnected = false;
          
          if (this.onConnectionChange) {
            this.onConnectionChange(false);
          }
        };

      } catch (error) {
        console.error('Connection setup error:', error);
        reject(error);
      }
    });
  }

  /**
   * STEP 4: Start Audio Streaming
   * Capture microphone and send audio chunks to backend
   */
  async startStreaming() {
    console.log('🎙️  startStreaming() called');
    console.log('📍 Connection status:', {
      isConnected: this.isConnected,
      isStreaming: this.isStreaming,
      wsReadyState: this.ws ? this.ws.readyState : 'null'
    });

    if (!this.isConnected) {
      console.error('❌ WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    if (this.isStreaming) {
      console.warn('⚠️  Already streaming, ignoring...');
      return;
    }

    try {
      console.log('🎤 Requesting microphone access...');
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('✅ Microphone access granted');
      console.log('📊 Stream tracks:', stream.getAudioTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        muted: t.muted
      })));

      // Setup audio processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      console.log('🎵 Audio context created, sample rate:', this.audioContext.sampleRate);

      // Create MediaRecorder to capture audio chunks
      const mimeType = this.getSupportedMimeType();
      console.log('🎬 Using MIME type:', mimeType);

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000
      });

      /**
       * STEP 5: Send Audio Chunks in Real-Time
       * As soon as audio is available, send it to backend (no buffering)
       */
      let chunkCount = 0;
      this.mediaRecorder.ondataavailable = (event) => {
        chunkCount++;
        if (event.data.size > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
          // Log every 10th chunk to avoid spam
          if (chunkCount % 10 === 0) {
            console.log(`📤 Sent ${chunkCount} audio chunks (${event.data.size} bytes)`);
          }
          
          // Convert to raw audio and send
          event.data.arrayBuffer().then(buffer => {
            // Send binary audio data directly
            this.ws.send(buffer);
          });
        } else if (event.data.size === 0) {
          console.warn('⚠️  Received empty audio chunk');
        } else if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket not ready:', this.ws ? this.ws.readyState : 'null');
        }
      };

      // Start recording with small chunks for low latency
      console.log('🎬 Starting MediaRecorder with 100ms chunks...');
      this.mediaRecorder.start(100); // 100ms chunks = near real-time
      this.isStreaming = true;

      console.log('✅ Audio streaming started successfully');

    } catch (error) {
      console.error('❌ Failed to start streaming:', error);
      throw error;
    }
  }

  /**
   * STEP 6: Stop Audio Streaming
   * Stop microphone capture and processing
   */
  stopStreaming() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      
      // Stop all tracks
      const tracks = this.mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isStreaming = false;
    console.log('🎙️  Audio streaming stopped');
  }

  /**
   * STEP 7: Disconnect and Cleanup
   * Close WebSocket and release resources
   */
  disconnect() {
    this.stopStreaming();

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'stop_stream' }));
      }
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    console.log('🔌 Disconnected from voice stream');
  }

  /**
   * Helper: Get supported audio MIME type
   */
  getSupportedMimeType() {
    const types = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Helper: Play audio response
   */
  playAudio(audioBase64) {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        
        audio.onended = resolve;
        audio.onerror = reject;
        
        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Keepalive ping
   */
  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }
}

// Export singleton instance
export const voiceStreamingService = new VoiceStreamingService();
