import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Star, TrendingUp, CheckCircle, AlertCircle, Award, Target, Download, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import "./InterviewFeedback.css";

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000');

const InterviewFeedback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  const [feedback, setFeedback] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const feedbackRef = useRef(null);

  const { conversation, mode, jobTitle, company, jobDescription, chatId, chatFeedback } = location.state || {};
  const isStarterFlow = location.state?.starterMode || user?.plan === "STARTER";
  const isBasicReport = feedback?.tier === "basic" || (!feedback?.tier && isStarterFlow);
  const isValuePlan = (user?.plan || '').toUpperCase() === 'VALUE';
  const limitedStrengths = (feedback?.strengths || []).slice(0, 2);
  const limitedImprovements = (feedback?.improvements || []).slice(0, 2);
  const showTips = isValuePlan && !isStarterFlow && tips.length > 0;

  // We may need to reconstruct conversation (e.g., page refresh) using chatId
  const [resolvedConversation, setResolvedConversation] = useState(conversation || null);

  useEffect(() => {
    if (feedback) {
      setTips(isStarterFlow ? [] : (feedback.tips || []));
    }
  }, [feedback, isStarterFlow]);

  useEffect(() => {
    // If viewing feedback from history page
    if (chatFeedback) {
      setFeedback(chatFeedback);
      setTips(chatFeedback?.tips || []);
      setLoading(false);
      return;
    }

    // If generating fresh feedback
    if (!conversation && chatId) {
      // Try to restore transcript from the server if state was lost
      fetchConversationFromServer(chatId);
      return;
    }

    if (!conversation) {
      setError("No interview data found. Please complete an interview first.");
      setLoading(false);
      return;
    }

    setResolvedConversation(conversation);
    generateFeedback(conversation);
  }, []);

  const fetchConversationFromServer = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/chats/${id}/messages?limit=300`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Couldn't load interview transcript. Please redo the interview.");
      }

      const data = await res.json();
      const messages = (data?.data?.messages || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const mapped = messages
        .filter((msg) => msg?.content)
        .map((msg) => ({
          type: msg.role === "user" ? "user" : "assistant",
          text: msg.content
        }));

      if (mapped.length === 0) {
        throw new Error("Transcript was empty. Please try another interview.");
      }

      setResolvedConversation(mapped);
      generateFeedback(mapped);
    } catch (err) {
      console.error("Failed to restore transcript:", err);
      setError(err.message || "Could not load interview transcript.");
      setLoading(false);
    }
  };

  const generateFeedback = async (conversationData = resolvedConversation) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Generating feedback with data:', {
        conversationLength: conversationData?.length,
        mode,
        jobTitle,
        company,
        chatId
      });

      if (!conversationData || !Array.isArray(conversationData) || conversationData.length === 0) {
        throw new Error("No interview conversation found. Please complete an interview first.");
      }

      const response = await fetch(
        `${API_BASE_URL}/api/ai/generate-interview-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            conversation: conversationData,
            mode,
            jobTitle,
            company,
            jobDescription,
            chatId
          }),
        }
      );

      const data = await response.json();

      console.log('📊 Feedback response received:', {
        status: data.status,
        hasFeedback: !!data.data?.feedback,
        hasError: !!data.error,
        savedToChat: !!data.data?.savedToChat
      });

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate feedback");
      }

      setFeedback(data.data.feedback);
      setTips(data.data.feedback?.tips || []);
    } catch (err) {
      console.error("Feedback generation error:", err);
      setError(err.message || "Failed to generate feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "#22c55e";
    if (score >= 6) return "#eab308";
    if (score >= 4) return "#f97316";
    return "#ef4444";
  };

  const downloadFeedbackPDF = async () => {
    try {
      setDownloading(true);
      
      // Try to use html2pdf if available, otherwise fallback to text
      try {
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default || html2pdfModule;
        
        const element = feedbackRef.current;
        const opt = {
          margin: 10,
          filename: `interview-feedback-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };

        html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.log("html2pdf not available, falling back to text download");
        downloadFeedbackText();
      }
    } catch (err) {
      console.error("Error downloading:", err);
      downloadFeedbackText();
    } finally {
      setDownloading(false);
    }
  };

  const downloadFeedbackText = () => {
    try {
      let content = `INTERVIEW FEEDBACK REPORT\n`;
      content += `Generated: ${new Date().toLocaleString()}\n`;
      content += `=====================================\n\n`;

      if (jobTitle) content += `Position: ${jobTitle}${company ? ` at ${company}` : ''}\n`;
      content += `Interview Type: ${mode || 'General'}\n\n`;

      const strengths = Array.isArray(feedback?.strengths) ? feedback.strengths : [];
      const improvements = Array.isArray(feedback?.improvements) ? feedback.improvements : [];

      content += `OVERALL SCORE: ${feedback?.overallScore ?? 'N/A'}/10\n`;
      content += `${feedback?.summary || 'Summary not available.'}\n\n`;

      content += `STRENGTHS:\n`;
      if (strengths.length === 0) {
        content += `No strengths captured.\n`;
      } else {
        strengths.forEach((s, i) => {
          content += `${i + 1}. ${s}\n`;
        });
      }

      content += `\nAREAS FOR IMPROVEMENT:\n`;
      if (improvements.length === 0) {
        content += `No improvements captured.\n`;
      } else {
        improvements.forEach((item, idx) => {
          content += `${idx + 1}. ${item}\n`;
        });
      }

      if (isBasicReport) {
        content += `\nCATEGORY SCORES:\nDetailed breakdowns are available on paid plans.\n`;
      } else {
        content += `\nCATEGORY SCORES:\n`;
        content += `Communication: ${feedback?.communication?.score ?? 'N/A'}/10\n`;
        content += `Technical Knowledge: ${feedback?.technicalKnowledge?.score ?? 'N/A'}/10\n`;
        content += `Problem Solving: ${feedback?.problemSolving?.score ?? 'N/A'}/10\n`;
        content += `Professionalism: ${feedback?.professionalism?.score ?? 'N/A'}/10\n`;
      }

      if (!isBasicReport && feedback?.recommendation) {
        content += `\nRECOMMENDATION:\n${feedback.recommendation}\n`;
      }

      const element = document.createElement("a");
      element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
      element.setAttribute("download", `interview-feedback-${new Date().toISOString().split('T')[0]}.txt`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Error downloading text:", err);
      alert("Failed to download feedback");
    }
  };

  const ScoreGauge = ({ score, label }) => (
    <div className="score-gauge-container">
      <div className="score-gauge">
        <svg viewBox="0 0 120 60" className="gauge-svg">
          <path
            d="M 10 50 A 40 40 0 0 1 110 50"
            fill="none"
            stroke="#333"
            strokeWidth="6"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 110 50"
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth="6"
            strokeDasharray={`${(score / 10) * 100} 100`}
            opacity="0.8"
          />
          <text
            x="60"
            y="40"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill={getScoreColor(score)}
          >
            {score}/10
          </text>
        </svg>
      </div>
      <p className="gauge-label">{label}</p>
    </div>
  );

  return (
    <div className="interview-feedback-container">
      <div className="feedback-background">
        <div className="feedback-bg-element feedback-bg-1"></div>
        <div className="feedback-bg-element feedback-bg-2"></div>
        <div className="feedback-bg-element feedback-bg-3"></div>
      </div>

      <div className="feedback-content">
        {/* Header */}
        <div className="feedback-header">
          <div className="feedback-header-left">
            <button
              onClick={() => navigate("/")}
              className="feedback-back-btn"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </button>
            <div>
              <h1 className="feedback-title">Interview Feedback</h1>
              <p className="feedback-subtitle">
                AI-generated analysis of your interview performance
              </p>
            </div>
          </div>
          {feedback && !loading && !isBasicReport && (
            <button
              onClick={downloadFeedbackPDF}
              disabled={downloading}
              className="feedback-download-btn"
              title="Download feedback as PDF"
            >
              <Download size={20} />
              <span>{downloading ? "Downloading..." : "Download"}</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="feedback-loading">
            <div className="loading-spinner"></div>
            <p>Generating your personalized feedback...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="feedback-error">
            <AlertCircle size={32} />
            <h3>Unable to Generate Feedback</h3>
            <p>{error}</p>
            <button onClick={generateFeedback} className="feedback-retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Feedback Display */}
        {feedback && !loading && (
          isBasicReport ? (
            <div className="feedback-cards">
              <div className="feedback-card overall-card">
                <div className="card-header">
                  <Award size={28} className="header-icon" />
                  <div>
                    <h2>Basic Feedback</h2>
                    <p className="feedback-subtitle">Starter plan includes a concise summary.</p>
                  </div>
                </div>
                <div className="overall-content">
                  <div className="overall-score">
                    <div className="score-circle">
                      <span className="score-value">{feedback.overallScore}</span>
                      <span className="score-max">/10</span>
                    </div>
                    <div className="score-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={
                            i < Math.round(feedback.overallScore / 2)
                              ? "star-filled"
                              : "star-empty"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="summary-text">{feedback.summary}</p>
                </div>
              </div>

              <div className="strengths-improvements">
                <div className="feedback-section strengths">
                  <div className="section-header">
                    <CheckCircle className="section-icon success" />
                    <h3>Your Strengths</h3>
                  </div>
                  <ul className="feedback-list">
                    {limitedStrengths.length === 0 ? (
                      <li className="feedback-item">
                        <span className="bullet">•</span>
                        <p>No strengths captured in this basic report.</p>
                      </li>
                    ) : (
                      limitedStrengths.map((strength, idx) => (
                        <li key={idx} className="feedback-item">
                          <span className="bullet">✓</span>
                          <p>{strength}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="feedback-section improvements">
                  <div className="section-header">
                    <Target className="section-icon improve" />
                    <h3>Areas for Improvement</h3>
                  </div>
                  <ul className="feedback-list">
                    {limitedImprovements.length === 0 ? (
                      <li className="feedback-item">
                        <span className="bullet">•</span>
                        <p>No improvements captured in this basic report.</p>
                      </li>
                    ) : (
                      limitedImprovements.map((improvement, idx) => (
                        <li key={idx} className="feedback-item">
                          <span className="bullet">→</span>
                          <p>{improvement}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div className="feedback-card recommendation-card">
                <div className="card-header">
                  <AlertCircle size={28} className="header-icon" />
                  <h2>Unlock the full report</h2>
                </div>
                <p className="recommendation-text">
                  Detailed category scores, recommendations, transcripts, and downloads are available on paid plans.
                </p>
              </div>

              <div className="feedback-actions">
                <button
                  onClick={() => navigate("/interview")}
                  className="action-btn primary"
                >
                  Practice Again
                </button>
                <button
                  onClick={() => navigate("/pricing")}
                  className="action-btn primary"
                >
                  Upgrade for detailed feedback
                </button>
                <button onClick={() => navigate("/")} className="action-btn secondary">
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <div className="feedback-cards">
              {/* Overall Score & Tips */}
              <div className="overall-grid">
                <div className="feedback-card overall-card">
                  <div className="card-header">
                    <Award size={28} className="header-icon" />
                    <h2>Overall Performance</h2>
                  </div>
                  <div className="overall-content">
                    <div className="overall-score">
                      <div className="score-circle">
                        <span className="score-value">{feedback.overallScore}</span>
                        <span className="score-max">/10</span>
                      </div>
                      <div className="score-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={20}
                            className={
                              i < Math.round(feedback.overallScore / 2)
                                ? "star-filled"
                                : "star-empty"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="summary-text">{feedback.summary}</p>
                  </div>
                </div>

                {showTips && (
                  <div className="feedback-card tips-card">
                    <div className="card-header">
                      <TrendingUp size={24} className="header-icon" />
                      <h2>Quick Win Tips</h2>
                    </div>
                    <p className="tips-subtitle">AI-crafted takeaways from your interview</p>
                    <ul className="tips-list">
                      {tips.map((tip, idx) => (
                        <li key={idx} className="tip-item">
                          <span className="tip-bullet">{idx + 1}.</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Category Scores */}
              <div className="scores-grid">
                <div className="category-card">
                  <div className="category-header">
                    <div
                      className="category-icon communication"
                      style={{ backgroundColor: getScoreColor(feedback.communication?.score) }}
                    >
                      📢
                    </div>
                    <div className="category-info">
                      <h3>Communication</h3>
                      <p className="category-score">{feedback.communication?.score}/10</p>
                    </div>
                  </div>
                  <p className="category-feedback">{feedback.communication?.feedback}</p>
                </div>

                <div className="category-card">
                  <div className="category-header">
                    <div
                      className="category-icon technical"
                      style={{ backgroundColor: getScoreColor(feedback.technicalKnowledge?.score) }}
                    >
                      🧠
                    </div>
                    <div className="category-info">
                      <h3>Technical Knowledge</h3>
                      <p className="category-score">{feedback.technicalKnowledge?.score}/10</p>
                    </div>
                  </div>
                  <p className="category-feedback">{feedback.technicalKnowledge?.feedback}</p>
                </div>

                <div className="category-card">
                  <div className="category-header">
                    <div
                      className="category-icon problem-solving"
                      style={{ backgroundColor: getScoreColor(feedback.problemSolving?.score) }}
                    >
                      ⚡
                    </div>
                    <div className="category-info">
                      <h3>Problem Solving</h3>
                      <p className="category-score">{feedback.problemSolving?.score}/10</p>
                    </div>
                  </div>
                  <p className="category-feedback">{feedback.problemSolving?.feedback}</p>
                </div>

                <div className="category-card">
                  <div className="category-header">
                    <div
                      className="category-icon professionalism"
                      style={{ backgroundColor: getScoreColor(feedback.professionalism?.score) }}
                    >
                      🎯
                    </div>
                    <div className="category-info">
                      <h3>Professionalism</h3>
                      <p className="category-score">{feedback.professionalism?.score}/10</p>
                    </div>
                  </div>
                  <p className="category-feedback">{feedback.professionalism?.feedback}</p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="strengths-improvements">
                <div className="feedback-section strengths">
                  <div className="section-header">
                    <CheckCircle className="section-icon success" />
                    <h3>Your Strengths</h3>
                  </div>
                  <ul className="feedback-list">
                    {feedback.strengths?.map((strength, idx) => (
                      <li key={idx} className="feedback-item">
                        <span className="bullet">✓</span>
                        <p>{strength}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="feedback-section improvements">
                  <div className="section-header">
                    <Target className="section-icon improve" />
                    <h3>Areas for Improvement</h3>
                  </div>
                  <ul className="feedback-list">
                    {feedback.improvements?.map((improvement, idx) => (
                      <li key={idx} className="feedback-item">
                        <span className="bullet">→</span>
                        <p>{improvement}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendation */}
              <div className="feedback-card recommendation-card">
                <div className="card-header">
                  <TrendingUp size={28} className="header-icon" />
                  <h2>Next Steps</h2>
                </div>
                <p className="recommendation-text">{feedback.recommendation}</p>
              </div>

              {/* Chat History */}
              {(conversation || chatFeedback) && (
                <div className="feedback-card chat-history-card">
                  <div className="card-header">
                    <MessageCircle size={28} className="header-icon" />
                    <h2>Interview Transcript</h2>
                  </div>
                  <div className="chat-history-section">
                    {conversation && conversation.length > 0 ? (
                      <div className="chat-messages">
                        {conversation.map((msg, idx) => (
                          <div key={idx} className={`chat-message ${msg.type}`}>
                            <div className="message-header">
                              <span className="message-role">
                                {msg.type === 'user' ? '👤 You' : '🤖 Interviewer'}
                              </span>
                              <span className="message-number">#{idx + 1}</span>
                            </div>
                            <p className="message-text">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-history">No conversation history available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="feedback-actions">
                <button
                  onClick={() => navigate("/interview")}
                  className="action-btn primary"
                >
                  Practice Again
                </button>
                <button onClick={() => navigate("/")} className="action-btn secondary">
                  Back to Home
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default InterviewFeedback;
