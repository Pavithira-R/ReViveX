/**
 * Member 6 – Ratings and reviews on the fake Firestore (`reviews` collection):
 * the service rules, the "Leave a review" screen and "My reviews" from the profile.
 */
import React from 'react';
import ReactTestRenderer, { ReactTestInstance } from 'react-test-renderer';
import { Text } from 'react-native';
import App from '../App';
import { WriteReviewScreen } from '../src/screens';
import { ApiError, reviewService } from '../src/services';

const { __fake } = require('../jest.firebase');

const profile = (id: string, name: string, email: string, role: string) => ({
  id,
  name,
  email,
  role,
  phone: null,
  profileImage: null,
  latitude: null,
  longitude: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const owner = profile('a-owner', 'Nimal Perera', 'nimal@example.com', 'ITEM_OWNER');
const tech = profile('b-tech', 'Kasun Repairs', 'kasun@example.com', 'SERVICE_PROVIDER');

const allText = (root: ReactTestInstance): string =>
  root
    .findAllByType(Text)
    .map((node) => node.props.children)
    .flat(Infinity)
    .filter((child) => typeof child === 'string' || typeof child === 'number')
    .join(' ');

const button = (root: ReactTestInstance, label: string) =>
  root.findAll(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function' &&
      (allText(node) === label || node.props.accessibilityLabel === label)
  )[0];

const press = async (root: ReactTestInstance, label: string) => {
  await ReactTestRenderer.act(async () => {
    button(root, label).props.onPress();
  });
};

const signInAs = (email: string) => require('firebase/auth').signInWithEmailAndPassword(null, email, 'Password123');

let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

beforeEach(() => {
  __fake.addAccount(owner, 'Password123');
  __fake.addAccount(tech, 'Password123');
});

afterEach(async () => {
  await ReactTestRenderer.act(async () => renderer?.unmount());
  renderer = undefined;
});

describe('reviewService', () => {
  test('saves one review per activity and notifies the reviewed person', async () => {
    await signInAs(owner.email);
    const review = await reviewService.create({
      revieweeId: 'b-tech',
      refType: 'REPAIR',
      refId: 'rq1',
      rating: 5,
      comment: '  Fixed my laptop in a day!  ',
    });

    expect(review).toMatchObject({ id: 'REPAIR_rq1_a-owner', reviewerName: 'Nimal Perera', comment: 'Fixed my laptop in a day!' });
    expect(await reviewService.hasReviewed('REPAIR', 'rq1')).toBe(true);
    expect(__fake.docsIn('notifications')).toEqual([
      expect.objectContaining({ userId: 'b-tech', type: 'REVIEW', message: 'Nimal Perera gave you 5 stars.' }),
    ]);

    const again = await reviewService
      .create({ revieweeId: 'b-tech', refType: 'REPAIR', refId: 'rq1', rating: 1 })
      .catch((e: unknown) => e as ApiError);
    expect(again).toMatchObject({ status: 409, message: 'You have already reviewed this' });
    expect(__fake.getDoc('reviews/REPAIR_rq1_a-owner').rating).toBe(5);
  });

  test('rejects a missing rating and reviewing yourself', async () => {
    await signInAs(owner.email);
    const error = await reviewService
      .create({ revieweeId: 'a-owner', refType: 'LISTING', refId: 'l1', rating: 0 })
      .catch((e: unknown) => e as ApiError);

    expect((error as ApiError).details).toEqual(['Please choose a rating from 1 to 5 stars', 'You cannot review yourself']);
    expect(__fake.docsIn('reviews')).toEqual([]);
  });

  test('summarises the reviews a user received', async () => {
    const base = { reviewerId: 'x', reviewerName: 'X', revieweeId: 'b-tech', refType: 'REPAIR', comment: null };
    __fake.setDoc('reviews/r1', { ...base, refId: '1', rating: 5, createdAt: '2026-11-01T00:00:00.000Z' });
    __fake.setDoc('reviews/r2', { ...base, refId: '2', rating: 4, createdAt: '2026-11-03T00:00:00.000Z' });
    __fake.setDoc('reviews/r3', { ...base, refId: '3', rating: 4, createdAt: '2026-11-02T00:00:00.000Z' });
    __fake.setDoc('reviews/r4', { ...base, revieweeId: 'someone-else', refId: '4', rating: 1, createdAt: '2026-11-04T00:00:00.000Z' });

    const summary = await reviewService.listFor('b-tech');

    expect(summary).toMatchObject({ averageRating: 4.3, totalReviews: 3, breakdown: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 } });
    expect(summary.reviews.map((r) => r.refId)).toEqual(['2', '3', '1']); // newest first
  });
});

describe('Leave a review screen', () => {
  const renderWriteReview = async () => {
    await signInAs(owner.email);
    const onBack = jest.fn();
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <WriteReviewScreen
          target={{ revieweeId: 'b-tech', revieweeName: 'Kasun Repairs', refType: 'REPAIR', refId: 'rq1', subject: 'Laptop screen repair' }}
          onBack={onBack}
        />
      );
    });
    return { root: renderer!.root, onBack };
  };

  test('asks for a rating before submitting', async () => {
    const { root } = await renderWriteReview();

    await press(root, 'Submit review');

    expect(allText(root)).toContain('Please choose a rating from 1 to 5 stars.');
    expect(__fake.docsIn('reviews')).toEqual([]);
  });

  test('saves the stars and comment, then offers Done', async () => {
    const { root, onBack } = await renderWriteReview();
    expect(allText(root)).toContain('Laptop screen repair');

    await press(root, '4 stars');
    expect(allText(root)).toContain('Good');
    await ReactTestRenderer.act(async () => {
      root.findAll((n) => n.props.accessibilityLabel === 'Comment (optional)' && !!n.props.onChangeText)[0].props.onChangeText('Quick and friendly');
    });
    await press(root, 'Submit review');

    expect(__fake.getDoc('reviews/REPAIR_rq1_a-owner')).toMatchObject({ rating: 4, comment: 'Quick and friendly' });
    expect(allText(root)).toContain('Thanks! Your review of Kasun Repairs was saved.');

    await press(root, 'Done');
    expect(onBack).toHaveBeenCalled();
  });
});

test('"My reviews" on the profile shows the average and each review', async () => {
  __fake.setDoc('reviews/REPAIR_rq1_a-owner', {
    reviewerId: 'a-owner',
    reviewerName: 'Nimal Perera',
    revieweeId: 'b-tech',
    refType: 'REPAIR',
    refId: 'rq1',
    rating: 5,
    comment: 'Fixed my laptop in a day!',
    createdAt: '2026-11-14T10:00:00.000Z',
  });
  await signInAs(tech.email);
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer!.root;

  await press(root, 'My Profile');
  await press(root, 'My reviews');

  const text = allText(root);
  expect(text).toContain('My reviews');
  expect(text).toContain('5.0');
  expect(text).toMatch(/1\s+review/);
  expect(text).toContain('Fixed my laptop in a day!');
});
