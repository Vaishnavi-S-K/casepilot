const USERS_KEY = 'cp_users';
const SESSION_KEY = 'cp_session';

const defaultUsers = [
  { email: 'arjun@advocourt.io', password: 'Pilot2026', name: 'Arjun Mehta', role: 'Managing Partner', isAdmin: true },
  { email: 'elena@advocourt.io', password: 'Pilot2026', name: 'Elena Vasquez', role: 'Senior Associate', isAdmin: false },
  { email: 'daniel@advocourt.io', password: 'Pilot2026', name: 'Daniel Okafor', role: 'Associate Attorney', isAdmin: false },
  { email: 'sofia@advocourt.io', password: 'Pilot2026', name: 'Sofia Petrov', role: 'Paralegal', isAdmin: false },
  { email: 'kevin@advocourt.io', password: 'Pilot2026', name: 'Kevin Liang', role: 'Junior Associate', isAdmin: false },
];

function initUsers() {
  const existing = localStorage.getItem(USERS_KEY);
  // Force refresh if cached users still have old domain
  if (!existing || existing.includes('@casepilot.io')) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
}

// Auto-init on module load
initUsers();

export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

export function findUser(email, password) {
  const users = getUsers();
  return users.find((u) => u.email === email && u.password === password) || null;
}

export function getUserByEmail(email) {
  return getUsers().find((u) => u.email === email) || null;
}

export function updateUser(email, updates) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // Also update session if it's the current user
  const session = getSession();
  if (session && session.email === email) {
    setSession({ ...session, ...updates });
  }
  return users[idx];
}

export function addUser(userData) {
  const users = getUsers();
  if (users.find((u) => u.email === userData.email)) {
    throw new Error('User with this email already exists');
  }
  users.push(userData);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return userData;
}

export function deleteUser(email) {
  const users = getUsers().filter((u) => u.email !== email);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
