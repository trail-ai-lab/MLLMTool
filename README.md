# SLAI: Bridging Science and Language with AI

**SLAI** is an advanced AI-powered platform designed to bridge the gap between scientific content and natural language understanding. The system provides intelligent transcription, summarization, and analysis capabilities for scientific audio, documents, and other research materials.

## 🌟 Overview

SLAI combines cutting-edge AI technologies to help researchers, students, and professionals:

- **Transcribe** scientific audio content with high accuracy
- **Summarize** complex research materials into digestible insights
- **Highlight** key information and concepts automatically
- **Organize** and manage various scientific content sources
- **Interact** with content through AI-powered chat interfaces

## 🏗 Architecture

The project consists of two main components:

### 🖥 Frontend
- **Technology**: Next.js 15 with React 19 and TypeScript
- **UI Framework**: shadcn/ui with Tailwind CSS
- **Authentication**: Firebase Auth
- **Features**: Responsive dashboard, audio playback, real-time chat, theme switching

### ⚙️ Backend
- **Technology**: FastAPI with Python 3.11+
- **AI/ML**: Sentence Transformers, PyTorch, NLTK
- **Authentication**: Firebase Admin SDK
- **Features**: RESTful API, AI pipelines, content processing

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18+) and **pnpm**
- **Python** (3.11+) and **Poetry**
- **Firebase** project for authentication
- **Google Cloud Storage** for file storage

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MLLMTool
```

### 2. Backend Setup

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```

The frontend application will be available at `http://localhost:3000`

## 📚 Documentation

Detailed setup and usage instructions are available in each component's README:

- **[Backend README](./backend/README.md)** - API setup, configuration, and development
- **[Frontend README](./frontend/README.md)** - UI setup, components, and deployment

## 🔧 Development

### Project Structure

```
MLLMTool/
├── backend/                 # FastAPI backend application
│   ├── app/                # Application code
│   │   ├── api/           # API routes and endpoints
│   │   ├── core/          # Core configuration
│   │   ├── pipelines/     # AI processing pipelines
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── pyproject.toml     # Python dependencies
│   └── README.md          # Backend documentation
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js App Router
│   ├── components/        # React components
│   ├── lib/               # Utility libraries
│   ├── package.json       # Node.js dependencies
│   └── README.md          # Frontend documentation
└── README.md              # This file
```

### Key Features

#### 🎵 Audio Processing
- High-quality transcription using advanced AI models
- Support for various audio formats
- Real-time processing with progress tracking

#### 📄 Document Analysis
- PDF and text document processing
- Intelligent content extraction and summarization
- Key concept identification and highlighting

#### 💬 Interactive Chat
- AI-powered conversational interface
- Context-aware responses based on processed content
- Multi-turn conversations with memory

#### 🔐 Security & Authentication
- Firebase-based user authentication
- Secure API endpoints with proper authorization
- Data privacy and user session management

## 🛠 Technology Stack

### Frontend Technologies
- **Next.js 15**: React framework with App Router
- **React 19**: Modern React with latest features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **Firebase**: Authentication and real-time features

### Backend Technologies
- **FastAPI**: Modern Python web framework
- **Uvicorn**: High-performance ASGI server
- **Sentence Transformers**: Text embeddings and similarity
- **PyTorch**: Deep learning framework
- **NLTK**: Natural language processing
- **Firebase Admin**: Server-side Firebase integration

### AI & ML Capabilities
- **Speech-to-Text**: Advanced audio transcription
- **Text Summarization**: Intelligent content summarization
- **Information Extraction**: Key concept identification
- **Semantic Search**: Content similarity and retrieval
- **Natural Language Understanding**: Context-aware processing

## 🚀 Deployment

### Development Environment
1. Start the backend: `poetry run uvicorn app.main:app --reload --port 8000`
2. Start the frontend: `pnpm dev`
3. Access the application at `http://localhost:3000`

### Production Deployment
- **Frontend**: Deploy to Vercel, Netlify, or similar platforms
- **Backend**: Deploy to cloud platforms (AWS, GCP, Azure) with Docker
- **Database**: Configure production Firebase project
- **Storage**: Set up Google Cloud Storage for file handling

## 🧪 Testing

### Backend Testing
```bash
cd backend
poetry run pytest
```

### Frontend Testing
```bash
cd frontend
pnpm test
```

## 🤝 Contributing

We welcome contributions to SLAI! Please follow these guidelines:

1. **Code Style**: Follow established patterns and conventions
2. **Documentation**: Update relevant documentation for changes
3. **Testing**: Add tests for new features and bug fixes
4. **Type Safety**: Use TypeScript in frontend and type hints in backend
5. **Accessibility**: Ensure UI components are accessible

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## 📊 Research & Academic Use

SLAI is developed as part of research initiatives at the University of Wisconsin-Madison. The platform is designed to support:

- **Academic Research**: Processing and analyzing scientific literature
- **Educational Applications**: Helping students understand complex materials
- **Research Collaboration**: Facilitating knowledge sharing and discovery
- **Content Accessibility**: Making scientific content more accessible

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3000 (frontend) and 8000 (backend) are available
2. **Environment Variables**: Verify all required environment variables are set
3. **Dependencies**: Run `pnpm install` and `poetry install` to ensure all dependencies are installed
4. **Firebase Configuration**: Check Firebase project settings and credentials

### Getting Help

- Check the individual README files for component-specific issues
- Review the API documentation at `http://localhost:8000/docs`
- Ensure all prerequisites are properly installed and configured

## 📄 License

This project is part of the SLAI research initiative at the University of Wisconsin-Madison.

## 👥 Contributors

- **Research Group at UW Madison**
- **GitHub**: [B-a-1-a](https://github.com/B-a-1-a)
- **GitHub**: [sungwoonpark0502](https://github.com/sungwoonpark0502)

---

**SLAI: Bridging Science and Language with AI** - Empowering researchers and learners with intelligent content analysis and understanding.
