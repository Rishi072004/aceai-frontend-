import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, Download, Share2, MoreVertical, Star, TrendingUp, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import "./Feedback.css";

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000');

const Feedback = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState(null);
  const [isStarterSession, setIsStarterSession] = useState(false);

  const stateConversation = location.state?.conversation;
  const stateMeta = {
    mode: location.state?.mode,
    jobTitle: location.state?.jobTitle,
    company: location.state?.company,
    jobDescription: location.state?.jobDescription,
    chatId: location.state?.chatId
  };

  const buildConversationPayload = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(msg => ({
      type: msg.type || msg.role || (msg.sender === 'user' ? 'user' : 'assistant'),
      text: msg.text || msg.content || ''
    })).filter(m => m.text);
  };

  const deriveAnalysisFromAi = (feedback, sourceMessages = []) => {
    if (!feedback) return null;
    const score10 = Number(feedback.overallScore) || 0;
    const overallScore = Math.min(100, Math.max(0, Math.round(score10 * 10)));
    const commScore = Math.min(25, Math.max(0, (feedback.communication?.score || 0) * 2.5));
    const techScore = Math.min(25, Math.max(0, (feedback.technicalKnowledge?.score || 0) * 2.5));
    const probScore = Math.min(25, Math.max(0, (feedback.problemSolving?.score || 0) * 2.5));
    const profScore = Math.min(25, Math.max(0, (feedback.professionalism?.score || 0) * 2.5));
    const rating = overallScore >= 85 ? "Excellent" : overallScore >= 70 ? "Good" : overallScore >= 55 ? "Moderate" : "Needs Improvement";
    const ratingIcon = overallScore >= 85 ? "excellent" : overallScore >= 70 ? "good" : overallScore >= 55 ? "moderate" : "needswork";
    const message = feedback.summary || feedback.recommendation || "Thanks for completing the interview.";
    const userResponses = sourceMessages.filter(m => (m.role || m.type) === 'user').length;

    return {
      overallScore,
      avgResponseLength: 0,
      userResponseCount: userResponses,
      communicationQuality: commScore,
      professionalism: profScore,
      depth: Math.max(probScore, techScore),
      strengths: feedback.strengths || [],
      improvements: feedback.improvements || [],
      detailedFeedback: feedback.summary || '',
      honestAssessment: {
        rating,
        message,
        icon: ratingIcon
      }
    };
  };

  const fetchAiFeedback = async (conversationPayload) => {
    if (!token || !conversationPayload.length) return null;
    try {
      setAiLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-interview-feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversation: conversationPayload,
          mode: stateMeta.mode || chatSession?.difficulty || 'moderate',
          jobTitle: stateMeta.jobTitle,
          company: stateMeta.company,
          jobDescription: stateMeta.jobDescription,
          chatId: chatId || stateMeta.chatId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        console.warn('AI feedback generation failed:', data?.message || response.statusText);
        return null;
      }
      const payload = data?.data || data;
      setAiFeedback(payload);
      return payload;
    } catch (err) {
      console.error('Error generating AI feedback:', err);
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  // Analyze interview performance
  const analyzeInterviewPerformance = (interviewMessages) => {
    if (!interviewMessages || interviewMessages.length === 0) {
      return null;
    }

    // Filter only user messages (excluding AI feedback)
    const userMessages = interviewMessages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content);

    // Calculate metrics
    const avgResponseLength = userMessages.reduce((sum, msg) => sum + msg.length, 0) / userMessages.length;
    const hasSpecificExamples = userMessages.some(msg => 
      msg.toLowerCase().includes('project') || 
      msg.toLowerCase().includes('built') ||
      msg.toLowerCase().includes('implemented')
    );
    const usedStar = userMessages.some(msg =>
      msg.toLowerCase().includes('situation') ||
      msg.toLowerCase().includes('task') ||
      msg.toLowerCase().includes('action') ||
      msg.toLowerCase().includes('result')
    );
    const askedQuestions = userMessages.some(msg =>
      msg.includes('?')
    );
    const communicationQuality = calculateCommunicationQuality(userMessages);
    const professionalism = calculateProfessionalism(userMessages);
    const depth = calculateDepthAnalysis(userMessages);

    // Calculate overall score
    const scoreComponents = [
      communicationQuality,
      professionalism,
      depth,
      hasSpecificExamples ? 20 : 0,
      askedQuestions ? 10 : 0
    ];
    const overallScore = Math.min(100, Math.round(scoreComponents.reduce((a, b) => a + b) / scoreComponents.length * 1.2));

    return {
      overallScore: Math.min(100, overallScore),
      avgResponseLength: Math.round(avgResponseLength),
      userResponseCount: userMessages.length,
      communicationQuality,
      professionalism,
      depth,
      strengths: identifyStrengths({ hasSpecificExamples, usedStar, askedQuestions, communicationQuality, professionalism, depth }),
      improvements: identifyImprovements({ hasSpecificExamples, usedStar, askedQuestions, communicationQuality, professionalism, depth }),
      detailedFeedback: generateDetailedFeedback({ userMessages, hasSpecificExamples, usedStar, communicationQuality }),
      honestAssessment: generateHonestAssessment(overallScore, { hasSpecificExamples, usedStar, communicationQuality, professionalism })
    };
  };

  // Calculate communication quality (0-25 scale)
  const calculateCommunicationQuality = (userMessages) => {
    let score = 0;
    const combinedText = userMessages.join(' ').toLowerCase();

    // Check for clarity and structure
    const hasGoodStructure = userMessages.some(msg => msg.split(' ').length > 20);
    if (hasGoodStructure) score += 8;

    // Check for relevance
    const relevantKeywords = ['project', 'team', 'developed', 'improved', 'solved', 'implemented'];
    const relevanceCount = relevantKeywords.filter(kw => combinedText.includes(kw)).length;
    score += Math.min(10, relevanceCount * 2);

    // Check for clarity markers
    const clarityMarkers = ['first', 'then', 'finally', 'therefore', 'as a result', 'specifically'];
    const clarityCount = clarityMarkers.filter(marker => combinedText.includes(marker)).length;
    score += Math.min(7, clarityCount * 1.5);

    return Math.min(25, score);
  };

  // Calculate professionalism (0-25 scale)
  const calculateProfessionalism = (userMessages) => {
    let score = 25; // Start with full score
    const combinedText = userMessages.join(' ').toLowerCase();

    // Penalize for informal language
    const informalMarkers = ['lol', 'haha', 'dunno', 'gonna', 'wanna', 'kinda', 'yeah', 'omg'];
    const informalCount = informalMarkers.filter(marker => combinedText.includes(marker)).length;
    score -= informalCount * 3;

    // Penalize for negative words
    const negativeMarkers = ['hate', 'stupid', 'boring', 'sucks', 'waste'];
    const negativeCount = negativeMarkers.filter(marker => combinedText.includes(marker)).length;
    score -= negativeCount * 5;

    // Reward for professional tone
    const professionalMarkers = ['analyze', 'collaborate', 'contribute', 'optimize', 'facilitate'];
    const professionalCount = professionalMarkers.filter(marker => combinedText.includes(marker)).length;
    score += professionalCount * 2;

    return Math.max(0, Math.min(25, score));
  };

  // Calculate depth of responses (0-25 scale)
  const calculateDepthAnalysis = (userMessages) => {
    let score = 0;
    
    // Average response length indicator
    const avgLength = userMessages.reduce((sum, msg) => sum + msg.split(' ').length, 0) / userMessages.length;
    if (avgLength > 50) score += 12;
    else if (avgLength > 30) score += 8;
    else if (avgLength > 15) score += 4;

    // Check for detailed explanations
    const detailMarkers = userMessages.filter(msg => 
      msg.includes('because') || 
      msg.includes('for example') ||
      msg.includes('specifically') ||
      msg.includes('details')
    ).length;
    score += Math.min(13, detailMarkers * 3);

    return Math.min(25, score);
  };

  // Identify strengths
  const identifyStrengths = (metrics) => {
    const strengths = [];

    if (metrics.communicationQuality > 15) {
      strengths.push("✓ Clear and structured communication");
    }
    if (metrics.professionalism > 20) {
      strengths.push("✓ Maintained professional tone throughout");
    }
    if (metrics.depth > 15) {
      strengths.push("✓ Provided detailed explanations");
    }
    if (metrics.hasSpecificExamples) {
      strengths.push("✓ Used concrete examples from experience");
    }
    if (metrics.usedStar) {
      strengths.push("✓ Used structured approach (STAR method)");
    }
    if (metrics.askedQuestions) {
      strengths.push("✓ Showed initiative by asking questions");
    }

    return strengths.length > 0 ? strengths : ["✓ Showed engagement in the interview"];
  };

  // Identify improvements
  const identifyImprovements = (metrics) => {
    const improvements = [];

    if (metrics.communicationQuality < 12) {
      improvements.push("→ Work on structuring your answers more clearly");
    }
    if (metrics.depth < 12) {
      improvements.push("→ Provide more detailed explanations and examples");
    }
    if (metrics.professionalism < 18) {
      improvements.push("→ Maintain a more professional tone");
    }
    if (!metrics.hasSpecificExamples) {
      improvements.push("→ Include specific project examples to support your answers");
    }
    if (!metrics.usedStar) {
      improvements.push("→ Try using the STAR method for behavioral questions");
    }
    if (!metrics.askedQuestions) {
      improvements.push("→ Ask clarifying or follow-up questions to show interest");
    }

    return improvements.length > 0 ? improvements : ["→ Continue to prepare thoroughly before interviews"];
  };

  // Generate detailed feedback
  const generateDetailedFeedback = ({ userMessages, hasSpecificExamples, usedStar, communicationQuality }) => {
    let feedback = "Based on your responses, ";

    if (communicationQuality > 18 && hasSpecificExamples) {
      feedback += "you demonstrated strong communication skills with concrete examples. ";
    } else if (communicationQuality > 12) {
      feedback += "your answers showed reasonable clarity but could benefit from more structure. ";
    } else {
      feedback += "try to organize your thoughts better before responding to make your points clearer. ";
    }

    if (hasSpecificExamples) {
      feedback += "Your use of real-world examples was particularly effective. ";
    }

    if (usedStar) {
      feedback += "Good job using a structured approach for your behavioral answers. ";
    } else {
      feedback += "Consider using the STAR method to structure behavioral answers better. ";
    }

    feedback += "Overall, you showed good preparation and engagement throughout the interview.";

    return feedback;
  };

  // Generate honest assessment
  const generateHonestAssessment = (score, metrics) => {
    if (score >= 85) {
      return {
        rating: "Excellent",
        message: "You performed exceptionally well! Your answers were clear, professional, and well-structured. You're well-prepared for the next round.",
        icon: "excellent"
      };
    } else if (score >= 70) {
      return {
        rating: "Good",
        message: "You did well overall with good communication and engagement. With some refinement in providing specific examples and depth, you'll be even stronger.",
        icon: "good"
      };
    } else if (score >= 55) {
      return {
        rating: "Moderate",
        message: "You showed understanding of the questions, but consider working on clarity and providing more detailed examples. Practice structuring your responses better.",
        icon: "moderate"
      };
    } else {
      return {
        rating: "Needs Improvement",
        message: "This was a good learning opportunity. Focus on preparing specific examples, structuring your responses clearly, and maintaining a professional tone for better results next time.",
        icon: "needswork"
      };
    }
  };

  // Load interview session and messages
  useEffect(() => {
    const loadInterviewData = async () => {
      try {
        setLoading(true);

        let workingMessages = [];
        let conversationPayload = [];

        // 1) Try loading from chatId (server history)
        if (chatId && token) {
          const chatRes = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            setChatSession(chatData.data);
          }

          const messagesRes = await fetch(
            `${API_BASE_URL}/api/chats/${chatId}/messages?limit=200`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );

          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            workingMessages = (messagesData?.data?.messages || [])
              .filter(msg => msg.role === 'user' || msg.role === 'assistant')
              .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setMessages(workingMessages);
            conversationPayload = buildConversationPayload(workingMessages);
          }
        }

        // 2) If no chatId or no messages, fallback to conversation passed via navigation state
        if ((!workingMessages.length || !conversationPayload.length) && stateConversation?.length) {
          conversationPayload = buildConversationPayload(stateConversation);
          workingMessages = stateConversation.map((msg, idx) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.text,
            timestamp: msg.timestamp || new Date(Date.now() + idx * 1000).toISOString()
          }));
          setMessages(workingMessages);
        }

        if (!workingMessages.length) {
          setError('No conversation data available for feedback.');
          return;
        }

        // Heuristic analysis fallback (client-side)
        const analysis = analyzeInterviewPerformance(workingMessages.map(m => ({ role: m.role, content: m.content })));
        setFeedbackAnalysis(analysis);

        // Server-side AI feedback
        const aiResult = conversationPayload.length ? await fetchAiFeedback(conversationPayload) : null;
        if (aiResult) {
          const derived = deriveAnalysisFromAi(aiResult, workingMessages);
          if (derived) {
            setFeedbackAnalysis(derived);
          }
        }

      } catch (err) {
        console.error('Error loading interview:', err);
        setError('Failed to load interview feedback');
      } finally {
        setLoading(false);
      }
    };

    const starterFromState = location.state?.starterMode;
    const starterFromStorage = localStorage.getItem('starter-mode') === 'true';
    setIsStarterSession(!!starterFromState || starterFromStorage);

    loadInterviewData();
  }, [chatId, token, location.state, stateConversation]);

  const handleBack = () => {
    navigate('/history');
  };

  const handleDownload = () => {
    // Generate transcript as text
    let transcript = `Interview Feedback\n`;
    transcript += `=================\n\n`;
    
    if (chatSession) {
      transcript += `Title: ${chatSession.title || 'Interview'}\n`;
      transcript += `Date: ${new Date(chatSession.createdAt).toLocaleDateString()}\n`;
      transcript += `Duration: ${chatSession.duration || 0} minutes\n`;
      transcript += `Mode: ${chatSession.difficulty || 'moderate'}\n\n`;
    }

    transcript += `Conversation Transcript\n`;
    transcript += `---------------------\n\n`;

    messages.forEach((msg, idx) => {
      const speaker = msg.role === 'assistant' ? 'Interviewer' : 'You';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      transcript += `[${time}] ${speaker}:\n${msg.content}\n\n`;
    });

    // Download as text file
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`);
    element.setAttribute('download', `interview-feedback-${chatId}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="feedback-page">
        <div className="feedback-loading">
          <div className="feedback-spinner"></div>
          <p>Loading your interview feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-page">
        <div className="feedback-error">
          <p>{error}</p>
          <button className="feedback-btn-primary" onClick={handleBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-page">
      {/* Header */}
      <div className="feedback-header">
        <button className="feedback-back-btn" onClick={handleBack}>
          <ChevronLeft size={24} />
        </button>
        <div className="feedback-title-section">
          <h1>Interview Feedback</h1>
          <p className="feedback-subtitle">
            {chatSession?.title || 'Your Interview Session'}
          </p>
        </div>
        <div className="feedback-header-actions">
          <button className="feedback-icon-btn" onClick={handleDownload} title="Download transcript">
            <Download size={20} />
          </button>
          <button className="feedback-icon-btn" title="Share">
            <Share2 size={20} />
          </button>
          <button className="feedback-icon-btn" title="More options">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="feedback-content">
        {/* Starter credit info banner */}
        {isStarterSession && (
          <div className="feedback-starter-banner">
            <div className="feedback-starter-pill">Starter Pack</div>
            <p>
              You&apos;ve used your Starter interview credit.
              {user?.credits === 0 && " To continue practicing, please purchase another package from the Pricing page."}
            </p>
          </div>
        )}

        {/* Honest Performance Analysis */}
        {feedbackAnalysis && (
          <div className="feedback-analysis-section">
            <div className="feedback-analysis-header">
              <h2>📊 Your Interview Analysis</h2>
              <p className="feedback-analysis-subtitle">Comprehensive feedback based on your responses</p>
            </div>

            {/* Overall Score Card */}
            <div className="feedback-score-card">
              <div className="feedback-score-display">
                <div className="feedback-score-circle">
                  <span className="feedback-score-number">{feedbackAnalysis.overallScore}</span>
                  <span className="feedback-score-max">/100</span>
                </div>
                <div className="feedback-score-info">
                  <h3 className={`feedback-rating ${feedbackAnalysis.honestAssessment.icon}`}>
                    {feedbackAnalysis.honestAssessment.rating}
                  </h3>
                  <p className="feedback-assessment-message">
                    {feedbackAnalysis.honestAssessment.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="feedback-metrics-grid">
              <div className="feedback-metric-card">
                <div className="feedback-metric-label">Communication Quality</div>
                <div className="feedback-metric-bar">
                  <div className="feedback-metric-fill" style={{ width: `${(feedbackAnalysis.communicationQuality / 25) * 100}%` }}></div>
                </div>
                <div className="feedback-metric-value">{feedbackAnalysis.communicationQuality}/25</div>
              </div>

              <div className="feedback-metric-card">
                <div className="feedback-metric-label">Professionalism</div>
                <div className="feedback-metric-bar">
                  <div className="feedback-metric-fill" style={{ width: `${(feedbackAnalysis.professionalism / 25) * 100}%` }}></div>
                </div>
                <div className="feedback-metric-value">{feedbackAnalysis.professionalism}/25</div>
              </div>

              <div className="feedback-metric-card">
                <div className="feedback-metric-label">Response Depth</div>
                <div className="feedback-metric-bar">
                  <div className="feedback-metric-fill" style={{ width: `${(feedbackAnalysis.depth / 25) * 100}%` }}></div>
                </div>
                <div className="feedback-metric-value">{feedbackAnalysis.depth}/25</div>
              </div>

              <div className="feedback-metric-card">
                <div className="feedback-metric-label">Responses Count</div>
                <div className="feedback-metric-display">{feedbackAnalysis.userResponseCount}</div>
              </div>
            </div>

            {/* Strengths Section */}
            <div className="feedback-strengths-section">
              <h3>💪 Your Strengths</h3>
              <ul className="feedback-strengths-list">
                {feedbackAnalysis.strengths.map((strength, idx) => (
                  <li key={idx} className="feedback-strength-item">
                    <CheckCircle size={18} />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements Section */}
            <div className="feedback-improvements-section">
              <h3>📈 Areas to Improve</h3>
              <ul className="feedback-improvements-list">
                {feedbackAnalysis.improvements.map((improvement, idx) => (
                  <li key={idx} className="feedback-improvement-item">
                    <AlertCircle size={18} />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Feedback */}
            <div className="feedback-detailed-section">
              <h3>📝 Detailed Feedback</h3>
              <div className="feedback-detailed-text">
                {feedbackAnalysis.detailedFeedback}
              </div>
            </div>
          </div>
        )}

        {/* Session Summary */}
        <div className="feedback-summary">
          <div className="feedback-summary-grid">
            <div className="feedback-stat">
              <TrendingUp size={20} />
              <div>
                <span className="feedback-stat-label">Duration</span>
                <span className="feedback-stat-value">
                  {chatSession?.duration || 0} min
                </span>
              </div>
            </div>
            <div className="feedback-stat">
              <div>
                <span className="feedback-stat-label">Questions Answered</span>
                <span className="feedback-stat-value">
                  {Math.ceil((messages.filter(m => m.role === 'assistant').length + 1) / 2)}
                </span>
              </div>
            </div>
            <div className="feedback-stat">
              <Star size={20} />
              <div>
                <span className="feedback-stat-label">Performance</span>
                <span className="feedback-stat-value">
                  {feedbackAnalysis?.honestAssessment?.rating || 'Good'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Transcript */}
        <div className="feedback-conversation">
          <h2>🎙️ Interview Transcript</h2>
          <div className="feedback-messages">
            {messages.length === 0 ? (
              <p className="feedback-no-messages">No messages recorded</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`feedback-message ${msg.role === 'assistant' ? 'interviewer' : 'user'}`}
                >
                  <div className="feedback-message-speaker">
                    {msg.role === 'assistant' ? '🤖 Interviewer' : '👤 You'}
                  </div>
                  <div className="feedback-message-content">
                    {msg.content}
                  </div>
                  <div className="feedback-message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Feedback Tips */}
        <div className="feedback-tips">
          <h3>💡 Tips for Your Next Interview</h3>
          <ul>
            <li><strong>Be Specific:</strong> Use concrete examples from your projects</li>
            <li><strong>Use STAR Method:</strong> Situation, Task, Action, Result for behavioral questions</li>
            <li><strong>Ask Questions:</strong> Shows genuine interest in the role and company</li>
            <li><strong>Stay Professional:</strong> Maintain clear and professional communication</li>
            <li><strong>Prepare Stories:</strong> Have 3-5 key stories ready to illustrate your skills</li>
            <li><strong>Follow Up:</strong> Send a thank you note after the interview</li>
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="feedback-footer">
        <button className="feedback-btn-secondary" onClick={handleBack}>
          View All Interviews
        </button>
        <button 
          className="feedback-btn-primary"
          onClick={() => navigate('/interview')}
        >
          Start Another Interview
        </button>
      </div>
    </div>
  );
};

export default Feedback;
