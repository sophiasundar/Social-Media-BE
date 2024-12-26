// userRoutes.js
const express = require('express');
const { User } = require('../Models/UserModel.js');
const { registerUser, loginUser} = require('../Controllers/userController.js');
const { getAllUsersRequested, getFollowRequests , acceptFollowRequest, denyFollowRequest, sendFollowRequest, 
  getUserFollowersAndFollowing,
 } = require('../Controllers/FollowRequestController.js');
const { auth } = require('../middleware/auth.js');
const router = express.Router();
const mongoose = require('mongoose');

// Register route
router.post('/register', registerUser);

// Login route
router.post('/login', loginUser);

// Protected route example

// Get profile by ID
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password -email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// Update user profile
router.put('/profile/:userId', auth, async (req, res) => {
  const { firstName, lastName, location, profession, profileUrl } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.userId,
      { firstName, lastName, location, profession, profileUrl, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password -email');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User details updated successfully', updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Route to explore all user ??
router.get('/explore', auth, getAllUsersRequested);

// Route to send follow request ??
router.post('/send-follow-request', auth, sendFollowRequest);

// Route to   
router.get('/follow-requests', auth, getFollowRequests);

router.post('/accept-follow', auth,  acceptFollowRequest);

router.post('/deny-follow', auth, denyFollowRequest);

router.get('/followers-following', auth, getUserFollowersAndFollowing);






// Backend: Get Follow Requests for a specific user
// Endpoint to get follow requests for the current user
router.get('/follow-requests/:currentUserId', auth, getFollowRequests, async (req, res) => {
  const { currentUserId } = req.params;

  try {
    // Fetch the user by their ID
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Assuming followRequests are embedded in the user document
    const followRequests = await getFollowRequests.find({ receiver: currentUserId })
    .populate("sender", "firstName lastName profileUrl profession");
  

    // Return the follow requests to the frontend
    res.status(200).json({ followRequests });
  } catch (error) {
    console.error('Error fetching follow requests:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Increment profile views
router.post('/profile/:id/view', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { profileViews: 1 } }, // Increment profileViews by 1
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ profileViews: user.profileViews });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});



module.exports = router;
