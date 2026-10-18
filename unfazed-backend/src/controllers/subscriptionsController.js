const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Subscription = require('../models/Subscription');
const Therapist = require('../models/Therapist');
const entitlementService = require('../services/entitlementService');

/**
 * Public: List available subscription tiers (used by landing page and settings)
 */
exports.getTiers = async (req, res) => {
  try {
    let tiers = await SubscriptionTierConfig.find().sort({ priceMonthly: 1 });

    // Seed default tier configurations if empty
    if (!tiers || tiers.length === 0) {
      tiers = await SubscriptionTierConfig.create([
        {
          tierKey: 'starter',
          name: 'Starter Practice',
          description: 'Essential practice management tools for solo therapists getting started.',
          priceMonthly: 1499,
          priceYearly: 14990,
          activeClientLimit: 10,
          enabledFeatures: ['basic_notes', 'basic_analytics', 'branded_link', 'online_booking'],
          allowedNoteTemplates: ['freeform'],
          analyticsAccessLevel: 'basic',
          isPopular: false,
        },
        {
          tierKey: 'pro',
          name: 'Pro Practice',
          description: 'Advanced clinical templates, multi-session packages, and practice analytics.',
          priceMonthly: 2999,
          priceYearly: 29990,
          activeClientLimit: 50,
          enabledFeatures: [
            'basic_notes',
            'advanced_notes',
            'basic_analytics',
            'advanced_analytics',
            'packages',
            'custom_branding',
            'branded_link',
            'online_booking',
            'chat',
          ],
          allowedNoteTemplates: ['freeform', 'soap', 'dap'],
          analyticsAccessLevel: 'advanced',
          isPopular: true,
        },
        {
          tierKey: 'practice',
          name: 'Group Practice',
          description: 'Unlimited capacity and full-suite practice intelligence for growing practices.',
          priceMonthly: 5999,
          priceYearly: 59990,
          activeClientLimit: -1, // Unlimited
          enabledFeatures: [
            'basic_notes',
            'advanced_notes',
            'basic_analytics',
            'advanced_analytics',
            'packages',
            'custom_branding',
            'unlimited_clients',
            'priority_support',
            'branded_link',
            'online_booking',
            'chat',
          ],
          allowedNoteTemplates: ['freeform', 'soap', 'dap'],
          analyticsAccessLevel: 'advanced',
          isPopular: false,
        },
      ]);
    }

    res.json({ success: true, tiers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Therapist: Get current subscription and usage stats
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.user.id);
    if (!therapist) return res.status(404).json({ success: false, message: 'Therapist not found' });

    let subscription = await Subscription.findOne({ therapistId: req.user.id });
    if (!subscription) {
      subscription = await Subscription.create({
        therapistId: req.user.id,
        tierKey: therapist.subscriptionTier || 'starter',
        status: 'active',
      });
    }

    const usage = await entitlementService.getUsageSummary(req.user.id);

    res.json({
      success: true,
      subscription,
      usage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Therapist: Upgrade or change plan
 */
exports.changeTier = async (req, res) => {
  try {
    const { tierKey, billingPeriod = 'monthly' } = req.body;

    const tierConfig = await SubscriptionTierConfig.findOne({ tierKey });
    if (!tierConfig) {
      return res.status(400).json({ success: false, message: 'Invalid subscription tier selected.' });
    }

    const therapist = await Therapist.findById(req.user.id);
    therapist.subscriptionTier = tierKey;
    therapist.subscriptionStatus = 'active';
    await therapist.save();

    let subscription = await Subscription.findOne({ therapistId: req.user.id });
    if (subscription) {
      subscription.tierKey = tierKey;
      subscription.billingPeriod = billingPeriod;
      subscription.status = 'active';
      subscription.currentPeriodStart = new Date();
      subscription.currentPeriodEnd = new Date(Date.now() + (billingPeriod === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        therapistId: req.user.id,
        tierKey,
        billingPeriod,
        status: 'active',
      });
    }

    const usage = await entitlementService.getUsageSummary(req.user.id);

    res.json({
      success: true,
      message: `Successfully upgraded practice subscription to ${tierConfig.name}!`,
      tier: tierConfig,
      subscription,
      usage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
