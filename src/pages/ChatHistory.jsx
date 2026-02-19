import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  MessageSquare, 
  Timer, 
  Calendar, 
  Search, 
  Trash2, 
  Eye, 
  Play,
  Loader2,
  History,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import "./ChatHistory.css";

const ChatHistory = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [deletingChat, setDeletingChat] = useState(null);
  
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    // Starter package: do not load or show history
    if (user?.plan === 'STARTER') {
      setChats([]);
      setLoading(false);
      return;
    }

    loadChats();
  }, [isAuthenticated, user]);

  const loadChats = async () => {
    if (!isAuthenticated || user?.plan === 'STARTER') return;

    setLoading(true);
    try {
      console.log('Loading chats...');
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Current user:', user);
      console.log('User ID from token:', user?._id);
      console.log('Is authenticated:', isAuthenticated);
      
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Failed to load chats: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Chats data:', data);
      setChats(data.data.chats);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: `Failed to load chat history: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    if (!isAuthenticated) return;

    setDeletingChat(chatId);
    try {
      const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      setChats(chats.filter(chat => chat.id !== chatId));
      toast({
        title: "Success",
        description: "Chat deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat.",
        variant: "destructive",
      });
    } finally {
      setDeletingChat(null);
    }
  };

  const filteredAndSortedChats = chats
    .filter(chat => {
      const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           chat.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || chat.difficulty === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(b.lastActivity) - new Date(a.lastActivity);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "messages":
          comparison = b.messageCount - a.messageCount;
          break;
        case "duration":
          comparison = b.duration - a.duration;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "desc" ? comparison : -comparison;
    });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'ch-badge--beginner';
      case 'intermediate':
        return 'ch-badge--intermediate';
      case 'advanced':
        return 'ch-badge--advanced';
      default:
        return 'ch-badge--default';
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (!isAuthenticated) {
    return (
      <div className="chat-history-main-container">
        <div className="about-background">
          <div className="about-bg-element about-bg-1"></div>
          <div className="about-bg-element about-bg-2"></div>
          <div className="about-bg-element about-bg-3"></div>
        </div>
        <div className="ch-container ch-center">
          <div className="ch-card ch-auth">
            <div className="ch-auth__content">
              <History className="ch-icon ch-icon--xl ch-icon--muted" />
              <h2 className="ch-auth__title">Authentication Required</h2>
              <p className="ch-auth__subtitle">Please log in to view your chat history.</p>
              <Link to="/login">
                <button className="ch-btn primary">Go to Login</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-history-main-container">
      <div className="about-background">
        <div className="about-bg-element about-bg-1"></div>
        <div className="about-bg-element about-bg-2"></div>
        <div className="about-bg-element about-bg-3"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      <div className="ch-container">
        {/* Header */}
        <div className="ch-header">
          <div className="ch-header__left">
            <Link to="/" className="ch-back">
              <ArrowLeft className="ch-icon" />
              <span>Back to Home</span>
            </Link>
            <div className="ch-header__content">
              <h1 className="chat-history-title">Chat History</h1>
              <p className="ch-subtitle">View and manage your previous interviews</p>
            </div>
          </div>
          <Link to="/interview">
            <button className="ch-btn primary">
              <Play className="ch-icon" />
              <span>New Interview</span>
            </button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="ch-card ch-filters">
          <div className="ch-filters__grid">
            {/* Search */}
            <div className="ch-search">
              <Search className="ch-icon ch-search__icon" />
              <input
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ch-input"
              />
            </div>
            {/* Filter by difficulty */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="ch-select"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ch-select"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="messages">Sort by Messages</option>
              <option value="duration">Sort by Duration</option>
            </select>
            {/* Sort order */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="ch-btn outline"
            >
              {sortOrder === "desc" ? <SortDesc className="ch-icon" /> : <SortAsc className="ch-icon" />}
              <span>{sortOrder === "desc" ? "Descending" : "Ascending"}</span>
            </button>
          </div>
        </div>

        {/* Chat List */}
        {loading ? (
          <div className="ch-loading">
            <Loader2 className="ch-icon ch-icon--lg ch-icon--spin" />
            <span>Loading your chat history...</span>
          </div>
        ) : filteredAndSortedChats.length === 0 ? (
          <div className="ch-card ch-empty">
            <History className="ch-icon ch-icon--xl ch-icon--muted" />
            <h3>No chats found</h3>
            <p>
              {searchTerm || filterType !== "all"
                ? "No chats match your current filters."
                : "You haven't started any interviews yet."}
            </p>
            {searchTerm || filterType !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="ch-btn primary"
              >
                Clear Filters
              </button>
            ) : (
              <Link to="/interview">
                <button className="ch-btn primary">Start Your First Interview</button>
              </Link>
            )}
          </div>
        ) : (
          <div className="ch-grid">
            {filteredAndSortedChats.map((chat) => (
              <div key={chat.id} className="ch-card ch-chat-card">
                <div className="ch-chat-card__body">
                  <div className="ch-chat-card__header">
                    <h3 className="ch-chat-title">{chat.title}</h3>
                    <span className={`ch-badge ${getDifficultyColor(chat.difficulty)}`}>
                      {chat.difficulty}
                    </span>
                  </div>
                  <p className="ch-chat-desc">{chat.description}</p>
                  
                  {/* Feedback Score Display */}
                  {chat.feedback && chat.feedback.overallScore && (
                    <div className="ch-feedback-summary">
                      <div className="ch-score-badge">
                        <span className="ch-score-label">Score:</span>
                        <span className="ch-score-value">{chat.feedback.overallScore}/10</span>
                      </div>
                      <p className="ch-feedback-summary-text">{chat.feedback.summary}</p>
                    </div>
                  )}
                  
                  <div className="ch-chat-meta">
                    <span className="ch-meta"><MessageSquare className="ch-icon ch-icon--sm" /> {chat.messageCount} messages</span>
                    <span className="ch-meta"><Timer className="ch-icon ch-icon--sm" /> {formatDuration(chat.duration)}</span>
                    <span className="ch-meta"><Calendar className="ch-icon ch-icon--sm" /> {new Date(chat.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="ch-actions">
                  {chat.feedback && chat.feedback.overallScore ? (
                    <button
                      type="button"
                      className="ch-btn outline ch-btn--blue ch-btn--sm"
                      onClick={() => navigate(`/feedback`, { state: { chatFeedback: chat.feedback } })}
                    >
                      <Eye className="ch-icon ch-icon--sm" />
                      <span>View Feedback</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="ch-btn outline ch-btn--blue ch-btn--sm"
                      disabled
                    >
                      <Eye className="ch-icon ch-icon--sm" />
                      <span>No Feedback</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="ch-btn outline ch-btn--green ch-btn--sm"
                    onClick={() => navigate(`/interview/${chat.id}`)}
                  >
                    <Play className="ch-icon ch-icon--sm" />
                    <span>Continue</span>
                  </button>
                  <button
                    type="button"
                    className="ch-btn outline ch-btn--red ch-btn--icon ch-btn--sm"
                    onClick={() => deleteChat(chat.id)}
                    disabled={deletingChat === chat.id}
                    aria-label="Delete chat"
                    title="Delete chat"
                  >
                    {deletingChat === chat.id ? (
                      <Loader2 className="ch-icon ch-icon--sm ch-icon--spin" />
                    ) : (
                      <Trash2 className="ch-icon ch-icon--sm" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {chats.length > 0 && (
          <div className="ch-card ch-stats">
            <div className="ch-stats__header">
              <h3 className="ch-stats__title">Your Interview Statistics</h3>
            </div>
            <div className="ch-stats-grid">
              <div className="ch-stat">
                <div className="ch-stat__value">{chats.length}</div>
                <div className="ch-stat__label">Total Interviews</div>
              </div>
              <div className="ch-stat">
                <div className="ch-stat__value">{chats.reduce((sum, chat) => sum + chat.messageCount, 0)}</div>
                <div className="ch-stat__label">Total Messages</div>
              </div>
              <div className="ch-stat">
                <div className="ch-stat__value">{formatDuration(chats.reduce((sum, chat) => sum + chat.duration, 0))}</div>
                <div className="ch-stat__label">Total Time</div>
              </div>
              <div className="ch-stat">
                <div className="ch-stat__value">{Math.round(chats.reduce((sum, chat) => sum + (chat.score || 0), 0) / chats.length)}%</div>
                <div className="ch-stat__label">Average Score</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
