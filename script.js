// Club directory enhancements: search/filter, saved clubs, and application tracker.
(() => {
  const cards = [...document.querySelectorAll('#clubCards .card')];
  // Build the application dropdown from the club cards already on the page.
  const clubSelect = document.getElementById('clubSelect');
  if (clubSelect) {
    clubSelect.replaceChildren(new Option('Choose a club', ''));
    cards.forEach(card => {
      const clubName = card.querySelector('h3')?.textContent.trim();
      if (clubName) clubSelect.add(new Option(clubName, clubName));
    });
    if (!cards.length) {
      clubSelect.replaceChildren(new Option('No clubs are currently listed', ''));
      clubSelect.disabled = true;
    }
  }
  const search = document.getElementById('clubSearch');
  const category = document.getElementById('clubCategory');
  const savedButton = document.getElementById('showSaved');
  const savedCount = document.getElementById('savedCount');
  const count = document.getElementById('clubResultCount');
  const SAVED_KEY = 'campusPortalSavedClubs';
  const APP_KEY = 'campusPortalDemoApplications';
  let saved = new Set(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'));
  let onlySaved = false;
  const nameOf = card => card.querySelector('h3').textContent.trim();

  function updateSavedButtons() {
    cards.forEach(card => {
      const button = card.querySelector('.save-club');
      const isSaved = saved.has(nameOf(card));
      button.textContent = isSaved ? '★ Saved' : '☆ Save club';
      button.setAttribute('aria-pressed', String(isSaved));
    });
    savedCount.textContent = saved.size;
  }
  function filterCards() {
    const q = search.value.trim().toLowerCase();
    const type = category.value;
    let shown = 0;
    cards.forEach(card => {
      const matches = nameOf(card).toLowerCase().includes(q) ||
        card.querySelector('p').textContent.toLowerCase().includes(q);
      const visible = matches && (type === 'all' || card.dataset.category === type) &&
        (!onlySaved || saved.has(nameOf(card)));
      card.hidden = !visible;
      if (visible) shown++;
    });
    count.textContent = `${shown} club${shown === 1 ? '' : 's'} shown`;
    savedButton.textContent = onlySaved ? 'Show all clubs' : `Saved clubs ${saved.size}`;
  }
  cards.forEach(card => card.querySelector('.save-club').addEventListener('click', () => {
    const name = nameOf(card);
    saved.has(name) ? saved.delete(name) : saved.add(name);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
    updateSavedButtons(); filterCards();
  }));
  search.addEventListener('input', filterCards);
  category.addEventListener('change', filterCards);
  savedButton.addEventListener('click', () => { onlySaved = !onlySaved; filterCards(); });
  // Click a club card to open its detail popup. Save buttons remain independent.
  const modal = document.getElementById('clubModal');
  const modalTitle = document.getElementById('clubModalTitle');
  const modalDescription = document.getElementById('clubModalDescription');
  const modalMeta = document.getElementById('clubModalMeta');
  const modalExtra = document.getElementById('clubModalExtra');
  const modalSave = document.getElementById('clubModalSave');
  const modalApply = document.getElementById('clubModalApply');
  let activeCard = null;

  const clubDetails = {
    'Coding & Robotics Club': {
      focus: 'Build, experiment and collaborate on practical technology projects.',
      activities: 'Hack nights, beginner-friendly coding sessions, robotics builds, workshops and team hackathons.',
      welcome: 'Students interested in programming, electronics, problem-solving or learning something new are welcome.'
    },
    'Debating Society': {
      focus: 'Develop clear arguments, confident public speaking and thoughtful discussion.',
      activities: 'Inter-university debates, speaking practice, discussion circles and workshops on argumentation.',
      welcome: 'Open to students who enjoy current affairs, discussion and learning to communicate their ideas.'
    },
    'Cultural Society': {
      focus: 'Bring the campus community together through the many cultures and traditions of South Asia.',
      activities: 'Festival celebrations, cultural showcases, performances and collaborative campus events.',
      welcome: 'Students can contribute through performance, planning, design, coordination or volunteering.'
    },
    'Photography & Film Club': {
      focus: 'Tell stories and document campus life through photography and film.',
      activities: 'Photo walks, short-film projects, creative workshops and campus event coverage.',
      welcome: 'Open to beginners and experienced creators interested in visual storytelling.'
    },
    'Sports Society': {
      focus: 'Make sport, fitness and teamwork part of campus life.',
      activities: 'Cricket, football, badminton, yoga and opportunities to participate at different levels.',
      welcome: 'Students of all experience levels can get involved and take part.'
    },
    'Social Outreach Cell': {
      focus: 'Connect students with meaningful community service and awareness initiatives.',
      activities: 'Volunteering, awareness drives and community-focused activities.',
      welcome: 'Open to students who want to contribute time, ideas and practical support.'
    }
  };

  function openClubModal(card) {
    activeCard = card;
    const name = nameOf(card);
    const details = clubDetails[name] || {};
    modalTitle.textContent = name;
    modalDescription.textContent = details.focus || card.querySelector('p').textContent.trim();
    modalMeta.replaceChildren();
    [card.dataset.category ? card.dataset.category.replace('-', ' ') : 'Student club',
      card.querySelector('.date')?.textContent.trim() || 'Recruitment details'].forEach(value => {
      const tag = document.createElement('span');
      tag.textContent = value;
      modalMeta.append(tag);
    });
    modalExtra.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = 'What you can expect';
    const activity = document.createElement('p');
    activity.textContent = details.activities || card.querySelector('p').textContent.trim();
    const welcomeHeading = document.createElement('h3');
    welcomeHeading.textContent = 'Who can join';
    const welcome = document.createElement('p');
    welcome.textContent = details.welcome || 'Students interested in this club are encouraged to apply.';
    modalExtra.append(heading, activity, welcomeHeading, welcome);
    updateModalSaveButton();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('.club-modal-close').focus();
  }

  function closeClubModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (activeCard) activeCard.focus?.();
  }

  function updateModalSaveButton() {
    if (!activeCard) return;
    const isSaved = saved.has(nameOf(activeCard));
    modalSave.textContent = isSaved ? '★ Saved' : '☆ Save club';
    modalSave.setAttribute('aria-pressed', String(isSaved));
  }

  cards.forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${nameOf(card)}`);
    card.addEventListener('click', event => {
      if (event.target.closest('.save-club')) return;
      openClubModal(card);
    });
    card.addEventListener('keydown', event => {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openClubModal(card);
      }
    });
  });

  modal.querySelectorAll('[data-close-modal]').forEach(element =>
    element.addEventListener('click', closeClubModal)
  );
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('open')) closeClubModal();
  });
  modalSave.addEventListener('click', () => {
    if (!activeCard) return;
    const name = nameOf(activeCard);
    saved.has(name) ? saved.delete(name) : saved.add(name);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
    updateSavedButtons();
    filterCards();
    updateModalSaveButton();
  });
  modalApply.addEventListener('click', () => {
    if (!activeCard) return;
    const club = nameOf(activeCard);
    closeClubModal();
    if (window.startClubApplication) window.startClubApplication(club);
  });

  updateSavedButtons(); filterCards();

  // Demo tracker stores applications in this browser; it is not a server submission.
  const form = document.getElementById('applicationForm');
  const list = document.getElementById('applicationList');
  function renderApplications() {
    const apps = JSON.parse(localStorage.getItem(APP_KEY) || '[]');
    if (!apps.length) { list.innerHTML = '<p>No demo applications submitted yet.</p>'; return; }
    list.replaceChildren();
    apps.forEach(app => {
      const item = document.createElement('div');
      item.className = 'application-item';
      const title = document.createElement('strong'); title.textContent = app.club;
      const status = document.createElement('span'); status.className = 'status'; status.textContent = app.status;
      const detail = document.createElement('p'); detail.textContent = `${app.course} · ${app.year} · Submitted ${app.date}`;
      item.append(title, ' ', status, detail); list.append(item);
    });
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const club = document.getElementById('clubSelect').value;
    if (!club) { document.getElementById('applicationMessage').textContent = 'Choose a club first.'; return; }
    const apps = JSON.parse(localStorage.getItem(APP_KEY) || '[]');
    if (apps.some(app => app.club === club)) {
      document.getElementById('applicationMessage').textContent = 'You already have a demo application for this club.';
      return;
    }
    apps.push({club, course: document.getElementById('studentCourse').value,
      year: document.getElementById('studentYear').value, motivation: document.getElementById('motivation').value,
      date: new Date().toLocaleDateString(), status: 'Submitted (demo)'});
    localStorage.setItem(APP_KEY, JSON.stringify(apps));
    document.getElementById('applicationMessage').textContent = 'Demo application saved in this browser.';
    renderApplications();
  });
  document.getElementById('refreshApplications')?.addEventListener('click', renderApplications);
  renderApplications();
})();

// Demo sign-in/register flow (browser-local only; not production authentication).
(() => {
  const byId = id => document.getElementById(id);
  const authPanel = byId('authPanel'), studentPanel = byId('studentPanel'), adminPanel = byId('adminPanel');
  const authForm = byId('authForm');
  if (!authForm) return;
  const USERS_KEY = 'campusPortalDemoUsers';
  const SESSION_KEY = 'campusPortalDemoSession';
  let mode = 'login';
  const users = () => JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  const setMessage = message => { byId('authMessage').textContent = message; };
  function showMode(next) {
    mode = next;
    const registering = mode === 'register';
    byId('authHeading').textContent = registering ? 'Create student account' : 'Student sign in';
    byId('nameField').classList.toggle('portal-hidden', !registering);
    byId('fullName').required = registering;
    byId('password').autocomplete = registering ? 'new-password' : 'current-password';
    byId('authSubmit').textContent = registering ? 'Create account' : 'Sign in';
    byId('showLogin').classList.toggle('secondary', registering);
    byId('showRegister').classList.toggle('secondary', !registering);
    setMessage('');
  }
  let pendingClub = null;

  // Called by the club details popup's Apply button.
  window.startClubApplication = function(clubName) {
    pendingClub = clubName;
    const email = localStorage.getItem(SESSION_KEY);
    const signedIn = !!email && !!users()[email];
    if (signedIn) {
      byId('clubSelect').value = clubName;
      studentPanel.classList.add('visible');
      studentPanel.scrollIntoView({behavior:'smooth', block:'start'});
    } else {
      authPanel.classList.add('visible');
      showMode('login');
      authPanel.scrollIntoView({behavior:'smooth', block:'center'});
    }
  };

  function continuePendingApplication() {
    if (!pendingClub) return;
    const clubName = pendingClub;
    pendingClub = null;
    byId('clubSelect').value = clubName;
    studentPanel.classList.add('visible');
    studentPanel.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function renderSession() {
    const email = localStorage.getItem(SESSION_KEY);
    const signedIn = !!email && !!users()[email];
    authPanel.classList.toggle('visible', !signedIn);
    studentPanel.classList.toggle('visible', signedIn);
    if (adminPanel) adminPanel.classList.remove('visible');
    byId('sessionMessage').textContent = signedIn ? `Signed in as ${email}` : '';
    byId('navAuth').textContent = signedIn ? 'My dashboard' : 'Sign in';
    if (signedIn) byId('welcomeHeading').textContent = `Welcome, ${users()[email].name}`;
  }
  byId('signInButton').addEventListener('click', event => {
    event.preventDefault();
    const signedIn = !!localStorage.getItem(SESSION_KEY);
    if (signedIn) studentPanel.scrollIntoView({behavior:'smooth', block:'start'});
    else { authPanel.classList.add('visible'); showMode('login'); authPanel.scrollIntoView({behavior:'smooth', block:'center'}); }
  });
  byId('navAuth').addEventListener('click', event => {
    if (!localStorage.getItem(SESSION_KEY)) {
      event.preventDefault(); authPanel.classList.add('visible'); showMode('login');
    }
  });
  byId('showLogin').addEventListener('click', () => showMode('login'));
  byId('showRegister').addEventListener('click', () => showMode('register'));
  authForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = byId('email').value.trim().toLowerCase();
    const password = byId('password').value;
    const store = users();
    if (mode === 'register') {
      const name = byId('fullName').value.trim();
      if (!name) return setMessage('Enter your full name.');
      if (store[email]) return setMessage('An account with this email already exists. Sign in instead.');
      store[email] = {name, password};
      localStorage.setItem(USERS_KEY, JSON.stringify(store));
      localStorage.setItem(SESSION_KEY, email);
      authForm.reset(); renderSession(); continuePendingApplication();
    } else {
      if (!store[email] || store[email].password !== password) return setMessage('Email or password is incorrect.');
      localStorage.setItem(SESSION_KEY, email);
      authForm.reset(); renderSession(); continuePendingApplication();
    }
  });
  function signOut() { localStorage.removeItem(SESSION_KEY); renderSession(); showMode('login'); }
  byId('logoutButton')?.addEventListener('click', signOut);
  byId('adminLogout')?.addEventListener('click', signOut);
  showMode('login'); renderSession();
})();
