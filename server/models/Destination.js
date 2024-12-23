const mongoose = require('mongoose');
const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: { type: String },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nickname: { type: String, required: true, default: 'Anonymous' },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
  averageRating: { type: Number, default: 0 },
});

module.exports = mongoose.model('Destination', destinationSchema);
