const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const { AppError } = require('../utils/errorHandler');

// POST /api/projects
exports.createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });

    const project = await Project.create({
      title, description, createdBy: req.user._id
    });

    await project.populate('members.user', 'name email');
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
};

// GET /api/projects
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email')
      .sort('-createdAt');

    res.json({ success: true, count: projects.length, projects });
  } catch (err) { next(err); }
};

// GET /api/projects/:id
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied.' });

    res.json({ success: true, project });
  } catch (err) { next(err); }
};

// POST /api/projects/:id/members
exports.addMember = async (req, res, next) => {
  try {
    const { email, role = 'Member' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ success: false, message: 'User not found.' });

    const project = req.project;

    const alreadyMember = project.members.some(
      m => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) return res.status(400).json({ success: false, message: 'User is already a member.' });

    project.members.push({ user: userToAdd._id, role });
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ success: true, project });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/members/:userId
exports.removeMember = async (req, res, next) => {
  try {
    const project = req.project;
    const { userId } = req.params;

    if (userId === project.createdBy.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove project creator.' });
    }

    project.members = project.members.filter(m => m.user.toString() !== userId);
    await project.save();

    // Remove assigned tasks from removed user
    await Task.updateMany(
      { project: project._id, assignedTo: userId },
      { $unset: { assignedTo: '' } }
    );

    res.json({ success: true, message: 'Member removed successfully.' });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    if (project.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can delete this project.' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) { next(err); }
};
