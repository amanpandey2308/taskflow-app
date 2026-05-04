const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');
let currentProject = null;
let currentUser = null;
let myRole = 'Member';
let allTasks = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  if (!projectId) { window.location.href = 'dashboard.html'; return; }

  currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  document.getElementById('user-name').textContent = currentUser.name || 'User';
  document.getElementById('user-avatar').textContent = (currentUser.name || 'U')[0].toUpperCase();
  document.getElementById('logout-btn').addEventListener('click', logout);

  setupTaskModal();
  setupMemberModal();
  setupFilterListeners();

  await loadProject();
  await loadTasks();
});

const loadProject = async () => {
  try {
    const data = await api.getProject(projectId);
    currentProject = data.project;

    document.getElementById('project-title').textContent = currentProject.title;
    document.getElementById('project-desc').textContent = currentProject.description || '';

    const me = currentProject.members.find(m => m.user._id === currentUser.id);
    myRole = me ? me.role : 'Member';

    document.getElementById('my-role-badge').innerHTML = `<span class="badge badge-${myRole.toLowerCase()}">${myRole}</span>`;

    if (myRole === 'Admin') {
      document.getElementById('add-task-btn').style.display = 'inline-flex';
      document.getElementById('add-member-btn').style.display = 'inline-flex';
    }

    renderMembers();
  } catch (err) {
    showToast(err.message, 'error');
    window.location.href = 'dashboard.html';
  }
};

const renderMembers = () => {
  const list = document.getElementById('member-list');
  list.innerHTML = currentProject.members.map(m => `
    <div class="member-row">
      <div class="user-avatar" style="width:30px;height:30px;font-size:0.8rem">${m.user.name[0].toUpperCase()}</div>
      <div class="member-info">
        <div class="member-row-name">${m.user.name}</div>
        <div class="member-row-email">${m.user.email}</div>
      </div>
      <span class="badge badge-${m.role.toLowerCase()}">${m.role}</span>
      ${myRole === 'Admin' && m.user._id !== currentProject.createdBy._id ? `
        <button class="btn-ghost btn-sm" onclick="removeMember('${m.user._id}')" style="padding:0.2rem 0.5rem;color:var(--danger)">✕</button>
      ` : ''}
    </div>
  `).join('');
};

const loadTasks = async (filter = '') => {
  const board = document.getElementById('kanban-board');
  board.innerHTML = '<div class="page-loader"><div class="spinner"></div></div>';
  try {
    const data = await api.getProjectTasks(projectId, filter);
    allTasks = data.tasks;
    renderKanban(allTasks);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

const renderKanban = (tasks) => {
  const cols = { 'To Do': [], 'In Progress': [], 'Done': [] };
  tasks.forEach(t => cols[t.status] && cols[t.status].push(t));

  const board = document.getElementById('kanban-board');
  board.innerHTML = Object.entries(cols).map(([status, tasks]) => {
    const key = status.replace(' ', '').toLowerCase().replace('todo','todo').replace('inprogress','inprogress').replace('done','done');
    const dotClass = { 'To Do': 'todo', 'In Progress': 'inprogress', 'Done': 'done' }[status];
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <div class="kanban-col-title">
            <div class="col-dot ${dotClass}"></div>
            ${status}
          </div>
          <span class="col-count">${tasks.length}</span>
        </div>
        <div id="col-${key}">
          ${tasks.length === 0
            ? '<div class="empty-state" style="padding:2rem 0.5rem"><div class="empty-state-icon" style="font-size:1.8rem">📭</div><div class="empty-state-text">No tasks</div></div>'
            : tasks.map(t => renderTaskCard(t)).join('')
          }
        </div>
      </div>
    `;
  }).join('');
};

const renderTaskCard = (t) => {
  const isOverdue = t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < new Date();
  const priorityClass = t.priority.toLowerCase() + '-priority';
  const dueTxt = t.dueDate ? `<span class="task-due ${isOverdue ? 'overdue' : ''}">📅 ${formatDate(t.dueDate)}${isOverdue ? ' (Overdue)' : ''}</span>` : '';
  const assignee = t.assignedTo ? `<span class="task-assignee">👤 ${t.assignedTo.name}</span>` : '';
  const canEdit = myRole === 'Admin' || (t.assignedTo && t.assignedTo._id === currentUser.id);

  return `
    <div class="card task-card ${priorityClass}" onclick="${canEdit ? `openEditTask('${t._id}')` : 'void(0)'}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem">
        <div class="task-card-title">${t.title}</div>
        <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
      </div>
      ${t.description ? `<div style="font-size:0.78rem;color:var(--text-muted);margin:0.3rem 0;line-height:1.4">${t.description.substring(0,80)}${t.description.length > 80 ? '...' : ''}</div>` : ''}
      <div class="task-card-meta">
        ${dueTxt}
        ${assignee}
      </div>
    </div>
  `;
};

const openEditTask = (taskId) => {
  const task = allTasks.find(t => t._id === taskId);
  if (!task) return;

  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-id').value = taskId;
  document.getElementById('task-title').value = task.title;
  document.getElementById('task-desc').value = task.description || '';
  document.getElementById('task-due').value = task.dueDate ? task.dueDate.split('T')[0] : '';
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-status').value = task.status;

  if (myRole === 'Admin') {
    document.getElementById('task-assignee-group').style.display = 'block';
    populateMemberSelect(task.assignedTo?._id);
    document.getElementById('task-delete-btn').style.display = 'inline-flex';
    setAdminFields(true);
  } else {
    document.getElementById('task-assignee-group').style.display = 'none';
    document.getElementById('task-delete-btn').style.display = 'none';
    setAdminFields(false);
  }

  document.getElementById('task-modal-overlay').classList.add('active');
};

const setAdminFields = (enabled) => {
  ['task-title', 'task-desc', 'task-due', 'task-priority'].forEach(id => {
    document.getElementById(id).disabled = !enabled;
  });
};

const populateMemberSelect = (selectedId) => {
  const sel = document.getElementById('task-assignee');
  sel.innerHTML = '<option value="">Unassigned</option>' +
    currentProject.members.map(m => `<option value="${m.user._id}" ${m.user._id === selectedId ? 'selected' : ''}>${m.user.name}</option>`).join('');
};

const setupTaskModal = () => {
  const overlay = document.getElementById('task-modal-overlay');
  const form = document.getElementById('task-form');
  const addBtn = document.getElementById('add-task-btn');
  const closeBtn = document.getElementById('task-modal-close');
  const deleteBtn = document.getElementById('task-delete-btn');

  addBtn.addEventListener('click', () => {
    document.getElementById('task-modal-title').textContent = 'Create Task';
    document.getElementById('task-id').value = '';
    form.reset();
    document.getElementById('task-assignee-group').style.display = 'block';
    document.getElementById('task-delete-btn').style.display = 'none';
    setAdminFields(true);
    populateMemberSelect('');
    overlay.classList.add('active');
  });

  closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });

  deleteBtn.addEventListener('click', async () => {
    const id = document.getElementById('task-id').value;
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      showToast('Task deleted.', 'success');
      overlay.classList.remove('active');
      loadTasks();
    } catch (err) { showToast(err.message, 'error'); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const id = document.getElementById('task-id').value;
    const body = {
      title: document.getElementById('task-title').value,
      description: document.getElementById('task-desc').value,
      dueDate: document.getElementById('task-due').value || undefined,
      priority: document.getElementById('task-priority').value,
      status: document.getElementById('task-status').value,
      assignedTo: document.getElementById('task-assignee')?.value || undefined
    };
    try {
      if (id) {
        await api.updateTask(id, body);
        showToast('Task updated!', 'success');
      } else {
        await api.createTask(projectId, body);
        showToast('Task created!', 'success');
      }
      overlay.classList.remove('active');
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
};

const setupMemberModal = () => {
  const overlay = document.getElementById('member-modal-overlay');
  const form = document.getElementById('member-form');
  document.getElementById('add-member-btn').addEventListener('click', () => overlay.classList.add('active'));
  document.getElementById('member-modal-close').addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    try {
      await api.addMember(projectId, {
        email: document.getElementById('member-email').value,
        role: document.getElementById('member-role').value
      });
      showToast('Member added!', 'success');
      overlay.classList.remove('active');
      form.reset();
      await loadProject();
    } catch (err) {
      showToast(err.message, 'error');
    } finally { btn.disabled = false; }
  });
};

const removeMember = async (userId) => {
  if (!confirm('Remove this member?')) return;
  try {
    await api.removeMember(projectId, userId);
    showToast('Member removed.', 'success');
    await loadProject();
    loadTasks();
  } catch (err) { showToast(err.message, 'error'); }
};

const setupFilterListeners = () => {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = chip.dataset.filter;
      loadTasks(val ? `?status=${encodeURIComponent(val)}` : '');
    });
  });
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
