const express = require("express");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| TEMPORARY DATA STORAGE
|--------------------------------------------------------------------------
| This is used for testing the feature before connecting everything
| permanently to the project's database.
|
| Data will reset when the server restarts.
|--------------------------------------------------------------------------
*/

let reuseItems = [];
let sellItems = [];
let donateItems = [];
let offers = [];
let recyclingRequests = [];
let transactions = [];


// ================================================================
// REUSE
// ================================================================

// GET all reuse items
router.get("/reuse", (req, res) => {
  res.json({
    success: true,
    count: reuseItems.length,
    data: reuseItems
  });
});


// CREATE reuse item
router.post("/reuse", (req, res) => {
  const {
    userId,
    title,
    description,
    category,
    condition,
    imageUrl
  } = req.body;

  if (!userId || !title || !category) {
    return res.status(400).json({
      success: false,
      message: "userId, title and category are required"
    });
  }

  const item = {
    id: reuseItems.length + 1,
    userId,
    title,
    description: description || "",
    category,
    condition: condition || "Good",
    imageUrl: imageUrl || "",
    status: "AVAILABLE",
    createdAt: new Date().toISOString()
  };

  reuseItems.push(item);

  res.status(201).json({
    success: true,
    message: "Reuse item created successfully",
    data: item
  });
});


// GET single reuse item
router.get("/reuse/:id", (req, res) => {
  const item = reuseItems.find(
    item => item.id === Number(req.params.id)
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Reuse item not found"
    });
  }

  res.json({
    success: true,
    data: item
  });
});


// UPDATE reuse item
router.put("/reuse/:id", (req, res) => {
  const item = reuseItems.find(
    item => item.id === Number(req.params.id)
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Reuse item not found"
    });
  }

  Object.assign(item, req.body);

  res.json({
    success: true,
    message: "Reuse item updated successfully",
    data: item
  });
});


// DELETE reuse item
router.delete("/reuse/:id", (req, res) => {
  const index = reuseItems.findIndex(
    item => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Reuse item not found"
    });
  }

  reuseItems.splice(index, 1);

  res.json({
    success: true,
    message: "Reuse item deleted successfully"
  });
});


// ================================================================
// SELL
// ================================================================

// GET all sell listings
router.get("/sell", (req, res) => {
  res.json({
    success: true,
    count: sellItems.length,
    data: sellItems
  });
});


// CREATE sell listing
router.post("/sell", (req, res) => {
  const {
    userId,
    title,
    description,
    category,
    price,
    condition,
    imageUrl
  } = req.body;

  if (!userId || !title || !category || price === undefined) {
    return res.status(400).json({
      success: false,
      message: "userId, title, category and price are required"
    });
  }

  const item = {
    id: sellItems.length + 1,
    userId,
    title,
    description: description || "",
    category,
    price: Number(price),
    condition: condition || "Good",
    imageUrl: imageUrl || "",
    status: "AVAILABLE",
    createdAt: new Date().toISOString()
  };

  sellItems.push(item);

  res.status(201).json({
    success: true,
    message: "Sell listing created successfully",
    data: item
  });
});


// GET single sell listing
router.get("/sell/:id", (req, res) => {
  const item = sellItems.find(
    item => item.id === Number(req.params.id)
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Sell listing not found"
    });
  }

  res.json({
    success: true,
    data: item
  });
});


// UPDATE sell listing
router.put("/sell/:id", (req, res) => {
  const item = sellItems.find(
    item => item.id === Number(req.params.id)
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Sell listing not found"
    });
  }

  Object.assign(item, req.body);

  res.json({
    success: true,
    message: "Sell listing updated successfully",
    data: item
  });
});


// DELETE sell listing
router.delete("/sell/:id", (req, res) => {
  const index = sellItems.findIndex(
    item => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Sell listing not found"
    });
  }

  sellItems.splice(index, 1);

  res.json({
    success: true,
    message: "Sell listing deleted successfully"
  });
});


// ================================================================
// DONATE
// ================================================================

// GET donations
router.get("/donate", (req, res) => {
  res.json({
    success: true,
    count: donateItems.length,
    data: donateItems
  });
});


// CREATE donation
router.post("/donate", (req, res) => {
  const {
    userId,
    title,
    description,
    category,
    condition,
    organization,
    imageUrl
  } = req.body;

  if (!userId || !title || !category) {
    return res.status(400).json({
      success: false,
      message: "userId, title and category are required"
    });
  }

  const item = {
    id: donateItems.length + 1,
    userId,
    title,
    description: description || "",
    category,
    condition: condition || "Good",
    organization: organization || "",
    imageUrl: imageUrl || "",
    status: "AVAILABLE",
    createdAt: new Date().toISOString()
  };

  donateItems.push(item);

  res.status(201).json({
    success: true,
    message: "Donation created successfully",
    data: item
  });
});


// GET single donation
router.get("/donate/:id", (req, res) => {
  const item = donateItems.find(
    item => item.id === Number(req.params.id)
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Donation not found"
    });
  }

  res.json({
    success: true,
    data: item
  });
});


// UPDATE donation
router.put("/donate/:id", (req, res) => {
  const item = donateItems.find(
    item => item.id === Number(req.params.id)
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Donation not found"
    });
  }

  Object.assign(item, req.body);

  res.json({
    success: true,
    message: "Donation updated successfully",
    data: item
  });
});


// DELETE donation
router.delete("/donate/:id", (req, res) => {
  const index = donateItems.findIndex(
    item => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Donation not found"
    });
  }

  donateItems.splice(index, 1);

  res.json({
    success: true,
    message: "Donation deleted successfully"
  });
});


// ================================================================
// OFFERS
// ================================================================

// GET offers
router.get("/offers", (req, res) => {
  res.json({
    success: true,
    count: offers.length,
    data: offers
  });
});


// CREATE offer
router.post("/offers", (req, res) => {
  const {
    itemId,
    buyerId,
    sellerId,
    amount,
    message
  } = req.body;

  if (
    !itemId ||
    !buyerId ||
    !sellerId ||
    amount === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "itemId, buyerId, sellerId and amount are required"
    });
  }

  const offer = {
    id: offers.length + 1,
    itemId,
    buyerId,
    sellerId,
    amount: Number(amount),
    message: message || "",
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  offers.push(offer);

  res.status(201).json({
    success: true,
    message: "Offer created successfully",
    data: offer
  });
});


// GET single offer
router.get("/offers/:id", (req, res) => {
  const offer = offers.find(
    offer => offer.id === Number(req.params.id)
  );

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found"
    });
  }

  res.json({
    success: true,
    data: offer
  });
});


// UPDATE offer
router.put("/offers/:id", (req, res) => {
  const offer = offers.find(
    offer => offer.id === Number(req.params.id)
  );

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: "Offer not found"
    });
  }

  Object.assign(offer, req.body);

  res.json({
    success: true,
    message: "Offer updated successfully",
    data: offer
  });
});


// ================================================================
// RECYCLING
// ================================================================

// GET recycling requests
router.get("/recycling-requests", (req, res) => {
  res.json({
    success: true,
    count: recyclingRequests.length,
    data: recyclingRequests
  });
});


// CREATE recycling request
router.post("/recycling-requests", (req, res) => {
  const {
    userId,
    itemType,
    description,
    quantity,
    pickupAddress,
    pickupDate
  } = req.body;

  if (!userId || !itemType || !pickupAddress) {
    return res.status(400).json({
      success: false,
      message:
        "userId, itemType and pickupAddress are required"
    });
  }

  const request = {
    id: recyclingRequests.length + 1,
    userId,
    itemType,
    description: description || "",
    quantity: quantity || 1,
    pickupAddress,
    pickupDate: pickupDate || null,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  recyclingRequests.push(request);

  res.status(201).json({
    success: true,
    message: "Recycling request created successfully",
    data: request
  });
});


// GET single recycling request
router.get("/recycling-requests/:id", (req, res) => {
  const request = recyclingRequests.find(
    request => request.id === Number(req.params.id)
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "Recycling request not found"
    });
  }

  res.json({
    success: true,
    data: request
  });
});


// UPDATE recycling request
router.put("/recycling-requests/:id", (req, res) => {
  const request = recyclingRequests.find(
    request => request.id === Number(req.params.id)
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "Recycling request not found"
    });
  }

  Object.assign(request, req.body);

  res.json({
    success: true,
    message: "Recycling request updated successfully",
    data: request
  });
});


// ================================================================
// TRANSACTIONS
// ================================================================

// GET transactions
router.get("/transactions", (req, res) => {
  res.json({
    success: true,
    count: transactions.length,
    data: transactions
  });
});


// CREATE transaction
router.post("/transactions", (req, res) => {
  const {
    offerId,
    buyerId,
    sellerId,
    itemId,
    amount,
    type
  } = req.body;

  if (
    !offerId ||
    !buyerId ||
    !sellerId ||
    !itemId ||
    amount === undefined
  ) {
    return res.status(400).json({
      success: false,
      message:
        "offerId, buyerId, sellerId, itemId and amount are required"
    });
  }

  const transaction = {
    id: transactions.length + 1,
    offerId,
    buyerId,
    sellerId,
    itemId,
    amount: Number(amount),
    type: type || "SALE",
    status: "COMPLETED",
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);

  res.status(201).json({
    success: true,
    message: "Transaction created successfully",
    data: transaction
  });
});


// GET single transaction
router.get("/transactions/:id", (req, res) => {
  const transaction = transactions.find(
    transaction =>
      transaction.id === Number(req.params.id)
  );

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: "Transaction not found"
    });
  }

  res.json({
    success: true,
    data: transaction
  });
});


module.exports = router;