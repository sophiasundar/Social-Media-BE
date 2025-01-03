const express = require('express');
const router = express.Router();
const { createPost, getPosts, likePost, commentOnPost, getComments, deletePost } = require('../Controllers/postControllers.js');
const { auth } = require('../middleware/auth.js');
const upload = require('../config/multer');

// Create a new post with file upload
router.post('/new-post', auth, upload.single('file'), createPost);

// get all post 
router.get('/getall-posts', auth, getPosts);

// delete the current user post 
router.delete('/delete-post/:postId', auth, deletePost);

// Like a post
router.put('/like/:postId', auth, likePost);

// Comment on a post
router.post('/comment/:postId', auth, commentOnPost);

router.get('/comments/:postId', auth, getComments);




module.exports = router;