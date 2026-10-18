const analyticsService = require('../services/analyticsService');
const entitlementService = require('../services/entitlementService');

/**
 * Get Practice Analytics with date-range filters and aggregation pipelines
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { range = '30d' } = req.query;

    // Check Entitlement: Pro/Practice gets unrestricted ranges
    const isAdvancedRange = range === '90d' || range === '1y';
    let entitlementCheck = { allowed: true };

    if (isAdvancedRange) {
      entitlementCheck = await entitlementService.canAccess(req.user.id, 'advanced_analytics');
    }

    const effectiveRange = (!entitlementCheck.allowed && isAdvancedRange) ? '30d' : range;

    const data = await analyticsService.getTherapistAnalytics(req.user.id, effectiveRange);

    res.json({
      success: true,
      data,
      isGatedNotice: !entitlementCheck.allowed && isAdvancedRange ? entitlementCheck.reason : null,
    });
  } catch (error) {
    console.error('[Analytics Controller Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
