const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireAdmin, requireMember } = require('../middleware/rbac');
const {
  createProject, getProjects, getProject,
  addMember, removeMember, deleteProject
} = require('../controllers/projectController');
const {
  createTask, getProjectTasks
} = require('../controllers/taskController');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .delete(deleteProject);

router.post('/:id/members', requireAdmin, addMember);
router.delete('/:id/members/:userId', requireAdmin, removeMember);

// Tasks under a project
router.get('/:projectId/tasks', requireMember, getProjectTasks);
router.post('/:projectId/tasks', requireAdmin, createTask);

module.exports = router;
