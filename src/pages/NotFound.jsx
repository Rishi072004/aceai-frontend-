import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background animate-fade-in">
      <div className="text-center animate-scale-in">
        <h1 className="text-4xl font-bold mb-4 text-foreground hover:text-primary transition-colors duration-300 cursor-default">
          404
        </h1>
        <p className="text-xl text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Oops! Page not found
        </p>
        <a 
          href="/" 
          className="text-primary hover:text-accent underline transition-all duration-300 hover:scale-105 inline-block animate-fade-in" 
          style={{ animationDelay: '0.4s' }}
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;