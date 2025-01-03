const { User } = require('../Models/UserModel');
const Post = require('../Models/PostModel'); // Assuming you have already created this model
const mongoose = require('mongoose');

// Create a post
exports.createPost = async (req, res) => {
  try {
    console.log('Request Body:', JSON.stringify(req.body, null, 2)); // Format with 2-space indentation for readability
    console.log('Request File:', JSON.stringify(req.file, null, 2));

    const { description } = req.body;
    const userId = req.user.userId; // Assuming user ID is attached to req.user from authentication middleware
   

    if (!description) {
      return res.status(400).json({ message: 'Description is required' });
    }

    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    // Determine media type based on file mimetype
    const mediaType = req.file.mimetype.startsWith('video')
      ? 'video'
      : req.file.mimetype.startsWith('image')
      ? 'image'
      : 'gif';

    // Validate media type
    if (!['image', 'video', 'gif'].includes(mediaType)) {
      return res.status(400).json({ message: 'Invalid media type' });
    }

    const mediaUrl = req.file.path; // Cloudinary file URL

    // Find the current user
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

    // Populate the user data for the post
    const populatedPost = await Post.findById(savedPost._id).populate(
      'userId',
      'firstName lastName profileUrl location'
    );

    res.status(201).json({ message: 'Post created successfully', post: populatedPost });
  } catch (error) {
    console.error('Error:', error.message);
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


exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Toggle like
    if (post.likes.includes(userId)) {
      post.likes.pull(userId); // Unlike the post
    } else {
      post.likes.push(userId); // Like the post
    }

    await post.save();
    res.status(200).json({ message: 'Like updated', likes: post.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.commentOnPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.userId; 

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Fetch the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add the comment
    const newComment = {
      userId: new mongoose.Types.ObjectId(userId), // Ensure userId is also an ObjectId
      text, // Ensure this field is set correctly
      likes: [],
    };

    console.log('New Comment:', newComment);

    post.comments.push(newComment);

    // Save the updated post
    await post.save();

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error in commentOnPost:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    const postWithComments = await Post.findById(postId)
      .populate({
        path: 'comments.userId', // Populate the userId in comments
        select: 'firstName lastName profileUrl', // Select required fields
      })
      .exec();

    if (!postWithComments) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Extract comments with user details
    const comments = postWithComments.comments.map((comment) => ({
      commentText: comment.text, // Use `text` instead of `comment`
      createdAt: comment.createdAt,
      likes: comment.likes,
      commenter: {
        firstName: comment.userId?.firstName,
        lastName: comment.userId?.lastName,
        profileUrl: comment.userId?.profileUrl,
      },
    }));

    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'An error occurred while fetching comments' });
  }
};








// Delete a post by the current user
exports.deletePost = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the current logged-in user's ID from JWT
    const { postId } = req.params; // Get the post ID from the request parameters

    // Find the post and verify ownership
    const post = await Post.findOne({ _id: postId, userId });

    if (!post) {
      return res.status(404).json({ message: 'Post not found or not authorized to delete' });
    }

    // Delete the post
    await Post.deleteOne({ _id: postId });

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};