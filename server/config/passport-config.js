const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Ensure the path matches your structure
const { ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');

passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) return done(null, false, { message: 'Email not registered' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return done(null, false, { message: 'Incorrect password' });

            if (!user.isVerified) return done(null, false, { message: 'Email not verified' });

            // Generate JWT with nickname included
            const token = jwt.sign(
                { id: user.id, nickname: user.nickname }, // Include nickname here
                process.env.JWT_SECRET,
                { expiresIn: '10h' }
            );

            return done(null, { user, token }); // Pass token with user object
        } catch (error) {
            return done(error);
        }
    })
);


// JWT Strategy for protecting routes
passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET, // Ensure JWT_SECRET is in your .env file
        },
        async (payload, done) => {
            try {
                const user = await User.findById(payload.id);
                if (!user) return done(null, false);

                return done(null, user);
            } catch (error) {
                return done(error, false);
            }
        }
    )
);

module.exports = passport;
