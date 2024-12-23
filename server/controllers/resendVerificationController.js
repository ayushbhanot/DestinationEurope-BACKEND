
exports.resendVerification = (req, res) => {
  const email = req.body.email;

  nev.resendVerificationEmail(email, (err, userFound) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (userFound) {
      res.status(200).json({ message: 'Verification email resent' });
    } else {
      res.status(400).json({ message: 'User not found or already verified' });
    }
  });
};
