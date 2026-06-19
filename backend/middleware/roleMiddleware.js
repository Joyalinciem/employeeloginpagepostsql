// Simple role authorization middleware
const requireRole = (allowedRoles = []) => (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole) return res.status(401).json({ message: 'Unauthorized' });

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
};

module.exports = { requireRole };
