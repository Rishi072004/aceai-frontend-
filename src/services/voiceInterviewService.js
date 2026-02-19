/**
 * Voice Interview Service
 * Handles audio recording, API communication, and audio playback for voice-based interviews
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL) ||
  (import.meta.env?.VITE_API_URL) ||
  'http://localhost:5000';

/**
 * Initialize audio recording from microphone
 * @returns {Promise<MediaRecorder>} MediaRecorder instance
 */
export const startAudioRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });
    return mediaRecorder;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Failed to access microphone. Please check permissions.');
  }
};

/**
 * Stop audio recording and return audio blob
 * @param {MediaRecorder} mediaRecorder - The MediaRecorder instance
 * @returns {Promise<Blob>} Audio blob
 */
export const stopAudioRecording = (mediaRecorder) => {
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (event) => {
      resolve(event.data);
    };
    mediaRecorder.onerror = (error) => {
      reject(error);
    };
    mediaRecorder.stop();
    // Stop all audio tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  });
};

/**
 * Send voice interview round to backend
 * @param {Blob} audioBlob - Audio blob from recording
 * @param {string} role - Interview mode (friendly/moderate/strict)
 * @param {string} sessionId - Chat session ID
 * @param {string} resumeText - Optional resume context
 * @param {string} token - JWT authentication token
 * @param {object} jobContext - Optional job context {jobTitle, company}
 * @returns {Promise<Object>} Response with transcript, aiText, and audioBase64
 */
export const sendVoiceRound = async (audioBlob, role, sessionId, resumeText, token, jobContext = {}) => {
  try {
    console.log('📤 sendVoiceRound called with:', {
      audioBlobSize: audioBlob.size,
      audioBlobType: audioBlob.type,
      role,
      sessionId,
      hasToken: !!token,
      jobContext
    });

    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Audio blob is empty or invalid');
    }

    const formData = new FormData();
    // Create a proper file from the blob
    const audioFile = new File([audioBlob], 'recording.webm', { 
      type: audioBlob.type || 'audio/webm',
      lastModified: Date.now()
    });
    formData.append('audio', audioFile);
    formData.append('role', role);
    formData.append('sessionId', sessionId);
    formData.append('mode', role);
    if (resumeText) {
      formData.append('resumeText', resumeText);
    }
    if (jobContext.jobTitle) {
      formData.append('jobTitle', jobContext.jobTitle);
    }
    if (jobContext.company) {
      formData.append('company', jobContext.company);
    }

    console.log('📋 FormData contents:', {
      audioFile: { name: audioFile.name, size: audioFile.size, type: audioFile.type },
      role,
      sessionId
    });

    console.log('🌐 Sending POST to:', `${API_BASE_URL}/api/ai/voice-round`);
    const response = await fetch(`${API_BASE_URL}/api/ai/voice-round`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log('📨 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      throw new Error(error.message || 'Failed to process voice interview');
    }

    const data = await response.json();
    console.log('✅ Voice round response:', data);
    return data.data;
  } catch (error) {
    console.error('Error sending voice round:', error);
    throw error;
  }
};

/**
 * Play audio response from base64 string
 * @param {string} audioBase64 - Base64 encoded audio data
 * @param {object} [options]
 * @param {number} [options.playbackRate=1] - Playback speed (e.g. 0.9 for slightly slower)
 * @param {number} [options.volume=1] - Initial volume
 * @returns {HTMLAudioElement} Audio element for playback control
 */
export const playAudioResponse = (audioBase64, options = {}) => {
  try {
    const { playbackRate = 1, volume = 1 } = options;
    // Convert base64 to blob
    const binaryString = atob(audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
    
    // Create audio element and play
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackRate;
    audio.volume = volume;
    audio.play();
    
    return audio;
  } catch (error) {
    console.error('Error playing audio:', error);
    throw new Error('Failed to play audio response');
  }
};

/**
 * Record voice input from user
 * @param {number} timeLimit - Maximum recording time in seconds (optional)
 * @returns {Promise<Blob>} Audio blob
 */
export const recordVoiceInput = async (timeLimit = 30) => {
  try {
    const mediaRecorder = await startAudioRecording();
    
    return new Promise((resolve, reject) => {
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started...');
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          console.log('Recording completed. Blob size:', audioBlob.size);
          // Stop all audio tracks
          if (mediaRecorder.stream) {
            mediaRecorder.stream.getTracks().forEach((track) => track.stop());
          }
          resolve(audioBlob);
        } catch (error) {
          reject(error);
        }
      };

      mediaRecorder.start();

      // Auto-stop after time limit
      const timeout = setTimeout(() => {
        try {
          mediaRecorder.stop();
        } catch (e) {
          // Ignore if already stopped
        }
        clearTimeout(timeout);
      }, timeLimit * 1000);
    });
  } catch (error) {
    console.error('Error recording voice input:', error);
    throw error;
  }
};

/**
 * Full voice interview round workflow
 * @param {string} role - Interview mode
 * @param {string} sessionId - Chat session ID
 * @param {string} token - JWT token
 * @param {string} resumeText - Optional resume context
 * @param {Function} onRecordingStart - Callback when recording starts
 * @param {Function} onRecordingStop - Callback when recording stops
 * @param {Function} onProcessing - Callback when processing starts
 * @returns {Promise<Object>} Full response data
 */
export const executeVoiceInterviewRound = async (
  role,
  sessionId,
  token,
  resumeText = null,
  onRecordingStart = null,
  onRecordingStop = null,
  onProcessing = null
) => {
  try {
    // Record audio
    if (onRecordingStart) onRecordingStart();
    const audioBlob = await recordVoiceInput(30); // 30 second limit
    if (onRecordingStop) onRecordingStop();
    
    // Send to backend and get response
    if (onProcessing) onProcessing();
    const response = await sendVoiceRound(audioBlob, role, sessionId, resumeText, token);
    
    // Auto-play response audio
    playAudioResponse(response.audioBase64);
    
    return response;
  } catch (error) {
    console.error('Voice interview round error:', error);
    throw error;
  }
};

/**
 * Transcribe audio only (without full voice round)
 * @param {Blob} audioBlob - Audio blob
 * @param {string} token - JWT token
 * @returns {Promise<string>} Transcript text
 */
export const transcribeAudio = async (audioBlob, token) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to transcribe audio');
    }

    const data = await response.json();
    return data.data.transcript;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

/**
 * Generate TTS audio from text
 * @param {string} text - Text to convert to speech
 * @param {string} token - JWT token
 * @param {string} voice - Voice option (alloy, echo, fable, onyx, nova, shimmer)
 * @returns {Promise<string>} Audio base64
 */
export const generateSpeech = async (text, token, voice = 'alloy') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/tts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, voice })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn('TTS request failed:', error.message || response.statusText);
      return null;
    }

    const data = await response.json();
    return data.data.audioBase64 || null;
  } catch (error) {
    console.warn('Error generating speech:', error?.message || error);
    return null;
  }
};

export default {
  startAudioRecording,
  stopAudioRecording,
  sendVoiceRound,
  playAudioResponse,
  recordVoiceInput,
  executeVoiceInterviewRound,
  transcribeAudio,
  generateSpeech
};
