require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
// const nev = require('email-verification')(mongoose);
const authRoutes = require('./routes/auth'); // Authentication routes
const User = require('./models/User'); // Your main User model
const protectedRoute = require('./routes/protectedRoute');
const listRoutes = require('./routes/list');
const destinationRoutes = require('./routes/destinations');
const search = require('./routes/search');
const countryRoutes = require('./routes/countries')
const authMiddleware = require('./middleware/authMiddleware');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `${process.env.FRONTEND_URL}`); // allow requests from localhost:3000
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // allow the necessary methods
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); // allow headers for JWT
  next();
});

console.log('Base URL:', process.env.APP_BASE_URL);

// Connect to MongoDB using MONGO_URI from .env
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport middleware
app.use(passport.initialize());
require('./config/passport-config'); // Ensure this is included after initializing Passport


app.use('/api/protected', protectedRoute);
app.use('/api/auth', authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/search', search);
app.use('/api/countries', countryRoutes);
app.use('/api/lists/mine', authMiddleware);



// Create a transporter using SMTP (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const sendVerificationEmail = (email, verificationToken) => {
  const verificationURL = `${process.env.APP_BASE_URL}/verify/${verificationToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Please verify your email address',
    html: `<p>Click the following link to verify your email: <a href="${verificationURL}">Verify Email</a></p>`,
    text: `Click the following link to verify your email: ${verificationURL}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending verification email:', err);
    } else {
      console.log('Verification email sent:', info.response);
    }
  });
};


/* This is for Email Verification usng the npm email-verification package now I switchedf to Nodemailer due to unresponsive API

// Email verification configuration using environment variables
nev.configure({
  verificationURL: `${process.env.APP_BASE_URL}/email-verification/\${URL}`, // Update to use APP_BASE_URL
  persistentUserModel: User,
  tempUserCollection: 'temp_users',
  transportOptions: {
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, // Environment variable for email user
      pass: process.env.EMAIL_PASS  // Environment variable for email password
    }
  },
  verifyMailOptions: {
    from: 'Do Not Reply <no-reply@yourapp.com>',
    subject: 'Please confirm your account',
    html: 'Click the following link to confirm your account: <a href="${URL}">${URL}</a>',
    text: 'Please confirm your account by clicking the following link: ${URL}'
  }
}, (err) => {
  if (err) console.error('Error setting up email verification:', err);
});

// Automatically generate the TempUser model based on User
nev.generateTempUserModel(User, (err, tempUserModel) => {
  if (err) {
      console.error('Error generating temporary user model:', err);
  } else {
      console.log('Temporary user model generated successfully.');
      console.log(tempUserModel);
  }
}); */

app.get("/test-db", async (req, res) => {
  try {
    const tempUsers = await mongoose.connection.db.collection("temp_users").find({}).toArray();
    res.status(200).json({ tempUsers });
  } catch (err) {
    res.status(500).json({ message: "Database connection failed", error: err });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Backend is running!</h1>
    <p>API Base URL: <a href="${process.env.APP_BASE_URL}/api">${process.env.APP_BASE_URL}/api</a></p>
  `);
});


// server.js

/* OLD Email verification route (correct location)
app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Mark the user as verified
    user.isVerified = true;
    user.verificationToken = null;  // Remove the token after successful verification
    await user.save();

    res.status(200).json({ message: 'User verified successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying user', error: err.message });
  }
});
*/

app.get('/verify/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      // Redirect to frontend with an error status
      return res.redirect(`${process.env.FRONTEND_URL}/verify?status=error`);
    }

    // Mark the user as verified
    user.isVerified = true;
    user.verificationToken = null; // Clear the token
    await user.save();

    // Redirect to frontend with a success status
    return res.redirect(`${process.env.FRONTEND_URL}/verify?status=success`);
  } catch (err) {
    console.error(err);
    // Redirect to frontend with an error status
    return res.redirect(`${process.env.FRONTEND_URL}/verify?status=error`);
  }
});




// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { sendVerificationEmail, app };
