// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');

// Create express app
const app = express();
// Use body parser
app.use(bodyParser.json());
// Use cors
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Create get request
app.get('/posts/:id/comments', (req, res) => {
  // Return comments array
  res.send(commentsByPostId[req.params.id] || []);
});

// Create post request
app.post('/posts/:id/comments', async (req, res) => {
  // Generate random id
  const commentId = randomBytes(4).toString('hex');
  // Get comment content from request body
  const { content } = req.body;
  // Get comments array from commentsByPostId object
  const comments = commentsByPostId[req.params.id] || [];
  // Push new comment to comments array
  comments.push({ id: commentId, content, status: 'pending' });
  // Set comments array to commentsByPostId object
  commentsByPostId[req.params.id] = comments;
  // Make post request to event-bus service
  await axios.post('http://event-bus-srv:4005/events', {
    // Set event type
    type: 'CommentCreated',
    // Set event data
    data: {
      id: commentId,
      content,
      postId: req.params.id,
      status: 'pending',
    },
  });
  // Return comments array
  res.status(201).send(comments);
});

// Create post request
app.post('/events', async (req, res) => {
  // Get event type from request body
  const { type, data } = req.body;
  // Check if event type is CommentModerated
  if (type === 'CommentModerated') {
    // Get comments array from commentsByPostId object
    const comments = commentsByPostId[data.postId];
    // Get comment from comments array
    const comment = comments.find((comment) => {
      return comment.id === data.id;
    });
    // Update comment status
    comment.status = data.status;
    // Make post request to event-bus service
    await axios.post('http://event-b