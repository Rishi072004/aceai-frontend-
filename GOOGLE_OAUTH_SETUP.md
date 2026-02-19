# Google OAuth Setup Guide

## Why Google Auth0 was closing automatically:

1. **Missing Dependencies**: The `@auth0/auth0-react` package wasn't installed
2. **Conflicting Authentication Systems**: Auth0 and custom AuthContext were conflicting
3. **Incorrect Configuration**: Environment variables weren't properly set up
4. **Popup Blocking**: Browser security policies were blocking the popup

## Solution: Direct Google OAuth Integration

We've replaced the problematic Auth0 setup with a direct Google OAuth integration that works with your existing backend.

## Setup Steps:

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized origins:
   - `http://localhost:3000` (for development)
   - `http://localhost:5173` (Vite default)
   - Your production domain
7. Copy the Client ID

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
VITE_API_URL=http://localhost:5000
```

### 3. Backend Configuration

Your backend already has Google OAuth support! Just make sure to set:

```env
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

### 4. Test the Integration

1. Start your backend: `cd Backend && npm start`
2. Start your frontend: `cd interview-bot-ai-main && npm run dev`
3. Go to `/login` and click the Google button
4. The popup should now work properly!

## How It Works Now:

1. **Frontend**: Uses Google's official OAuth library
2. **Backend**: Verifies Google ID tokens and creates/authenticates users
3. **Integration**: Seamlessly works with your existing AuthContext
4. **Security**: Proper token verification and user management

## Troubleshooting:

- **Popup still closes**: Check browser console for errors
- **"Client ID not configured"**: Make sure `.env` file exists and has correct values
- **Backend errors**: Verify `GOOGLE_CLIENT_ID` is set in backend environment
- **CORS issues**: Check that your frontend origin is in Google OAuth authorized origins

## Benefits of This Approach:

✅ **No more popup closing issues**  
✅ **Faster authentication**  
✅ **Better user experience**  
✅ **Direct integration with your backend**  
✅ **No third-party service dependencies**  
✅ **Full control over the authentication flow**
