const express = require('express');

const { User } = require('../models/User.model.js'); // Adjust the path as needed

const router = express.Router();

// Sign Up (Register) Route
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already registered' });

        // Create a new user
        const user = new User({ username, email, password });
        await user.save();

        // Respond with a success message
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

        
        console.log('user is:',user);
      console.log('userid is:',user._id);
        res.json({ message:"success",
            status:true,
            userId:user._id
         });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
