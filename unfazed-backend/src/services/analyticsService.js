const mongoose = require('mongoose');
const Session = require('../models/Session');
const Payment = require('../models/Payment');
const Client = require('../models/Client');
const ClientPackage = require('../models/ClientPackage');
const Therapist = require('../models/Therapist');

class AnalyticsService {
  /**
   * Get practice analytics for a therapist with date range filtering
   * @param {string} therapistId
   * @param {string} range - '7d', '30d', '90d', '1y'
   */
  async getTherapistAnalytics(therapistId, range = '30d') {
    let tId;
    if (therapistId === 'admin_master_id' || !mongoose.Types.ObjectId.isValid(therapistId)) {
      const primary = await Therapist.findOne();
      tId = primary ? primary._id : new mongoose.Types.ObjectId();
    } else {
      tId = new mongoose.Types.ObjectId(therapistId);
    }

    // Calculate startDate based on range
    const now = new Date();
    let startDate = new Date();
    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1);
    else startDate.setDate(now.getDate() - 30);

    // 1. Overall Key Summary Metrics
    const [
      totalRevenueResult,
      sessionStatusCounts,
      activeClientsCount,
      newClientsCount,
      packageUsageResult,
    ] = await Promise.all([
      // Total Revenue in period
      Payment.aggregate([
        {
          $match: {
            therapistId: tId,
            status: 'captured',
            createdAt: { $gte: startDate, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
      ]),

      // Session Status Breakdown
      Session.aggregate([
        {
          $match: {
            therapistId: tId,
            startDateTime: { $gte: startDate, $lte: now },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Active clients count
      Client.countDocuments({
        therapistId: tId,
        status: 'active',
      }),

      // New clients in range
      Client.countDocuments({
        therapistId: tId,
        createdAt: { $gte: startDate, $lte: now },
      }),

      // Package Usage Stats
      ClientPackage.aggregate([
        { $match: { therapistId: tId } },
        {
          $group: {
            _id: null,
            totalPackages: { $sum: 1 },
            totalSessionsPurchased: { $sum: '$sessionsTotal' },
            totalSessionsUsed: { $sum: '$sessionsUsed' },
            totalSessionsRemaining: { $sum: '$sessionsRemaining' },
          },
        },
      ]),
    ]);

    // Compute session counts and rates
    let completedSessions = 0;
    let cancelledSessions = 0;
    let noShowSessions = 0;
    let totalSessions = 0;

    sessionStatusCounts.forEach((item) => {
      totalSessions += item.count;
      if (item._id === 'completed') completedSessions = item.count;
      if (item._id === 'cancelled') cancelledSessions = item.count;
      if (item._id === 'no-show') noShowSessions = item.count;
    });

    const cancellationRate = totalSessions > 0 ? Math.round((cancelledSessions / totalSessions) * 100) : 0;
    const noShowRate = totalSessions > 0 ? Math.round((noShowSessions / totalSessions) * 100) : 0;

    // Upcoming sessions (from now forward)
    const upcomingSessionsCount = await Session.countDocuments({
      therapistId: tId,
      status: { $in: ['confirmed', 'pending'] },
      startDateTime: { $gte: now },
    });

    // 2. Revenue Over Time (Daily / Weekly Trend Aggregation)
    const revenueOverTime = await Payment.aggregate([
      {
        $match: {
          therapistId: tId,
          status: 'captured',
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          revenue: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 3. Sessions By Service Type
    const sessionsByService = await Session.aggregate([
      {
        $match: {
          therapistId: tId,
          startDateTime: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: '$serviceName',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          service: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 4. Client Growth Over Time
    const clientGrowth = await Client.aggregate([
      {
        $match: {
          therapistId: tId,
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' },
          },
          newClients: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          newClients: 1,
          _id: 0,
        },
      },
    ]);

    return {
      range,
      summary: {
        totalRevenue: totalRevenueResult[0]?.totalRevenue || 0,
        completedSessions,
        upcomingSessions: upcomingSessionsCount,
        activeClients: activeClientsCount,
        newClients: newClientsCount,
        totalSessions,
        cancellationRate,
        noShowRate,
      },
      packageStats: packageUsageResult[0] || {
        totalPackages: 0,
        totalSessionsPurchased: 0,
        totalSessionsUsed: 0,
        totalSessionsRemaining: 0,
      },
      charts: {
        revenueOverTime,
        sessionsByService,
        clientGrowth,
        sessionBreakdown: sessionStatusCounts.map(s => ({ status: s._id, count: s.count })),
      },
    };
  }
}

module.exports = new AnalyticsService();
