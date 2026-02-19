import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageSquare, Users, ArrowRight, LogIn, UserPlus, LogOut, User, History, Star, Zap, Shield, Target, Award, BookOpen, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeedbackModal from "@/components/FeedbackModal";
import { useState, useEffect } from "react";
import "./About.css";

const About = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="about-container">
      {/* Background decorative elements */}
      <div className="about-background">
        <div className="about-bg-element about-bg-1"></div>
        <div className="about-bg-element about-bg-2"></div>
        <div className="about-bg-element about-bg-3"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Sidebar Navigation */}
      <div className="about-sidebar">
        <div className="about-sidebar-content">
          <div className="about-sidebar-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <span>About</span>
            <div>
              <FeedbackModal />
            </div>
          </div>
          <button 
            className="about-sidebar-link active"
            onClick={() => scrollToSection('hero')}
          >
            About
          </button>
          <button 
            className="about-sidebar-link"
            onClick={() => scrollToSection('mission')}
          >
            Our Mission
          </button>
          <button 
            className="about-sidebar-link"
            onClick={() => scrollToSection('features')}
          >
            Why Choose Us
          </button>
          <button 
            className="about-sidebar-link"
            onClick={() => scrollToSection('how-it-works')}
          >
            How It Works
          </button>
          <button 
            className="about-sidebar-link"
            onClick={() => scrollToSection('cta')}
          >
            Get Started
          </button>
        </div>
      </div>

      <div className="about-main">
        {/* Hero Section */}
        <section id="hero" className="about-hero">
          <div className="about-hero-content">

            <h1 className="about-hero-title">AceAi: AI for better conversations</h1>
            <p className="about-hero-subtitle">
              Launching now: AI Interview. In pilot: AI Debate.
            </p>
            <p className="about-hero-description">
              We build focused, high-impact AI experiences that help you perform under pressure. Today,
              you can master interviews with realistic AI practice and actionable feedback. Debate is in
              "coming soon"—we’re testing it quietly so it’s great on day one. Start with Interview, stay
              tuned for Debate.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="about-mission">
          <div className="about-section-content">
                         <h2 className="about-section-title">Our Mission</h2>
             <div className="about-mission-grid">
               <div className="about-mission-card">
                 <Target className="about-mission-icon" />
                 <h3>Launch with purpose</h3>
                 <p>Ship one great AI Interview experience that genuinely helps you get hired, then expand carefully.</p>
               </div>
               <div className="about-mission-card">
                 <Zap className="about-mission-icon" />
                 <h3>Boost your confidence</h3>
                 <p>Offer realistic practice, tight feedback, and clear next steps so you walk into interviews ready.</p>
               </div>
               <div className="about-mission-card">
                 <Shield className="about-mission-icon" />
                 <h3>Grow with you</h3>
                 <p>Keep improving Interview and bring Debate when it’s polished—one platform, multiple conversation skills.</p>
               </div>
             </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="about-features">
          <div className="about-section-content">
                         <h2 className="about-section-title">Why choose AceAi right now?</h2>
             <div className="about-features-grid">
               <div className="about-feature-card">
                 <div className="about-feature-icon">
                   <Bot className="about-feature-bot" />
                 </div>
                 <h3>Realistic Interview Practice</h3>
                 <p>Practice with AI interviewers that simulate real job interviews from top companies like Google, Amazon, and Microsoft.</p>
               </div>
               <div className="about-feature-card">
                 <div className="about-feature-icon">
                   <MessageSquare className="about-feature-message" />
                 </div>
                 <h3>Industry-Specific Questions</h3>
                  <p>Get targeted interview questions tuned to your role, seniority, and domain to prepare effectively.</p>
               </div>
               <div className="about-feature-card">
                 <div className="about-feature-icon">
                   <Clock className="about-feature-clock" />
                 </div>
                 <h3>Practice Anytime, Anywhere</h3>
                 <p>No more scheduling conflicts - practice interviews 24/7 to build confidence before your real job interviews.</p>
               </div>
               <div className="about-feature-card">
                 <div className="about-feature-icon">
                   <TrendingUp className="about-feature-trend" />
                 </div>
                 <h3>Track Your Job Readiness</h3>
                 <p>Monitor your interview performance and see exactly where you need to improve to increase your hiring chances.</p>
               </div>
                <div className="about-feature-card soon">
                  <div className="about-feature-icon">
                    <Users className="about-feature-message" />
                  </div>
                  <h3>AI Debate (Coming Soon)</h3>
                  <p>Challenge your thinking with structured AI debates. It’s in pilot; Interview users will be first in line when it launches.</p>
                </div>
               <div className="about-feature-card">
                 <div className="about-feature-icon">
                   <BookOpen className="about-feature-book" />
                 </div>
                 <h3>Career Guidance & Tips</h3>
                 <p>Access proven interview strategies, salary negotiation tips, and career advice from industry experts.</p>
               </div>
               <div className="about-feature-card">
                 <div className="about-feature-icon">
                   <Award className="about-feature-award" />
                 </div>
                 <h3>Proven Success Rate</h3>
                 <p>Join thousands of users who have successfully landed jobs at Fortune 500 companies using our platform.</p>
               </div>
             </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="about-how-it-works">
          <div className="about-section-content">
            <h2 className="about-section-title">How It Works (Interview first)</h2>
            <div className="about-steps">
                             <div className="about-step">
                 <div className="about-step-number">1</div>
                 <div className="about-step-content">
                   <h3>Select your target job</h3>
                   <p>Pick your role, level, and domain so we can tailor interview questions and scenarios.</p>
                 </div>
               </div>
               <div className="about-step">
                 <div className="about-step-number">2</div>
                 <div className="about-step-content">
                   <h3>Practice real interviews</h3>
                   <p>Run realistic interview sessions with AI that adapts to your answers and pacing.</p>
                 </div>
               </div>
               <div className="about-step">
                 <div className="about-step-number">3</div>
                 <div className="about-step-content">
                   <h3>Get targeted feedback</h3>
                   <p>See what to improve and why—concise notes you can act on before your next round.</p>
                 </div>
               </div>
               <div className="about-step">
                 <div className="about-step-number">4</div>
                 <div className="about-step-content">
                   <h3>Land your role</h3>
                   <p>Track progress, build confidence, and walk into real interviews ready. Debate arrives later for broader communication mastery.</p>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        {/* <section className="about-testimonials">
          <div className="about-section-content">
                         <h2 className="about-section-title">Success Stories - Real Jobs Landed</h2>
             <div className="about-testimonials-grid">
               <div className="about-testimonial-card">
                 <div className="about-testimonial-stars">
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                 </div>
                 <p>"AceAi helped me land my dream job at Google! The realistic interview practice gave me the confidence I needed to ace the real thing."</p>
                 <div className="about-testimonial-author">- Sarah M., Software Engineer at Google</div>
               </div>
               <div className="about-testimonial-card">
                 <div className="about-testimonial-stars">
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                 </div>
                 <p>"After 6 months of job searching, I used AceAi for 2 weeks and got hired at Amazon. The industry-specific questions were game-changing!"</p>
                 <div className="about-testimonial-author">- Michael T., Product Manager at Amazon</div>
               </div>
               <div className="about-testimonial-card">
                 <div className="about-testimonial-stars">
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                   <Star className="about-star" />
                 </div>
                 <p>"The salary negotiation tips and interview feedback helped me get a 40% pay increase at my new job. Worth every penny!"</p>
                 <div className="about-testimonial-author">- Emily R., Senior Marketing Manager at Microsoft</div>
               </div>
             </div>
          </div>
        </section> */}

        {/* CTA Section */}
        <section id="cta" className="about-cta">
          <div className="about-cta-content">
                         <h2 className="about-cta-title">Start with AI Interview today</h2>
             <p className="about-cta-description">
               Join candidates leveling up with AI Interview now. You’ll get first access to AI Debate when it rolls out.
             </p>
            <div className="about-cta-buttons">
              {!isAuthenticated ? (
                <>
                  <Link to="/register">
                    <Button size="lg" className="about-cta-btn primary">
                      <UserPlus className="about-btn-icon" />
                      Get Started Free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="about-cta-btn">
                      <LogIn className="about-btn-icon" />
                      Sign In
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/interview">
                  <Button size="lg" className="about-cta-btn primary">
                    <MessageSquare className="about-btn-icon" />
                    Start Interview
                    <ArrowRight className="about-btn-icon" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;
