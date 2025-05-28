require('dotenv').config();
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API is running!' });
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// USER ROUTES - These were missing!

// GET all users
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      { _id: "507f1f77bcf86cd799439011", name: "Sample User", email: "sample@example.com", age: 25 }
    ]
  });
});

// POST create user
app.post('/api/users', (req, res) => {
  const { name, email, age } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required'
    });
  }
  
  const newUser = {
    _id: "507f1f77bcf86cd799439" + Math.random().toString(36).substr(2, 4),
    name,
    email,
    age: age || null,
    createdAt: new Date().toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: newUser
  });
});

// GET user by ID
app.get('/api/users/:id', (req, res) => {
  const mockUser = {
    _id: req.params.id,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockUser
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});