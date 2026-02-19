# AceAi Frontend - AI Interview Platform

React-based frontend for AceAi, an intelligent interview preparation platform with AI-powered questions, voice interviews, resume analysis, and real-time feedback.

## 🚀 Features

### Interview Modes
- **Friendly Mode** - Warm, encouraging interview style for beginners
- **Moderate Mode** - Professional, balanced interview experience
- **Strict Mode** - Challenging, expert-level technical assessment

### Core Features
- **🎤 Voice Interview** - Real-time voice transcription and text-to-speech
- **📄 Resume Upload** - Upload PDF/DOC/DOCX for AI-powered analysis
- **🧠 Smart Questions** - AI generates questions based on resume skills
- **⚡ Batch Prefetch** - Pre-generate 3 questions for reduced latency
- **💬 Real-time Feedback** - Instant AI feedback after each answer
- **📊 Interview History** - Review past interview sessions
- **💳 Plan Management** - STARTER (20 questions) / VALUE (35 questions)
- **🔐 Authentication** - Email/password + Google OAuth login

### Technical Highlights
- **Shadcn/UI** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Context API** - Global state management
- **Vite** - Lightning-fast build tool

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + Shadcn/UI
- **Routing:** React Router v6
- **State Management:** React Context API
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Radix UI primitives
- **Icons:** Lucide React
- **Animations:** Framer Motion (optional)
- **Payment:** Razorpay integration

## 📋 Prerequisites

- Node.js 18+ and npm
- Backend server running (see Backend README)
- Google OAuth credentials (optional)

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Important:** All Vite environment variables must be prefixed with `VITE_`

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <frontend-repo-url>
   cd interview-bot-ai-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file with above variables
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`

## 🚀 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📁 Project Structure

```
interview-bot-ai-main/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Shadcn UI components
│   │   ├── Navbar.jsx       # Navigation bar
│   │   ├── Footer.jsx       # Footer component
│   │   ├── ResumeUpload.jsx # Resume upload & selection
│   │   └── FeedbackModal.jsx # Feedback collection
│   ├── pages/               # Route pages
│   │   ├── Home.jsx         # Landing page
│   │   ├── Interview.jsx    # Main interview room (3200+ lines!)
│   │   ├── Feedback.jsx     # Interview feedback page
│   │   ├── ChatHistory.jsx  # Past interviews
│   │   ├── Pricing.jsx      # Plan pricing & payment
│   │   ├── Login.jsx        # Login page
│   │   └── Register.jsx     # Registration page
│   ├── contexts/
│   │   └── AuthContext.jsx  # Authentication state
│   ├── services/
│   │   ├── voiceInterviewService.js     # Voice interview logic
│   │   └── voiceStreamingService.js     # WebSocket streaming
│   ├── lib/
│   │   └── utils.js         # Utility functions
│   ├── App.jsx              # Root component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── .env                    # Environment variables (NEVER COMMIT!)
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
└── tailwind.config.js     # Tailwind configuration
```

## 🔌 Backend Integration

The frontend communicates with the backend via REST APIs. All API calls use the `VITE_API_URL` environment variable:

```javascript
// Example API call
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

const response = await fetch(`${API_BASE_URL}/api/ai/interview`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
});
```

## 🎯 Key Features Explained

### Batch Question Prefetch
The system requests 3 questions at once and queues them to reduce latency:

```javascript
// Interview.jsx - Batch request
const result = await getAIResponse(userAnswer, 3);  // batchCount=3

// Queue management
if (result.responses?.length > 1) {
  setQuestionQueue(result.responses.slice(1));  // Queue remaining questions
}
```

### Resume-Based Questions
1. User uploads resume (PDF/DOC/DOCX)
2. Backend analyzes and extracts skills, projects, experience
3. AI generates questions prioritizing core resume skills
4. Questions reference specific projects from resume

### Plan Limits (Enforced by Backend)
- **STARTER**: 20 questions max, 30 minutes max, job-focused only
- **VALUE**: 35 questions max, 50 minutes max, resume-based questions

Frontend displays warnings at:
- 5 questions remaining (30 for VALUE)
- 2 questions remaining (33 for VALUE)
- 5 minutes remaining (45 min for VALUE)
- 2 minutes remaining (48 min for VALUE)

## 🎨 Styling

### Tailwind CSS
Utility-first CSS framework for rapid UI development:

```jsx
<button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
  Start Interview
</button>
```

### Shadcn/UI Components
Pre-built, customizable components:

```jsx
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
```

### Custom Theme
Theme configuration in [tailwind.config.js](tailwind.config.js):
- Colors, typography, spacing
- Dark mode support (if enabled)

## 🔐 Authentication Flow

1. User registers or logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. AuthContext provides token to all components
5. Token sent in `Authorization` header for all API requests

```javascript
// AuthContext.jsx
const { token, user, login, logout } = useAuth();
```

## 🚀 Deployment

### Cloudflare Pages (Recommended)
1. Push code to GitHub
2. Connect repo to Cloudflare Pages
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables in Cloudflare dashboard
6. Deploy!

### Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Framework preset: Vite
4. Add environment variables
5. Deploy

### Netlify
1. Push code to GitHub  
2. New site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy

### Important: Update Backend CORS
After deployment, update `FRONTEND_URL` in backend `.env` to match your deployed domain!

## ⚠️ IMPORTANT: Never Commit

The `.gitignore` file blocks:
- ❌ `.env` file with API keys
- ❌ `node_modules/`
- ❌ `dist/` build output
- ❌ Editor config files

**Always double-check before pushing!**

## 🐛 Debugging

### Enable Debug Console Logs
The app includes extensive console logging in development:

```javascript
// See batch question logs
🔍 [BATCH DEBUG] Question Request Check
✅ [BATCH] Received Question Batch Successfully!
📊 [VALUE] Question count: 5/35

// See API requests
🌐 [AI] Sending request to: http://localhost:5000/api/ai/interview
📊 Request Parameters: { batchCount: 3, mode: "moderate" }
```

### Common Issues

**Backend not connecting:**
- Check `VITE_API_URL` in `.env`
- Ensure backend is running on correct port
- Check browser console for CORS errors

**Voice not working:**
- Check microphone permissions
- Verify Deepgram API key in backend
- Check browser console for errors

**Payment not working:**
- Verify Razorpay keys in backend
- Check Razorpay dashboard for test mode
- Ensure HTTPS in production

## 🧪 Testing

```bash
# Run tests (if configured)
npm run test

# Lint code
npm run lint
```

## 📦 Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

Output in `dist/` directory ready for deployment.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

MIT License

## 🔗 Related Repositories

- **Backend Repository:** [Link to backend repo]
- **Documentation:** [Link to docs]

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: support@aceai.com

---

Built with ❤️ for AceAi Interview Platform
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a4c1ebcf-3e87-4253-ac5b-359bc481a2aa) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
#   a c e a i - f r o n t e n d -  
 