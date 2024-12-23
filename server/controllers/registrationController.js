const User = require('../models/User');

exports.register = async (req, res) => {
  const { email, password } = req.body;

  // Create a new user instance
  const newUser = new User({ email, password });

  // Use nev (already configured in server.js) to create a temporary user
  nev.createTempUser(newUser, (err, existingPersistentUser, newTempUser) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (existingPersistentUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (newTempUser) {
      const URL = newTempUser[nev.options.URLFieldName];
      nev.sendVerificationEmail(email, URL, (err) => {
        if (err) return res.status(500).json({ message: 'Failed to send email' });
        res.status(200).json({ message: 'Verification email sent' });
      });
    } else {
      res.status(400).json({ message: 'User already in temp collection' });
    }
  });
};
