# Use python 3.13 image
FROM python:3.13.2-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.2

# Install dependencies
RUN apt-get update && apt-get install -y curl build-essential && \
    curl -sSL https://install.python-poetry.org | python3 - && \
    ln -s /root/.local/bin/poetry /usr/local/bin/poetry

# Set workdir
WORKDIR /app

# Copy only pyproject first (better Docker caching)
COPY backend/pyproject.toml backend/poetry.lock ./

# Install project dependencies
RUN poetry config virtualenvs.create false \
 && poetry install --only main --no-root

# Copy the rest of backend code
COPY backend/ .

# Expose port
EXPOSE 8000

# Start FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
