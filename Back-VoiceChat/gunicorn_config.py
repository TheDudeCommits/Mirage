# WSGI config (for Flask/Django)
bind = "0.0.0.0:3000"
workers = 4
worker_class = "sync"  # Default worker for WSGI
timeout = 30
keepalive = 2
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log errors to stdout