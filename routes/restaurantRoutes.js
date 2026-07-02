const express = require('express');
const router = express.Router();
const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} = require('../controllers/restaurantController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const upload = require('../middleware/upload');

router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);

router.post('/', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), createRestaurant);
router.put('/:id', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), updateRestaurant);
router.delete('/:id', protect, authorize('admin', 'restaurant_owner'), deleteRestaurant);

module.exports = router;
