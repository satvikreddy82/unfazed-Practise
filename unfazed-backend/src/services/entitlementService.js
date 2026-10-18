const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');

/**
 * Entitlement Service: Centralized authority for subscription features, limits, and gating
 */
class EntitlementService {
  /**
   * Get therapist's active tier configuration
   */
  async getTherapistTierConfig(therapistId) {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      throw new Error('Therapist not found');
    }

    const tierKey = therapist.subscriptionTier || 'starter';
    let config = await SubscriptionTierConfig.findOne({ tierKey });

    // Fallback default config if not seeded yet
    if (!config) {
      if (tierKey === 'pro') {
        config = {
          tierKey: 'pro',
          name: 'Pro Practice',
          activeClientLimit: 50,
          enabledFeatures: ['basic_notes', 'advanced_notes', 'basic_analytics', 'advanced_analytics', 'packages', 'custom_branding'],
          allowedNoteTemplates: ['freeform', 'soap', 'dap'],
          analyticsAccessLevel: 'advanced',
        };
      } else if (tierKey === 'practice') {
        config = {
          tierKey: 'practice',
          name: 'Group Practice',
          activeClientLimit: -1, // Unlimited
          enabledFeatures: ['basic_notes', 'advanced_notes', 'basic_analytics', 'advanced_analytics', 'packages', 'custom_branding', 'unlimited_clients'],
          allowedNoteTemplates: ['freeform', 'soap', 'dap'],
          analyticsAccessLevel: 'advanced',
        };
      } else {
        config = {
          tierKey: 'starter',
          name: 'Starter Practice',
          activeClientLimit: 10,
          enabledFeatures: ['basic_notes', 'basic_analytics'],
          allowedNoteTemplates: ['freeform'],
          analyticsAccessLevel: 'basic',
        };
      }
    }

    return { therapist, config };
  }

  /**
   * canAccess check for any featureKey or operation
   * @param {string} therapistId
   * @param {string} featureKey
   * @param {object} context - extra info, e.g. { templateType: 'soap' }
   */
  async canAccess(therapistId, featureKey, context = {}) {
    const { therapist, config } = await this.getTherapistTierConfig(therapistId);

    // 1. Active Client Limit Gate
    if (featureKey === 'add_client') {
      if (config.activeClientLimit === -1) {
        return { allowed: true, current: 0, limit: -1 };
      }
      const activeCount = await Client.countDocuments({
        therapistId,
        status: 'active',
      });
      if (activeCount >= config.activeClientLimit) {
        return {
          allowed: false,
          reason: `Active client limit reached (${activeCount}/${config.activeClientLimit}). Upgrade to Pro or Practice to add more clients.`,
          current: activeCount,
          limit: config.activeClientLimit,
          tier: config.name,
        };
      }
      return { allowed: true, current: activeCount, limit: config.activeClientLimit };
    }

    // 2. Note Template Gate
    if (featureKey === 'note_template') {
      const template = context.template || 'freeform';
      const isAllowed = config.allowedNoteTemplates.includes(template);
      if (!isAllowed) {
        return {
          allowed: false,
          reason: `The '${template.toUpperCase()}' clinical note template is available on Pro and Practice plans.`,
          allowedTemplates: config.allowedNoteTemplates,
          tier: config.name,
        };
      }
      return { allowed: true, allowedTemplates: config.allowedNoteTemplates };
    }

    // 3. Analytics Gate
    if (featureKey === 'advanced_analytics') {
      const isAllowed = config.analyticsAccessLevel === 'advanced';
      if (!isAllowed) {
        return {
          allowed: false,
          reason: 'Advanced practice analytics & historical breakdowns are available on Pro and Practice plans.',
          tier: config.name,
        };
      }
      return { allowed: true };
    }

    // 4. Packages Feature Gate
    if (featureKey === 'packages') {
      const isAllowed = config.enabledFeatures.includes('packages');
      if (!isAllowed) {
        return {
          allowed: false,
          reason: 'Session packages and bundles require a Pro or Practice subscription.',
          tier: config.name,
        };
      }
      return { allowed: true };
    }

    // Generic feature check
    const isEnabled = config.enabledFeatures.includes(featureKey);
    return {
      allowed: isEnabled,
      reason: isEnabled ? null : `Feature '${featureKey}' is not enabled in your current plan (${config.name}).`,
      tier: config.name,
    };
  }

  /**
   * Get summary of current limits and usage for dashboard/settings
   */
  async getUsageSummary(therapistId) {
    const { therapist, config } = await this.getTherapistTierConfig(therapistId);
    const activeClients = await Client.countDocuments({
      therapistId,
      status: 'active',
    });

    return {
      tierKey: config.tierKey,
      tierName: config.name,
      activeClients,
      activeClientLimit: config.activeClientLimit,
      clientUsagePercentage: config.activeClientLimit === -1 ? 0 : Math.round((activeClients / config.activeClientLimit) * 100),
      allowedNoteTemplates: config.allowedNoteTemplates,
      analyticsAccessLevel: config.analyticsAccessLevel,
      enabledFeatures: config.enabledFeatures,
    };
  }
}

module.exports = new EntitlementService();
