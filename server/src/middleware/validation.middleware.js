const { validationResult, check } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  };
};

// Common validation rules
const commonValidators = {
  // User validators
  registerUser: [
    check('username')
      .trim()
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    
    check('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address')
      .normalizeEmail(),
    
    check('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase, one lowercase, and one number'),
    
    check('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    check('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    check('phoneNumber')
      .optional()
      .trim()
      .matches(/^[+]?[0-9\s\-()]{10,}$/).withMessage('Please enter a valid phone number'),
    
    check('role')
      .optional()
      .isIn(['player', 'scorer', 'umpire', 'team_manager', 'admin']).withMessage('Invalid role')
  ],

  loginUser: [
    check('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email address'),
    
    check('password')
      .notEmpty().withMessage('Password is required')
  ],

  // Player validators
  createPlayer: [
    check('firstName')
      .trim()
      .notEmpty().withMessage('First name is required')
      .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    
    check('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    
    check('displayName')
      .trim()
      .notEmpty().withMessage('Display name is required')
      .isLength({ max: 50 }).withMessage('Display name cannot exceed 50 characters'),
    
    check('jerseyNumber')
      .optional()
      .isInt({ min: 1, max: 999 }).withMessage('Jersey number must be between 1 and 999'),
    
    check('battingStyle')
      .optional()
      .isIn(['right-hand', 'left-hand', null]).withMessage('Invalid batting style'),
    
    check('bowlingStyle')
      .optional()
      .isIn([
        'right-arm fast', 'right-arm medium', 'right-arm spin',
        'left-arm fast', 'left-arm medium', 'left-arm spin',
        null
      ]).withMessage('Invalid bowling style'),
    
    check('primaryRole')
      .optional()
      .isIn(['batsman', 'bowler', 'all-rounder', 'wicket-keeper', null]).withMessage('Invalid primary role'),
    
    check('height')
      .optional()
      .isInt({ min: 100, max: 250 }).withMessage('Height must be between 100cm and 250cm'),
    
    check('email')
      .optional()
      .trim()
      .isEmail().withMessage('Please enter a valid email address'),
    
    check('dateOfBirth')
      .optional()
      .isISO8601().withMessage('Please enter a valid date')
  ],

  // Team validators
  createTeam: [
    check('name')
      .trim()
      .notEmpty().withMessage('Team name is required')
      .isLength({ max: 100 }).withMessage('Team name cannot exceed 100 characters'),
    
    check('shortName')
      .trim()
      .notEmpty().withMessage('Short name is required')
      .isLength({ max: 10 }).withMessage('Short name cannot exceed 10 characters')
      .isUppercase().withMessage('Short name must be in uppercase'),
    
    check('type')
      .optional()
      .isIn(['club', 'school', 'college', 'corporate', 'national', 'regional', 'local'])
      .withMessage('Invalid team type'),
    
    check('city')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('City cannot exceed 50 characters'),
    
    check('country')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Country cannot exceed 50 characters')
  ],

  // Match validators
  createMatch: [
    check('title')
      .trim()
      .notEmpty().withMessage('Match title is required')
      .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    
    check('format')
      .isIn(['t20', 'odi', 'test', 't10', 'the_hundred', 'custom'])
      .withMessage('Invalid match format'),
    
    check('team1')
      .notEmpty().withMessage('Team 1 is required')
      .isMongoId().withMessage('Invalid team ID'),
    
    check('team2')
      .notEmpty().withMessage('Team 2 is required')
      .isMongoId().withMessage('Invalid team ID'),
    
    check('date')
      .notEmpty().withMessage('Match date is required')
      .isISO8601().withMessage('Please enter a valid date'),
    
    check('venue')
      .optional()
      .isMongoId().withMessage('Invalid venue ID'),
    
    check('rules.oversPerInning')
      .optional()
      .isInt({ min: 1 }).withMessage('Overs per inning must be at least 1'),
    
    check('rules.maxOversPerBowler')
      .optional()
      .isInt({ min: 1 }).withMessage('Max overs per bowler must be at least 1')
  ],

  // Ball scoring validators
  scoreBall: [
    check('inningId')
      .notEmpty().withMessage('Inning ID is required')
      .isMongoId().withMessage('Invalid inning ID'),
    
    check('overNumber')
      .notEmpty().withMessage('Over number is required')
      .isInt({ min: 1 }).withMessage('Over number must be at least 1'),
    
    check('ballNumber')
      .notEmpty().withMessage('Ball number is required')
      .isInt({ min: 1, max: 6 }).withMessage('Ball number must be between 1 and 6'),
    
    check('runs')
      .notEmpty().withMessage('Runs are required')
      .isInt({ min: 0 }).withMessage('Runs cannot be negative'),
    
    check('batsman')
      .notEmpty().withMessage('Batsman is required')
      .isMongoId().withMessage('Invalid batsman ID'),
    
    check('bowler')
      .notEmpty().withMessage('Bowler is required')
      .isMongoId().withMessage('Invalid bowler ID'),
    
    check('nonStriker')
      .notEmpty().withMessage('Non-striker is required')
      .isMongoId().withMessage('Invalid non-striker ID'),
    
    check('deliveryType')
      .isIn(['normal', 'wide', 'no_ball', 'bye', 'leg_bye', 'dead_ball'])
      .withMessage('Invalid delivery type'),
    
    check('extras.wides')
      .optional()
      .isInt({ min: 0 }).withMessage('Wides cannot be negative'),
    
    check('extras.noBalls')
      .optional()
      .isInt({ min: 0 }).withMessage('No balls cannot be negative'),
    
    check('extras.byes')
      .optional()
      .isInt({ min: 0 }).withMessage('Byes cannot be negative'),
    
    check('extras.legByes')
      .optional()
      .isInt({ min: 0 }).withMessage('Leg byes cannot be negative')
  ]
};

// Pagination middleware
const paginate = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Validate pagination parameters
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page number must be greater than 0'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  req.pagination = {
    page,
    limit,
    skip
  };
  
  next();
};

// Sorting middleware
const sort = (req, res, next) => {
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
  req.sorting = {
    [sortBy]: sortOrder
  };
  
  next();
};

// Filtering middleware for common fields
const filter = (allowedFilters = []) => {
  return (req, res, next) => {
    const filters = {};
    
    allowedFilters.forEach(filterName => {
      if (req.query[filterName]) {
        filters[filterName] = req.query[filterName];
      }
    });
    
    req.filters = filters;
    next();
  };
};

module.exports = {
  validate,
  commonValidators,
  paginate,
  sort,
  filter
};