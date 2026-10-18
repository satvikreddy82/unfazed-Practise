const jwt = require('jsonwebtoken');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');

/**
 * Authentication Middleware: Verifies JWT token and resolves user context
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'unfazed_production_super_secret_jwt_key_2026_dev_mode');

    // Attach role-based entity
    if (decoded.role === 'admin') {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: 'admin',
        name: 'Platform Administrator',
      };
      return next();
    }

    if (decoded.role === 'therapist') {
      const therapist = await Therapist.findById(decoded.id).select('-passwordHash');
      if (!therapist) {
        return res.status(401).json({
          success: false,
          message: 'Therapist account not found or has been deactivated.',
        });
      }
      req.user = {
        id: therapist._id.toString(),
        role: 'therapist',
        email: therapist.email,
        name: therapist.name,
        slug: therapist.slug,
        subscriptionTier: therapist.subscriptionTier,
      };
      req.therapist = therapist;
      req.therapistId = therapist._id.toString();
      return next();
    }

    if (decoded.role === 'client') {
      const client = await Client.findById(decoded.id).select('-passwordHash');
      if (!client) {
        return res.status(401).json({
          success: false,
          message: 'Client account not found.',
        });
      }
      req.user = {
        id: client._id.toString(),
        role: 'client',
        email: client.email,
        name: client.name,
        therapistId: client.therapistId.toString(),
      };
      req.client = client;
      req.therapistId = client.therapistId.toString();
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Invalid user role in token.',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        isExpired: true,
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.',
    });
  }
};

/**
 * Role-Based Access Control middleware
 * @param  {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || (!allowedRoles.includes(req.user.role) && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This resource requires one of [${allowedRoles.join(', ')}] roles.`,
      });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
