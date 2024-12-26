const mongoose = require('mongoose');

// Define the schema for followers and following
const FollowerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followedAt: { type: Date, default: Date.now }
  
});

// Follow Request Schema
const FollowRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // Who sent the request
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who receives the request
  requestedAt: { type: Date, default: Date.now }
});


// Main User Schema
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profileUrl: { type: String, default: '' },

  location: { type: String, trim: true },    
  profession: { type: String, trim: true },  
  profileCompletion: { type: Number, default: 0 },

  followers: [FollowerSchema],      // followers
  following: [FollowerSchema],      // following
  followRequests: [FollowRequestSchema],  // Pending follow requests

  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],  // Post collection

  postCount: { type: Number, default: 0 }, 

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});



// Create and export the model
const User = mongoose.model('User', UserSchema);
module.exports = { User };
