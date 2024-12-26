// userController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../Models/UserModel');

// Register User
exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, password, location, profession, profileUrl } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

     // Create new user
     const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        location,
        profession,
        profileUrl,
      });
  
      await newUser.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

  // Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.SECRET_KEY,
      );

      res.json({ message: 'Login successful', token });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };