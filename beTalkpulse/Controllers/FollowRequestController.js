// followrequest

// get follow request 

// controllers/userController.js
const { User } = require('../Models/UserModel');
const mongoose = require('mongoose');





const getAllUsersRequested = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);

    // Fetch the current user's data
    const currentUser = await User.findById(currentUserId, 'followers following followRequests');

    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Extract follower, following, and follow request IDs
    const followerIds = currentUser.followers.map((f) => f.userId.toString()); // IDs of followers
    const followingIds = currentUser.following.map((f) => f.userId.toString()); // IDs of following
    const sentRequestIds = currentUser.followRequests.map((f) => f.receiver.toString()); // IDs where current user sent requests

    // Exclude current user and already-followed users
    const excludeIds = [currentUserId.toString(), ...followingIds];

    // Query to include potential users
    const exploreUsers = await User.find({
      _id: { $nin: excludeIds }, // Exclude current user and already-followed users
    }).select('firstName lastName profileUrl profession');

    // Add follow request status to each user
    const updatedExploreUsers = exploreUsers.map((user) => {
      const userId = user._id.toString();
      let status = 'Follow';

      if (followerIds.includes(userId)) {
        status = 'Following You';
      } else if (sentRequestIds.includes(userId)) {
        status = 'Follow Request Sent';
      }

      return {
        ...user.toObject(),
        status, // Add the status field
      };
    });

    res.status(200).json({ users: updatedExploreUsers });
  } catch (error) {
    console.error('Error fetching explore users:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};







// Get all follow requests (users excluding the current user)
const getFollowRequests = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
    console.log('Current user ID:', currentUserId);

    // Fetch the user by their ID
    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all follow requests and populate sender details
    const followRequests = await User.aggregate([
      { $match: { _id: currentUserId } }, // Match the current user
      {
        $project: {
          followRequests: 1, // Include only the followRequests field
        },
      },
      {
        $unwind: '$followRequests', // Unwind the followRequests array
      },
      {
        $lookup: {
          from: 'users', // The 'users' collection
          localField: 'followRequests.sender', // Match sender ID in the follow request
          foreignField: '_id', // Match the _id in the users collection
          as: 'followRequests.senderDetails', // Add sender details to the request
        },
      },
      {
        $project: {
          'followRequests.senderDetails.password': 0, // Optionally exclude the password
        },
      },
    ]);

    // Map through the user's followRequests and add senderDetails
    const followRequestsWithSenderDetails = user.followRequests.map((request) => {
      const senderDetails = followRequests
        .filter((entry) => entry.followRequests.sender.toString() === request.sender.toString())
        .map((entry) => entry.followRequests.senderDetails)[0]; // Assuming there's only one match per request
      return {
        ...request.toObject(),
        senderDetails: senderDetails || null, // Add sender details
      };
    });

    res.status(200).json({ followRequests: followRequestsWithSenderDetails });
  } catch (error) {
    console.error('Error fetching follow requests:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



// Accept Follow Request

const acceptFollowRequest = async (req, res) => {
  const { currentUserId, requesterId } = req.body;

  try {
    const currentDate = new Date();

    // Update the current user's followers
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { followers: { userId: requesterId, followedAt: currentDate } },
      $pull: { followRequests: { sender: requesterId } }, // Remove the follow request
    });

    // Update the requester's following
    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { following: { userId: currentUserId, followedAt: currentDate } },
    });

    res.status(200).json({ message: 'Follow request accepted' });
  } catch (error) {
    console.error('Error accepting follow request:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};




// Deny Follow Request
// Deny Follow Request

const denyFollowRequest = async (req, res) => {
  const { currentUserId, requesterId } = req.body;

  try {
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { followRequests: { sender: requesterId } }, // Remove follow request
    });

    res.status(200).json({ message: 'Follow request denied' });
  } catch (error) {
    console.error('Error denying follow request:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};





const sendFollowRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    // Validate the receiverId
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Create the follow request
    const followRequest = {
      sender: senderId,
      receiver: receiverId,
    };

    // Add the follow request to the receiver's followRequests array
    const user = await User.findByIdAndUpdate(
      receiverId, 
      { $push: { followRequests: followRequest } }, 
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Error adding follow request' });
    }

    res.status(200).json({ message: 'Follow request sent' });
  } catch (error) {
    console.error('Error sending follow request:', error);
    res.status(500).json({ message: 'Error sending follow request', error });
  }
};






const getUserFollowersAndFollowing = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user.userId);

    // Find the user and populate followers and following
    const user = await User.findById(currentUserId)
      .populate({
        path: 'followers.userId',
        select: 'firstName lastName profileUrl profession',
      })
      .populate({
        path: 'following.userId',
        select: 'firstName lastName profileUrl profession',
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format followers and following data
    const followers = user.followers.map((follower) => ({
      id: follower.userId._id,
      firstName: follower.userId.firstName,
      lastName: follower.userId.lastName,
      profileUrl: follower.userId.profileUrl,
      profession: follower.userId.profession,
      followedAt: follower.followedAt, // Include followedAt
    }));

    const following = user.following.map((followed) => ({
      id: followed.userId._id,
      firstName: followed.userId.firstName,
      lastName: followed.userId.lastName,
      profileUrl: followed.userId.profileUrl,
      profession: followed.userId.profession,
      followedAt: followed.followedAt, // Include followedAt
    }));

    res.status(200).json({ followers, following });
  } catch (error) {
    console.error('Error fetching followers and following:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};



//  for followrequest in userModel
const addFollowRequestsField = async () => {
  try {
    // Update all users to add the followRequests field
    await User.updateMany(
      {}, // No filter, meaning all documents
      { $set: { followRequests: [] } } // Set the new field as an empty array
    );
    console.log('All users updated with followRequests field');
  } catch (err) {
    console.error('Error updating users:', err);
  }
};

addFollowRequestsField();



module.exports = {
  getAllUsersRequested,
  getFollowRequests,
  acceptFollowRequest,
  denyFollowRequest,
  sendFollowRequest,
  getUserFollowersAndFollowing,
};