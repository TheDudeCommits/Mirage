# Outbound detector configuration

The GAME agent sends analysis requests only to the fixed `/api/detect` path.

- Development and test may use `http://localhost:5001`,
  `http://127.0.0.1:5001`, or `http://[::1]:5001`.
- Production detector URLs must use HTTPS and their exact origin must appear in
  the comma-separated `TEXT_DETECTOR_ALLOWED_ORIGINS` environment variable.
- Origins must be canonical host-based URLs without credentials, paths,
  queries, fragments, wildcards, or IP literals.
- DNS answers are checked for private, loopback, link-local, reserved, or mixed
  destinations and the validated public address is pinned for the request.
- Redirects are disabled.

Example variable names:

```env
TEXT_DETECTOR_API_URL=
TEXT_DETECTOR_ALLOWED_ORIGINS=
```
