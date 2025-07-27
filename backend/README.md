# SLAI Backend

Backend API for **SLAI: Bridging Science and Language with AI** - A FastAPI-based service that provides AI-powered transcription, summarization, and highlighting capabilities for scientific content.

## 🚀 Features

- **Audio Transcription**: Convert audio files to text using advanced AI models
- **Content Summarization**: Generate intelligent summaries of scientific content
- **Text Highlighting**: Extract and highlight key information from documents
- **Source Management**: Organize and manage various content sources
- **Firebase Authentication**: Secure user authentication and authorization
- **RESTful API**: Clean, documented API endpoints

## 📋 Prerequisites

Before setting up the backend, ensure you have:

- **Python** (>=3.11, <3.13.3)
- **Poetry** - Python dependency management tool
  - Install via: `curl -sSL https://install.python-poetry.org | python3 -`
- **Firebase Admin SDK** credentials (for authentication)
- **Google Cloud Storage** access (for file storage)

## 🛠 Installation

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd MLLMTool/backend
   ```

2. **Install dependencies using Poetry**:
   ```bash
   poetry install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory with the following variables:
   ```env
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   
   # API Configuration
   CORS_ORIGINS=["http://localhost:3000"]
   
   # Add other required environment variables
   ```

4. **Configure Firebase Admin SDK**:
   - Place your Firebase service account key file in the backend directory
   - Update the path in your environment configuration

## 🚀 Running the Backend

### Development Mode

Start the development server with hot-reloading:

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API Base URL**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

### Production Mode

For production deployment:

```bash
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 📚 API Endpoints

The backend provides the following main endpoint groups:

- **`/api/v1/health`** - Health check endpoints
- **`/api/v1/transcribe`** - Audio transcription services
- **`/api/v1/summary`** - Content summarization
- **`/api/v1/highlight`** - Text highlighting and extraction
- **`/api/v1/sources`** - Source management
- **`/api/v1/transcript`** - Transcript management
- **`/api/v1/onboard`** - User onboarding

Visit `http://localhost:8000/docs` for detailed API documentation.

## 🏗 Project Structure

```
backend/
├── app/
│   ├── api/v1/           # API route definitions
│   │   ├── endpoints/    # Individual endpoint modules
│   │   └── api.py       # API router configuration
│   ├── core/            # Core configuration and utilities
│   │   ├── firebase_auth.py
│   │   ├── firebase_client.py
│   │   └── settings.py
│   ├── models/          # Database models
│   ├── pipelines/       # AI processing pipelines
│   ├── schemas/         # Pydantic schemas for request/response
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── main.py         # FastAPI application entry point
├── pyproject.toml      # Poetry configuration and dependencies
└── README.md          # This file
```

## 🔧 Key Dependencies

- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI applications
- **Sentence Transformers**: For text embeddings and similarity
- **PyTorch**: Deep learning framework
- **Firebase Admin**: Firebase authentication and services
- **Pydantic**: Data validation and serialization
- **NLTK**: Natural language processing toolkit

## 🧪 Testing

Run tests using Poetry:

```bash
poetry run pytest
```

## 🐛 Troubleshooting

### Common Issues

1. **Poetry not found**:
   - Install Poetry: `curl -sSL https://install.python-poetry.org | python3 -`
   - Add Poetry to PATH: `export PATH="$HOME/.local/bin:$PATH"`

2. **Python version issues**:
   - Ensure Python 3.11+ is installed
   - Use `poetry env use python3.11` to specify Python version

3. **Firebase authentication errors**:
   - Verify your Firebase service account key is correctly configured
   - Check that all required environment variables are set

4. **Port already in use**:
   - Change the port: `poetry run uvicorn app.main:app --reload --port 8001`
   - Or kill the process using the port: `lsof -ti:8000 | xargs kill -9`

## 📝 Development

### Adding New Endpoints

1. Create endpoint module in `app/api/v1/endpoints/`
2. Define Pydantic schemas in `app/schemas/`
3. Implement business logic in `app/services/`
4. Register the router in `app/api/v1/api.py`

### Environment Setup

For development, you may want to:
- Enable debug logging
- Use development Firebase project
- Configure CORS for local frontend development

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write tests for new features
4. Update documentation as needed

## 📄 License

This project is part of the SLAI research initiative at UW-Madison.