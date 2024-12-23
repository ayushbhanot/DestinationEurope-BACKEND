const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); 
// const nev = require('email-verification')(mongoose); 
const User = require('../models/User');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sendVerificationEmail } = require('../utils/emailUtil');


// Signup route
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user && !user.isVerified) {
      return res.status(400).json({ 
        message: 'User exists but is not verified. Please check your email for verification.'
      });
    }
    
    // If the user already exists and is verified
    if (user && user.isVerified) {
      return res.status(400).json({ message: 'User already exists' });
    }


    const newUser = new User({ email, password, nickname: name });

    // Generate a unique verification token for the user
    const verificationToken = uuidv4();

    // Save the token on the user document
    newUser.verificationToken = verificationToken;
    await newUser.save();

    // Send the verification email using Nodemailer
    sendVerificationEmail(newUser.email, verificationToken);

    res.status(200).json({ message: 'Signup successful! Please check your email for verification.' });

  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: 'Account not verified. Please check your email for the verification link.',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // If the email and password are correct and the account is verified, generate JWT
    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* Old Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) return res.status(400).json({ message: info.message });

    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ token });
  })(req, res, next);
});
*/

/* OLD Email verification route
router.get('/email-verification/:url', (req, res) => {
  const url = req.params.url;

  nev.confirmTempUser(url, (err, user) => {
    if (err) return res.status(500).json({ message: 'Error verifying user' });

    if (user) {
      return res.status(200).json({ message: 'User verified successfully.' });
    } else {
      return res.status(400).json({ message: 'Verification link expired or invalid.' });
    }
  });
});*/

router.get('/email-verification/:url', (req, res) => {
  const url = req.params.url;

  nev.confirmTempUser(url, (err, user) => {
    if (err) return res.status(500).send('Error verifying user');

    if (user) {
      // Redirect to frontend verification success page
      return res.redirect('/verify?status=success');
    } else {
      // Redirect to frontend verification error page
      return res.redirect('/verify?status=error');
    }
  });
});


// Resend verification route
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Generate a new verification token and update the user
    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    await user.save();

    // Send the verification email
    sendVerificationEmail(user.email, verificationToken);

    return res.status(200).json({ message: 'Verification email resent.' });
  } catch (err) {
    res.status(500).json({ message: 'Error resending email', error: err.message });
  }
});


module.exports = router;
