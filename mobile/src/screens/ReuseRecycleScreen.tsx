import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  listListings,
  listMyListings,
  listMyItems,
  listMyRecyclingRequests,
  listMyTransactions,
  createListing as createFirebaseListing,
  createOffer,
  listOffers,
  respondToOffer,
  createRecyclingRequest,
  updateRecyclingRequest,
} from '../services/reuseRecycle.service';
import { useAuth } from '../context';

type ListingType = 'REUSE' | 'SELL' | 'DONATE';

type MyItem = {
  id: string;
  name: string;
  condition: string;
  action: string;
  category?: {
    id: string;
    name: string;
  };
};

type Listing = {
  id: string;
  itemId?: string;
  title: string;
  description?: string;
  category: string;
  condition?: string;
  type: ListingType;
  price?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  owner: {
    id: string;
    name: string;
  };
};

type Offer = {
  id: string;
  amount?: number;
  message?: string;
  status: string;
  buyer?: {
    name: string;
  };
};

type RecyclingRequest = {
  id: string;
  itemId?: string;
  itemName: string;
  category: string;
  quantity: number;
  pickupAddress: string;
  notes?: string | null;
  status: string;
  owner?: {
    name: string;
  };
  recycler?: {
    name: string;
  };
};

type Transaction = {
  id: string;
  kind: 'LISTING' | 'RECYCLING';
  refId: string;
  fromUserId: string;
  toUserId: string;
  completedAt: string;
  fromUser?: { name: string };
  toUser?: { name: string } | null;
  listing?: { title: string } | null;
  offer?: Offer | null;
  recyclingRequest?: { itemName: string } | null;
};

type Tab =
  | 'BROWSE'
  | 'CREATE'
  | 'OFFERS'
  | 'RECYCLE'
  | 'TRANSACTIONS';

const Button = ({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    disabled={disabled}
    onPress={onPress}
    style={[styles.button, disabled && styles.disabled]}
  >
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>
);

export const ReuseRecycleScreen: React.FC<{
  onBack?: () => void;
  onLeaveReview?: (target: { revieweeId: string; revieweeName: string; refType: 'LISTING' | 'RECYCLING'; refId: string; subject?: string }) => void;
  initialTab?: Tab;
  initialActionType?: ListingType | 'RECYCLE';
}> = ({ onBack, onLeaveReview, initialTab, initialActionType }) => {
  const { user, hasRole } = useAuth();

  const [tab, setTab] = useState<Tab>(() => {
    if (initialTab) return initialTab;
    if (initialActionType === 'RECYCLE') return 'RECYCLE';
    if (initialActionType === 'SELL' || initialActionType === 'DONATE') return 'CREATE';
    return 'BROWSE';
  });

  const [type, setType] = useState<ListingType>(() => {
    if (initialActionType === 'SELL' || initialActionType === 'DONATE' || initialActionType === 'REUSE') {
      return initialActionType;
    }
    return 'REUSE';
  });

  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myItems, setMyItems] = useState<MyItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [requests, setRequests] = useState<RecyclingRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [busy, setBusy] = useState(false);

  // Listing form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [itemId, setItemId] = useState('');
  const [price, setPrice] = useState('');

  // Offer form
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [selectedListing, setSelectedListing] =
    useState<Listing | null>(null);

  // Recycling form
  const [itemName, setItemName] = useState('');
  const [recycleCategory, setRecycleCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [acknowledged, setAcknowledged] = useState(false);

  // -------------------------
  // LOAD LISTINGS
  // -------------------------

  const loadListings = useCallback(async () => {
    setBusy(true);
    try {
      const result = await listListings(type);
      setListings(result);
    } catch (error) {
      Alert.alert('Could not load listings', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }, [type]);

  // -------------------------
  // LOAD MY LISTINGS
  // -------------------------

  const loadMyListings = async () => {
    if (!user) return;
    try {
      setMyListings(await listMyListings(user.id));
    } catch (error) {
      Alert.alert('Could not load your listings', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // -------------------------
  // LOAD MY POSTED ITEMS
  // -------------------------

  const loadMyItems = async () => {
    if (!user) return;
    try {
      setMyItems(await listMyItems(user.id));
    } catch (error) {
      Alert.alert('Could not load your items', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // -------------------------
  // LOAD RECYCLING REQUESTS
  // -------------------------

  const loadRequests = async () => {
    if (!user) return;
    try {
      setRequests(await listMyRecyclingRequests(user.id));
    } catch (error) {
      Alert.alert('Could not load recycling requests', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // -------------------------
  // LOAD TRANSACTIONS
  // -------------------------

  const loadTransactions = async () => {
    if (!user) return;
    try {
      setTransactions(await listMyTransactions(user.id));
    } catch (error) {
      Alert.alert('Could not load transactions', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  useEffect(() => {
    if (tab === 'BROWSE') loadListings();
    if (tab === 'CREATE' || tab === 'RECYCLE') loadMyItems();
    if (tab === 'OFFERS') loadMyListings();
    if (tab === 'RECYCLE') loadRequests();
    if (tab === 'TRANSACTIONS') loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, loadListings]);

  // -------------------------
  // CREATE LISTING
  // -------------------------

  const createListing = async () => {
    if (!user) return;

    if (!title.trim() || !category.trim()) {
      Alert.alert('Missing details', 'Enter a title and category.');
      return;
    }

    if (!acknowledged) {
      Alert.alert('Data protection', 'Please confirm the data protection checklist first.');
      return;
    }

    let parsedPrice: number | undefined;

    if (type === 'SELL') {
      parsedPrice = Number(price);
      if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        Alert.alert('Invalid price', 'Enter a selling price greater than zero.');
        return;
      }
    }

    setBusy(true);
    try {
      await createFirebaseListing(user, {
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        condition: condition.trim() || undefined,
        itemId: itemId.trim() || undefined,
        type,
        ...(type === 'SELL' ? { price: parsedPrice } : {}),
      });

      Alert.alert('Success', 'Your listing has been created.');
      setTitle('');
      setDescription('');
      setCategory('');
      setCondition('');
      setItemId('');
      setPrice('');
      setAcknowledged(false);
      setTab('BROWSE');
    } catch (error) {
      Alert.alert('Could not create listing', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // -------------------------
  // MAKE OFFER
  // -------------------------

  const makeOffer = async () => {
    if (!user || !selectedListing) return;

    const parsedAmount = amount.trim() ? Number(amount) : undefined;

    if (
      selectedListing.type === 'SELL' &&
      (parsedAmount === undefined || !Number.isFinite(parsedAmount) || parsedAmount <= 0)
    ) {
      Alert.alert('Invalid amount', 'Enter a valid offer amount.');
      return;
    }

    try {
      await createOffer(user, selectedListing, parsedAmount, message.trim() || undefined);
      Alert.alert('Success', 'Your offer has been submitted.');
      setSelectedListing(null);
      setAmount('');
      setMessage('');
    } catch (error) {
      Alert.alert('Offer failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // -------------------------
  // VIEW OFFERS
  // -------------------------

  const loadOffers = async (listing: Listing) => {
    if (!user) return;
    try {
      const result = await listOffers(listing.id, user.id);
      setOffers(result);
      setSelectedListing(listing);
    } catch (error) {
      Alert.alert('Could not load offers', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // -------------------------
  // ACCEPT / REJECT OFFER
  // -------------------------

  const respondOffer = async (
    offerId: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) => {
    if (!user) return;
    try {
      await respondToOffer(offerId, user.id, status);
      Alert.alert('Updated', `Offer ${status.toLowerCase()}.`);

      if (selectedListing) await loadOffers(selectedListing);
      await loadTransactions();
      await loadMyListings();
    } catch (error) {
      Alert.alert('Could not update offer', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // -------------------------
  // CREATE RECYCLING REQUEST
  // -------------------------

  const createRecycleRequest = async () => {
    if (!user) return;

    if (!itemName.trim() || !recycleCategory.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Enter the item name, category and pickup address.');
      return;
    }

    if (!acknowledged) {
      Alert.alert('Data protection', 'Please confirm the data protection checklist first.');
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      Alert.alert('Invalid quantity', 'Quantity must be at least one.');
      return;
    }

    try {
      await createRecyclingRequest(user, {
        itemId: itemId.trim() || undefined,
        itemName: itemName.trim(),
        category: recycleCategory.trim(),
        quantity: parsedQuantity,
        pickupAddress: address.trim(),
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Recycling pickup requested.');
      setItemName('');
      setRecycleCategory('');
      setQuantity('1');
      setItemId('');
      setAddress('');
      setNotes('');
      setAcknowledged(false);
      await loadRequests();
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  // -------------------------
  // UPDATE RECYCLING STATUS
  // -------------------------

  const updateRecycle = async (
    id: string,
    status: 'ACCEPTED' | 'COLLECTED' | 'COMPLETED',
  ) => {
    if (!user) return;
    try {
      await updateRecyclingRequest(id, user, status);
      Alert.alert('Success', `Request marked ${status.toLowerCase()}.`);
      await loadRequests();

      if (status === 'COMPLETED') await loadTransactions();
    } catch (error) {
      Alert.alert('Could not update request', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  // -------------------------
  // DATA PROTECTION CHECKLIST
  // -------------------------

  const DataChecklist = () => (
    <View style={styles.checklist}>
      <Text style={styles.subheading}>Data protection checklist</Text>

      {[
        'Back up your files',
        'Sign out of all accounts',
        'Remove your SIM card',
        'Remove your memory card',
        'Factory reset your device',
      ].map((value) => (
        <Text key={value} style={styles.checkText}>
          - {value}
        </Text>
      ))}

      <TouchableOpacity
        onPress={() => setAcknowledged(!acknowledged)}
        style={styles.ackRow}
      >
        <Text style={styles.checkBox}>
          {acknowledged ? '[X]' : '[ ]'}
        </Text>

        <Text style={styles.body}>
          I have completed / understood these steps.
        </Text>
      </TouchableOpacity>
    </View>
  );

  // -------------------------
  // MAIN SCREEN
  // -------------------------

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        {onBack ? <Button label="Back" onPress={onBack} /> : null}

        <Text style={styles.title}>
          Reuse | Sell | Donate | Recycle
        </Text>

        <Text style={styles.body}>
          Signed in as {user?.name ?? 'User'}
        </Text>
      </View>

      {/* MAIN TABS */}

      <View style={styles.tabs}>
        {(
          [
            'BROWSE',
            'CREATE',
            'OFFERS',
            'RECYCLE',
            'TRANSACTIONS',
          ] as Tab[]
        ).map((value) => (
          <TouchableOpacity
            key={value}
            onPress={() => {
              setTab(value);
              setSelectedListing(null);
            }}
            style={[styles.tab, tab === value && styles.activeTab]}
          >
            <Text style={styles.tabText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* BROWSE LISTINGS */}

      {tab === 'BROWSE' && (
        <>
          <View style={styles.tabs}>
            {(['REUSE', 'SELL', 'DONATE'] as ListingType[]).map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setType(value)}
                style={[styles.tab, type === value && styles.activeTab]}
              >
                <Text style={styles.tabText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {busy ? <ActivityIndicator size="large" /> : null}

          {!busy && listings.length === 0 ? (
            <Text style={styles.body}>No listings available yet.</Text>
          ) : null}

          {listings.map((listing) => (
            <View key={listing.id} style={styles.card}>
              <Text style={styles.subheading}>{listing.title}</Text>

              <Text style={styles.body}>
                Type: {listing.type}
              </Text>

              <Text style={styles.body}>
                Category: {listing.category}
              </Text>

              {listing.description ? (
                <Text style={styles.body}>{listing.description}</Text>
              ) : null}

              {listing.condition ? (
                <Text style={styles.body}>
                  Condition: {listing.condition}
                </Text>
              ) : null}

              {listing.itemId ? (
                <Text style={styles.body}>
                  Item ID: {listing.itemId}
                </Text>
              ) : null}

              <Text style={styles.body}>
                Owner: {listing.owner?.name ?? 'Member'}
              </Text>

              {listing.price != null ? (
                <Text style={styles.body}>
                  Price: {listing.price}
                </Text>
              ) : null}

              {listing.owner?.id === user?.id ? (
                <Button
                  label="View offers"
                  onPress={() => loadOffers(listing)}
                />
              ) : (
                <Button
                  label="Make an offer"
                  onPress={() => {
                    setSelectedListing(listing);
                    setAmount('');
                    setMessage('');
                  }}
                />
              )}
            </View>
          ))}

          {/* MAKE OFFER FORM */}

          {selectedListing &&
          selectedListing.owner?.id !== user?.id ? (
            <View style={styles.card}>
              <Text style={styles.subheading}>
                Make an offer
              </Text>

              <Text style={styles.body}>
                Listing: {selectedListing.title}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Offer amount (required for Sell)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              <TextInput
                style={styles.input}
                placeholder="Message (optional)"
                value={message}
                onChangeText={setMessage}
              />

              <Button label="Submit offer" onPress={makeOffer} />

              <Button
                label="Cancel"
                onPress={() => setSelectedListing(null)}
              />
            </View>
          ) : null}

          {/* VIEW OFFERS */}

          {selectedListing &&
          selectedListing.owner?.id === user?.id ? (
            <View style={styles.card}>
              <Text style={styles.subheading}>
                Offers for {selectedListing.title}
              </Text>

              {offers.length === 0 ? (
                <Text style={styles.body}>No offers received yet.</Text>
              ) : null}

              {offers.map((offer) => (
                <View key={offer.id} style={styles.innerCard}>
                  <Text style={styles.body}>
                    Buyer: {offer.buyer?.name ?? 'Buyer'}
                  </Text>

                  <Text style={styles.body}>
                    Amount: {offer.amount ?? 'No amount'}
                  </Text>

                  <Text style={styles.body}>
                    Status: {offer.status}
                  </Text>

                  {offer.message ? (
                    <Text style={styles.body}>{offer.message}</Text>
                  ) : null}

                  {offer.status === 'PENDING' ? (
                    <View style={styles.row}>
                      <Button
                        label="Accept"
                        onPress={() => respondOffer(offer.id, 'ACCEPTED')}
                      />

                      <Button
                        label="Reject"
                        onPress={() => respondOffer(offer.id, 'REJECTED')}
                      />
                    </View>
                  ) : null}
                </View>
              ))}

              <Button
                label="Close"
                onPress={() => setSelectedListing(null)}
              />
            </View>
          ) : null}
        </>
      )}

      {/* CREATE LISTING */}

      {tab === 'CREATE' && (
        <View style={styles.card}>
          <Text style={styles.subheading}>Create a listing</Text>

          <Text style={styles.body}>
            Select one of your posted items to link it to this listing.
          </Text>

          <Text style={styles.body}>Your posted items:</Text>

          {myItems.length === 0 ? (
            <Text style={styles.body}>You have no posted items yet.</Text>
          ) : null}

          {myItems.map((item) => (
            <Button
              key={item.id}
              label={`${item.name} (${item.category?.name ?? 'No category'})${itemId === item.id ? ' ? Selected' : ''}`}
              onPress={() => {
                setItemId(item.id);
                setTitle(item.name);
                setCategory(item.category?.name ?? '');
                setCondition(item.condition);
              }}
            />
          ))}

          <Button
            label="Create without linking an item"
            onPress={() => setItemId('')}
          />

          <TextInput
            style={styles.input}
            placeholder="Listing title"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Category (e.g. Electronics, Furniture)"
            value={category}
            onChangeText={setCategory}
          />

          <TextInput
            style={styles.input}
            placeholder="Condition (e.g. New, Used)"
            value={condition}
            onChangeText={setCondition}
          />

          {itemId ? (
            <Text style={styles.body}>Linked item ID: {itemId}</Text>
          ) : (
            <Text style={styles.body}>No item linked.</Text>
          )}

          <Text style={styles.body}>Select listing type:</Text>

          <View style={styles.tabs}>
            {(['REUSE', 'SELL', 'DONATE'] as ListingType[]).map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => setType(value)}
                style={[styles.tab, type === value && styles.activeTab]}
              >
                <Text style={styles.tabText}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'SELL' ? (
            <TextInput
              style={styles.input}
              placeholder="Selling price"
              keyboardType="decimal-pad"
              value={price}
              onChangeText={setPrice}
            />
          ) : null}

          <DataChecklist />

          <Button
            label={busy ? 'Publishing...' : 'Publish listing'}
            disabled={busy || !acknowledged}
            onPress={createListing}
          />
        </View>
      )}

      {/* OFFERS */}

      {tab === 'OFFERS' && (
        <View style={styles.card}>
          <Text style={styles.subheading}>Manage your offers</Text>

          <Text style={styles.body}>
            Select one of your listings to see the offers received.
          </Text>

          {myListings.length === 0 ? (
            <Text style={styles.body}>You have no active listings.</Text>
          ) : null}

          {myListings.map((listing) => (
            <View key={listing.id} style={styles.innerCard}>
              <Text style={styles.subheading}>{listing.title}</Text>

              <Text style={styles.body}>
                Type: {listing.type}
              </Text>

              <Button
                label="View offers"
                onPress={() => loadOffers(listing)}
              />
            </View>
          ))}

          {selectedListing &&
          selectedListing.owner?.id === user?.id ? (
            <View>
              <Text style={styles.subheading}>
                Offers for {selectedListing.title}
              </Text>

              {offers.length === 0 ? (
                <Text style={styles.body}>No offers received.</Text>
              ) : null}

              {offers.map((offer) => (
                <View key={offer.id} style={styles.innerCard}>
                  <Text style={styles.body}>
                    Buyer: {offer.buyer?.name ?? 'Buyer'}
                  </Text>

                  <Text style={styles.body}>
                    Amount: {offer.amount ?? 'No amount'}
                  </Text>

                  <Text style={styles.body}>
                    Status: {offer.status}
                  </Text>

                  {offer.message ? (
                    <Text style={styles.body}>{offer.message}</Text>
                  ) : null}

                  {offer.status === 'PENDING' ? (
                    <View style={styles.row}>
                      <Button
                        label="Accept"
                        onPress={() => respondOffer(offer.id, 'ACCEPTED')}
                      />

                      <Button
                        label="Reject"
                        onPress={() => respondOffer(offer.id, 'REJECTED')}
                      />
                    </View>
                  ) : null}
                </View>
              ))}

              <Button
                label="Close offers"
                onPress={() => setSelectedListing(null)}
              />
            </View>
          ) : null}
        </View>
      )}

      {/* RECYCLING */}

      {tab === 'RECYCLE' && (
        <>
          <View style={styles.card}>
            <Text style={styles.subheading}>
              Request recycling pickup
            </Text>

            <Text style={styles.body}>
              Select one of your posted items:
            </Text>

            {myItems.length === 0 ? (
              <Text style={styles.body}>You have no posted items yet.</Text>
            ) : null}

            {myItems.map((item) => (
              <Button
                key={item.id}
                label={`${item.name} (${item.category?.name ?? 'No category'})${itemId === item.id ? ' ? Selected' : ''}`}
                onPress={() => {
                  setItemId(item.id);
                  setItemName(item.name);
                  setRecycleCategory(item.category?.name ?? '');
                }}
              />
            ))}

            <Button
              label="Request without linking an item"
              onPress={() => setItemId('')}
            />

            <TextInput
              style={styles.input}
              placeholder="Item name"
              value={itemName}
              onChangeText={setItemName}
            />

            <TextInput
              style={styles.input}
              placeholder="Category"
              value={recycleCategory}
              onChangeText={setRecycleCategory}
            />

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />

            {itemId ? (
              <Text style={styles.body}>Linked item ID: {itemId}</Text>
            ) : (
              <Text style={styles.body}>No item linked.</Text>
            )}

            <TextInput
              style={styles.input}
              placeholder="Pickup address"
              value={address}
              onChangeText={setAddress}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Additional notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <DataChecklist />

            <Button
              label="Request pickup"
              disabled={!acknowledged}
              onPress={createRecycleRequest}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.subheading}>
              {hasRole('RECYCLER')
                ? 'Available recycling requests'
                : 'My recycling requests'}
            </Text>

            {requests.length === 0 ? (
              <Text style={styles.body}>No recycling requests found.</Text>
            ) : null}

            {requests.map((request) => (
              <View key={request.id} style={styles.innerCard}>
                <Text style={styles.subheading}>
                  {request.itemName}
                </Text>

                <Text style={styles.body}>
                  Category: {request.category}
                </Text>

                <Text style={styles.body}>
                  Quantity: {request.quantity}
                </Text>

                <Text style={styles.body}>
                  Address: {request.pickupAddress}
                </Text>

                <Text style={styles.body}>
                  Status: {request.status}
                </Text>

                {request.owner ? (
                  <Text style={styles.body}>
                    Owner: {request.owner.name}
                  </Text>
                ) : null}

                {request.recycler ? (
                  <Text style={styles.body}>
                    Recycler: {request.recycler.name}
                  </Text>
                ) : null}

                {hasRole('RECYCLER') &&
                request.status === 'REQUESTED' ? (
                  <Button
                    label="Accept pickup"
                    onPress={() => updateRecycle(request.id, 'ACCEPTED')}
                  />
                ) : null}

                {hasRole('RECYCLER') &&
                request.status === 'ACCEPTED' ? (
                  <Button
                    label="Mark collected"
                    onPress={() => updateRecycle(request.id, 'COLLECTED')}
                  />
                ) : null}

                {hasRole('RECYCLER') &&
                request.status === 'COLLECTED' ? (
                  <Button
                    label="Complete request"
                    onPress={() => updateRecycle(request.id, 'COMPLETED')}
                  />
                ) : null}
              </View>
            ))}
          </View>
        </>
      )}

      {/* TRANSACTIONS */}

      {tab === 'TRANSACTIONS' && (
        <View style={styles.card}>
          <Text style={styles.subheading}>My transactions</Text>

          {transactions.length === 0 ? (
            <Text style={styles.body}>No transactions recorded yet.</Text>
          ) : null}

          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.innerCard}>
              <Text style={styles.subheading}>
                Transaction
              </Text>

              {transaction.listing ? (
                <Text style={styles.body}>
                  Listing: {transaction.listing.title}
                </Text>
              ) : null}

              {transaction.recyclingRequest ? (
                <Text style={styles.body}>
                  Recycling: {transaction.recyclingRequest.itemName}
                </Text>
              ) : null}

              <Text style={styles.body}>
                From: {transaction.fromUser?.name ?? 'Member'}
              </Text>

              <Text style={styles.body}>
                To: {transaction.toUser?.name ?? 'Not specified'}
              </Text>

              <Text style={styles.body}>
                Completed: {new Date(
                  transaction.completedAt,
                ).toLocaleString()}
              </Text>

              <Button
                label="Leave a review"
                onPress={() => {
                  if (!user) return;

                  const revieweeId =
                    transaction.fromUserId === user.id
                      ? transaction.toUserId
                      : transaction.fromUserId;

                  if (!revieweeId || revieweeId === user.id) return;

                  onLeaveReview?.({
                    revieweeId,
                    revieweeName: 'Transaction participant',
                    refType: transaction.kind,
                    refId: transaction.refId,
                    subject:
                      transaction.listing?.title ??
                      transaction.recyclingRequest?.itemName ??
                      'Completed transaction',
                  });
                }}
              />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

// -------------------------
// STYLES
// -------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F8F7',
  },

  container: {
    padding: 16,
    paddingBottom: 50,
  },

  header: {
    marginBottom: 16,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#173D32',
    marginVertical: 8,
  },

  body: {
    fontSize: 14,
    color: '#333',
    marginVertical: 3,
  },

  subheading: {
    fontSize: 17,
    fontWeight: '700',
    color: '#173D32',
    marginBottom: 8,
  },

  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },

  tab: {
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 8,
    backgroundColor: '#E4EAE7',
  },

  activeTab: {
    backgroundColor: '#B9D9CA',
  },

  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#173D32',
  },

  card: {
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE5E0',
  },

  innerCard: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#F5F7F5',
    borderRadius: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#C8D2CC',
    borderRadius: 8,
    padding: 11,
    marginVertical: 7,
    color: '#222',
  },

  button: {
    padding: 11,
    marginVertical: 5,
    backgroundColor: '#1E6B50',
    borderRadius: 8,
    alignItems: 'center',
  },

  disabled: {
    opacity: 0.45,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: '700',
  },

  checklist: {
    backgroundColor: '#F0F5F1',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
  },

  checkText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 2,
  },

  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  checkBox: {
    fontSize: 18,
    marginRight: 8,
    color: '#1E6B50',
  },

  row: {
    flexDirection: 'row',
    gap: 8,
  },
});








