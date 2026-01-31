const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // For hashing passwords

// User Schema
const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true, // Ensure username is unique
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensure email is unique
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    }
});

// Hash the password before saving the user
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare hashed password with input password
UserSchema.methods.comparePassword = async function(inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

// Create and export the User model
const User = mongoose.model('User', UserSchema);

module.exports = { User };
