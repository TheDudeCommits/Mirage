FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_PYTHON=/usr/local/bin/python3.12 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock /app/

WORKDIR /app
RUN uv sync --no-dev && uv cache prune --ci

COPY . /app

EXPOSE 5000
CMD ["uv", "run", "gunicorn", "--config", "/app/gunicorn_config.py", "app:app"]