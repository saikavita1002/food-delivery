const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getUserOrders,
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.post('/', protect, placeOrder);
router.get('/user/:id', protect, getUserOrders);
router.get('/restaurant/:id', protect, authorize('admin', 'restaurant_owner'), getRestaurantOrders);
router.get('/:id', protect, getOrderById);
router.put('/status/:id', protect, authorize('admin', 'restaurant_owner'), updateOrderStatus);

module.exports = router;
