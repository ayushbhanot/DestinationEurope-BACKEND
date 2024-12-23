const express = require('express');
const List = require('../models/List');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const User = require('../models/User');

// Create new list
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, destinations, visibility } = req.body;
  try {
    const newList = new List({
      name,
      description,
      destinations,
      visibility,
      user: req.user.id, // Authenticated user's ID
    });
    const list = await newList.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all lists
router.get('/', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const lists = await List.find({ visibility: 'public' })
      .sort({ lastModified: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'nickname');

      const formatLists = (lists) =>
        lists.map((list) => ({
          ...list.toObject(),
          user: {
            ...list.user,
            nickname: list.user?.nickname || 'Anonymous',
          },
        }));

    const totalLists = await List.countDocuments({ visibility: 'public' });

    res.json({
      listsL: formatLists(lists),
      currentPage: Number(page),
      totalPages: Math.ceil(totalLists / limit),
      totalLists,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get paginated public lists and user's lists (For logged-in users)
router.get('/home', authMiddleware, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  try {
    const publicLists = await List.find({ visibility: 'public' })
      .sort({ lastModified: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'nickname');

    const userLists = await List.find({ user: req.user.id })
      .sort({ lastModified: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'nickname');

    const totalPublicLists = await List.countDocuments({ visibility: 'public' });
    const totalUserLists = await List.countDocuments({ user: req.user.id });

    const formatLists = (lists) =>
      lists.map((list) => ({
        ...list.toObject(), // Convert Mongoose document to plain object
        user: {
          ...list.user,
          nickname: list.user?.nickname || 'Anonymous', // Default to "Anonymous" if nickname is missing
        },
      }));

    res.json({
      publicLists: formatLists(publicLists),
      userLists: formatLists(userLists),
      currentPage: Number(page),
      totalPages: Math.ceil((totalPublicLists + totalUserLists) / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/public', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  try {
    const lists = await List.find({ visibility: 'public' })
      .sort({ lastModified: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'nickname');

      const formatLists = (lists) =>
        lists.map((list) => ({
          ...list.toObject(),
          user: {
            ...list.user,
            nickname: list.user?.nickname || 'Anonymous',
          },
        }));

    const totalLists = await List.countDocuments({ visibility: 'public' });

    res.json({
      lists: formatLists(lists),
      currentPage: Number(page),
      totalPages: Math.ceil(totalLists / limit),
      totalLists,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const lists = await List.find({ user: req.user.id })
    .populate('user', 'nickname');

    const formatLists = (lists) =>
      lists.map((list) => ({
        ...list.toObject(),
        user: {
          ...list.user,
          nickname: list.user?.nickname || 'Anonymous',
        },
      }));


    res.json(formatLists(lists));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.put('/:id', authMiddleware, async (req, res) => {
  const { name, description, destinations } = req.body;

  try {
    // Find the list by ID
    const list = await List.findById(req.params.id);

    // Check if the list exists
    if (!list) return res.status(404).json({ error: 'List not found' });

    // Ensure the user is authorized to edit the list
    if (list.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update the list fields
    if (name) list.name = name;
    if (description) list.description = description;
    if (destinations) list.destinations = destinations;
    list.lastModified = Date.now();

    // Save the updated list
    await list.save();

    // Respond with the updated list
    res.json(list);
  } catch (err) {
    console.error('Error updating list:', err);
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });
    if (list.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await list.deleteOne();
    res.json({ message: 'List deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Add a review to a list
router.post('/:id/reviews', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ error: 'List not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const review = {
      user: user.id,
      nickname: user.nickname,
      rating,
      comment,
      date: Date.now(),
    };

    list.reviews.push(review);
    list.averageRating =
      list.reviews.reduce((sum, review) => sum + review.rating, 0) / list.reviews.length;

    await list.save();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Get a list by ID with reviews
router.get('/:id', async (req, res) => {
  try {
    const list = await List.findById(req.params.id)
      .populate('user', 'nickname')
      .populate('reviews.user', 'nickname');

    if (!list) return res.status(404).json({ error: 'List not found' });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;
