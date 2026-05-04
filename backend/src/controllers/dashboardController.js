const Task = require('../models/Task');
const Project = require('../models/Project');

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    // Get all projects user is a member of
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map(p => p._id);

    // All tasks in those projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('project', 'title');

    const now = new Date();

    // Stats
    const total = allTasks.length;
    const byStatus = {
      'To Do': allTasks.filter(t => t.status === 'To Do').length,
      'In Progress': allTasks.filter(t => t.status === 'In Progress').length,
      'Done': allTasks.filter(t => t.status === 'Done').length
    };

    const overdue = allTasks.filter(
      t => t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < now
    );

    // Tasks per user
    const userMap = {};
    allTasks.forEach(t => {
      if (t.assignedTo) {
        const uid = t.assignedTo._id.toString();
        if (!userMap[uid]) {
          userMap[uid] = { user: t.assignedTo, count: 0 };
        }
        userMap[uid].count++;
      }
    });
    const tasksByUser = Object.values(userMap).sort((a, b) => b.count - a.count);

    // Recent tasks (last 5)
    const recentTasks = allTasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalProjects: projects.length,
        totalTasks: total,
        byStatus,
        overdueCount: overdue.length,
        tasksByUser,
        overdueTasks: overdue.slice(0, 5),
        recentTasks
      }
    });
  } catch (err) { next(err); }
};
