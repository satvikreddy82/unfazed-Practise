require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Availability = require('../models/Availability');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const Package = require('../models/Package');
const ClientPackage = require('../models/ClientPackage');
const Payment = require('../models/Payment');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const Subscription = require('../models/Subscription');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const Lead = require('../models/Lead');
const IntakeSubmission = require('../models/IntakeSubmission');
const ConsentRecord = require('../models/ConsentRecord');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unfazed_db';
    console.log(`[Seed] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing demo collections...');
    await Promise.all([
      Therapist.deleteMany({}),
      Client.deleteMany({}),
      Availability.deleteMany({}),
      Session.deleteMany({}),
      SessionNote.deleteMany({}),
      Package.deleteMany({}),
      ClientPackage.deleteMany({}),
      Payment.deleteMany({}),
      SubscriptionTierConfig.deleteMany({}),
      Subscription.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Lead.deleteMany({}),
      IntakeSubmission.deleteMany({}),
      ConsentRecord.deleteMany({}),
    ]);

    console.log('[Seed] Inserting Subscription Tiers...');
    const tiers = await SubscriptionTierConfig.create([
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
        activeClientLimit: -1,
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

    console.log('[Seed] Creating Sample Therapist (Dr. Sharma)...');
    const therapist = await Therapist.create({
      name: 'Dr. Aarav Sharma',
      email: 'dr.sharma@unfazed.in',
      passwordHash: 'Therapist123!', // pre-save hook will hash with bcrypt
      slug: 'dr-sharma',
      title: 'M.Phil, Ph.D. — Licensed Clinical Psychologist & CBT Specialist',
      bio: 'Dr. Aarav Sharma is a licensed clinical psychologist with over 9 years of clinical experience specializing in Cognitive Behavioral Therapy (CBT), anxiety disorders, panic disorders, and depression. He is dedicated to creating an evidence-based, compassionate space for clients to explore challenges and build sustainable psychological resilience.',
      qualifications: [
        'Ph.D. in Clinical Psychology — NIMHANS',
        'M.Phil in Medical & Social Psychology — CIP Ranchi',
        'Certified CBT Practitioner — Beck Institute',
      ],
      specializations: [
        'Anxiety & Panic Disorders',
        'Clinical Depression',
        'Workplace Burnout & Stress',
        'Cognitive Behavioral Therapy (CBT)',
        'Grief & Life Transitions',
      ],
      languages: ['English', 'Hindi', 'Punjabi'],
      profileImage: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      phone: '+91 98765 43210',
      practiceDetails: {
        clinicName: 'MindWell Clinic & Psychological Services',
        address: 'Suite 402, Green Park Extension',
        city: 'New Delhi',
        country: 'India',
        registrationNumber: 'RCI-CR-2015-8941',
        gstNumber: '07AAAAA0000A1Z5',
        currency: 'INR',
      },
      sessionOfferings: [
        {
          title: 'Initial Consultation & Diagnostic Intake',
          duration: 60,
          price: 2500,
          description: 'Comprehensive 60-minute intake session to understand your concerns, clinical history, and formulate a personalized treatment plan.',
          isAvailable: true,
        },
        {
          title: 'Individual Psychotherapy (CBT)',
          duration: 60,
          price: 2200,
          description: 'Standard 60-minute one-on-one session utilizing Cognitive Behavioral Therapy and evidence-based interventions.',
          isAvailable: true,
        },
        {
          title: 'Extended Therapy & Couples Session',
          duration: 90,
          price: 3200,
          description: 'Deep-dive 90-minute session for complex presentations, EMDR processing, or relationship counseling.',
          isAvailable: true,
        },
        {
          title: 'Focused Review & Progress Check',
          duration: 30,
          price: 1400,
          description: 'Concise 30-minute check-in session for existing clients focusing on weekly homework and maintenance.',
          isAvailable: true,
        },
      ],
      themePreference: {
        theme: 'emerald_gold',
        mode: 'light',
      },
      subscriptionTier: 'pro',
      subscriptionStatus: 'active',
    });

    console.log('[Seed] Setting up Therapist Subscription & Availability...');
    await Subscription.create({
      therapistId: therapist._id,
      tierKey: 'pro',
      billingPeriod: 'monthly',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await Availability.create({
      therapistId: therapist._id,
      timezone: 'Asia/Kolkata',
      slotDurations: [30, 45, 60, 90],
      defaultDuration: 60,
      bufferMinutes: 15,
      noticeHours: 4,
      maxAdvanceDays: 60,
      weeklySchedule: [
        { dayOfWeek: 0, isAvailable: false, slots: [] }, // Sunday
        {
          dayOfWeek: 1, // Monday
          isAvailable: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '19:00' },
          ],
        },
        {
          dayOfWeek: 2, // Tuesday
          isAvailable: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '19:00' },
          ],
        },
        {
          dayOfWeek: 3, // Wednesday
          isAvailable: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '19:00' },
          ],
        },
        {
          dayOfWeek: 4, // Thursday
          isAvailable: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '19:00' },
          ],
        },
        {
          dayOfWeek: 5, // Friday
          isAvailable: true,
          slots: [
            { startTime: '10:00', endTime: '13:00' },
            { startTime: '14:00', endTime: '18:00' },
          ],
        },
        {
          dayOfWeek: 6, // Saturday
          isAvailable: true,
          slots: [{ startTime: '10:00', endTime: '14:00' }],
        },
      ],
      overrides: [],
      blockedDates: [],
    });

    console.log('[Seed] Creating Sample Packages...');
    const package3 = await Package.create({
      therapistId: therapist._id,
      name: 'Essential Care Bundle (3 Sessions)',
      sessionCount: 3,
      price: 6000,
      discountPercent: 10,
      validityDays: 60,
      description: 'Ideal for short-term support and targeted coping strategies.',
      isActive: true,
    });

    const package6 = await Package.create({
      therapistId: therapist._id,
      name: 'Growth & Transformation Bundle (6 Sessions)',
      sessionCount: 6,
      price: 11500,
      discountPercent: 15,
      validityDays: 120,
      description: 'Recommended for sustained CBT protocol and habit restructuring.',
      isActive: true,
    });

    console.log('[Seed] Creating Sample Clients...');
    const client1 = await Client.create({
      therapistId: therapist._id,
      name: 'Rohan Verma',
      email: 'rohan.verma@example.com',
      passwordHash: 'Client123!',
      phone: '+91 98111 22233',
      emergencyContact: {
        name: 'Sunita Verma',
        relation: 'Spouse',
        phone: '+91 98111 22234',
      },
      tags: ['CBT', 'Anxiety', 'Active Weekly'],
      notes: 'Client presented with generalized workplace anxiety and sleep onset difficulty. Good homework compliance.',
      status: 'active',
      intakeCompleted: true,
      consentAgreed: true,
      consentTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    const client2 = await Client.create({
      therapistId: therapist._id,
      name: 'Ananya Sen',
      email: 'ananya.sen@example.com',
      passwordHash: 'Client123!',
      phone: '+91 99222 33344',
      emergencyContact: {
        name: 'Debashis Sen',
        relation: 'Father',
        phone: '+91 99222 33355',
      },
      tags: ['Depression', 'Student', 'Bi-weekly'],
      notes: 'University graduate navigating career transition and low mood. Focus on behavioral activation.',
      status: 'active',
      intakeCompleted: true,
      consentAgreed: true,
      consentTimestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    const client3 = await Client.create({
      therapistId: therapist._id,
      name: 'Kabir Mehta',
      email: 'kabir.mehta@example.com',
      passwordHash: 'Client123!',
      phone: '+91 97333 44455',
      tags: ['Burnout', 'Executive'],
      notes: 'Initial consultation completed. Deciding on package.',
      status: 'active',
      intakeCompleted: false,
      consentAgreed: true,
      consentTimestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });

    console.log('[Seed] Creating Intake and Consent records...');
    await IntakeSubmission.create({
      therapistId: therapist._id,
      clientId: client1._id,
      demographics: {
        dateOfBirth: '1992-06-15',
        gender: 'Male',
        occupation: 'Senior Product Manager',
        city: 'Gurugram',
        preferredLanguage: 'English',
      },
      presentingConcern: 'Frequent panic attacks during high-stakes client meetings and persistent muscle tension.',
      previousTherapyExperience: 'Brief counseling 3 years ago during bereavement.',
      currentMedications: 'None',
      goalsForTherapy: 'Learn cognitive reframing techniques, stop catastrophizing, and establish healthy work boundaries.',
    });

    await ConsentRecord.create({
      therapistId: therapist._id,
      clientId: client1._id,
      consentVersion: '1.0',
      consentText: 'I agree to voluntary participation in psychotherapy, understand confidentiality boundaries, and accept practice policies.',
      agreed: true,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    console.log('[Seed] Creating Sample Payments and Invoices...');
    const payment1 = await Payment.create({
      therapistId: therapist._id,
      clientId: client1._id,
      amount: 2200,
      currency: 'INR',
      status: 'captured',
      itemType: 'session',
      itemDescription: 'Individual Psychotherapy (CBT)',
      razorpayOrderId: 'order_test_sim_001',
      razorpayPaymentId: 'pay_test_sim_001',
      invoiceNumber: 'INV-2026-00001',
      taxDetails: {
        hasGst: true,
        gstRatePercent: 18,
        subtotal: 1864.41,
        cgstAmount: 167.80,
        sgstAmount: 167.80,
        totalTax: 335.59,
      },
      isSimulated: true,
      webhookProcessed: true,
    });

    const payment2 = await Payment.create({
      therapistId: therapist._id,
      clientId: client1._id,
      amount: 6000,
      currency: 'INR',
      status: 'captured',
      itemType: 'package',
      itemId: package3._id,
      itemDescription: 'Essential Care Bundle (3 Sessions)',
      razorpayOrderId: 'order_test_sim_002',
      razorpayPaymentId: 'pay_test_sim_002',
      invoiceNumber: 'INV-2026-00002',
      taxDetails: {
        hasGst: true,
        gstRatePercent: 18,
        subtotal: 5084.75,
        cgstAmount: 457.63,
        sgstAmount: 457.63,
        totalTax: 915.25,
      },
      isSimulated: true,
      webhookProcessed: true,
    });

    console.log('[Seed] Creating ClientPackage credit...');
    await ClientPackage.create({
      therapistId: therapist._id,
      clientId: client1._id,
      packageId: package3._id,
      paymentId: payment2._id,
      packageName: package3.name,
      sessionsTotal: 3,
      sessionsUsed: 1,
      sessionsRemaining: 2,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    console.log('[Seed] Creating Sample Sessions (Appointments)...');
    // 1. Past completed session
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    pastDate.setHours(11, 0, 0, 0);
    const pastEndDate = new Date(pastDate);
    pastEndDate.setHours(12, 0, 0, 0);

    const pastSession = await Session.create({
      therapistId: therapist._id,
      clientId: client1._id,
      serviceName: 'Individual Psychotherapy (CBT)',
      duration: 60,
      startDateTime: pastDate,
      endDateTime: pastEndDate,
      status: 'completed',
      clientTimezone: 'Asia/Kolkata',
      price: 2200,
      paymentStatus: 'paid',
      paymentId: payment1._id,
      meetLink: 'https://meet.google.com/unf-demo-past',
      clientNotes: 'Follow-up on thought logs.',
    });

    // 2. Upcoming confirmed session (Tomorrow at 14:00)
    const upcomingDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    upcomingDate.setHours(14, 0, 0, 0);
    const upcomingEndDate = new Date(upcomingDate);
    upcomingEndDate.setHours(15, 0, 0, 0);

    const upcomingSession = await Session.create({
      therapistId: therapist._id,
      clientId: client1._id,
      serviceName: 'Individual Psychotherapy (CBT)',
      duration: 60,
      startDateTime: upcomingDate,
      endDateTime: upcomingEndDate,
      status: 'confirmed',
      clientTimezone: 'Asia/Kolkata',
      price: 2200,
      paymentStatus: 'paid',
      paymentId: payment2._id,
      meetLink: 'https://meet.google.com/unf-live-room',
      clientNotes: 'Reviewing exposure hierarchy.',
    });

    // 3. Upcoming session for client 2
    const upcomingDate2 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    upcomingDate2.setHours(16, 0, 0, 0);
    const upcomingEndDate2 = new Date(upcomingDate2);
    upcomingEndDate2.setHours(17, 0, 0, 0);

    await Session.create({
      therapistId: therapist._id,
      clientId: client2._id,
      serviceName: 'Initial Consultation & Diagnostic Intake',
      duration: 60,
      startDateTime: upcomingDate2,
      endDateTime: upcomingEndDate2,
      status: 'confirmed',
      clientTimezone: 'Asia/Kolkata',
      price: 2500,
      paymentStatus: 'unpaid',
      meetLink: 'https://meet.google.com/unf-cl2-room',
    });

    console.log('[Seed] Creating Clinical Notes (Private & Shared)...');
    // Private SOAP Note (NEVER returned to client)
    await SessionNote.create({
      therapistId: therapist._id,
      clientId: client1._id,
      sessionId: pastSession._id,
      title: 'Session 3: Cognitive Restructuring & Thought Logs',
      noteType: 'soap',
      isPrivate: true, // STRICTLY PRIVATE
      content: {
        soap: {
          subjective: 'Client reports feeling moderate anxiety (5/10) over the past week, down from 8/10. Noted specific panic symptoms during a Thursday leadership presentation.',
          objective: 'Affect was congruent and calm. Speech normal in rate and volume. Client brought completed automatic thought record (3 entries).',
          assessment: 'Client is demonstrating developing awareness of cognitive distortions, particularly all-or-nothing thinking and catastrophizing. Good progress on CBT protocol.',
          plan: 'Continue weekly CBT. Homework: Conduct behavioral experiment with 5-minute pause during high-stress moments. Next session scheduled.',
        },
      },
    });

    // Shared Client Note (Visible in Client Portal)
    await SessionNote.create({
      therapistId: therapist._id,
      clientId: client1._id,
      sessionId: pastSession._id,
      title: 'Session 3 Reflection & Weekly Exercises',
      noteType: 'freeform',
      isPrivate: false, // SHARED WITH CLIENT
      sharedWithClientAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      content: {
        freeform: {
          body: '<p>Great work in today’s session on challenging catastrophic thoughts. Remember our key takeaways:</p><ul><li><strong>Thoughts are hypotheses, not facts:</strong> Whenever you notice "I will fail the presentation", write down 2 pieces of counter-evidence.</li><li><strong>Box breathing:</strong> 4 seconds inhale, 4 seconds hold, 4 seconds exhale, 4 seconds pause.</li></ul><p>Looking forward to reviewing your thought log next week!</p>',
        },
      },
    });

    console.log('[Seed] Creating Leads...');
    await Lead.create({
      therapistId: therapist._id,
      name: 'Pooja Iyer',
      email: 'pooja.iyer@example.com',
      phone: '+91 98888 77766',
      status: 'new',
      preferredService: 'Individual Psychotherapy (CBT)',
      message: 'Hello Dr. Sharma, I have been dealing with severe postpartum anxiety and would like to understand your availability for online sessions.',
    });

    await Lead.create({
      therapistId: therapist._id,
      name: 'Vikram Seth',
      email: 'vikram.seth@example.com',
      phone: '+91 97777 66655',
      status: 'contacted',
      preferredService: 'Extended Therapy & Couples Session',
      message: 'Looking for relationship counseling sessions.',
      notes: 'Sent initial intake details via email. Follow up on Monday.',
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    console.log('[Seed] Creating Conversations and Messages...');
    const conversation = await Conversation.create({
      therapistId: therapist._id,
      clientId: client1._id,
      participants: [
        { userId: therapist._id, role: 'therapist', name: therapist.name, unreadCount: 0 },
        { userId: client1._id, role: 'client', name: client1.name, unreadCount: 0 },
      ],
      lastMessageText: 'Thank you Dr. Sharma, I have completed the thought log for this week.',
      lastMessageAt: new Date(),
    });

    await Message.create([
      {
        conversationId: conversation._id,
        senderId: therapist._id,
        senderRole: 'therapist',
        recipientId: client1._id,
        text: 'Hi Rohan, just checking in to see how the breathing exercises went this week?',
        isRead: true,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        conversationId: conversation._id,
        senderId: client1._id,
        senderRole: 'client',
        recipientId: therapist._id,
        text: 'Thank you Dr. Sharma, I have completed the thought log for this week. It really helped during my team standup.',
        isRead: true,
        readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('[Seed] Creating Sample Notifications...');
    await Notification.create([
      {
        userId: therapist._id,
        userRole: 'therapist',
        title: 'New Appointment Booked',
        message: 'Rohan Verma booked a session on Tomorrow at 2:00 PM.',
        type: 'booking',
        isRead: false,
      },
      {
        userId: therapist._id,
        userRole: 'therapist',
        title: 'Payment Received',
        message: 'Received ₹6,000 for Essential Care Bundle (Inv #INV-2026-00002).',
        type: 'payment',
        isRead: true,
      },
      {
        userId: client1._id,
        userRole: 'client',
        title: 'Session Reminder',
        message: 'Your session with Dr. Aarav Sharma is scheduled for Tomorrow at 2:00 PM.',
        type: 'reminder',
        isRead: false,
      },
    ]);

    console.log('------------------------------------------------------------');
    console.log('✅ SYNTHETIC SEED DATA CREATED SUCCESSFULLY!');
    console.log('------------------------------------------------------------');
    console.log('Therapist Credentials:');
    console.log('  Email:    dr.sharma@unfazed.in');
    console.log('  Password: Therapist123!');
    console.log('  Public Branded Link: /dr-sharma');
    console.log('Client Credentials:');
    console.log('  Email:    rohan.verma@example.com');
    console.log('  Password: Client123!');
    console.log('Platform Admin Credentials:');
    console.log('  Email:    admin@unfazed.in');
    console.log('  Password: AdminUnfazed2026!');
    console.log('------------------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
