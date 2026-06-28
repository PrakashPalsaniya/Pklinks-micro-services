export function requireAuth(req, res, next) {
  // In our microservices architecture, the API Gateway already verifies the JWT 
  // and attaches the user's ID to this custom header.
  const userId = req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized (Missing user ID from Gateway)' });
  }

  req.userId = userId;
  next();
}
