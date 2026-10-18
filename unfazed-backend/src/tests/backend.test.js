const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Therapist = require('../models/Therapist');
const Client = require('../models/Client');
const Session = require('../models/Session');
const SessionNote = require('../models/SessionNote');
const SubscriptionTierConfig = require('../models/SubscriptionTierConfig');
const entitlementService = require('../services/entitlementService');

describe('UNFAZED Backend API & Security Tests', () => {
  let therapistToken;
  let clientToken;
  let therapistUser;
  let clientUser;
  let testSession;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/unfazed_db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // 1. Log in therapist
    const tRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dr.sharma@unfazed.in', password: 'Therapist123!' });
    expect(tRes.status).toBe(200);
    therapistToken = tRes.body.token;
    therapistUser = tRes.body.user;

    // 2. Log in client
    const cRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rohan.verma@example.com', password: 'Client123!' });
    expect(cRes.status).toBe(200);
    clientToken = cRes.body.token;
    clientUser = tRes.body.user;
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // 1. AUTHENTICATION & LOGIN
  describe('Authentication & Security', () => {
    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dr.sharma@unfazed.in', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get current authenticated therapist profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${therapistToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('therapist');
      expect(res.body.user.slug).toBe('dr-sharma');
      expect(res.body.user.passwordHash).toBeUndefined(); // Must not expose hash
    });

    it('should reject access to protected routes without a token', async () => {
      const res = await request(app).get('/api/scheduling/appointments');
      expect(res.status).toBe(401);
    });
  });

  // 2. PUBLIC BRANDED PROFILE (DATA LEAK BARRIER)
  describe('Public Branded Profile & Sanitization', () => {
    it('should return public profile for /dr-sharma without sensitive fields', async () => {
      const res = await request(app).get('/api/profile/dr-sharma');
      expect(res.status).toBe(200);
      expect(res.body.therapist.name).toBe('Dr. Aarav Sharma');
      expect(res.body.therapist.slug).toBe('dr-sharma');
      expect(res.body.therapist.passwordHash).toBeUndefined();
      expect(res.body.therapist.phone).toBeUndefined(); // private phone withheld
      expect(res.body.therapist.sessionOfferings.length).toBeGreaterThan(0);
    });
  });

  // 3. SCHEDULING & DOUBLE-BOOKING PREVENTION
  describe('Scheduling & Double-Booking Prevention', () => {
    it('should calculate available slots for a weekday', async () => {
      // Pick a weekday date 3 days from now
      const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await request(app).get(`/api/scheduling/public/dr-sharma/slots?date=${date}&duration=60`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.slots)).toBe(true);
    });

    it('should atomically book an appointment and reject double-booking', async () => {
      const targetTime = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      targetTime.setHours(11, 0, 0, 0);

      // Clean up previous test runs if any
      await Session.deleteMany({ startDateTime: targetTime });

      // First booking
      const book1 = await request(app)
        .post('/api/scheduling/book')
        .send({
          slug: 'dr-sharma',
          serviceName: 'Individual Psychotherapy (CBT)',
          duration: 60,
          startDateTime: targetTime.toISOString(),
          clientName: 'Test Booking Client',
          clientEmail: 'test.booking@example.com',
          paymentMethod: 'pay_later',
        });

      expect(book1.status).toBe(201);
      expect(book1.body.appointment).toBeDefined();
      testSession = book1.body.appointment;

      // Second concurrent/duplicate booking for the same time slot
      const book2 = await request(app)
        .post('/api/scheduling/book')
        .send({
          slug: 'dr-sharma',
          serviceName: 'Individual Psychotherapy (CBT)',
          duration: 60,
          startDateTime: targetTime.toISOString(),
          clientName: 'Second Client Conflicting',
          clientEmail: 'second.client@example.com',
          paymentMethod: 'pay_later',
        });

      // MUST FAIL WITH 409 CONFLICT!
      expect(book2.status).toBe(409);
      expect(book2.body.doubleBookingPrevented).toBe(true);
    });
  });

  // 4. CRITICAL CLINICAL NOTES PRIVACY BARRIER
  describe('Clinical Notes Security & Client Barrier', () => {
    let privateNoteId;
    let sharedNoteId;

    beforeAll(async () => {
      const therapist = await Therapist.findOne({ slug: 'dr-sharma' });
      const client = await Client.findOne({ email: 'rohan.verma@example.com' });

      // Create a private note
      const privateNote = await SessionNote.create({
        therapistId: therapist._id,
        clientId: client._id,
        title: 'Confidential Risk Evaluation (Strictly Private)',
        noteType: 'soap',
        isPrivate: true,
        content: {
          soap: {
            subjective: 'Confidential clinical discussion',
            assessment: 'Clinical formulation',
          },
        },
      });
      privateNoteId = privateNote._id.toString();

      // Create a shared note
      const sharedNote = await SessionNote.create({
        therapistId: therapist._id,
        clientId: client._id,
        title: 'Shared Coping Strategies',
        noteType: 'freeform',
        isPrivate: false,
        content: {
          freeform: { body: 'Take 3 deep breaths and write in your journal.' },
        },
      });
      sharedNoteId = sharedNote._id.toString();
    });

    it('Client GET /api/notes MUST NOT return private notes', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notes).toBeDefined();

      // Ensure every single note returned to the client has isPrivate !== true
      const hasPrivateNote = res.body.notes.some((n) => n.isPrivate === true || n.id === privateNoteId);
      expect(hasPrivateNote).toBe(false);
    });

    it('Client GET /api/notes/:id on a private note MUST return 404 (Not Found / Hidden)', async () => {
      const res = await request(app)
        .get(`/api/notes/${privateNoteId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      // Must be 404 Not Found (or 403 Forbidden)
      expect([404, 403]).toContain(res.status);
      expect(res.body.note).toBeUndefined();
    });

    it('Client GET /api/notes/:id on a shared note should succeed', async () => {
      const res = await request(app)
        .get(`/api/notes/${sharedNoteId}`)
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.note).toBeDefined();
      expect(res.body.note.title).toBe('Shared Coping Strategies');
    });
  });

  // 5. SUBSCRIPTION ENTITLEMENT ENFORCEMENT
  describe('Subscription Entitlements Enforcement', () => {
    it('should verify entitlement service restricts templates on starter tier', async () => {
      // Mock therapist with starter tier
      const therapist = await Therapist.findOne({ slug: 'dr-sharma' });
      const originalTier = therapist.subscriptionTier;

      therapist.subscriptionTier = 'starter';
      await therapist.save();

      const soapCheck = await entitlementService.canAccess(therapist._id, 'note_template', { template: 'soap' });
      expect(soapCheck.allowed).toBe(false);

      const freeformCheck = await entitlementService.canAccess(therapist._id, 'note_template', { template: 'freeform' });
      expect(freeformCheck.allowed).toBe(true);

      // Restore tier
      therapist.subscriptionTier = originalTier;
      await therapist.save();
    });
  });

  // 6. HEALTH CHECK
  describe('Health Endpoint', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });
});
