const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    foodName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Speeds up "search foods" and "get foods by restaurant" queries
foodSchema.index({ foodName: 'text', category: 'text' });

module.exports = mongoose.model('Food', foodSchema);
