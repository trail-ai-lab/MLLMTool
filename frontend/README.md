# SLAI Frontend

Frontend application for **SLAI: Bridging Science and Language with AI** - A modern Next.js web application that provides an intuitive interface for AI-powered scientific content analysis, transcription, and summarization.

## 🚀 Features

- **Dashboard Interface**: Clean, modern dashboard for managing scientific content
- **Audio Playback**: Built-in audio player for transcription review
- **Real-time Chat**: Interactive chat interface for AI-powered assistance
- **Transcript Management**: View, edit, and organize transcriptions
- **Source Management**: Add and organize various content sources (PDFs, audio files, etc.)
- **Summary Generation**: AI-powered content summarization
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **Firebase Authentication**: Secure user authentication and session management

## 📋 Prerequisites

Before setting up the frontend, ensure you have:

- **Node.js** (v18 or later) - [Download](https://nodejs.org/)
- **pnpm** (recommended) or npm
  - Install pnpm: `npm install -g pnpm`
- **Firebase project** configured for authentication

## 🛠 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd MLLMTool/frontend
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```
   
   Or with npm:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the frontend directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   
   # Backend API Configuration
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   ```

## 🚀 Running the Frontend

### Development Mode

Start the development server with hot-reloading:

```bash
pnpm dev
```

Or with npm:
```bash
npm run dev
```

The application will be available at:
- **Frontend URL**: `http://localhost:3000`

### Production Build

Build the application for production:

```bash
pnpm build
```

Start the production server:

```bash
pnpm start
```

## 🏗 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (protected)/       # Protected routes (require authentication)
│   │   └── dashboard/     # Main dashboard page
│   ├── (public)/         # Public routes (login, signup)
│   │   ├── login/        # Login page
│   │   └── signup/       # Signup page
│   ├── layout.tsx        # Root layout component
│   └── page.tsx          # Home page
├── components/            # Reusable React components
│   ├── dashboard/        # Dashboard-specific components
│   │   ├── audio-playback.tsx
│   │   ├── chat-view.tsx
│   │   ├── summary-view.tsx
│   │   └── transcript-view.tsx
│   ├── dialogs/          # Modal dialogs
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   ├── nav/              # Navigation components
│   └── ui/               # Base UI components (shadcn/ui)
├── lib/                  # Utility libraries
│   ├── api/              # API client functions
│   ├── contexts/         # React contexts
│   └── hooks/            # Custom React hooks
├── public/               # Static assets
├── styles/               # Global styles
├── types/                # TypeScript type definitions
├── components.json       # shadcn/ui configuration
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for consistent, accessible UI components built on top of:

- **Radix UI**: Unstyled, accessible components
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **Next Themes**: Theme switching functionality

### Adding New Components

To add a new shadcn/ui component:

```bash
npx shadcn@latest add <component-name>
```

Example:
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add form
```

## 🔧 Key Dependencies

### Core Framework
- **Next.js 15**: React framework with App Router
- **React 19**: JavaScript library for building user interfaces
- **TypeScript**: Type-safe JavaScript

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### State & Data
- **Firebase**: Authentication and real-time database
- **React Context**: State management for user auth and themes

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **PostCSS**: CSS processing

## 🔐 Authentication

The application uses Firebase Authentication with the following features:

- **Email/Password Authentication**: Standard login/signup
- **Protected Routes**: Automatic redirection for unauthenticated users
- **Session Management**: Persistent login sessions
- **User Context**: Global user state management

### Authentication Flow

1. Users access public routes (`/login`, `/signup`) without authentication
2. Protected routes (`/dashboard`) require valid authentication
3. Authentication state is managed via React Context
4. Firebase handles token management and session persistence

## 🎨 Theming

The application supports both light and dark themes:

- **Theme Toggle**: Available in the site header
- **System Preference**: Automatically detects user's system theme
- **Persistent**: Theme preference is saved locally

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop**: Full-featured dashboard experience
- **Tablet**: Adapted layout with collapsible sidebars
- **Mobile**: Touch-optimized interface with mobile navigation

## 🧪 Development

### Code Style

- Follow React and Next.js best practices
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow accessibility guidelines (WCAG)

### Component Guidelines

1. **Functional Components**: Use function components with hooks
2. **TypeScript**: Add proper type definitions
3. **Props Interface**: Define clear prop interfaces
4. **Error Handling**: Implement proper error states
5. **Loading States**: Show loading indicators for async operations

### API Integration

API calls are centralized in the `lib/api/` directory:

```typescript
// Example API call
import { apiClient } from '@/lib/api/client';

const transcribeAudio = async (audioFile: File) => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  return await apiClient.post('/transcribe', formData);
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Module not found errors**:
   ```bash
   rm -rf node_modules package-lock.json
   pnpm install
   ```

2. **Firebase configuration errors**:
   - Verify all environment variables are set correctly
   - Check Firebase project settings match your configuration

3. **Build errors**:
   ```bash
   pnpm build
   # Check for TypeScript errors and fix them
   ```

4. **Port already in use**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   # Or use a different port
   pnpm dev -- --port 3001
   ```

5. **Styling issues**:
   - Ensure Tailwind CSS is properly configured
   - Check that global styles are imported in `app/layout.tsx`
   - Restart the development server after style changes

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Static site deployment
- **AWS Amplify**: Full-stack deployment
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Follow the established code style and patterns
2. Add TypeScript types for all new code
3. Test components thoroughly before submitting
4. Update documentation for new features
5. Ensure responsive design works across devices

## 📄 License

This project is part of the SLAI research initiative at UW-Madison.
