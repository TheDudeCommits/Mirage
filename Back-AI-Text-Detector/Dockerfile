FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

ENV UV_COMPILE_BYTECODE=1 \
    UV_PYTHON=/usr/local/bin/python3.12 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app --no-create-home --shell /usr/sbin/nologin app

COPY pyproject.toml uv.lock /app/

WORKDIR /app
RUN uv sync --no-dev && uv cache prune --ci

COPY . /app
RUN chown -R app:app /app

EXPOSE 3000
USER app
CMD ["/app/.venv/bin/gunicorn", "--config", "/app/gunicorn_config.py", "main:app"]
