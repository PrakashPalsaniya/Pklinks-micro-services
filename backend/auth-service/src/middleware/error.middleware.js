export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.statusCode || 500;
  
  const isSystemError = status === 500;
  const message = isSystemError ? 'An unexpected internal error occurred.' : err.message;

  if (isSystemError) {
    console.error('[System Crash]', err);
  }

  res.status(status).json({ message });
}
