const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');

// POST /api/restaurants  (protected: admin or restaurant_owner)
const createRestaurant = async (req, res) => {
  try {
    const { name, address, phone,cuisine,openingHours } = req.body;
    if (!name || !address || !phone || !cuisine || !openingHours) {
      return res.status(400).json({ message: 'Name, address phone cuisine and openingHours are required' });
    }

    const restaurant = await Restaurant.create({
      name,
      address,
      phone,
      cuisine,
      openingHours,
      image: req.file ? req.file.filename : '',
      ownerId: req.user._id,
    });

    res.status(201).json(restaurant);
  } catch (error) {
  console.error('CREATE RESTAURANT ERROR:', error);

  res.status(500).json({
    message: 'Server error creating restaurant',
    error: error.message
  });
}
};

// GET /api/restaurants
const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching restaurants', error: error.message });
  }
};

// GET /api/restaurants/:id  (restaurant details + its menu)
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const menu = await Food.find({ restaurantId: restaurant._id, isAvailable: true });
    res.json({ ...restaurant.toObject(), menu });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching restaurant', error: error.message });
  }
};

// PUT /api/restaurants/:id  (protected: owner or admin)
const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const isOwner = restaurant.ownerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const { name, address, phone } = req.body;
    restaurant.name = name ?? restaurant.name;
    restaurant.address = address ?? restaurant.address;
    restaurant.phone = phone ?? restaurant.phone;
    restaurant.cuisine = cuisine ?? restaurant.cuisine;
    restaurant.openingHours = openingHours ?? restaurant.openingHours;
    if (req.file) restaurant.image = req.file.filename;

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating restaurant', error: error.message });
  }
};

// DELETE /api/restaurants/:id  (protected: owner or admin)
const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

    const isOwner = restaurant.ownerId.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this restaurant' });
    }

    await restaurant.deleteOne();
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting restaurant', error: error.message });
  }
};

module.exports = { createRestaurant, getRestaurants, getRestaurantById, updateRestaurant, deleteRestaurant };
