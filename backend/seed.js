require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Project = require('./src/models/Project');
const Task = require('./src/models/Task');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Clear existing
  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});

  // Create users
  const adminUser = await User.create({
    name: 'Alice Admin',
    email: 'alice@demo.com',
    password: 'password123'
  });

  const member1 = await User.create({
    name: 'Bob Builder',
    email: 'bob@demo.com',
    password: 'password123'
  });

  const member2 = await User.create({
    name: 'Carol Coder',
    email: 'carol@demo.com',
    password: 'password123'
  });

  // Create project
  const project = await Project.create({
    title: 'Ethara Product Launch',
    description: 'End-to-end coordination for the Q3 product launch.',
    createdBy: adminUser._id,
    members: [
      { user: adminUser._id, role: 'Admin' },
      { user: member1._id, role: 'Member' },
      { user: member2._id, role: 'Member' }
    ]
  });

  // Create tasks
  const tasks = [
    {
      title: 'Design landing page wireframes',
      description: 'Create low-fidelity wireframes for the new landing page.',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: 'High',
      status: 'In Progress',
      assignedTo: member1._id
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated deployments.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: 'High',
      status: 'To Do',
      assignedTo: member2._id
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST endpoints with Swagger.',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // overdue
      priority: 'Medium',
      status: 'To Do',
      assignedTo: member1._id
    },
    {
      title: 'User testing session',
      description: 'Conduct usability testing with 5 participants.',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: 'Medium',
      status: 'To Do'
    },
    {
      title: 'Fix auth bug in mobile app',
      description: 'Token refresh fails on Android devices.',
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // overdue
      priority: 'High',
      status: 'In Progress',
      assignedTo: member2._id
    },
    {
      title: 'Prepare press release',
      description: 'Draft and review the official press release.',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      priority: 'Low',
      status: 'Done',
      assignedTo: adminUser._id
    }
  ];

  for (const t of tasks) {
    await Task.create({ ...t, project: project._id, createdBy: adminUser._id });
  }

  console.log('\n✅ Seed complete!');
  console.log('----------------------------');
  console.log('Login with any of these accounts (password: password123):');
  console.log('  Admin : alice@demo.com');
  console.log('  Member: bob@demo.com');
  console.log('  Member: carol@demo.com');
  console.log('----------------------------\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
