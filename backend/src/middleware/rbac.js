const Project = require('../models/Project');

// Check if current user is an Admin in the project
const requireAdmin = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    if (member.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }

    req.project = project;
    req.memberRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

// Check if current user is at least a Member in the project
const requireMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId || req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project.' });
    }

    req.project = project;
    req.memberRole = member.role;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAdmin, requireMember };
