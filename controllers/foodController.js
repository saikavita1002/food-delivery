const Food = require('../models/Food');
const Restaurant = require('../models/Restaurant');

// Helper: confirms the logged-in user owns the restaurant (or is admin)
const canManageRestaurant = async (restaurantId, user) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return { ok: false, code: 404, message: 'Restaurant not found' };
  const isOwner = restaurant.ownerId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    return { ok: false, code: 403, message: 'Not authorized to manage this restaurant\'s menu' };
  }
  return { ok: true };
};

// POST /api/foods  (protected: owner or admin)
const addFood = async (req, res) => {
  try {
    const { foodName, price, category, description, restaurantId } = req.body;
    if (!foodName || !price || !category || !restaurantId) {
      return res.status(400).json({ message: 'foodName, price, category and restaurantId are required' });
    }

    const check = await canManageRestaurant(restaurantId, req.user);
    if (!check.ok) return res.status(check.code).json({ message: check.message });

    const food = await Food.create({
      foodName,
      price,
      category,
      description,
      restaurantId,
      image: req.file ? req.file.filename : '',
    });

    res.status(201).json(food);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding food item', error: error.message });
  }
};

// GET /api/foods  (optionally filter by ?restaurantId=)
const getFoods = async (req, res) => {
  try {
    const filter = { isAvailable: true };
    if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;

    const foods = await Food.find(filter).populate('restaurantId', 'name address');
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching foods', error: error.message });
  }
};

// GET /api/foods/search?q=biryani
const searchFoods = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Query parameter "q" is required' });

    const foods = await Food.find({
      $text: { $search: q },
      isAvailable: true,
    }).populate('restaurantId', 'name');

    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: 'Server error searching foods', error: error.message });
  }
};

// GET /api/foods/:id
const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate('restaurantId', 'name address phone');
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching food item', error: error.message });
  }
};

// PUT /api/foods/:id  (protected: owner or admin)
const updateFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food item not found' });

    const check = await canManageRestaurant(food.restaurantId, req.user);
    if (!check.ok) return res.status(check.code).json({ message: check.message });

    const { foodName, price, category, description, isAvailable } = req.body;
    food.foodName = foodName ?? food.foodName;
    food.price = price ?? food.price;
    food.category = category ?? food.category;
    food.description = description ?? food.description;
    if (isAvailable !== undefined) food.isAvailable = isAvailable;
    if (req.file) food.image = req.file.filename;

    await food.save();
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating food item', error: error.message });
  }
};

// DELETE /api/foods/:id  (protected: owner or admin)
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food item not found' });

    const check = await canManageRestaurant(food.restaurantId, req.user);
    if (!check.ok) return res.status(check.code).json({ message: check.message });

    await food.deleteOne();
    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting food item', error: error.message });
  }
};

module.exports = { addFood, getFoods, searchFoods, getFoodById, updateFood, deleteFood };
