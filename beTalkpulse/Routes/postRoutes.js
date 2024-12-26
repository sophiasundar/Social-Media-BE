const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../Controllers/postControllers.js');
const { auth } = require('../middleware/auth.js');


// create post 
router.post('/new-post', auth, createPost);

// get all post 
router.get('/getall-posts', auth, getPosts);

module.exports = router;