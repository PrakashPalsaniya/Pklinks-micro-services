export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';

  if (status === 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ message });
}
