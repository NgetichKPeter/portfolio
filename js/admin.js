const CONFIG = {
  owner: 'ngetichkpeter',
  repo: 'portfolio',
  branch: 'main'
};

let rawUpdates = [];
let rawProjects = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('gh_pat');
  if (token) {
    document.getElementById('gh-token').value = token;
    document.getElementById('auth-status').textContent = 'Token status: Active';
    document.getElementById('auth-status').className = 'text-xs font-mono block mt-1 text-emerald-400';
  } else {
    document.getElementById('auth-status').textContent = 'Token status: Missing';
    document.getElementById('auth-status').className = 'text-xs font-mono block mt-1 text-red-400';
  }
  loadAdminData();
});

function saveToken() {
  const token = document.getElementById('gh-token').value.trim();
  if (!token) return;
  localStorage.setItem('gh_pat', token);
  document.getElementById('auth-status').textContent = 'Token status: Active';
  document.getElementById('auth-status').className = 'text-xs font-mono block mt-1 text-emerald-400';
}

function switchTab(tab) {
  const updatesSec = document.getElementById('updates-section');
  const projectsSec = document.getElementById('projects-section');
  const tabUpdates = document.getElementById('tab-updates');
  const tabProjects = document.getElementById('tab-projects');

  if (tab === 'updates') {
    updatesSec.classList.remove('hidden');
    projectsSec.classList.add('hidden');
    tabUpdates.className = 'px-4 py-2 border-b-2 border-blue-500 text-blue-400 font-medium';
    tabProjects.className = 'px-4 py-2 text-gray-400 font-medium';
  } else {
    updatesSec.classList.add('hidden');
    projectsSec.classList.remove('hidden');
    tabProjects.className = 'px-4 py-2 border-b-2 border-blue-500 text-blue-400 font-medium';
    tabUpdates.className = 'px-4 py-2 text-gray-400 font-medium';
  }
}

function utf8ToBase64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
}

function base64ToUtf8(str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
}

async function getFileFromGitHub(filePath) {
  const token = localStorage.getItem('gh_pat');
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${filePath}?ref=${CONFIG.branch}`;
  
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`);
  return await res.json();
}

async function commitFileToGitHub(filePath, updatedData, commitMessage) {
  const token = localStorage.getItem('gh_pat');
  if (!token) {
    alert('Operation aborted: GitHub Access Token is required.');
    return false;
  }

  try {
    const currentFile = await getFileFromGitHub(filePath);
    const jsonString = JSON.stringify(updatedData, null, 2);
    const encodedContent = utf8ToBase64(jsonString);

    const payload = {
      message: commitMessage,
      content: encodedContent,
      sha: currentFile.sha,
      branch: CONFIG.branch
    };

    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${filePath}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Commit rejected by repository.');
    }

    return true;
  } catch (err) {
    alert(`Commit failure: ${err.message}`);
    return false;
  }
}

async function loadAdminData() {
  try {
    const updateFile = await getFileFromGitHub('data/updates.json');
    rawUpdates = JSON.parse(base64ToUtf8(updateFile.content));
    renderAdminUpdates();

    const projectFile = await getFileFromGitHub('data/projects.json');
    rawProjects = JSON.parse(base64ToUtf8(projectFile.content));
    renderAdminProjects();
  } catch (err) {
    console.error('Data retrieval failed:', err);
  }
}

function renderAdminUpdates() {
  const container = document.getElementById('admin-updates-list');
  container.innerHTML = rawUpdates.map(u => `
    <div class="bg-gray-900 border border-gray-800 p-3 rounded flex justify-between items-center">
      <div>
        <p class="font-bold text-sm text-gray-200">${u.title}</p>
        <p class="text-xs text-gray-500 font-mono">${u.date}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="editUpdate('${u.id}')" class="text-xs text-gray-300 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded">Edit</button>
        <button onclick="deleteUpdate('${u.id}')" class="text-xs text-red-400 bg-red-950 border border-red-900 px-2.5 py-1 rounded">Delete</button>
      </div>
    </div>
  `).join('');
}

async function handleUpdateSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('update-id').value;
  const title = document.getElementById('update-title').value;
  const content = document.getElementById('update-content').value;

  if (id) {
    const index = rawUpdates.findIndex(u => u.id == id);
    if (index !== -1) {
      rawUpdates[index].title = title;
      rawUpdates[index].content = content;
    }
  } else {
    const newUpdate = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title,
      content
    };
    rawUpdates.unshift(newUpdate);
  }

  const success = await commitFileToGitHub('data/updates.json', rawUpdates, id ? `Update entry: ${title}` : `New log entry: ${title}`);
  if (success) {
    resetUpdateForm();
    loadAdminData();
  }
}

function editUpdate(id) {
  const item = rawUpdates.find(u => u.id == id);
  if (!item) return;
  document.getElementById('update-id').value = item.id;
  document.getElementById('update-title').value = item.title;
  document.getElementById('update-content').value = item.content;
  document.getElementById('update-form-title').textContent = 'Modify Log Entry';
  document.getElementById('update-submit-btn').textContent = 'Commit Changes';
}

async function deleteUpdate(id) {
  if (!confirm('Confirm deletion of selected entry.')) return;
  rawUpdates = rawUpdates.filter(u => u.id != id);
  const success = await commitFileToGitHub('data/updates.json', rawUpdates, `Delete entry ${id}`);
  if (success) loadAdminData();
}

function resetUpdateForm() {
  document.getElementById('update-id').value = '';
  document.getElementById('update-title').value = '';
  document.getElementById('update-content').value = '';
  document.getElementById('update-form-title').textContent = 'Publish Log Entry';
  document.getElementById('update-submit-btn').textContent = 'Commit Log Entry';
}

function renderAdminProjects() {
  const container = document.getElementById('admin-projects-list');
  container.innerHTML = rawProjects.map(p => `
    <div class="bg-gray-900 border border-gray-800 p-3 rounded flex justify-between items-center">
      <div>
        <p class="font-bold text-sm text-gray-200">${p.title}</p>
        <p class="text-xs text-gray-500 font-mono">${p.status}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="editProject('${p.id}')" class="text-xs text-gray-300 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded">Edit</button>
        <button onclick="deleteProject('${p.id}')" class="text-xs text-red-400 bg-red-950 border border-red-900 px-2.5 py-1 rounded">Delete</button>
      </div>
    </div>
  `).join('');
}

async function handleProjectSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('project-id').value;
  const title = document.getElementById('project-title').value;
  const description = document.getElementById('project-desc').value;
  const techStack = document.getElementById('project-tech').value.split(',').map(t => t.trim());
  const status = document.getElementById('project-status').value;

  if (id) {
    const index = rawProjects.findIndex(p => p.id == id);
    if (index !== -1) {
      rawProjects[index] = { id, title, description, techStack, status, repoUrl: rawProjects[index].repoUrl || '' };
    }
  } else {
    const newProj = {
      id: Date.now().toString(),
      title,
      description,
      techStack,
      status,
      repoUrl: `https://github.com/ngetichkpeter/${title.toLowerCase().replace(/\s+/g, '-')}`
    };
    rawProjects.unshift(newProj);
  }

  const success = await commitFileToGitHub('data/projects.json', rawProjects, id ? `Update project: ${title}` : `New project specification: ${title}`);
  if (success) {
    resetProjectForm();
    loadAdminData();
  }
}

function editProject(id) {
  const item = rawProjects.find(p => p.id == id);
  if (!item) return;
  document.getElementById('project-id').value = item.id;
  document.getElementById('project-title').value = item.title;
  document.getElementById('project-desc').value = item.description;
  document.getElementById('project-tech').value = item.techStack.join(', ');
  document.getElementById('project-status').value = item.status;
  document.getElementById('project-form-title').textContent = 'Modify Project Specification';
  document.getElementById('project-submit-btn').textContent = 'Commit Changes';
}

async function deleteProject(id) {
  if (!confirm('Confirm deletion of project record.')) return;
  rawProjects = rawProjects.filter(p => p.id != id);
  const success = await commitFileToGitHub('data/projects.json', rawProjects, `Delete project ${id}`);
  if (success) loadAdminData();
}

function resetProjectForm() {
  document.getElementById('project-id').value = '';
  document.getElementById('project-title').value = '';
  document.getElementById('project-desc').value = '';
  document.getElementById('project-tech').value = '';
  document.getElementById('project-status').value = '';
  document.getElementById('project-form-title').textContent = 'Add Project Specification';
  document.getElementById('project-submit-btn').textContent = 'Commit Project Entry';
}
