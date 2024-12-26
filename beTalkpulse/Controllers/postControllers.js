const { User } = require('../Models/UserModel');
const Post = require('../Models/PostModel'); // Assuming you have already created this model

// Create a post
exports.createPost = async (req, res) => {
  try {
    const { description, mediaType, mediaUrl } = req.body;
    const userId = req.user.userId; // Assuming user is authenticated and user ID is in `req.user.id`

    // Find the current user to populate their details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a new post
    const newPost = new Post({
      userId,
      description,
      mediaType,
      mediaUrl,
    });

    // Save the post
    const savedPost = await newPost.save();

    // Add the new post to the user's `posts` array
    user.posts.push(savedPost._id);
    user.postCount += 1; // Increment post count
    await user.save();

    // Populate the user data (firstName, lastName, profileUrl) for the post
    const populatedPost = await Post.findById(savedPost._id).populate('userId', 'firstName lastName profileUrl location');

    res.status(201).json({ message: 'Post created successfully', post: populatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Fetch posts based on user roles (followers, mutual followers, or the post owner)
exports.getPosts = async (req, res) => {
  try {
    const userId = req.user.userId; // Get current logged-in user id from JWT
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the list of users the current user is following
    const followingUserIds = user.following.map(following => following.userId.toString());
    // Get the list of users who follow the current user (followers)
    const followerUserIds = user.followers.map(follower => follower.userId.toString());

    // Filter to get mutual followers (users in both following and follower lists)
    const mutualUserIds = followingUserIds.filter(id => followerUserIds.includes(id));

    // Query for posts the current user is allowed to view:
    const posts = await Post.find({
      $or: [
        { userId: userId }, // Current user's own posts (always visible)
        { userId: { $in: followingUserIds } }, // Posts from users the current user follows
        { userId: { $in: mutualUserIds } } // Posts from mutual followers (in both following and follower lists)
      ]
    })
    .populate('userId', 'firstName lastName profileUrl') // Populate user data in the posts
    .sort({ createdAt: -1 }); // Sort posts by creation date (newest first)

    res.status(200).json({ posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


