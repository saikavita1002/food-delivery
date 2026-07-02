const Cart = require('../models/Cart');
const Food = require('../models/Food');

// GET /api/cart  (protected — gets the logged-in user's cart)
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.foodId', 'foodName price image isAvailable');
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching cart', error: error.message });
  }
};

// POST /api/cart/add  (protected)
const addToCart = async (req, res) => {
  try {
    const { foodId, quantity = 1 } = req.body;
    if (!foodId) return res.status(400).json({ message: 'foodId is required' });

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: 'Food item not found' });

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [{ foodId, quantity }] });
    } else {
      const existingItem = cart.items.find((item) => item.foodId.toString() === foodId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ foodId, quantity });
      }
      await cart.save();
    }

    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding to cart', error: error.message });
  }
};

// PUT /api/cart/update  (protected) — body: { foodId, quantity }
const updateCartItem = async (req, res) => {
  try {
    const { foodId, quantity } = req.body;
    if (!foodId || quantity === undefined) {
      return res.status(400).json({ message: 'foodId and quantity are required' });
    }
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1; use remove endpoint to delete an item' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.find((item) => item.foodId.toString() === foodId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    item.quantity = quantity;
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating cart item', error: error.message });
  }
};

// DELETE /api/cart/remove/:foodId  (protected)
const removeFromCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((item) => item.foodId.toString() !== req.params.foodId);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error removing cart item', error: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
