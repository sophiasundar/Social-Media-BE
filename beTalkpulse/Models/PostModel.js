const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // postId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'Post',
  //   required: true,
  // },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'gif'],
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
    trim: true,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  comments: [commentSchema], // Use the locally defined schema
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;