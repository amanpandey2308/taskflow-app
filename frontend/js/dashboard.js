document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('user-name').textContent = user.name || 'User';
  document.getElementById('user-avatar').textContent = (user.name || 'U')[0].toUpperCase();
  document.getElementById('logout-btn').addEventListener('click', logout);

  const newProjectBtn = document.getElementById('new-project-btn');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalClose = document.getElementById('modal-close');
  const projectForm = document.getElementById('project-form');

  newProjectBtn.addEventListener('click', () => modalOverlay.classList.add('active'));
  modalClose.addEventListener('click', () => modalOverlay.classList.remove('active'));
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); });

  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = projectForm.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Creating...';
    try {
      await api.createProject({
        title: document.getElementById('proj-title').value,
        description: document.getElementById('proj-desc').value
      });
      showToast('Project created!', 'success');
      modalOverlay.classList.remove('active');
      projectForm.reset();
      loadDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Create Project';
    }
  });

  loadDashboard();
});

const loadDashboard = async () => {
  const statsArea = document.getElementById('stats-area');
  const projectsGrid = document.getElementById('projects-grid');
  const overdueList = document.getElementById('overdue-list');

  try {
    const [dashData, projData] = await Promise.all([api.getDashboard(), api.getProjects()]);
    const s = dashData.stats;

    // Stats
    statsArea.innerHTML = `
      <div class="stat-card purple fade-up">
        <div class="stat-icon">📁</div>
        <div class="stat-number">${s.totalProjects}</div>
        <div class="stat-label">Total Projects</div>
      </div>
      <div class="stat-card blue fade-up-2">
        <div class="stat-icon">📋</div>
        <div class="stat-number">${s.totalTasks}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
      <div class="stat-card amber fade-up-2">
        <div class="stat-icon">⚡</div>
        <div class="stat-number">${s.byStatus['In Progress']}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card green fade-up-3">
        <div class="stat-icon">✅</div>
        <div class="stat-number">${s.byStatus['Done']}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card red fade-up-3">
        <div class="stat-icon">🔥</div>
        <div class="stat-number">${s.overdueCount}</div>
        <div class="stat-label">Overdue</div>
      </div>
    `;

    // Progress bar
    const total = s.totalTasks || 1;
    const pct = Math.round((s.byStatus['Done'] / total) * 100);
    document.getElementById('completion-pct').textContent = pct + '%';
    document.getElementById('progress-fill').style.width = pct + '%';

    // Task by user
    const userList = document.getElementById('user-task-list');
    if (s.tasksByUser.length === 0) {
      userList.innerHTML = '<p style="color:var(--text-muted);font-size:0.83rem">No assigned tasks yet.</p>';
    } else {
      userList.innerHTML = s.tasksByUser.map(u => `
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.6rem">
          <div class="user-avatar" style="width:30px;height:30px;font-size:0.8rem">${u.user.name[0].toUpperCase()}</div>
          <div style="flex:1">
            <div style="font-size:0.85rem;font-weight:500">${u.user.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${u.count} task${u.count !== 1 ? 's' : ''}</div>
          </div>
          <div class="task-count-badge">${u.count}</div>
        </div>
      `).join('');
    }

    // Projects
    if (projData.projects.length === 0) {
      projectsGrid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🗂️</div><div class="empty-state-text">No projects yet. Create your first project!</div></div>`;
    } else {
      projectsGrid.innerHTML = projData.projects.map(p => {
        const initials = p.members.slice(0, 3).map(m => `<div class="member-dot">${m.user.name[0].toUpperCase()}</div>`).join('');
        return `
          <div class="card project-card fade-up" onclick="window.location.href='project.html?id=${p._id}'">
            <div class="project-card-title">${p.title}</div>
            <div class="project-card-desc">${p.description || 'No description provided.'}</div>
            <div class="project-meta">
              <div class="member-stack">${initials}</div>
              <span class="task-count-badge">${p.members.length} member${p.members.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Overdue
    if (s.overdueTasks.length === 0) {
      overdueList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">No overdue tasks!</div></div>';
    } else {
      overdueList.innerHTML = s.overdueTasks.map(t => `
        <div class="overdue-item">
          <div>
            <div class="overdue-title">${t.title}</div>
            <div class="overdue-project">${t.project?.title || ''}</div>
          </div>
          <span class="badge badge-high">${t.priority}</span>
          <span class="badge badge-inprogress">${formatDate(t.dueDate)}</span>
        </div>
      `).join('');
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
