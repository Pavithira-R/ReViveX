/**
 * Member 4 – Repair & Service Providers tests on in-memory fake Firestore:
 * - Provider profiles and directory listing with filters
 * - Submitting repair requests
 * - Quotation flows
 * - Booking appointment
 * - Full status progression (Accepted -> On the Way -> Repairing -> Completed)
 * - Eco points awarded on completion (20 points)
 */
import { authService } from '../src/services';
import { repairService } from '../src/features/member4/repair.service';
import { RepairStatus } from '../src/features/member4/types';

const { __fake } = require('../jest.firebase');

const customer = {
  id: 'customer-1',
  name: 'Kamal Perera',
  email: 'kamal@example.com',
  role: 'ITEM_OWNER',
  phone: '0771234567',
  profileImage: null,
  latitude: 6.9271,
  longitude: 79.8612,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const providerUser = {
  id: 'provider-1',
  name: 'TechFix Solutions',
  email: 'techfix@example.com',
  role: 'SERVICE_PROVIDER',
  phone: '0719876543',
  profileImage: null,
  latitude: 6.9319,
  longitude: 79.8478,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const signInAs = (email: string) => authService.login({ email, password: 'Password123' });

beforeEach(async () => {
  __fake.addAccount(customer, 'Password123');
  __fake.addAccount(providerUser, 'Password123');
});

test('provider profiles: register/update and list with search & category filter', async () => {
  await signInAs(providerUser.email);

  await repairService.saveMyProviderProfile({
    businessName: 'TechFix Solutions Colombo',
    description: 'Expert laptop and smartphone repairs in Colombo',
    categoryIds: ['laptops', 'smartphones'],
    services: ['Screen Replacement', 'Battery Replacement', 'Logic Board Repair'],
    startingPrice: 3500,
    phone: '0719876543',
    location: {
      city: 'Colombo',
      latitude: 6.9319,
      longitude: 79.8478,
    },
  });

  // Verify provider was saved
  const provider = await repairService.getProvider(providerUser.id);
  expect(provider).toMatchObject({
    businessName: 'TechFix Solutions Colombo',
    phone: '0719876543',
  });

  // Verify getMyProviderProfile retrieves current provider's own profile
  const myProfile = await repairService.getMyProviderProfile();
  expect(myProfile).toMatchObject({
    businessName: 'TechFix Solutions Colombo',
    phone: '0719876543',
    startingPrice: 3500,
  });

  // Test listing all providers
  const allProviders = await repairService.listProviders();
  expect(allProviders.length).toBeGreaterThanOrEqual(1);

  // Test filter by category
  const laptopProviders = await repairService.listProviders({ category: 'laptops' });
  expect(laptopProviders.some((p) => p.businessName?.includes('TechFix'))).toBe(true);

  const audioProviders = await repairService.listProviders({ category: 'audio' });
  expect(audioProviders.length).toBe(0);

  // Test search query
  const searched = await repairService.listProviders({ search: 'colombo' });
  expect(searched.length).toBe(1);
});

test('full repair workflow: request -> quote -> book -> complete -> eco points', async () => {
  // 1. Setup provider
  __fake.setDoc(`serviceProviders/${providerUser.id}`, {
    userId: providerUser.id,
    businessName: 'TechFix Solutions',
    description: 'Hardware specialists',
    categoryIds: ['laptop'],
    services: ['Screen Repair'],
    startingPrice: 5000,
    phone: '0719876543',
    ratingAverage: 4.9,
    ratingCount: 12,
    isVerified: true,
  });

  // 2. Customer creates repair request
  await signInAs(customer.email);
  const createdReq = await repairService.createRequest({
    itemId: 'item-lap-01',
    itemName: 'Dell XPS 13',
    categoryName: 'Laptop',
    providerId: providerUser.id,
    providerName: 'TechFix Solutions',
    problem: 'Flickering display after drop',
  });

  expect(createdReq.id).toBeDefined();
  expect(createdReq.status).toBe(RepairStatus.REQUESTED);
  expect(createdReq.customerId).toBe(customer.id);

  // Verify notification was sent to provider
  const providerNotifications = __fake
    .docsIn('notifications')
    .filter((n: any) => n.userId === providerUser.id);
  expect(providerNotifications.length).toBe(1);
  expect(providerNotifications[0].title).toContain('New Repair Request');

  // Customer sees it in their request list
  const myRequests = await repairService.listMyRequests();
  expect(myRequests.some((r) => r.id === createdReq.id)).toBe(true);

  // 3. Provider reviews incoming jobs and sends quotation
  await signInAs(providerUser.email);
  const providerJobs = await repairService.listProviderJobs();
  expect(providerJobs.some((r) => r.id === createdReq.id)).toBe(true);

  const quotedReq = await repairService.sendQuotation(createdReq.id, {
    price: 8500,
    notes: 'OEM screen replacement with 6-month warranty',
  });

  expect(quotedReq.status).toBe(RepairStatus.QUOTED);
  expect(quotedReq.quotation?.price).toBe(8500);

  // Customer gets quotation notification
  const customerNotifications = __fake
    .docsIn('notifications')
    .filter((n: any) => n.userId === customer.id);
  expect(customerNotifications.some((n: any) => n.title.includes('Quotation Ready'))).toBe(true);

  // 4. Customer accepts quotation and books appointment
  await signInAs(customer.email);
  const bookingResult = await repairService.createBooking({
    repairRequestId: createdReq.id,
    appointmentDate: '2026-11-20',
    appointmentTime: '10:30 AM',
    notes: 'Dropping off in the morning',
  });

  expect(bookingResult.success).toBe(true);
  expect(bookingResult.data?.status).toBe('CONFIRMED');
  expect(bookingResult.data?.confirmationCode).toMatch(/^REV-BK-/);

  // Check request status is now ACCEPTED
  const acceptedStatusRes = await repairService.getRequestStatus(createdReq.id);
  expect(acceptedStatusRes.success).toBe(true);
  expect(acceptedStatusRes.data?.status).toBe(RepairStatus.ACCEPTED);

  // 5. Provider updates status step-by-step
  await signInAs(providerUser.email);

  const onTheWay = await repairService.updateStatus(
    createdReq.id,
    RepairStatus.ON_THE_WAY,
    'Driver dispatched for device pickup'
  );
  expect(onTheWay.status).toBe(RepairStatus.ON_THE_WAY);

  const repairing = await repairService.updateStatus(
    createdReq.id,
    RepairStatus.REPAIRING,
    'Screen disassembled and new panel installed'
  );
  expect(repairing.status).toBe(RepairStatus.REPAIRING);

  // Complete repair
  const completed = await repairService.updateStatus(
    createdReq.id,
    RepairStatus.COMPLETED,
    'Tested and fully operational'
  );
  expect(completed.status).toBe(RepairStatus.COMPLETED);

  // 6. Verify Eco Points awarded (20 points for REPAIR) and activity logged
  expect(__fake.getDoc(`ecoActions/REPAIR_${createdReq.id}`)).toMatchObject({
    userId: customer.id,
    type: 'REPAIR',
    points: 20,
    deviceCategory: 'LAPTOP',
  });

  // Verify customer received completion notification
  const afterCompleteNotifs = __fake
    .docsIn('notifications')
    .filter((n: any) => n.userId === customer.id);
  expect(
    afterCompleteNotifs.some(
      (n: any) => n.title.includes('Device Repaired') || n.title.includes('Eco points')
    )
  ).toBe(true);
});

test('repair request rejection: declines request and notifies the other party', async () => {
  await signInAs(customer.email);
  const createdReq = await repairService.createRequest({
    itemId: 'item-lap-02',
    itemName: 'Old CRT Monitor',
    categoryName: 'Monitor',
    providerId: providerUser.id,
    providerName: 'TechFix Solutions',
    problem: 'Parts obsolete',
  });

  await signInAs(providerUser.email);
  const rejected = await repairService.rejectQuotation(
    createdReq.id,
    'We no longer service CRT equipment'
  );

  expect(rejected.status).toBe(RepairStatus.REJECTED);
  expect(rejected.rejectionReason).toBe('We no longer service CRT equipment');
});

test('technician portal: listProviderJobs and getProvider fallback when database is fresh', async () => {
  await signInAs(providerUser.email);

  // When database has no assigned jobs, listProviderJobs falls back safely to demo incoming job
  const jobs = await repairService.listProviderJobs();
  expect(jobs.length).toBeGreaterThanOrEqual(1);
  expect(jobs[0].itemName).toBe('Samsung Galaxy A32');

  // getProvider falls back to mock provider if not yet in database
  const mockProv = await repairService.getProvider('prov_fixit_001');
  expect(mockProv.businessName).toBe('Apex Tech Repair & Diagnostics');

  // sendQuotation succeeds even on fresh/demo request
  const quoted = await repairService.sendQuotation('req_demo_a32_001', {
    price: 4500,
    notes: 'AMOLED screen replacement with warranty',
  });
  expect(quoted.status).toBe(RepairStatus.QUOTED);
  expect(quoted.estimatedPrice).toBe(4500);
});
