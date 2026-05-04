const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(protect);

router.route('/:id')
  .get(getTask)
  .patch(updateTask)
  .delete(deleteTask);

module.exports = router;
