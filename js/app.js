const GITHUB_USERNAME = 'ngetichkpeter';
const REPO_NAME = 'portfolio';
const BRANCH = 'main';

const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH}/data`;

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadUpdates();
  loadProjects();
  loadSocials();
});

async function fetchData(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}?cacheBust=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP error. Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error loading ${endpoint}:`, err);
    return null;
  }
}

async function loadProfile() {
  const data = await fetchData('profile.json');
  if (!data) return;
  
  document.getElementById('user-name').textContent = data.name;
  document.getElementById('user-handle').textContent = data.handle;
  document.getElementById('user-title').textContent = data.title;
  document.getElementById('user-bio').textContent = data.bio;
}

async function loadUpdates() {
  const updates = await fetchData('updates.json');
  const container = document.getElementById('updates-container');
  if (!updates) return;

  container.innerHTML = updates.map(u => `
    <article class="bg-gray-900 border border-gray-800 p-4 rounded-lg space-y-1">
      <div class="flex justify-between items-center text-xs text-gray-500 font-mono">
        <span>${u.date}</span>
      </div>
      <h3 class="font-bold text-gray-200 text-base">${u.title}</h3>
      <p class="text-sm text-gray-400 leading-relaxed">${u.content}</p>
    </article>
  `).join('');
}

async function loadProjects() {
  const projects = await fetchData('projects.json');
  const container = document.getElementById('projects-container');
  if (!projects) return;

  container.innerHTML = projects.map(p => `
    <article class="bg-gray-900 border border-gray-800 p-5 rounded-lg space-y-3">
      <div class="flex justify-between items-start">
        <h3 class="text-base font-bold text-white">${p.title}</h3>
        <span class="text-xs bg-gray-800 text-gray-300 border border-gray-700 px-2 py-0.5 rounded font-mono">
          ${p.status}
        </span>
      </div>
      <p class="text-sm text-gray-400 leading-relaxed">${p.description}</p>
      <div class="flex flex-wrap gap-2 pt-1">
        ${p.techStack.map(t => `
          <span class="text-xs bg-gray-950 text-gray-300 border border-gray-800 px-2 py-0.5 rounded font-mono">
            ${t}
          </span>
        `).join('')}
      </div>
    </article>
  `).join('');
}

async function loadSocials() {
  const socials = await fetchData('socials.json');
  const container = document.getElementById('socials-container');
  if (!socials) return;

  container.innerHTML = socials.map(s => `
    <a href="${s.url}" target="_blank" rel="noopener noreferrer" 
       class="flex items-center justify-between p-3.5 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-lg transition-all group">
      <span class="font-medium text-sm text-gray-300">${s.name}</span>
      <div class="flex items-center space-x-1 text-xs text-gray-500 group-hover:text-blue-400 font-mono">
        <span>${s.handle}</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
        </svg>
      </div>
    </a>
  `).join('');
}
