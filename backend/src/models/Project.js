const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['Admin', 'Member'], default: 'Member' }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema]
}, { timestamps: true });

// Creator is always an Admin member
projectSchema.pre('save', function (next) {
  if (this.isNew) {
    const alreadyMember = this.members.some(
      m => m.user.toString() === this.createdBy.toString()
    );
    if (!alreadyMember) {
      this.members.push({ user: this.createdBy, role: 'Admin' });
    }
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
