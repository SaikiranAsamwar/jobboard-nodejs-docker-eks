const express = require('express');
const { User } = require('../models');
const router = express.Router();

router.get('/', async (req, res) => {
  // list users (dev only)
  const users = await User.findAll({ attributes: ['id','email','role']});
  res.json(users);
});

module.exports = router;
