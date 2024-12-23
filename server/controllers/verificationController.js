exports.verifyEmail = (req, res) => {
  const url = req.params.url; // Get URL from route parameters

  nev.confirmTempUser(url, (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (user) {
      // Email verified, user is now in the permanent collection
      res.status(200).json({ message: 'Email verified! You can now log in.' });
    } else {
      res.status(400).json({ message: 'Verification link is expired or invalid' });
    }
  });
};
