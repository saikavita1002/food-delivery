const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');

// POST /api/orders  (protected) — places an order from the user's current cart
const placeOrder = async (req, res) => {
  try {
    const { deliveryAddress } = req.body;
    if (!deliveryAddress) {
      return res.status(400).json({ message: 'deliveryAddress is required' });
    }

    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.foodId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // All items in one order must belong to the same restaurant (typical food-delivery rule)
    const restaurantIds = new Set(cart.items.map((item) => item.foodId.restaurantId.toString()));
    if (restaurantIds.size > 1) {
      return res.status(400).json({ message: 'Cart contains items from multiple restaurants. Place separate orders.' });
    }

    // Snapshot name/price at order time, don't trust client-sent prices
    const orderItems = cart.items.map((item) => ({
      foodId: item.foodId._id,
      foodName: item.foodId.foodName,
      price: item.foodId.price,
      quantity: item.quantity,
    }));

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      userId: req.user._id,
      restaurantId: [...restaurantIds][0],
      items: orderItems,
      totalAmount,
      deliveryAddress,
      status: 'Pending',
    });

    // Clear the cart after a successful order
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error placing order', error: error.message });
  }
};

// GET /api/orders/user/:id  (protected — must be self or admin)
const getUserOrders = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these orders' });
    }

    const orders = await Order.find({ userId: req.params.id })
      .populate('restaurantId', 'name image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders', error: error.message });
  }
};

// GET /api/orders/restaurant/:id  (protected — restaurant owner or admin)
// Lets a restaurant see incoming orders, needed for the admin/restaurant dashboard
const getRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const isOwner = restaurant.ownerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these orders' });
    }

    const orders = await Order.find({ restaurantId: req.params.id })
      .populate('userId', 'name mobile')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching restaurant orders', error: error.message });
  }
};

// GET /api/orders/:id  (protected — single order detail)
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('restaurantId', 'name address phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isOwnerOfOrder = order.userId.toString() === req.user._id.toString();
    if (!isOwnerOfOrder && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching order', error: error.message });
  }
};

// PUT /api/orders/status/:id  (protected — restaurant owner or admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const restaurant = await Restaurant.findById(order.restaurantId);
    const isOwner = restaurant && restaurant.ownerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating order status', error: error.message });
  }
};

module.exports = { placeOrder, getUserOrders, getRestaurantOrders, getOrderById, updateOrderStatus };
