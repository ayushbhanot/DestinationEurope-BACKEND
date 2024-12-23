const mongoose = require('mongoose');


const listSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  destinations: [{ name: String, details: String }],
  visibility: { type: String, enum: ['public', 'private'], default: 'private' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastModified: { type: Date, default: Date.now },
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nickname: { type: String, required: true, default: 'Anonymous' },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String },
      date: { type: Date, default: Date.now }},
  ],
  averageRating: { type: Number, default: 0 },
});

module.exports = mongoose.model('List', listSchema);
