import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, Monitor, Settings, Grid, MessageSquare, FileText, List, Send, MoreVertical, Phone, AlertCircle, RefreshCw, Maximize, ChevronLeft, Upload, User, Bot, Volume2, VolumeX, ArrowUpRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ResumeUpload from "@/components/ResumeUpload";
// import { useAudioLevel } from "@/hooks/useAudioLevel";
import * as voiceInterviewService from "@/services/voiceInterviewService";
import { voiceStreamingService } from "@/services/voiceStreamingService";
import { motion } from "framer-motion";
import { Color, Mesh, Program, Renderer, Triangle } from "ogl";
import "./Interview.css";
import "./PremiumInterviewRoom.css";

const MODE_DISPLAY = {
  friendly: { label: "Friendly", accent: "#22c55e" },
  moderate: { label: "Moderate", accent: "#60a5fa" },
  strict: { label: "Strict", accent: "#f59e0b" },
};

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000');

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;
void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv * 2.0 - 1.0) * uResolution.xy / mr;
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 10.0; ++i)
 {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

const Iridescence = ({ color = [0.3, 0.6, 1], speed = 0.1, amplitude = 0.1 }) => {
  const containerRef = useRef(null);
  const programRef = useRef(null);
  const amplitudeRef = useRef(amplitude);
  const speedRef = useRef(speed);

  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return undefined;

    const renderer = new Renderer({ dpr: 1, alpha: true });
    const { gl } = renderer;
    gl.clearColor(0, 0, 0, 0);
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(...color) },
        uResolution: { value: new Color(1, 1, 1) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uAmplitude: { value: amplitudeRef.current },
        uSpeed: { value: speedRef.current },
      },
    });
    programRef.current = program;
    const mesh = new Mesh(gl, { geometry, program });
    let frame = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height);
      program.uniforms.uResolution.value = new Color(width, height, width / height);
    };

    resize();
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.borderRadius = "50%";
    gl.canvas.style.overflow = "hidden";
    gl.canvas.style.background = "transparent";
    gl.canvas.style.display = "block";
    parent.appendChild(gl.canvas);

    const render = (t) => {
      program.uniforms.uTime.value = t * 0.001;
      program.uniforms.uAmplitude.value = amplitudeRef.current;
      program.uniforms.uSpeed.value = speedRef.current;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (gl.canvas.parentNode === parent) {
        parent.removeChild(gl.canvas);
      }
    };
  }, [color]);

  useEffect(() => {
    amplitudeRef.current = amplitude;
    speedRef.current = speed;
  }, [amplitude, speed]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

const AssistantOrb = ({ glow, isActive }) => {
  // const { levelRef, ready, error, start } = useAudioLevel();
  // Fallback stub values to keep UI rendering while audio-level hook is disabled.
  const levelRef = useRef(0);
  const ready = true;
  const error = null;
  const start = () => {};
  const [level, setLevel] = useState(0);
  // Toggle between static fallback and animated WebGL orb
  const [useFallbackOrb] = useState(false);

  useEffect(() => {
    start();
  }, [start]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    const update = (ts) => {
      if (ts - last > 80) {
        setLevel((prev) => {
          const next = prev + (levelRef.current - prev) * 0.08;
          return Math.abs(next - prev) < 0.0015 ? prev : next;
        });
        last = ts;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  const amplitude = 0.12 + level * 0.65;
  const speed = 0.5 + level * 0.25;
  const scale = 1 + level * 0.08;
  const glowOpacity = 0.38 + level * 3.2;

  return (
    <div
      className={`ai-assistant-orb ${isActive ? 'orb-active' : ''}`}
      style={{
        position: "relative",
        width: "350px",
        height: "100px",
        display: "grid",
        placeItems: "center",
        boxShadow: glow,
        transition: "box-shadow 0.6s ease, transform 0.25s ease",
        borderRadius: "50%",
        padding:"0px",
        margin:"0px",
        // background: "transparent",
      }}
    >
      {useFallbackOrb ? (
        <div
          style={{
            position: "relative",
            width: "90%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            overflow: "hidden",
            transform: `scale(${scale})`,
            transition: "transform 0.25s ease, box-shadow 0.4s ease",
            background: "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.7), rgba(59,130,246,0.5) 50%, rgba(24,24,27,0.0) 85%)",
            boxShadow: "0 0 30px rgba(99,102,241,0.3), inset 0 0 18px rgba(255,255,255,0.1)",
          }}
        />
      ) : (
        <div
          style={{
            position: "relative",
            width: "90%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            overflow: "hidden",
            transform: `scale(${scale})`,
            transition: "transform 0.25s ease, box-shadow 0.4s ease",
            boxShadow: "0 0 40px rgba(99,102,241,0.35), inset 0 0 30px rgba(255,255,255,0.08)",
          }}
        >
          <Iridescence amplitude={amplitude} speed={speed} color={[0.3, 0.6, 1]} />
        </div>
      )}
      {!ready && !error && (
        <span style={{ fontSize: "0.75rem", color: "#dbeafe", marginTop: "8px" }}>Listening...</span>
      )}
      {error && (
        <span style={{ fontSize: "0.75rem", color: "#fecdd3", marginTop: "8px" }}>Mic access needed</span>
      )}
    </div>
  );
};

const InterviewRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, setUser } = useAuth();
  
  // Starter mode detection from route state
  const starterMode = location.state?.starterMode || false;
  const planType = location.state?.planType || null;

  const normalizedPlanType = planType ? String(planType).toUpperCase() : null;
  const isValuePlan = (user?.plan === 'VALUE') || normalizedPlanType === 'VALUE';
  // Treat any user on the STARTER plan as a Starter session,
  // even if route state was lost (e.g. on refresh).
  const isStarterPlan = user?.plan === 'STARTER';
  const isStarterSession = starterMode || isStarterPlan;
  const isValueSession = !isStarterSession && isValuePlan;
  
  // Always start on mode selection screen; Starter users will also
  // choose Friendly / Moderate / Strict before proceeding.
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [showJobProfile, setShowJobProfile] = useState(false);
  const [selectedMode, setSelectedMode] = useState(starterMode ? 'moderate' : null); // Default to moderate for Starter
  const [jobProfile, setJobProfile] = useState({
    jobTitle: "",
    company: "",
    jobDescription: "",
    resumeId: null
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");
  const [userMessage, setUserMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [notes, setNotes] = useState("");
  const [cameraError, setCameraError] = useState(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(true);
  
  // Backend integration states
  const [chatId, setChatId] = useState(null);
  const [isCreatingInterview, setIsCreatingInterview] = useState(false);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [queuedQuestions, setQueuedQuestions] = useState([]);
  const [lastError, setLastError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;
  
  // Voice interview states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAIAudioMuted, setIsAIAudioMuted] = useState(false);
  const [aiPlaybackRate, setAiPlaybackRate] = useState(0.9);
  const [isAITyping, setIsAITyping] = useState(false);
  const mediaRecorderRef = useRef(null);
  const micStreamRef = useRef(null); // Track mic stream for cleanup
  const audioChunksRef = useRef([]);
  const audioPlaybackRef = useRef(null);
  const submitInProgressRef = useRef(false);
  const starterTimerRef = useRef(null);
  const starterLimitTriggeredRef = useRef(false);
  const valueLimitTriggeredRef = useRef(false);
  const queuedQuestionsRef = useRef([]);
  
  // Premium Interview Room States
  const [webcamStream, setWebcamStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [webcamError, setWebcamError] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const webcamVideoRef = useRef(null);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);
  const isAssistantSpeaking = isAudioPlaying || isAITyping;
  const isAssistantListening = isRecordingVoice;

  // Normalize selected mode so requests always include a valid value
  const resolvedMode = selectedMode || 'moderate';

  // Navbar visibility states
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const [isNavbarHovered, setIsNavbarHovered] = useState(false);
  const navbarTimeoutRef = useRef(null);

  // Simple glow effects - no fancy animations
const getAssistantGlow = () => {
  if (isRecordingVoice) {
    return "0 0 55px rgba(99,102,241,0.95), 0 0 120px rgba(147,51,234,0.75)";
  }
  if (isAudioPlaying || isAITyping) {
    return "0 0 48px rgba(147,51,234,0.88), 0 0 110px rgba(59,130,246,0.65)";
  }
  if (isMicOn) {
    return "0 0 30px rgba(99,102,241,0.45), 0 0 70px rgba(147,51,234,0.35)";
  }
  return "0 0 18px rgba(99,102,241,0.25)";
};

  // Navbar control functions
  const showNavbar = () => {
    setIsNavbarVisible(true);
    if (navbarTimeoutRef.current) {
      clearTimeout(navbarTimeoutRef.current);
    }
    navbarTimeoutRef.current = setTimeout(() => {
      if (!isNavbarHovered) {
        setIsNavbarVisible(false);
      }
    }, 3000);
  };

  const toggleNavbar = () => {
    if (isNavbarVisible) {
      setIsNavbarVisible(false);
      if (navbarTimeoutRef.current) {
        clearTimeout(navbarTimeoutRef.current);
      }
    } else {
      showNavbar();
    }
  };

  const handleNavbarMouseEnter = () => {
    setIsNavbarHovered(true);
    setIsNavbarVisible(true);
    if (navbarTimeoutRef.current) {
      clearTimeout(navbarTimeoutRef.current);
    }
  };

  const handleNavbarMouseLeave = () => {
    setIsNavbarHovered(false);
    navbarTimeoutRef.current = setTimeout(() => {
      setIsNavbarVisible(false);
    }, 1000);
  };
  
  // Starter package restrictions
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const MAX_STARTER_QUESTIONS = 20; // Up to 20 questions for Starter pack
  const MAX_STARTER_TIME = 30 * 60; // 30 minutes for Starter pack
  const MAX_VALUE_QUESTIONS = 35; // Maximum 35 questions for Value pack
  const MAX_VALUE_TIME = 50 * 60; // Maximum 50 minutes for Value pack (in seconds)
  const VALUE_START_KEY = 'value-interview-start-ts';
  
  // Media stream refs
  const userVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      type: "question",
      text: "Tell me about a challenging project you worked on.",
      subPoints: [
        "Describe the project and your role",
        "What challenges did you face?",
        "How did you overcome them?"
      ]
    },
    {
      type: "question",
      text: "How do you prioritize your tasks?"
    },
    {
      type: "question",
      text: "What are your strengths?"
    }
  ]);

  const chatContainerRef = useRef(null);
  const transcriptContainerRef = useRef(null); // For transcript panel auto-scroll

  // Generic interview access guard: must be logged in and either
  // have credits available OR already be in an active interview
  // session (chatId/localStorage). This prevents redirecting away
  // mid-session after a credit is consumed.
  useEffect(() => {
    if (!user) {
      navigate('/pricing');
      return;
    }

    const activeChatId = chatId || localStorage.getItem('current-chat-id');
    if (!activeChatId && user.credits <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚫 No interview credits available, redirecting to pricing', {
          plan: user.plan,
          credits: user.credits,
        });
      }
      navigate('/pricing');
    }
  }, [user, navigate, chatId]);

  // Determine Starter access based on plan/credits or active session
  const hasStarterCredit = !isStarterSession || (!!user && user.plan === 'STARTER' && (
    user.credits > 0 || !!chatId || !!localStorage.getItem('current-chat-id')
  ));

  // Strict Starter pack access guard for entering the page; if a
  // Starter interview is already in progress (chatId present), we
  // allow it to continue even if the credit was consumed.
  useEffect(() => {
    if (!isStarterSession) return;

    if (!user) {
      navigate('/pricing');
      return;
    }

    const activeChatId = chatId || localStorage.getItem('current-chat-id');
    if (activeChatId) {
      // Active Starter session in progress; don't re-check credits
      return;
    }

    if (!(user.plan === 'STARTER' && user.credits > 0)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚫 Starter access denied: missing or consumed credit', {
          plan: user.plan,
          credits: user.credits,
        });
      }
      navigate('/pricing');
    }
  }, [isStarterSession, user, navigate, chatId]);

  // Initialize webcam on component mount
  useEffect(() => {
    // Restore Value session elapsed time from stored start timestamp
    if (isValueSession) {
      const storedStart = localStorage.getItem(VALUE_START_KEY);
      if (storedStart) {
        const startedAt = Number(storedStart);
        if (!Number.isNaN(startedAt)) {
          const secondsSinceStart = Math.floor((Date.now() - startedAt) / 1000);
          if (secondsSinceStart > 0) {
            setElapsedTime(secondsSinceStart);
            if (secondsSinceStart >= MAX_VALUE_TIME && !valueLimitTriggeredRef.current) {
              console.log('⏱️ [VALUE] Persisted session exceeded 50 min; ending now');
              valueLimitTriggeredRef.current = true;
              handleEndInterviewDueToLimit('time', 'VALUE');
            }
          }
        }
      }
    }

    // For Starter, only initialize webcam if user has valid credit
    if (isStarterSession && !hasStarterCredit) {
      return;
    }

    if (!showModeSelection && !showJobProfile) {
      initializeWebcam();
    }

    return () => {
      // Cleanup on unmount - COMPLETE CLEANUP
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 [CLEANUP] Component unmounting, cleaning up all resources...');
      }
      stopAllStreams();
      
      // Clear any remaining timers
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // Clear navbar timeout
      if (navbarTimeoutRef.current) {
        clearTimeout(navbarTimeoutRef.current);
        navbarTimeoutRef.current = null;
      }
      
      // Reset refs
      mediaRecorderRef.current = null;
      micStreamRef.current = null;
      audioChunksRef.current = [];
      audioPlaybackRef.current = null;
      submitInProgressRef.current = false;
    };
  }, [showModeSelection, showJobProfile, isStarterSession, hasStarterCredit]);

  // Force webcam initialization when interview room is visible
  useEffect(() => {
    // For Starter, only initialize webcam if user has valid credit
    if (isStarterSession && !hasStarterCredit) {
      return;
    }

    if (!showModeSelection && !showJobProfile && !webcamStreamRef.current) {
      console.log('Force initializing webcam for interview room');
      initializeWebcam();
    }
  }, [showModeSelection, showJobProfile, isStarterSession, hasStarterCredit]);

  // Timer effect - with Starter mode time limit enforcement
  useEffect(() => {
    // For Starter, only run timer if user has valid credit
    if (isStarterSession && !hasStarterCredit) {
      return;
    }

    if (!showModeSelection && !showJobProfile) {
      const timer = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          // Starter session: Auto-end at 30 minutes
          if (isStarterSession && newTime >= MAX_STARTER_TIME && !starterLimitTriggeredRef.current) {
            console.log('⏱️ Starter interview time limit reached (30 min)');
            handleEndInterviewDueToLimit('time', 'STARTER');
          }
          // Value session: Auto-end at 50 minutes
          if (isValueSession && newTime >= MAX_VALUE_TIME && !valueLimitTriggeredRef.current) {
            console.log('⏱️ [VALUE] Interview time limit reached (50 min)');
            handleEndInterviewDueToLimit('time', 'VALUE');
          }
          // Warning when approaching time limit (at 45 minutes)
          if (isValueSession && newTime === 45 * 60) {
            console.warn('⚠️ [VALUE] 5 minutes remaining! Interview will end at 50 minutes.');
          }
          if (isValueSession && newTime === 48 * 60) {
            console.warn('⚠️ [VALUE] 2 minutes remaining! Wrapping up soon.');
          }
          return newTime;
        });
      }, 1000);

      starterTimerRef.current = timer;

      return () => {
        clearInterval(timer);
        starterTimerRef.current = null;
      };
    }
  }, [showModeSelection, showJobProfile, isStarterSession, hasStarterCredit, isValueSession]);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('interview-notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  // Restore session info if available
  useEffect(() => {
    const savedChatId = localStorage.getItem('current-chat-id');
    const savedMode = localStorage.getItem('current-chat-mode');
    if (!chatId && savedChatId) {
      setChatId(savedChatId);
    }
    if (!selectedMode && savedMode) {
      setSelectedMode(savedMode);
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem('interview-notes', notes);
  }, [notes]);

  // Helper to merge messages (defined early for use in useEffect)
  const mergeMessages = (existing, incoming) => {
    const seen = new Set();
    const combined = [...existing, ...incoming];
    const deduped = combined.filter(msg => {
      const key = `${msg.sender}-${msg.timestamp}-${msg.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return deduped.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  // Load chat history function (defined early for use in useEffect)
  const loadChatHistory = async (existingChatId) => {
    // Starter sessions never persist or reload history
    if (!existingChatId || !token || isStarterSession) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/${existingChatId}/messages?limit=200`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load chat history');
      const data = await res.json();
      const ordered = (data?.data?.messages || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const mapped = ordered.map(msg => ({
        id: msg.id || `${msg.timestamp}-${msg.role}`,
        text: msg.content,
        sender: msg.role === 'assistant' || msg.role === 'interviewer' ? 'interviewer' : 'user',
        type: msg.role === 'assistant' || msg.role === 'interviewer' ? 'assistant' : 'user',
        timestamp: msg.timestamp
      }));
      setChatMessages(prev => mergeMessages(prev, mapped));
      const lastAssistant = [...mapped].reverse().find(m => m.sender === 'interviewer');
      if (lastAssistant) setCurrentQuestion(lastAssistant.text);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Load chat history when chatId becomes available
  useEffect(() => {
    if (chatId && token) {
      loadChatHistory(chatId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, token]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isAITyping]);

  // Setup streaming WebSocket when chat session starts (if needed in future)
  // Removed isStreamingMode dependency - not using streaming mode currently
  useEffect(() => {
    // Streaming mode disabled for now - using standard recording mode
    // if (chatId && token && isStreamingMode && !voiceStreamingService.isConnected) {
    //   setupStreamingConnection();
    // }

    return () => {
      // Cleanup on unmount
      if (voiceStreamingService.isConnected) {
        voiceStreamingService.disconnect();
      }
    };
  }, [chatId, token]);

  // Initialize webcam for premium interview room
  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        setWebcamStream(stream);
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
        }
        setWebcamError(null);
      } catch (error) {
        console.error('Webcam access error:', error);
        setWebcamError(error.message || 'Camera access denied');
      }
    };

    if (chatId) {
      initWebcam();
    }

    // Cleanup on unmount
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [chatId]);

  // Update webcam video element when stream changes
  useEffect(() => {
    if (webcamVideoRef.current && webcamStream) {
      webcamVideoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream]);

  // Toggle camera - FIXED to work with both stream sources
  const toggleCamera = () => {
    // Try both webcamStream and webcamStreamRef (for compatibility)
    const stream = webcamStream || webcamStreamRef.current;
    
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        console.log(`Camera ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
      } else {
        console.warn('No video track found');
      }
    } else {
      console.warn('No webcam stream available');
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (webcamStream) {
      const audioTrack = webcamStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Toggle AI playback speed between relaxed and normal
  const togglePlaybackRate = () => {
    setAiPlaybackRate((prev) => (prev <= 0.9 ? 1 : 0.9));
  };

  // Hang up - stop all tracks and return home
  const handleHangUp = async () => {
    await confirmLeave();
  };

  /**
   * ULTRA-LOW LATENCY STREAMING SETUP
   * Initialize WebSocket connection and event handlers
   */
  const setupStreamingConnection = async () => {
    try {
      console.log('🚀 Setting up ultra-low latency streaming...');
      console.log('📍 Connection details:', {
        chatId,
        token: token ? 'Present' : 'Missing',
        mode: selectedMode,
        jobProfile
      });

      // Setup event handlers
      voiceStreamingService.onPartialTranscript = (text) => {
        console.log('📝 Partial transcript received:', text);
        // Show live transcript as user speaks
        // Note: Streaming mode disabled - these state setters removed
        // setPartialTranscript(text);
        // setLiveTranscript(text);
      };

      voiceStreamingService.onFinalTranscript = (text) => {
        console.log('✅ Final transcript received:', text);
        // Clear partial, show final
        // Note: Streaming mode disabled - these state setters removed
        // setPartialTranscript('');
        // setVoiceTranscript(text);
        // setLiveTranscript(text);

        // Add user message to chat
        appendChatMessage('user', text);
        saveMessageToBackend('user', text);
      };

      voiceStreamingService.onAIResponseChunk = (content) => {
        // Stream AI text token-by-token (live typing effect)
        // Note: Streaming mode disabled - this state setter removed
        // setStreamingAIResponse(prev => prev + content);
      };

      voiceStreamingService.onAIResponseComplete = async (response) => {
        // Clear streaming text
        // Note: Streaming mode disabled - this state setter removed
        // setStreamingAIResponse('');

        // Add feedback message (short)
        if (response.feedback) {
          appendChatMessage('assistant', response.feedback);
          await saveMessageToBackend('assistant', response.feedback);
        }

        // Add question message
        if (response.question) {
          appendChatMessage('assistant', response.question);
          setCurrentQuestion(response.question);
          await saveMessageToBackend('assistant', response.question);
        }

        // Play audio if available
        if (response.hasAudio && response.audioBase64 && !isAIAudioMuted) {
          try {
            setIsAudioPlaying(true);
            await voiceStreamingService.playAudio(response.audioBase64);
            setIsAudioPlaying(false);
          } catch (error) {
            console.error('Audio playback failed:', error);
            setIsAudioPlaying(false);
          }
        }
      };

      voiceStreamingService.onError = (message) => {
        setLastError(message);
        console.error('Streaming error:', message);
      };

      voiceStreamingService.onConnectionChange = (connected) => {
        console.log(connected ? '✅ Streaming connected' : '❌ Streaming disconnected');
      };

      // Connect to WebSocket
      await voiceStreamingService.connect(
        token,
        chatId,
        selectedMode,
        jobProfile
      );

      console.log('✅ Ultra-low latency streaming ready!');

    } catch (error) {
      console.error('Failed to setup streaming:', error);
      setLastError('Failed to initialize voice streaming');
    }
  };

  /**
   * START ULTRA-LOW LATENCY VOICE RECORDING
   * Streams audio chunks in real-time (no buffering)
   */
  const startStreamingVoiceRecording = async () => {
    console.log('🎤 startStreamingVoiceRecording called');
    console.log('📍 State:', {
      chatId,
      isConnected: voiceStreamingService.isConnected,
      isStreaming: voiceStreamingService.isStreaming
    });

    if (!chatId) {
      console.error('❌ No chatId - interview not started');
      alert('Please start the interview first.');
      return;
    }

    if (!voiceStreamingService.isConnected) {
      console.log('🔌 Not connected, setting up connection...');
      try {
        await setupStreamingConnection();
        console.log('✅ Connection setup complete');
      } catch (error) {
        console.error('❌ Connection setup failed:', error);
        alert('Failed to connect to voice streaming. Check console for details.');
        return;
      }
    }

    try {
      setIsRecordingVoice(true);
      setIsRecording(true);
      // Note: Streaming mode disabled - these state setters removed
      // setPartialTranscript('');
      // setLiveTranscript('');
      // setStreamingAIResponse('');

      console.log('🎙️  Starting audio streaming...');
      await voiceStreamingService.startStreaming();
      console.log('✅ Streaming voice recording started successfully');

    } catch (error) {
      console.error('Failed to start streaming:', error);
      alert('Failed to start recording: ' + error.message);
      setIsRecordingVoice(false);
      setIsRecording(false);
    }
  };

  /**
   * STOP ULTRA-LOW LATENCY VOICE RECORDING
   * Stops audio streaming (transcript finalization happens automatically)
   */
  const stopStreamingVoiceRecording = () => {
    try {
      voiceStreamingService.stopStreaming();
      setIsRecordingVoice(false);
      setIsRecording(false);
      
      console.log('🎤 Streaming voice recording stopped');

    } catch (error) {
      console.error('Failed to stop streaming:', error);
    }
  };

  // Recording duration timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingDuration(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Keep playback rate in sync for the current audio element
  useEffect(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.playbackRate = aiPlaybackRate;
    }
  }, [aiPlaybackRate]);

  useEffect(() => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.volume = (isAIAudioMuted || !isSpeakerOn) ? 0 : 1;
    }
  }, [isAIAudioMuted, isSpeakerOn]);

  // Helper to append chat messages with consistent structure
  const appendChatMessage = (role, text) => {
    if (!text) return null;
    const normalizedType = (role === 'assistant' || role === 'interviewer') ? 'assistant' : 'user';
    const message = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      sender: normalizedType === 'assistant' ? 'interviewer' : 'user',
      type: normalizedType,
      timestamp: new Date().toISOString()
    };
    console.log('📌 [APPEND] Adding message to chat:', { sender: message.sender, textLength: text.length, textPreview: text.substring(0, 60) });
    setChatMessages(prev => {
      const updated = [...prev, message];
      console.log('📌 [APPEND] ChatMessages state updated. Total messages:', updated.length);
      return updated;
    });
    return message;
  };

  // mergeMessages moved to top (before useEffects)

  // Generate short instant feedback (1-2 words) tuned per mode
  const makeShortFeedback = () => {
    const mode = selectedMode || 'moderate';
    const feedbackByMode = {
      friendly: ["Great!", "Nice!", "Love it", "Well done", "Good job", "Cool"],
      moderate: ["Good", "Solid", "Okay", "Makes sense", "Fair point", "Got it"],
      strict: ["Concise", "Tighter", "Be specific", "Go deeper", "More detail", "Clarify"]
    };
    const options = feedbackByMode[mode] || feedbackByMode.moderate;
    return options[Math.floor(Math.random() * options.length)];
  };

  // Play AI audio and lock mic while playing
  const playAIAudio = async (audioBase64) => {
    if (!audioBase64) return;
    if (isAIAudioMuted || !isSpeakerOn) {
      console.log('AI audio is muted or speaker is off, skipping playback');
      return;
    }
    try {
      setIsAudioPlaying(true);
      const audio = voiceInterviewService.playAudioResponse(audioBase64, {
        playbackRate: aiPlaybackRate,
        volume: isAIAudioMuted || !isSpeakerOn ? 0 : 1
      });
      audioPlaybackRef.current = audio;
      await new Promise((resolve, reject) => {
        audio.onended = () => {
          setIsAudioPlaying(false);
          resolve();
        };
        audio.onerror = (err) => {
          setIsAudioPlaying(false);
          reject(err);
        };
      });
    } catch (error) {
      setIsAudioPlaying(false);
      console.warn('Audio playback failed:', error);
    }
  };

  // Initialize webcam stream
  const initializeWebcam = async () => {
    try {
      setIsLoadingCamera(true);
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      webcamStreamRef.current = stream;

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.muted = true; // Mute to avoid feedback
        userVideoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }

      // Initialize muted and video state based on actual track states
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      if (audioTracks.length > 0) {
        setIsMuted(!audioTracks[0].enabled);
      }
      if (videoTracks.length > 0) {
        setIsVideoOn(videoTracks[0].enabled);
      }

      console.log('Webcam initialized:', {
        audio: audioTracks.length,
        video: videoTracks.length
      });

      setIsLoadingCamera(false);
    } catch (error) {
      console.error('Camera access error:', error);
      setIsLoadingCamera(false);
      
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on your device.');
      } else {
        setCameraError('Failed to access camera. Please try again.');
      }
    }
  };

  // Stop all media streams and cleanup - COMPLETE FIX
  const stopAllStreams = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 [CLEANUP] Stopping all streams and cleaning up media...');
    }
    
    // Stop recording timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Stop MediaRecorder if recording
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => {
            track.stop();
            if (process.env.NODE_ENV === 'development') {
              console.log('🛑 [CLEANUP] Stopped media recorder track:', track.kind);
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ [CLEANUP] Error stopping media recorder:', e);
      }
      mediaRecorderRef.current = null;
    }
    
    // Stop microphone stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop();
        if (process.env.NODE_ENV === 'development') {
          console.log('🛑 [CLEANUP] Stopped mic track:', track.kind);
        }
      });
      micStreamRef.current = null;
    }
    
    // Stop and clear video element
    if (userVideoRef.current) {
      userVideoRef.current.pause();
      userVideoRef.current.srcObject = null;
    }
    
    // Stop webcam streams
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      webcamStreamRef.current = null;
    }

    if (webcamStream) {
      webcamStream.getTracks().forEach(track => {
        track.stop();
      });
      setWebcamStream(null);
    }
    
    // Stop screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }
    
    // Stop and clear audio playback
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current.currentTime = 0;
      audioPlaybackRef.current = null;
    }
    
    // Reset states
    setIsRecordingVoice(false);
    setIsRecording(false);
    setIsProcessingVoice(false);
    setIsAudioPlaying(false);
    setRecordingDuration(0);
    setIsCameraOn(false);
    setIsVideoOn(false);
    audioChunksRef.current = [];
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [CLEANUP] All media streams stopped and cleaned up');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLeave = () => {
    setShowLeaveModal(true);
  };

  const confirmLeave = async () => {
    // Comprehensive cleanup before leaving
    console.log('Ending interview and cleaning up resources...');
    
    try {
      // Short polite AI closing message (common for manual end)
      const closingMessage = "Thank you for taking the time to practice today. I enjoyed our conversation and wish you all the best in your upcoming interviews!";

      appendChatMessage('assistant', closingMessage);
      setCurrentQuestion(closingMessage);

      // Play closing audio
      if (!isAIAudioMuted) {
        try {
          const audioB64 = await voiceInterviewService.generateSpeech(closingMessage, token);
          await playAIAudio(audioB64);
        } catch (err) {
          console.warn('Could not play closing audio:', err);
        }
      }

      // Stop all media streams and recording
      stopAllStreams();
      await new Promise(resolve => setTimeout(resolve, 100));

      // End the interview session (skip for Starter sessions)
      if (!isStarterSession) {
        await endInterviewSession();
      }

      // Clear any session markers so Starter credit cannot be reused
      localStorage.removeItem('current-chat-id');
      localStorage.removeItem('current-chat-mode');
      localStorage.removeItem('starter-mode');

      // Reset key UI flags
      setInterviewStarted(false);
      setIsRecordingVoice(false);
      setIsProcessingVoice(false);
      setIsLoadingQuestion(false);

      // Close modal
      setShowLeaveModal(false);
      
      console.log('Cleanup complete, navigating to feedback...');
      
      // STARTER SESSIONS: Navigate to simplified feedback
      if (isStarterSession) {
        // Prepare conversation data for Starter feedback
        const conversationData = chatMessages
          .filter((msg) => msg.sender === 'user' || msg.sender === 'interviewer' || msg.sender === 'assistant')
          .map((msg) => ({
            type: msg.sender === 'user' ? 'user' : 'assistant',
            text: msg.text || ''
          }));

        if (conversationData.length === 0 && currentQuestion) {
          conversationData.push({ type: 'assistant', text: currentQuestion });
        }

        console.log('📊 Starter session feedback data:', {
          conversationLength: conversationData.length,
          jobTitle: jobProfile.jobTitle,
          company: jobProfile.company
        });

        navigate('/feedback', {
          state: {
            starterMode: true,
            conversation: conversationData,
            jobTitle: jobProfile.jobTitle,
            company: jobProfile.company,
            jobDescription: jobProfile.jobDescription,
            mode: selectedMode,
            chatId: chatId,
            duration: Math.floor(elapsedTime / 60),
            questionCount: questionCount
          }
        });
        return;
      }
      
      // REGULAR MODE: Prepare conversation data for feedback
      const conversationData = chatMessages
        .filter((msg) => msg.sender === 'user' || msg.sender === 'interviewer' || msg.sender === 'assistant')
        .map((msg) => ({
          type: msg.sender === 'user' ? 'user' : 'assistant',
          text: msg.text || ''
        }));

      if (conversationData.length === 0 && currentQuestion) {
        conversationData.push({ type: 'assistant', text: currentQuestion });
      }

      if (conversationData.length === 0) {
        conversationData.push({ type: 'assistant', text: 'Interview completed.' });
      }
      
      console.log('Sending to feedback:', {
        conversationLength: conversationData.length,
        mode: selectedMode,
        jobTitle: jobProfile.jobTitle
      });
      
      // Navigate to feedback page with conversation data
      navigate('/feedback', {
        state: {
          conversation: conversationData,
          mode: resolvedMode,
          jobTitle: jobProfile.jobTitle,
          company: jobProfile.company,
          jobDescription: jobProfile.jobDescription,
          chatId: chatId
        }
      });
    } catch (error) {
      console.error('Error during leave cleanup:', error);
      // Still navigate even if there's an error
      setShowLeaveModal(false);
      
      // STARTER SESSIONS: Navigate to simplified feedback even on error
      if (isStarterSession) {
        navigate('/feedback', {
          state: {
            starterMode: true,
            jobTitle: jobProfile.jobTitle,
            company: jobProfile.company,
            duration: Math.floor(elapsedTime / 60),
            questionCount: questionCount
          }
        });
        return;
      }
      
      // REGULAR MODE: Prepare conversation data even if error occurred
      const conversationData = chatMessages.map((msg) => ({
        type: msg.sender === 'user' ? 'user' : 'ai',
        text: msg.text || ''
      }));
      
      navigate('/feedback', {
        state: {
          conversation: conversationData,
          mode: resolvedMode,
          jobTitle: jobProfile.jobTitle,
          company: jobProfile.company,
          jobDescription: jobProfile.jobDescription,
          chatId: chatId
        }
      });
    }
  };

  // Helper function to detect misbehavior and generate warnings
  const detectMisbehavior = (text) => {
    const lowercaseText = text.toLowerCase();
    
    // Profanity detection
    const profanityWords = ['damn', 'hell', 'crap', 'stupid', 'idiot', 'hate'];
    const hasProfanity = profanityWords.some(word => lowercaseText.includes(word));
    
    // Rudeness detection
    const rudePatterns = ['you suck', 'shut up', 'useless', 'waste', 'boring'];
    const isRude = rudePatterns.some(pattern => lowercaseText.includes(pattern));
    
    // Off-topic/irrelevant detection
    const offTopicKeywords = ['meme', 'joke', 'lol', 'haha', 'not serious'];
    const isOffTopic = offTopicKeywords.some(keyword => lowercaseText.includes(keyword)) && 
                       text.length < 20;
    
    return {
      hasProfanity,
      isRude,
      isOffTopic,
      isMisbehaving: hasProfanity || isRude || isOffTopic
    };
  };

  // Helper function to generate short feedback with tone per mode
  const generateFeedback = () => {
    const mode = selectedMode || 'moderate';
    const feedbackOptions = {
      friendly: ["Great answer!", "Nice detail!", "Love that", "Well said!", "Awesome", "Super clear"],
      moderate: ["Good", "Solid", "Clear", "Makes sense", "Fair point", "Reasonable"],
      strict: ["Need precision", "Be concise", "Cite impact", "Tighter", "Probe deeper", "Clarify metrics"]
    };
    const options = feedbackOptions[mode] || feedbackOptions.moderate;
    return options[Math.floor(Math.random() * options.length)];
  };

  // Helper function to generate warning message for misbehavior
  const generateWarning = (misbehaviorType) => {
    if (misbehaviorType.hasProfanity) {
      return "Please maintain professional language during the interview. Let's keep the conversation respectful.";
    } else if (misbehaviorType.isRude) {
      return "I noticed some rudeness in that response. Remember, interviews should be professional and respectful. Let's continue constructively.";
    } else if (misbehaviorType.isOffTopic) {
      return "Let's stay focused on the interview questions. Please provide a serious and relevant answer.";
    }
    return "";
  };

  // Submit message - ENHANCED with feedback and behavior detection
  const submitMessage = async (messageText) => {
    const textToSend = messageText || userMessage;
    
    if (!textToSend.trim()) {
      return;
    }

    // Prevent double submission
    if (submitInProgressRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [MESSAGE] Submission already in progress');
      }
      return;
    }

    if (!chatId) {
      alert('Please start the interview first.');
      return;
    }

    try {
      submitInProgressRef.current = true;
      setLastError(null);
      setRetryCount(0);

      const userAnswer = textToSend.trim();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📤 [MESSAGE] Submitting message:', userAnswer.substring(0, 50) + '...');
      }

      // OPTIMISTIC UI: Add user message immediately
      const userMessageObj = appendChatMessage('user', userAnswer);
      setUserMessage(""); // Clear input immediately

      // Save user message to backend (non-blocking, skip for Starter sessions)
      if (!isStarterSession) {
        saveMessageToBackend('user', userAnswer).catch(err => {
          console.error('❌ [MESSAGE] Failed to save user message:', err);
        });
      }

      // Check for misbehavior
      const misbehavior = detectMisbehavior(userAnswer);
      
      // If misbehaving, add a warning message
      if (misbehavior.isMisbehaving) {
        const warningMsg = generateWarning(misbehavior);
        if (warningMsg) {
          // Add warning as system/AI message
          setTimeout(() => {
            appendChatMessage('assistant', warningMsg);
            if (!isStarterSession) {
              saveMessageToBackend('assistant', warningMsg).catch(err => {
                console.error('Failed to save warning:', err);
              });
            }
          }, 500);
        }
      }

      // Add instant one-word feedback
      const feedback = generateFeedback();
      setTimeout(() => {
        appendChatMessage('assistant', feedback);
        if (!isStarterSession) {
          saveMessageToBackend('assistant', feedback).catch(err => {
            console.error('Failed to save feedback:', err);
          });
        }
      }, 300);

      // Check question limits BEFORE generating next question
      if (isStarterSession && questionCount >= MAX_STARTER_QUESTIONS) {
        console.log('⚠️ [STARTER] Question limit reached, ending interview');
        setIsLoadingQuestion(false);
        setIsAITyping(false);
        // Wait for feedback to show, then end
        setTimeout(() => {
          handleEndInterviewDueToLimit('questions', 'STARTER');
        }, 1500);
        return;
      }

      if (isValueSession && questionCount >= MAX_VALUE_QUESTIONS) {
        console.log('⚠️ [VALUE] Question cap reached, ending interview');
        setIsLoadingQuestion(false);
        setIsAITyping(false);
        setTimeout(() => {
          handleEndInterviewDueToLimit('questions', 'VALUE');
        }, 1000);
        return;
      }

      setIsLoadingQuestion(true);
      setIsAITyping(true);

      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [MESSAGE] Requesting AI response...');
      }

      // Slight delay to show feedback first
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check if we have prefetched questions in queue
      const queue = queuedQuestionsRef.current || [];
      let aiResponse = '';

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 [BATCH DEBUG] Question Request Check');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Queue Status:', {
        queueLength: queue.length,
        hasQueuedQuestions: queue.length > 0,
        queuedQuestions: queue.map((q, i) => `Q${i + 1}: ${q.substring(0, 50)}...`)
      });

      if (queue.length > 0) {
        // Use prefetched question from queue
        aiResponse = queue[0];
        setQuestionQueue(queue.slice(1));
        console.log('\n✅ [QUEUE] Using Prefetched Question');
        console.log('   📝 Question:', aiResponse.substring(0, 100) + '...');
        console.log('   📊 Remaining in queue:', queue.length - 1);
        console.log('   🎯 Next questions:', queue.slice(1, 3).map((q, i) => `\n      ${i + 1}. ${q.substring(0, 60)}...`).join(''));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        // Queue is empty, request a new batch of questions
        const batchSize = 3;
        console.log('\n🔄 [BATCH] Queue Empty - Requesting New Batch');
        console.log('   📊 Batch size:', batchSize);
        console.log('   📝 User answer length:', userAnswer.length, 'chars');
        console.log('   ⏱️ Request started at:', new Date().toISOString());
        
        const result = await getAIResponse(userAnswer, batchSize);
        
        console.log('   ⏱️ Request completed at:', new Date().toISOString());
        
        if (typeof result === 'string') {
          // Backward compatibility: single question
          aiResponse = result;
          console.log('\n⚠️ [BATCH] Received Single Question (Fallback)');
          console.log('   📝 Question:', result.substring(0, 100) + '...');
          console.log('   ℹ️ Batch generation may have failed or not supported');
        } else {
          // Batch response: use first question, queue the rest
          aiResponse = result.response;
          const remaining = (result.responses || []).slice(1);
          setQuestionQueue(remaining);
          
          console.log('\n✅ [BATCH] Received Question Batch Successfully!');
          console.log('   📊 Total questions received:', result.responses?.length || 0);
          console.log('   📝 Questions generated:');
          (result.responses || []).forEach((q, i) => {
            console.log(`      ${i + 1}. ${q.substring(0, 80)}...`);
          });
          console.log('   🎯 Using question #1:', aiResponse.substring(0, 100) + '...');
          console.log('   💾 Queued for later:', remaining.length, 'questions');
          console.log('   📋 Queue contents:', remaining.map((q, i) => `\n      Q${i + 2}: ${q.substring(0, 60)}...`).join(''));
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [MESSAGE] AI response received:', aiResponse?.substring(0, 50) + '...');
        console.log('✅ [MESSAGE] AI response length:', aiResponse?.length);
        console.log('✅ [MESSAGE] ChatMessages before add:', chatMessages.length);
      }

      // Add AI response to chat
      if (aiResponse && aiResponse.trim()) {
        console.log('📌 [MESSAGE] Adding AI response to chat messages');
        const msgObj = appendChatMessage('assistant', aiResponse);
        console.log('📌 [MESSAGE] Message added, ID:', msgObj?.id);
        console.log('📌 [MESSAGE] ChatMessages after add (callback):', chatMessages.length);
        setCurrentQuestion(aiResponse);
        
        // Increment question count for Starter/Value sessions (tracking only)
        if (isStarterSession || isValueSession) {
          const newCount = questionCount + 1;
          setQuestionCount(newCount);
          if (isStarterSession) {
            console.log(`📊 [STARTER] Question count: ${newCount}/${MAX_STARTER_QUESTIONS}`);
          }
          if (isValueSession) {
            console.log(`📊 [VALUE] Question count: ${newCount}/${MAX_VALUE_QUESTIONS}`);
            // Warning when approaching question limit
            if (newCount === 30) {
              console.warn('⚠️ [VALUE] Approaching question limit! 5 questions remaining.');
            } else if (newCount === 33) {
              console.warn('⚠️ [VALUE] Near question limit! 2 questions remaining.');
            }
          }
        }
        
        // Save AI response to backend (non-blocking, skip for Starter sessions)
        if (!isStarterSession) {
          saveMessageToBackend('assistant', aiResponse).catch(err => {
            console.error('❌ [MESSAGE] Failed to save AI message:', err);
          });
        }

        // Play AI audio response if not muted
        if (!isAIAudioMuted) {
          voiceInterviewService.generateSpeech(aiResponse, token)
            .then(audioB64 => {
              if (audioB64) {
                playAIAudio(audioB64);
              }
            })
            .catch(err => console.warn('Could not play AI audio:', err?.message || err));
        }
      } else {
        throw new Error('Empty AI response received');
      }

      // Clear error state on success
      setLastError(null);
      setRetryCount(0);

    } catch (error) {
      console.error('❌ [MESSAGE] Error sending message:', error);
      
      // Detailed error logging
      if (process.env.NODE_ENV === 'development') {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          chatId,
          hasToken: !!token
        });
      }

      const errorMsg = error.message || 'Failed to send message. Please try again.';
      setLastError(errorMsg);
      
      // Show user-friendly error
      alert(errorMsg);
      
      // Remove optimistic message on error (optional - you might want to keep it)
      // setChatMessages(prev => prev.filter(msg => msg.id !== userMessageObj?.id));
      
    } finally {
      setIsLoadingQuestion(false);
      setIsAITyping(false);
      // Always reset submission flag in finally block
      submitInProgressRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [MESSAGE] Submission completed, flag reset');
      }
    }
  };

  // Handle send message (wrapper for submitMessage)
  const handleSendMessage = async () => {
    await submitMessage();
  };

  const handleModeSelection = (mode) => {
    setSelectedMode(mode);
    setShowModeSelection(false);
    setShowJobProfile(true);
  };

  // Create interview session on backend
  const createInterviewSession = async () => {
    if (!token) {
      alert("Please log in to start an interview.");
      navigate("/login");
      return;
    }

    if (!jobProfile.jobTitle.trim() || !jobProfile.company.trim() || !jobProfile.jobDescription.trim()) {
      alert("Please fill in job title, company, and job description (required)");
      return;
    }

    if (jobProfile.jobDescription.trim().length < 10) {
      alert("Job description must be at least 10 characters to start an interview.");
      return;
    }

    setIsCreatingInterview(true);
    setChatMessages([]);
    setCurrentQuestion(null);
    setIsAIAudioMuted(false); // Audio ON by default
    setIsMuted(false);
    setQuestionCount(0); // Reset question count
    starterLimitTriggeredRef.current = false;
    valueLimitTriggeredRef.current = false;

    const modeToUse = resolvedMode;

    try {
      // STARTER SESSIONS: Don't create chat session in DB, use temporary in-memory session
      if (isStarterSession) {
        console.log('🆕 [STARTER] Initializing Starter interview (no DB persistence)');

        // Consume exactly one Starter credit when beginning the
        // interview session so each credit grants only 1 session.
        try {
          const res = await fetch(`${API_BASE_URL}/api/payments/consume-starter`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || 'Failed to consume Starter credit');
          }

          if (data.data && data.data.user && setUser) {
            setUser(data.data.user);
            localStorage.setItem('user', JSON.stringify(data.data.user));
          }
        } catch (creditError) {
          console.error('Error consuming Starter credit:', creditError);
          alert(creditError.message || 'Could not start Starter interview. Please try again.');
          setIsCreatingInterview(false);
          return;
        }

        // Use temporary chat ID for Starter
        const tempChatId = `starter-${Date.now()}`;
        setChatId(tempChatId);
        localStorage.setItem('current-chat-id', tempChatId);
        localStorage.setItem('current-chat-mode', modeToUse);
        localStorage.setItem('starter-mode', 'true'); // Mark as Starter session

        // Immediately transition from the job-role form to the
        // main interview room; keep the loader visible while the
        // first question is being prepared.
        setShowJobProfile(false);

        // Asynchronously fetch the first question; once it arrives,
        // fetchInitialQuestionForStarter will append it and mark the
        // interview as started.
        fetchInitialQuestionForStarter()
          .catch((error) => {
            console.error('Error fetching Starter initial question:', error);
          })
          .finally(() => {
            setIsCreatingInterview(false);
          });

        return;
      }

      // REGULAR MODE: Create chat session in DB
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `${jobProfile.jobTitle} Interview at ${jobProfile.company}`,
          description: jobProfile.jobDescription,
          interviewType: "technical",
          difficulty: modeToUse === 'friendly' ? 'beginner' : modeToUse === 'moderate' ? 'intermediate' : 'advanced',
          tags: [jobProfile.company, jobProfile.jobTitle]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create interview session');
      }

      const data = await response.json();
      const newChatId = data?.data?.chat?.id || data?.data?._id;
      if (data?.data?.user && setUser) {
        setUser(data.data.user);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      if (!newChatId) {
        throw new Error('Chat ID missing from response');
      }
      setChatId(newChatId);

      // Persist Value plan start time to enforce the 50-minute limit across reloads
      if (isValueSession) {
        const nowTs = Date.now();
        localStorage.setItem(VALUE_START_KEY, String(nowTs));
        setElapsedTime(0);
      }

      // Persist current session for reload resilience
      localStorage.setItem('current-chat-id', newChatId);
      localStorage.setItem('current-chat-mode', modeToUse);

      // Persist Value start time if resuming an existing Value session without recreation
      if (isValueSession && !localStorage.getItem(VALUE_START_KEY)) {
        localStorage.setItem(VALUE_START_KEY, String(Date.now()));
      }

      // Hide loading and show interview UI immediately
      setIsCreatingInterview(false);
      setShowJobProfile(false);

      // Fetch initial question in background (non-blocking)
      fetchInitialQuestion();

    } catch (error) {
      console.error('Error creating interview:', error);
      alert('Failed to start interview: ' + error.message);
      setShowJobProfile(true);
      setIsCreatingInterview(false);
    }
  };

  // Fetch initial question for Starter mode (async, no DB save)
  const fetchInitialQuestionForStarter = async () => {
    setIsLoadingQuestion(true);
    try {
      console.log('🎯 [STARTER] Fetching initial question...');
      
      // Build query params with job context (NO RESUME for Starter)
      const queryParams = new URLSearchParams();
      if (jobProfile.jobTitle) queryParams.append('jobTitle', jobProfile.jobTitle);
      if (jobProfile.company) queryParams.append('company', jobProfile.company);
      if (jobProfile.jobDescription) queryParams.append('jobDescription', jobProfile.jobDescription);
      // Explicitly NO resumeId for Starter

      const response = await fetch(
        `${API_BASE_URL}/api/ai/initial-question/${resolvedMode}?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = data?.message || 'Failed to fetch initial question (job description is required).';
        throw new Error(msg);
      }
      const initialQuestion = data.data.question;
      setCurrentQuestion(initialQuestion);
      setQuestionCount(1); // First question

      // Mark interview as started only after the very first
      // question is ready and visible.
      setInterviewStarted(true);

      // Add initial question to chat (in memory only, no DB save)
      appendChatMessage('assistant', initialQuestion);
      console.log('✅ [STARTER] First question loaded, interview ready!');

      // Auto-play audio (non-blocking)
      if (!isAIAudioMuted) {
        voiceInterviewService.generateSpeech(initialQuestion, token)
          .then(audioB64 => {
            if (audioB64) {
              playAIAudio(audioB64);
            }
          })
          .catch(err => console.warn('Could not play initial question audio:', err?.message || err));
      }
    } catch (error) {
      console.error('Error fetching Starter question:', error);
      alert('Failed to load interview question. Please try again.');
      // Rollback to job profile
      setShowJobProfile(true);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Handle interview ending due to limits
  const handleEndInterviewDueToLimit = async (limitType, planLabel = 'STARTER') => {
    const limitRef = planLabel === 'VALUE' ? valueLimitTriggeredRef : starterLimitTriggeredRef;

    if (limitRef.current) {
      console.log(`⚠️ [${planLabel}] Limit already handled, skipping duplicate closing`);
      return;
    }
    limitRef.current = true;
    if (starterTimerRef.current) {
      clearInterval(starterTimerRef.current);
      starterTimerRef.current = null;
    }
    if (planLabel === 'VALUE') {
      localStorage.removeItem(VALUE_START_KEY);
    }
    console.log(`⚠️ [${planLabel}] Interview ending due to ${limitType} limit`);
    
    // Stop any active recording
    if (isRecordingVoice) {
      try {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        setIsRecordingVoice(false);
        setIsRecording(false);
      } catch (err) {
        console.error('Error stopping recording:', err);
      }
    }

    // Add AI closing message
    const closingMessage = limitType === 'time' 
      ? "Our time is up. It was wonderful interviewing you today. Thank you for your thoughtful responses, and I wish you the very best in your career journey. Good luck!"
      : "We've completed all the questions for today's interview. It was a pleasure speaking with you and learning about your experiences. Thank you for your time, and I wish you all the best. Good luck!";
    
    appendChatMessage('assistant', closingMessage);
    setCurrentQuestion(closingMessage);
    
    // Play closing audio
    if (!isAIAudioMuted) {
      try {
        const audioB64 = await voiceInterviewService.generateSpeech(closingMessage, token);
        await playAIAudio(audioB64);
      } catch (err) {
        console.warn('Could not play closing audio:', err);
      }
    }

    // After closing message, fully clean up and reset Starter session
    stopAllStreams();
    localStorage.removeItem('current-chat-id');
    localStorage.removeItem('current-chat-mode');
    localStorage.removeItem('starter-mode');
    setInterviewStarted(false);
    setIsRecordingVoice(false);
    setIsProcessingVoice(false);
    setIsLoadingQuestion(false);

    // Small delay to let the user see the closing line
    setTimeout(() => {
      navigateToFeedback();
    }, 2000);
  };

  // Navigate to feedback with Starter mode flag
  const navigateToFeedback = () => {
    // For Starter: Use generic feedback, don't save to DB
    navigate('/feedback', { 
      state: { 
        starterMode: true,
        jobTitle: jobProfile.jobTitle,
        company: jobProfile.company,
        duration: Math.floor(elapsedTime / 60),
        questionCount: questionCount
      } 
    });
  };

  // Fetch initial interview question from backend
  const fetchInitialQuestion = async () => {
    setIsLoadingQuestion(true);
    try {
      // Build query params with job context and resume
      const queryParams = new URLSearchParams();
      if (jobProfile.jobTitle) queryParams.append('jobTitle', jobProfile.jobTitle);
      if (jobProfile.company) queryParams.append('company', jobProfile.company);
      if (jobProfile.jobDescription) queryParams.append('jobDescription', jobProfile.jobDescription);
      if (jobProfile.resumeId) queryParams.append('resumeId', jobProfile.resumeId);

      if (process.env.NODE_ENV === 'development') {
        console.log('🛰️ [Initial Question] Sending params', Object.fromEntries(queryParams.entries()));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/initial-question/${resolvedMode}?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch initial question');
      }

      const data = await response.json();
      const initialQuestion = data.data.question;
      setCurrentQuestion(initialQuestion);

      // Mark interview as started once the first question
      // is available for the candidate.
      setInterviewStarted(true);

      // Add initial question to chat and persist
      appendChatMessage('assistant', initialQuestion);
      await saveMessageToBackend('assistant', initialQuestion);

      // Auto-play audio in background (non-blocking)
      if (!isAIAudioMuted) {
        voiceInterviewService.generateSpeech(data.data.question, token)
          .then(audioB64 => {
            if (audioB64) {
              playAIAudio(audioB64);
            }
          })
          .catch(err => console.warn('Could not play initial question audio:', err?.message || err));
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      alert('Failed to load interview question');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Save message to backend chat (only real interview messages)
  const saveMessageToBackend = async (role, content) => {
    if (!chatId) return;
    
    // Only save user and assistant messages (real interview Q&A)
    if (role !== 'user' && role !== 'assistant') {
      console.log('Skipping non-interview message:', role);
      return;
    }
    
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role,
          content,
          metadata: {}
        })
      });
      console.log(`Saved ${role} message to backend`);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // loadChatHistory moved to top (before useEffects)

  const setQuestionQueue = (nextQueue) => {
    queuedQuestionsRef.current = nextQueue;
    setQueuedQuestions(nextQueue);
  };

  // Get AI response from backend - COMPLETE FIX with error handling
  const getAIResponse = async (userAnswer, batchCount = 1) => {
    if (!chatId) {
      throw new Error('No chat session available');
    }

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      // CRITICAL FIX: Send FULL conversation history for context, not just the latest answer
      const conversationHistory = chatMessages.map(msg => {
        const normalizedType = msg.type || (msg.sender === 'user' ? 'user' : 'assistant');
        return {
          type: normalizedType === 'user' ? 'user' : 'assistant',
          text: msg.text
        };
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 [AI] Sending request to:', `${API_BASE_URL}/api/ai/interview`);
        console.log('🌐 [AI] Request payload:', {
          userAnswer: userAnswer.substring(0, 100) + '...',
          interviewMode: resolvedMode,
          conversationHistory: conversationHistory.length + ' messages',
          hasResumeId: !!jobProfile.resumeId,
          hasJobTitle: !!jobProfile.jobTitle,
          hasJobDescription: !!jobProfile.jobDescription
        });
      }

      if (batchCount > 1) {
        console.log('\n🌐 [BATCH API] Preparing Batch Request');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Request Parameters:', {
          batchCount,
          userAnswerLength: userAnswer.length,
          mode: resolvedMode,
          hasResume: !!jobProfile.resumeId,
          hasJob: !!jobProfile.jobTitle,
          conversationLength: conversationHistory.length
        });
        console.log('🎯 Endpoint:', `${API_BASE_URL}/api/ai/interview`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }

      const response = await fetch(`${API_BASE_URL}/api/ai/interview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAnswer,
          interviewMode: resolvedMode,
          targetJobId: jobProfile.targetJobId,
          resumeId: jobProfile.resumeId,
          // CRITICAL: Include job details from user input
          jobTitle: jobProfile.jobTitle || '',
          jobDescription: jobProfile.jobDescription || '',
          company: jobProfile.company || '',
          conversation: conversationHistory,  // CRITICAL: Add full conversation
          batchCount
        })
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('📨 [AI] Response status:', response.status, response.statusText);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || `API error: ${response.status} ${response.statusText}`;
        
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ [AI] API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
        }

        // Handle specific error codes
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(errorMsg);
        }
      }

      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [AI] Response received:', {
          hasData: !!data.data,
          hasResponse: !!data.data?.response,
          responseLength: data.data?.response?.length || 0
        });
      }

      const responses = data.data?.responses || data.responses;
      const aiResponse = data.data?.response || data.response;

      if (batchCount > 1) {
        if (!responses || !Array.isArray(responses) || responses.length === 0) {
          throw new Error('Empty response batch from AI');
        }
        return { response: responses[0], responses };
      }

      if (!aiResponse || !aiResponse.trim()) {
        throw new Error('Empty response from AI');
      }

      return aiResponse;

    } catch (error) {
      console.error('❌ [AI] Error getting AI response:', error);
      
      // MOCK: If backend not ready, return mock response
      if (process.env.NODE_ENV === 'development' && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        console.warn('⚠️ [AI] Using mock response (backend may not be ready)');
        if (batchCount > 1) {
          return {
            response: '[MOCK] Can you share a project where you used your core skills? ',
            responses: [
              '[MOCK] Can you share a project where you used your core skills?',
              '[MOCK] Which resume-listed skill are you strongest in, and why?',
              '[MOCK] Describe a challenge you solved using your primary tools.'
            ]
          };
        }
        return '[MOCK] That\'s a great answer! Can you tell me more about your experience with that?';
      }
      
      throw error;
    }
  };

  // Start voice recording - COMPLETE FIX
  const handleStartVoiceRecording = async () => {
    // Prevent multiple simultaneous recordings
    if (isRecordingVoice || isProcessingVoice || isAudioPlaying) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Cannot start recording: already recording, processing, or audio playing');
      }
      return;
    }

    if (!chatId) {
      alert('Please start the interview first.');
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎤 [VOICE] Starting voice recording...');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Validate stream exists
      if (!stream || !stream.getAudioTracks().length) {
        throw new Error('No audio tracks available in stream');
      }

      const audioTracks = stream.getAudioTracks();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [VOICE] Microphone access granted:', {
          trackCount: audioTracks.length,
          trackLabel: audioTracks[0]?.label,
          trackEnabled: audioTracks[0]?.enabled
        });
      }

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      micStreamRef.current = stream; // Store for cleanup

      // Set up data collection
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 [VOICE] Audio chunk received:', event.data.size, 'bytes');
          }
        }
      };

      mediaRecorder.onerror = (error) => {
        console.error('❌ [VOICE] MediaRecorder error:', error);
        setIsRecordingVoice(false);
        setIsRecording(false);
        setLastError('Recording error: ' + error.message);
      };

      mediaRecorder.onstop = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('⏹️ [VOICE] Recording stopped, total chunks:', audioChunksRef.current.length);
        }
        // Cleanup stream
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop());
          micStreamRef.current = null;
        }
      };

      // Start recording with 100ms chunks
      mediaRecorder.start(100);
      
      // Update state
      setIsRecordingVoice(true);
      setIsRecording(true);
      setRecordingDuration(0);
      // Note: setLiveTranscript removed - not using streaming mode
      setLastError(null);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 [VOICE] Recording started successfully, state:', mediaRecorder.state);
      }

    } catch (error) {
      console.error('❌ [VOICE] Error starting voice recording:', error);
      
      // Handle specific error types
      if (error.name === 'NotAllowedError') {
        setLastError('Microphone permission denied. Please allow microphone access in your browser settings.');
        alert('Microphone permission denied. Please allow access to use voice recording.');
      } else if (error.name === 'NotFoundError') {
        setLastError('No microphone found. Please connect a microphone and try again.');
        alert('No microphone found. Please connect a microphone.');
      } else {
        setLastError('Failed to start recording: ' + error.message);
        alert('Failed to start recording: ' + error.message);
      }
      
      setIsRecordingVoice(false);
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  // Stop voice recording and auto-submit - COMPLETE FIX
  const handleStopVoiceRecording = async () => {
    // Prevent double submission
    if (submitInProgressRef.current || !isRecordingVoice) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [VOICE] Cannot stop: not recording or submission in progress');
      }
      return;
    }

    if (!chatId) {
      alert('Please start the interview first.');
      return;
    }

    if (!selectedMode) {
      alert('Please select an interview mode.');
      return;
    }

    try {
      // Stop recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecordingVoice(false);
      setIsRecording(false);
      setIsProcessingVoice(true);
      // Don't set submitInProgressRef here - let submitMessage handle it

      if (process.env.NODE_ENV === 'development') {
        console.log('⏹️ [VOICE] Stopping recording...');
      }

      // Get audio blob from recorder
      const audioBlob = await new Promise((resolve, reject) => {
        if (!mediaRecorderRef.current) {
          reject(new Error('No media recorder available'));
          return;
        }

        const recorder = mediaRecorderRef.current;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 [VOICE] Recorder state:', recorder.state);
          console.log('📊 [VOICE] Chunks collected:', audioChunksRef.current.length);
        }

        recorder.onstop = () => {
          try {
            if (audioChunksRef.current.length === 0) {
              reject(new Error('No audio chunks captured. Please check your microphone.'));
              return;
            }

            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            if (process.env.NODE_ENV === 'development') {
              console.log('📦 [VOICE] Audio blob created:', {
                size: blob.size,
                type: blob.type,
                duration: recordingDuration
              });
            }

            if (blob.size === 0) {
              reject(new Error('Audio blob is empty. No audio was recorded.'));
              return;
            }

            if (blob.size < 100) {
              reject(new Error('Audio recording too short. Please speak for at least 1 second.'));
              return;
            }

            // Cleanup stream
            if (micStreamRef.current) {
              micStreamRef.current.getTracks().forEach(track => track.stop());
              micStreamRef.current = null;
            }

            resolve(blob);
          } catch (error) {
            reject(error);
          }
        };

        recorder.onerror = (error) => {
          console.error('❌ [VOICE] Recorder error:', error);
          reject(new Error('Recording error: ' + error.message));
        };

        // Stop the recorder
        if (recorder.state === 'recording') {
          recorder.stop();
          // Stop all tracks
          if (recorder.stream) {
            recorder.stream.getTracks().forEach(track => {
              track.stop();
              if (process.env.NODE_ENV === 'development') {
                console.log('🛑 [VOICE] Stopped track:', track.kind);
              }
            });
          }
        } else {
          reject(new Error('Recorder not in recording state: ' + recorder.state));
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 [VOICE] Sending audio to backend STT endpoint...');
      }

      // Send to backend for transcription
      let transcript = '';
      try {
        const formData = new FormData();
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        formData.append('audio', audioFile);

        const sttResponse = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!sttResponse.ok) {
          const errorData = await sttResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `STT request failed: ${sttResponse.status}`);
        }

        const sttData = await sttResponse.json();
        transcript = sttData.data?.transcript || sttData.transcript || '';
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [VOICE] Transcript received:', transcript);
        }

        if (!transcript.trim()) {
          throw new Error('Empty transcript received. Please speak more clearly.');
        }
      } catch (sttError) {
        console.error('❌ [VOICE] STT Error:', sttError);
        
        // Check if it's a network/500 error
        const isServerError = sttError.message.includes('500') || 
                             sttError.message.includes('Failed to fetch') ||
                             sttError.message.includes('NetworkError');
        
        if (isServerError) {
          // For server errors, show user-friendly message and don't auto-submit
          setLastError('Speech-to-text service is temporarily unavailable. Please type your response instead.');
          alert('Speech-to-text service is temporarily unavailable. Please type your response instead.');
          setIsProcessingVoice(false);
          setRecordingDuration(0);
          return; // Exit early, don't try to submit
        }
        
        // For other errors, try mock in dev mode only
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ [VOICE] Using mock transcript (backend may not be ready)');
          transcript = '[MOCK] This is a mock transcript. Please connect backend STT endpoint.';
        } else {
          setLastError('Failed to transcribe audio: ' + sttError.message);
          alert('Failed to transcribe audio. Please try again or type your response.');
          setIsProcessingVoice(false);
          setRecordingDuration(0);
          return; // Exit early
        }
      }

      // Only auto-submit if we have a valid transcript
      if (transcript && transcript.trim() && !transcript.startsWith('[MOCK]')) {
        // Auto-submit the transcribed text
        setUserMessage(transcript);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 [VOICE] Auto-submitting transcript as message...');
        }

        // Submit the message (this will call handleSendMessage logic)
        // submitMessage will handle submitInProgressRef
        await submitMessage(transcript);
      } else if (transcript && transcript.startsWith('[MOCK]')) {
        // For mock transcripts, just show in input but don't auto-submit
        setUserMessage(transcript);
        if (process.env.NODE_ENV === 'development') {
          console.log('📝 [VOICE] Mock transcript added to input (not auto-submitting)');
        }
      }

    } catch (error) {
      console.error('❌ [VOICE] Error processing voice:', error);
      const errorMsg = error.message || 'Failed to process voice recording.';
      setLastError(errorMsg);
      
      // User-friendly error messages
      let userAlert = errorMsg;
      if (errorMsg.includes('No audio chunks') || errorMsg.includes('microphone')) {
        userAlert = 'Microphone issue: Please check your microphone is connected and permissions are granted.';
      } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        userAlert = 'Network error: Please check your connection and ensure the backend is running.';
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        userAlert = 'Session expired. Please refresh and login again.';
      }
      
      alert(userAlert);
    } finally {
      setIsProcessingVoice(false);
      setRecordingDuration(0);
      // Don't reset submitInProgressRef here - submitMessage handles it
    }
  };

  // End interview session
  const endInterviewSession = async () => {
    if (!chatId) return;

    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          duration: Math.floor(elapsedTime / 60),
          feedback: notes
        })
      });
    } catch (error) {
      console.error('Error ending interview:', error);
    }
  };

  const handleJobProfileSubmit = () => {
    createInterviewSession();
  };

  const handleBackFromJobProfile = () => {
    setShowJobProfile(false);
    setShowModeSelection(true);
    setSelectedMode(null);
  };

  // Toggle mute/recording - gated by interviewStarted and AI audio state
  const toggleMute = async () => {
    // For all modes, only allow recording after the
    // first AI question has been asked.
    if (!interviewStarted) {
      alert('Please wait for the interviewer to ask the first question.');
      return;
    }

    if (!chatId) {
      alert('Please start the interview first.');
      return;
    }

    // Block while processing or playing AI audio
    if (isProcessingVoice || isAudioPlaying) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ [VOICE] Cannot toggle: processing or audio playing');
      }
      return;
    }

    // Toggle recording
    if (isRecordingVoice) {
      // Stop recording
      await handleStopVoiceRecording();
    } else {
      // Start recording
      await handleStartVoiceRecording();
    }
  };

  const toggleVideo = () => {
    if (webcamStreamRef.current) {
      const videoTracks = webcamStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const newVideoState = !isVideoOn;
        videoTracks.forEach(track => {
          track.enabled = newVideoState;
        });
        setIsVideoOn(newVideoState);
        console.log(`Video ${newVideoState ? 'enabled' : 'disabled'}`);
      } else {
        console.warn('No video tracks available');
      }
    } else {
      console.warn('No webcam stream available');
    }
  };

  const toggleRecording = () => {
    if (isRecordingVoice) {
      handleStopVoiceRecording();
    } else {
      handleStartVoiceRecording();
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing, return to webcam
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      
      if (userVideoRef.current && webcamStreamRef.current) {
        userVideoRef.current.srcObject = webcamStreamRef.current;
      }
      
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        screenStreamRef.current = stream;

        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        setIsScreenSharing(true);

        // Listen for when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (userVideoRef.current && webcamStreamRef.current) {
            userVideoRef.current.srcObject = webcamStreamRef.current;
          }
        };
      } catch (error) {
        console.error('Screen share error:', error);
      }
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const retryCamera = () => {
    initializeWebcam();
  };

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.interview-room-main-video');
    if (videoContainer) {
      if (!document.fullscreenElement) {
        videoContainer.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  // If job profile setup screen should be shown
  if (showJobProfile) {
    return (
      <div className="interview-job-profile">
        <div className="interview-job-profile-header">
          <button className="interview-job-profile-back" onClick={handleBackFromJobProfile}>
            <ChevronLeft size={24} />
            Back
          </button>
          <h1>Job Interview Profile</h1>
        </div>

        <div className="interview-job-profile-container">
          {/* Decorative particles to match mode selection background */}
          <div className="interview-job-profile-bg-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
          <div className="interview-job-profile-content">
            <div className="interview-job-profile-section">
              <h2>Interview Details</h2>
              <p className="interview-job-profile-subtitle">Provide information about the position you're interviewing for</p>
              
              <div className="interview-job-profile-form">
                {/* Job Title */}
                <div className="interview-job-profile-field">
                  <label htmlFor="jobTitle">Job Title <span className="required">*</span></label>
                  <input
                    id="jobTitle"
                    type="text"
                    placeholder="e.g., Senior Software Engineer"
                    className="interview-job-profile-input"
                    value={jobProfile.jobTitle}
                    onChange={(e) => setJobProfile({...jobProfile, jobTitle: e.target.value})}
                  />
                </div>

                {/* Company */}
                <div className="interview-job-profile-field">
                  <label htmlFor="company">Company Name <span className="required">*</span></label>
                  <input
                    id="company"
                    type="text"
                    placeholder="e.g., Google, Microsoft, Apple"
                    className="interview-job-profile-input"
                    value={jobProfile.company}
                    onChange={(e) => setJobProfile({...jobProfile, company: e.target.value})}
                  />
                </div>

                {/* Job Description */}
                <div className="interview-job-profile-field">
                  <label htmlFor="jobDesc">Job Description</label>
                  <textarea
                    id="jobDesc"
                    placeholder={starterMode ? "Paste the job description or key responsibilities (optional)..." : "Paste the job description or key responsibilities... This will help customize the interview questions"}
                    className="interview-job-profile-textarea"
                    value={jobProfile.jobDescription}
                    onChange={(e) => setJobProfile({...jobProfile, jobDescription: e.target.value})}
                    rows="6"
                  />
                </div>

                {/* Resume Upload - HIDDEN FOR STARTER MODE AND STARTER PLAN USERS */}
                {!starterMode && user?.plan !== 'STARTER' && (
                  <div className="interview-job-profile-field">
                    <label>Upload Your Resume</label>
                    <div className="interview-job-profile-resume">
                      <ResumeUpload 
                        onResumeSelect={(resumeId) => setJobProfile({...jobProfile, resumeId})}
                        selectedResumeId={jobProfile.resumeId}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="interview-job-profile-actions">
                <button 
                  className="interview-job-profile-btn-start"
                  onClick={handleJobProfileSubmit}
                  disabled={isCreatingInterview}
                >
                  {isCreatingInterview ? 'Starting Interview...' : 'Start Interview'}
                </button>
              </div>
            </div>

            <div className="interview-job-profile-tips">
              <h3>💡 Tips for {starterMode ? 'Starter' : 'Better'} Interview</h3>
              <ul>
                <li><strong>Job Title:</strong> Helps us ask relevant questions for your position</li>
                <li><strong>Company:</strong> We'll customize questions based on the company's style</li>
                <li><strong>Job Description:</strong> Upload the JD so we can ask role-specific questions</li>
                {!isStarterSession && user?.plan !== 'STARTER' && (
                  <li><strong>Resume:</strong> We'll reference your experience during the interview</li>
                )}
                {isStarterSession && (
                  <>
                    <li><strong>Time Limit:</strong> You have 30 minutes maximum</li>
                    <li><strong>Questions:</strong> Up to 20 questions to fill the session</li>
                    <li><strong>Focus:</strong> Job role-based questions only</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If mode selection screen should be shown
  if (showModeSelection) {
    return (
      <div className="interview-mode-selection">
        {/* Animated background particles */}
        <div className="interview-mode-bg-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        {/* Back Button */}
        <button className="interview-mode-back-btn" onClick={() => navigate('/')} title="Back to Home">
          <ChevronLeft size={24} />
          <span>Back to Home</span>
        </button>

        <div className="interview-mode-container">
          <h1 className="interview-mode-title">Select Interview Difficulty</h1>
          <p className="interview-mode-subtitle">Choose the interview style that matches your preparation level</p>
          
          <div className="interview-mode-cards">
            {/* Friendly Mode */}
            <div className="interview-mode-card friendly-card" onClick={() => handleModeSelection('friendly')}>
              <div className="interview-mode-card-glow"></div>
              <div className="interview-mode-icon-wrapper">
                <div className="interview-mode-icon friendly">
                  <MessageSquare size={36} strokeWidth={2} />
                </div>
              </div>
              <h3 className="interview-mode-card-title">Friendly</h3>
              <p className="interview-mode-card-desc">Relaxed and supportive environment</p>
              <ul className="interview-mode-card-features">
                <li><span className="checkmark">✓</span>Easier questions</li>
                <li><span className="checkmark">✓</span>More guidance provided</li>
                <li><span className="checkmark">✓</span>Perfect for beginners</li>
              </ul>
              <button className="interview-mode-button friendly" onClick={(e) => { e.stopPropagation(); handleModeSelection('friendly'); }}>
                Start Friendly Interview
              </button>
            </div>

            {/* Moderate Mode */}
            <div className="interview-mode-card moderate-card popular" onClick={() => handleModeSelection('moderate')}>
              <div className="interview-mode-badge">Most Popular</div>
              <div className="interview-mode-card-glow"></div>
              <div className="interview-mode-icon-wrapper">
                <div className="interview-mode-icon moderate">
                  <FileText size={36} strokeWidth={2} />
                </div>
              </div>
              <h3 className="interview-mode-card-title">Moderate</h3>
              <p className="interview-mode-card-desc">Balanced and realistic interview</p>
              <ul className="interview-mode-card-features">
                <li><span className="checkmark">✓</span>Standard difficulty</li>
                <li><span className="checkmark">✓</span>Real-world scenarios</li>
                <li><span className="checkmark">✓</span>Great for practice</li>
              </ul>
              <button className="interview-mode-button moderate" onClick={(e) => { e.stopPropagation(); handleModeSelection('moderate'); }}>
                Start Moderate Interview
              </button>
            </div>

            {/* Strict Mode */}
            <div className="interview-mode-card strict-card" onClick={() => handleModeSelection('strict')}>
              <div className="interview-mode-card-glow"></div>
              <div className="interview-mode-icon-wrapper">
                <div className="interview-mode-icon strict">
                  <List size={36} strokeWidth={2} />
                </div>
              </div>
              <h3 className="interview-mode-card-title">Strict</h3>
              <p className="interview-mode-card-desc">Challenging and demanding</p>
              <ul className="interview-mode-card-features">
                <li><span className="checkmark">✓</span>Advanced questions</li>
                <li><span className="checkmark">✓</span>High expectations</li>
                <li><span className="checkmark">✓</span>For experienced candidates</li>
              </ul>
              <button className="interview-mode-button strict" onClick={(e) => { e.stopPropagation(); handleModeSelection('strict'); }}>
                Start Strict Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const modeMeta = MODE_DISPLAY[selectedMode] || { label: "Select mode", accent: "#94a3b8" };

  return (
    <div className="premium-interview-room">
      {/* Galaxy background particles */}
      <div className="premium-galaxy-bg">
        <div className="premium-particle"></div>
        <div className="premium-particle"></div>
        <div className="premium-particle"></div>
        <div className="premium-particle"></div>
        <div className="premium-particle"></div>
      </div>

      {(isCreatingInterview || (!chatId && isLoadingQuestion)) && (
        <div className="premium-interview-overlay">
          <div className="premium-interview-spinner"></div>
          <p>Preparing your interview...</p>
        </div>
      )}
      
      {/* Auto-hide Top Header Bar */}
      <div 
        className={`premium-top-bar ${isNavbarVisible ? 'navbar-visible' : 'navbar-hidden'}`}
        onMouseEnter={handleNavbarMouseEnter}
        onMouseLeave={handleNavbarMouseLeave}
      >
        <div className="premium-brand">
          <button 
            className="premium-menu-btn" 
            title="Toggle Menu"
            onClick={toggleNavbar}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <img src="/logo-aceai.png" alt="AceAI" className="premium-brand-logo" height={50} />
        </div>

          <div
            className="premium-mode-pill"
            style={{
              borderColor: `${modeMeta.accent}55`,
              background: `${modeMeta.accent}1a`,
            }}
          >
            <span
              className="premium-mode-dot"
              style={{ background: modeMeta.accent }}
              aria-hidden
            ></span>
            <div className="premium-mode-copy">
              <span>Mode</span>
              <strong>{modeMeta.label}</strong>
            </div>
          </div>
        
        {/* Starter Mode Indicator */}
        {isStarterSession && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            fontSize: '0.9rem',
            color: '#fff'
          }}>
            <div style={{
              background: 'rgba(147, 51, 234, 0.2)',
              border: '1px solid rgba(147, 51, 234, 0.4)',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: '#a78bfa' }}>⏱️</span>
              <span style={{ fontWeight: 500 }}>
                {Math.floor((MAX_STARTER_TIME - elapsedTime) / 60)}:{((MAX_STARTER_TIME - elapsedTime) % 60).toString().padStart(2, '0')} left
              </span>
            </div>
            <div style={{
              background: 'rgba(236, 72, 153, 0.2)',
              border: '1px solid rgba(236, 72, 153, 0.4)',
              padding: '6px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: '#f9a8d4' }}>📊</span>
              <span style={{ fontWeight: 500 }}>
                Starter session in progress
              </span>
            </div>
          </div>
        )}
        
        {/* Timer for all interviews */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          padding: '6px 14px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.95rem',
          fontWeight: 500,
          color: '#93c5fd'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>{formatTime(elapsedTime)}</span>
        </div>
        
        <div className="premium-recording-pill">
          <div className="premium-rec-dot"></div>
          Recording
        </div>
        <div className="premium-top-actions">
          <button className="premium-icon-btn" title="Grid View">
            <Grid size={20} />
          </button>
          <button className="premium-icon-btn" title="Profile">
            <User size={20} />
          </button>
          
          <button className="premium-icon-btn" title="Menu">
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Show Navbar Button - Always visible at top */}
      {!isNavbarVisible && (
        <button
          className="navbar-toggle-btn"
          onClick={showNavbar}
          onMouseEnter={handleNavbarMouseEnter}
          title="Show Navigation"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Main Content Area */}
      <div className="premium-main-content">
        <div className={`premium-stage ${showTranscriptPanel ? "has-transcript" : "no-transcript"}`}>
          <button
            className={`transcript-toggle-btn ${showTranscriptPanel ? "open" : ""}`}
            onClick={() => setShowTranscriptPanel((prev) => !prev)}
            aria-pressed={showTranscriptPanel}
            title={showTranscriptPanel ? "Hide transcript" : "Show transcript"}
          >
            <FileText size={16} />
          </button>
          {/* Left: Main Video Container */}
          <div className="premium-video-wrapper">
            {/* Main Video Feed - User's Webcam */}
            <div className="premium-main-video-container">
              {!webcamError ? (
                <div className="premium-video-placeholder">
                  <AssistantOrb glow={getAssistantGlow()} isActive={isRecordingVoice || isAudioPlaying || isAITyping} />
                  {/* <span>Camera Off</span> */}
                </div>
              ) : (
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`premium-main-video ${!isCameraOn ? 'hidden' : ''}`}
                />
              )}
              {!isCameraOn && !webcamError && (
                <div className="premium-video-placeholder">
                  <AssistantOrb glow={getAssistantGlow()} isActive={isRecordingVoice || isAudioPlaying || isAITyping} />
                  <span>Camera Off</span>
                </div>
              )}
            </div>

            {/* Picture-in-Picture Window - Top Left */}
            <div className="premium-pip-window">
              <div className="premium-pip-label">Interviewee</div>
              {webcamError ? (
                <div className="premium-pip-placeholder">
                  <img src="/aiassistant-int.png" alt="" />
                </div>
              ) : (
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`premium-pip-video ${!isCameraOn ? 'hidden' : ''}`}
                />
              )}
              {!isCameraOn && !webcamError && (
                <div className="premium-pip-placeholder">
                  <User size={24} />
                </div>
              )}
            </div>
          </div>

          {/* Right: Transcript/Chat Panel */}
          {showTranscriptPanel && (
            <div className="premium-transcript-panel">
            <div className="premium-transcript-header">
              <h3>Interview Transcript</h3>
              <div className="premium-transcript-actions">
                <button 
                  className="premium-questions-dropdown-btn"
                  title="Select Question"
                  onClick={() => {/* TODO: Open question selector */}}
                >
                  <FileText size={16} />
                </button>
              </div>
            </div>

            {/* Transcript Messages Container */}
            <div className="premium-transcript-messages" ref={transcriptContainerRef}>
              {chatMessages.length === 0 && !isLoadingQuestion && (
                <div className="premium-transcript-empty">
                  <MessageSquare size={48} />
                  <p>Interview transcript will appear here</p>
                  <span>Start speaking or type a message to begin</span>
                </div>
              )}

              {chatMessages.map((message, index) => {
                // Count questions (AI messages that are questions, not feedback)
                const questionsBeforeThis = chatMessages.slice(0, index).filter(msg => (msg.sender === 'ai' || msg.sender === 'interviewer') && !msg.text.match(/^(Great|Good|Excellent|Nice|Perfect|Interesting|That's|Well|Thank|I appreciate)/i)).length + 1;
                const isQuestion = (message.sender === 'ai' || message.sender === 'interviewer') && !message.text.match(/^(Great|Good|Excellent|Nice|Perfect|Interesting|That's|Well|Thank|I appreciate|It was|We've completed|Our time|--)/i);
                const questionNum = isQuestion ? questionsBeforeThis : null;
                
                return (
                  <div 
                    key={message.id} 
                    className={`premium-message-bubble ${message.sender === 'user' ? 'user' : 'ai'}`}
                  >
                    <div className="premium-message-content">
                      {questionNum && (
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#a78bfa',
                          fontWeight: 600,
                          marginBottom: '6px',
                          letterSpacing: '0.5px'
                        }}>
                          Question {questionNum} {isStarterSession ? `of ${MAX_STARTER_QUESTIONS}` : ''}
                        </div>
                      )}
                      <div className="premium-message-text">{message.text}</div>
                      <div className="premium-message-time">{formatTimestamp(message.timestamp)}</div>
                    </div>
                  </div>
                );
              })}

              {/* AI Typing Indicator */}
              {isLoadingQuestion && (
                <div className="premium-message-bubble ai">
                  <div className="premium-message-content">
                    <div className="premium-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="premium-message-time">AI is typing...</div>
                  </div>
                </div>
              )}

              {/* Recording Status */}
              {isRecordingVoice && (
                <div className="premium-recording-status-banner">
                  <div className="premium-recording-waveform">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>Listening... {recordingDuration > 0 && `${recordingDuration}s`}</span>
                </div>
              )}

              {/* Processing Status */}
              {isProcessingVoice && (
                <div className="premium-processing-status-banner">
                  <div className="premium-spinner-small"></div>
                  <span>Processing audio...</span>
                </div>
              )}
            </div>

            {/* Message Input Area */}
            <div className="premium-transcript-input-area">
              <div className="premium-input-wrapper">
                <input
                  type="text"
                  className="premium-message-input"
                  placeholder={isRecordingVoice ? "Recording in progress..." : "Type your answer or use voice..."}
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isRecordingVoice || isProcessingVoice || isLoadingQuestion}
                />
                <button
                  className={`premium-voice-record-btn ${isRecordingVoice ? 'recording' : ''}`}
                  onClick={toggleMute}
                  disabled={(!isRecordingVoice && (isProcessingVoice || isLoadingQuestion || isAudioPlaying || !interviewStarted))}
                  title={isRecordingVoice ? 'Stop Recording' : 'Start Voice Recording'}
                >
                  {isRecordingVoice ? (
                    <div className="premium-mic-pulse">
                      <MicOff size={20} />
                    </div>
                  ) : (
                    <Mic size={20} />
                  )}
                </button>
                <button
                  className="premium-send-message-btn"
                  onClick={handleSendMessage}
                  disabled={!userMessage.trim() || isRecordingVoice || isProcessingVoice || isLoadingQuestion}
                  title="Send Message"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls - Centered and Floating */}
      <div className="premium-bottom-controls">
        <button 
          className={`premium-control-btn mic ${!isMicOn || isRecordingVoice ? 'off' : ''} ${isRecordingVoice ? 'recording' : ''}`}
          onClick={toggleMute}
          disabled={(!isRecordingVoice && (isProcessingVoice || isLoadingQuestion || isAudioPlaying || !interviewStarted))}
          title={isRecordingVoice ? 'Stop Recording' : isMicOn ? 'Mute' : 'Unmute'}
        >
          {isRecordingVoice ? (
            <div className="premium-mic-pulse">
              <MicOff size={22} />
            </div>
          ) : isMicOn ? (
            <Mic size={22} />
          ) : (
            <MicOff size={22} />
          )}
        </button>
        <button 
          className={`premium-control-btn cam ${!isCameraOn ? 'off' : ''}`}
          onClick={toggleCamera}
          title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
        >
          {isCameraOn ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
        <button 
          className={`premium-control-btn speaker ${!isSpeakerOn ? 'off' : ''}`}
          onClick={toggleSpeaker}
          title={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
        >
          {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
        <button 
          className="premium-control-btn playback"
          onClick={togglePlaybackRate}
          title={`Playback speed: ${aiPlaybackRate === 1 ? 'Normal' : 'Slower'}`}
        >
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{aiPlaybackRate.toFixed(2)}x</span>
        </button>
        <button 
          className="premium-control-btn hangup"
          onClick={handleHangUp}
          title="End interview"
        >
          <Phone size={22} />
        </button>
      </div>
    </div>
  );
};

export default InterviewRoom;
