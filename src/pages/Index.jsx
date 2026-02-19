import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bot,
  MessageSquare,
  MessageSquareText,
  Users,
  ArrowRight,
  UserPlus,
  LogIn,
  History,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./Index.css";
import { motion } from "framer-motion";
import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Robot3D from "@/components/Robot3D";

const CARD_WIDTH = "420px";
const CARD_HEIGHT = "520px";

const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateY = useTransform(scrollYProgress, [0, 1], [-25, 25]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 400]);

  return (
    <div ref={ref} className="index-hero-shell">
      <div className="index-hero-visual">
        <div className="index-hero-orbit" />
        <motion.div></motion.div>

        <div className="robot-container">
          <Robot3D />
        </div>
      </div>

      <div className="index-hero-copy">
        <motion.h1
          className="index-hero-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Interview & Debate with AI
        </motion.h1>
        <motion.p
          className="index-hero-lead"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Practice your interview skills or engage in thought-provoking debates
          with our advanced AI.
        </motion.p>
        <motion.p
          className="index-hero-lead"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Get instant feedback and improve your communication abilities.
        </motion.p>
        {!isAuthenticated && (
          <div className="index-hero-cta">
            <Link to="/register" className="index-cta-primary">
              <span className="index-cta-icon">👤</span>
              Get Started
            </Link>
            <Link to="/login" className="index-cta-secondary">
              <ArrowRight className="index-cta-arrow" />
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
const ModesSection = () => (
  <div className="index-modes-section" id="modes-section">
    <div className="index-modes-header">
      <div className="index-modes-badge">New • Unlock full access</div>
      <h2 className="index-modes-title">Two Modes to Enhance Your Skills</h2>
    </div>
    <div className="index-modes-grid">
      {/* Interview Mode Card */}
      <Card className="index-mode-card interview-card">
        <div className="index-mode-card-glow" />
        <CardContent className="index-mode-card-content">
          <div className="index-mode-icon-wrapper">
            <div className="index-mode-icon interview">
              <MessageSquare size={36} strokeWidth={2} />
            </div>
          </div>
          <h3 className="index-mode-title">Interview Mode</h3>
          <p className="index-mode-description">
            Experience realistic interview scenarios with personalized questions
            and instant feedback. Perfect for job preparation and skill
            development.
          </p>
          <ul className="index-mode-features">
            <li>
              <span className="index-mode-feature-bullet" />
              Real-time AI feedback
            </li>
            <li>
              <span className="index-mode-feature-bullet" />
              Adaptive questioning
            </li>
            <li>
              <span className="index-mode-feature-bullet" />
              Professional scenarios
            </li>
          </ul>
          <Link to="/interview">
            <button className="index-mode-button primary">
              Start Interview <ArrowRight />
            </button>
          </Link>
        </CardContent>
      </Card>

      {/* Debate Mode Card */}
      <Card className="index-mode-card debate-card">
        <div className="index-mode-card-glow" />
        <CardContent className="index-mode-card-content">
          <div className="index-mode-icon-wrapper">
            <div className="index-mode-icon debate">
              <Users size={36} strokeWidth={2} />
            </div>
          </div>
          <h3 className="index-mode-title">Debate Mode</h3>
          <p className="index-mode-description">
            Challenge your argumentation skills in structured debates with AI
            opponents on various topics.
          </p>
          <ul className="index-mode-features">
            <li>
              <span className="index-mode-feature-bullet" />
              Multiple debate formats
            </li>
            <li>
              <span className="index-mode-feature-bullet" />
              Critical thinking training
            </li>
            <li>
              <span className="index-mode-feature-bullet" />
              Argument analysis
            </li>
          </ul>
          <button className="index-mode-button secondary" disabled>
            Coming Soon
          </button>
        </CardContent>
      </Card>
    </div>
  </div>
);

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="index-main-container">
      {/* Background decorative elements */}
      <div className="index-bg-decorations">
        <div className="index-bg-circle-1" />
        <div className="index-bg-circle-2" />
      </div>
      {/* Navbar */}
      <Navbar />
      <div className="index-main-content">
        {/* Hero Section */}
        <HeroSection />

        {/* Modes Section */}
        <ModesSection />

        {/* Chat History Section - Only for authenticated users */}
        {isAuthenticated && (
          <div className="index-chat-history">
            <h3 className="index-chat-history-title">Your Interview History</h3>
            <div>
              <Card className="index-chat-history-card">
                <CardContent className="index-chat-history-content">
                  <History className="index-chat-history-icon" />
                  <h4 className="index-chat-history-subtitle">
                    Track Your Progress
                  </h4>
                  <p className="index-chat-history-description">
                    Review your previous interviews, track your improvement, and
                    continue where you left off.
                  </p>
                  <Link to="/history">
                    <button className="index-chat-history-button">
                      View Chat History
                      <ArrowRight />
                    </button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Features Section - Centered */}
        <div className="index-features">
          <h3 className="index-features-title">Why Choose AceAi?</h3>
          <div className="index-features-grid">
            <div className="index-feature-card">
              <Bot className="index-feature-icon primary" />
              <h4 className="index-feature-title primary">Advanced AI</h4>
              <p className="index-feature-description">
                Powered by cutting-edge language models for realistic
                conversations
              </p>
            </div>
            <div className="index-feature-card">
              <MessageSquareText className="index-feature-icon success" />
              <h4 className="index-feature-title accent">Instant Feedback</h4>
              <p className="index-feature-description">
                Get immediate, constructive feedback to improve your skills
              </p>
            </div>
            <div className="index-feature-card">
              <MessageSquare className="index-feature-icon success" />
              <h4 className="index-feature-title success">Personalized</h4>
              <p className="index-feature-description">
                Adaptive scenarios tailored to your experience level
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="index-footer">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
