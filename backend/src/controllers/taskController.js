const Task = require('../models/Task');
const Project = require('../models/Project');

// POST /api/projects/:projectId/tasks  (Admin only)
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, dueDate, priority, assignedTo } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required.' });

    // Validate assignedTo is a project member
    if (assignedTo) {
      const project = await Project.findById(req.params.projectId);
      const isMember = project.members.some(m => m.user.toString() === assignedTo);
      if (!isMember) {
        return res.status(400).json({ success: false, message: 'Assigned user is not a project member.' });
      }
    }

    const task = await Task.create({
      title, description, dueDate, priority,
      assignedTo: assignedTo || undefined,
      project: req.params.projectId,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json({ success: true, task });
  } catch (err) { next(err); }
};

// GET /api/projects/:projectId/tasks
exports.getProjectTasks = async (req, res, next) => {
  try {
    const { status, priority, assignedTo } = req.query;
    const filter = { project: req.params.projectId };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) { next(err); }
};

// GET /api/tasks/:id
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'title');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    res.json({ success: true, task });
  } catch (err) { next(err); }
};

// PATCH /api/tasks/:id
exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = task.project;
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());

    if (!member) return res.status(403).json({ success: false, message: 'Access denied.' });

    if (member.role === 'Admin') {
      // Admin can update all fields
      const { title, description, dueDate, priority, status, assignedTo } = req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || undefined;
    } else {
      // Member can only update status of their own tasks
      if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only update your own tasks.' });
      }
      if (req.body.status) task.status = req.body.status;
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json({ success: true, task });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id  (Admin only)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    const project = task.project;
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());

    if (!member || member.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) { next(err); }
};
