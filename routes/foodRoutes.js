const express = require('express');
const router = express.Router();
const { addFood, getFoods, searchFoods, getFoodById, updateFood, deleteFood } = require('../controllers/foodController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');

// IMPORTANT: /search must be declared before /:id, otherwise Express
// will treat "search" as an :id value and 404 in Food.findById
router.get('/search', searchFoods);
router.get('/', getFoods);
router.get('/:id', getFoodById);

router.post('/', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), addFood);
router.put('/:id', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), updateFood);
router.delete('/:id', protect, authorize('admin', 'restaurant_owner'), deleteFood);

module.exports = router;
