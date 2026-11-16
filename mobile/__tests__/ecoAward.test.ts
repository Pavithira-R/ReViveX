/**
 * Member 6 – notify() and awardEcoPoints(), used by the Items, Repair and
 * Reuse/Recycle modules when something is completed (fake Firebase).
 */
import { awardEcoPoints, notify } from '../src/services';
import { badgeFor, nextBadgeFor, normalizeDeviceCategory } from '../src/utils/eco';

const { __fake } = require('../jest.firebase');

test('awardEcoPoints saves the activity once and notifies the user', async () => {
  const first = await awardEcoPoints('user-1', 'RECYCLE', 'pickup-9', 'Laptop');
  const again = await awardEcoPoints('user-1', 'RECYCLE', 'pickup-9', 'Laptop');

  expect(first).toEqual({ awarded: true, points: 30 });
  expect(again).toEqual({ awarded: false, points: 0 });
  expect(__fake.getDoc('ecoActions/RECYCLE_pickup-9')).toMatchObject({
    userId: 'user-1',
    type: 'RECYCLE',
    points: 30,
    deviceCategory: 'LAPTOP',
    co2SavedKg: 45,
    ewasteKg: 2,
  });
  expect(__fake.docsIn('notifications')).toEqual([
    expect.objectContaining({
      userId: 'user-1',
      type: 'ECO',
      refId: 'pickup-9',
      title: 'Eco points earned',
      message: '+30 points for recycling a device. About 45 kg CO2 saved.',
      isRead: false,
    }),
  ]);
});

test('notify never throws, even without a connection', async () => {
  __fake.setOffline(true);
  await expect(notify('user-1', 'Hello', 'Test')).resolves.toBe(false);
});

test('eco rules match the old backend', () => {
  expect(normalizeDeviceCategory('Battery charger')).toBe('BATTERY_CHARGER');
  expect(normalizeDeviceCategory('toaster')).toBe('OTHER');
  expect(badgeFor(149)).toBe('BRONZE');
  expect(badgeFor(300)).toBe('GOLD');
  expect(nextBadgeFor(120)).toEqual({ badge: 'SILVER', pointsNeeded: 30 });
});
