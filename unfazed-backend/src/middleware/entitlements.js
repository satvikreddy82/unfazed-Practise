const entitlementService = require('../services/entitlementService');

/**
 * Middleware factory to guard routes with centralized entitlements
 * @param {string} featureKey - Key like 'add_client', 'note_template', 'advanced_analytics', 'packages'
 * @param {Function} contextExtractor - Optional function(req) to provide extra context
 */
const requireEntitlement = (featureKey, contextExtractor = null) => {
  return async (req, res, next) => {
    try {
      if (req.user.role !== 'therapist') {
        return res.status(403).json({
          success: false,
          message: 'Entitlement checks apply to therapist accounts.',
        });
      }

      const context = contextExtractor ? contextExtractor(req) : {};
      const check = await entitlementService.canAccess(req.user.id, featureKey, context);

      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          entitlementError: true,
          featureKey,
          message: check.reason,
          details: check,
        });
      }

      req.entitlement = check;
      next();
    } catch (error) {
      console.error('[Entitlement Middleware Error]:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify subscription entitlements.',
      });
    }
  };
};

module.exports = { requireEntitlement };
