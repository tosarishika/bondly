import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://vcennazfnqccvrnmfuvn.supabase.co',
  'sb_publishable_YNz9KMB4mp758x2gtV99sQ_q6R5Ajrr'
);

let signedInUser = null;
let selectedMember = null;
let activeChatId = null;
let unreadMessageCount = 0;
let pendingSharedPost = null;
const localLaunch = window.launchApp;

function addProfileSetupFields() {
  const card = document.querySelector('.onboard-card');
  if (document.getElementById('profileFullName')) return;
  const universityLabel = [...card.querySelectorAll('label')].find((label) => label.textContent === 'University');
  universityLabel.insertAdjacentHTML('beforebegin', '<label>Your name</label><input id="profileFullName" class="field" placeholder="Your full name"><label>Profile picture</label><input id="profilePhoto" class="field" type="file" accept="image/*"><label>Short bio</label><textarea id="profileBioInput" class="field" placeholder="A little about you, your interests, or what you are looking for"></textarea>');
}
addProfileSetupFields();
document.querySelector('.my-card').onclick = () => openMyProfile();

function setupProductFeatures() {
  const topbar = document.querySelector('.topbar');
  const messagesNav = document.querySelector('.nav-item[data-view="messages"]');
  messagesNav.insertAdjacentHTML('beforeend', '<b id="messageCount" class="nav-badge" style="display:none">0</b>');
  document.querySelector('.send').insertAdjacentHTML('afterbegin', '<input id="chatFile" type="file" accept="image/*,application/pdf,.pdf" style="display:none" onchange="showSelectedChatFile()"><button id="chatAttachButton" type="button" title="Attach a photo or PDF" onclick="document.getElementById(\'chatFile\').click()" style="background:transparent;color:#176b57;font-size:21px;padding:2px 5px">📎</button><span id="chatFileName" style="font-size:11px;color:#68817c;max-width:85px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"></span>');
  topbar.insertAdjacentHTML('beforeend', '<button id="notificationsButton" class="secondary-btn" style="position:relative" onclick="showNotifications()">♡ <span id="notificationCount" style="display:none;position:absolute;top:-7px;right:-7px;background:#f0826c;color:#fff;border-radius:99px;padding:1px 5px;font-size:10px">0</span></button>');
  const notifications = document.createElement('div'); notifications.className = 'view'; notifications.id = 'notifications'; notifications.innerHTML = '<div class="view-title"><div><h2>Notifications</h2><p>Connection requests and matching internships.</p></div></div><div id="notificationsList"></div>'; document.querySelector('.content').appendChild(notifications);
  const accommodationNav = document.createElement('div'); accommodationNav.className = 'nav-item'; accommodationNav.dataset.view = 'accommodations'; accommodationNav.innerHTML = '<span class="icon">⌂</span><span>Accommodations</span>'; accommodationNav.onclick = () => window.showView('accommodations'); document.querySelector('.nav-item[data-view="opportunities"]').insertAdjacentElement('afterend', accommodationNav);
  const accommodations = document.createElement('div'); accommodations.className = 'view'; accommodations.id = 'accommodations'; accommodations.innerHTML = '<div class="view-title"><div><h2>Accommodations</h2><p>Find roommates, rooms, and student-friendly housing.</p></div><button class="secondary-btn" onclick="document.getElementById(\'accommodationModal\').classList.add(\'show\')">+ Post listing</button></div><div id="accommodationsList"></div>'; document.querySelector('.content').appendChild(accommodations);
  const accommodationModal = document.createElement('div'); accommodationModal.className = 'highlight-modal'; accommodationModal.id = 'accommodationModal'; accommodationModal.innerHTML = '<div class="dialog"><h2>Post accommodation</h2><p>Share a room, flat, roommate request, or housing lead.</p><select id="accommodationType" class="field"><option value="">What are you posting?</option><option>Room available</option><option>Looking for a roommate</option><option>Flat / studio available</option><option>Housing advice / lead</option></select><input id="accommodationTitle" class="field" placeholder="Title — e.g. Room near University of Dubai"><input id="accommodationArea" class="field" placeholder="Area / neighbourhood"><input id="accommodationPrice" class="field" placeholder="Monthly budget (optional)"><textarea id="accommodationDescription" class="field" placeholder="Add useful details, availability, and preferences"></textarea><p id="accommodationError" class="highlight-status"></p><button class="primary-btn wide" onclick="publishAccommodation()">Post listing</button><div class="switch"><a onclick="document.getElementById(\'accommodationModal\').classList.remove(\'show\')">Cancel</a></div></div>'; document.body.appendChild(accommodationModal);
  const shareModal = document.createElement('div'); shareModal.className = 'highlight-modal'; shareModal.id = 'sharePostModal'; shareModal.innerHTML = '<div class="dialog"><h2>Share highlight</h2><p>Choose a student to send this post to.</p><div id="sharePeopleList"></div><div class="switch"><a onclick="document.getElementById(\'sharePostModal\').classList.remove(\'show\')">Cancel</a></div></div>'; document.body.appendChild(shareModal);
  const postModal = document.createElement('div'); postModal.className = 'highlight-modal'; postModal.id = 'postModal';
  postModal.innerHTML = '<div class="dialog" style="max-width:700px;padding:0;overflow:hidden"><button onclick="closePostModal()" aria-label="Close post" style="position:absolute;right:22px;top:18px;z-index:2;border-radius:50%;background:#fff;width:34px;height:34px;font-size:20px">×</button><div id="openedPost"></div></div>';
  postModal.onclick = (event) => { if (event.target === postModal) window.closePostModal(); };
  document.body.appendChild(postModal);
  const internshipButton = document.createElement('button'); internshipButton.textContent = 'Post internship'; internshipButton.onclick = () => document.getElementById('internshipModal').classList.add('show'); document.querySelector('.weekly-card').appendChild(internshipButton);
  const modal = document.createElement('div'); modal.className = 'highlight-modal'; modal.id = 'internshipModal';
  modal.innerHTML = '<div class="dialog"><h2>Share an internship</h2><p>Students with the matching interest will be notified.</p><input id="internshipTitle" class="field" placeholder="Role title — e.g. Marketing Intern"><input id="internshipCompany" class="field" placeholder="Company"><select id="internshipField" class="field"><option value="">Choose field</option><option>Marketing</option><option>Finance</option><option>Design</option><option>Technology</option><option>Media</option><option>Consulting</option><option>Engineering</option></select><input id="internshipLocation" class="field" placeholder="Location — e.g. Dubai"><textarea id="internshipDescription" class="field" placeholder="Describe the role, duration, and how to apply"></textarea><input id="internshipLink" class="field" placeholder="Application link (optional)"><p id="internshipError" class="highlight-status"></p><button class="primary-btn wide" onclick="publishInternship()">Post internship</button><div class="switch"><a onclick="document.getElementById(\'internshipModal\').classList.remove(\'show\')">Cancel</a></div></div>';
  document.body.appendChild(modal);

  const editModal = document.createElement('div'); editModal.className = 'highlight-modal'; editModal.id = 'editProfileModal';
  editModal.innerHTML = '<div class="dialog"><h2>Edit your profile</h2><label>Name</label><input id="editName" class="field"><label>Profile picture</label><input id="editPhoto" class="field" type="file" accept="image/*"><label>University</label><select id="editUniversity" class="field"><option>University of Dubai</option><option>American University of Sharjah</option><option>Heriot-Watt University Dubai</option><option>University of Birmingham Dubai</option><option>Zayed University</option></select><label>Course and year</label><input id="editCourse" class="field" placeholder="e.g. Business Management, Year 2"><label>Bio</label><textarea id="editBio" class="field"></textarea><label>Interests</label><input id="editInterests" class="field" placeholder="Marketing, Finance, Design"><p id="editProfileError" class="highlight-status"></p><button class="primary-btn wide" onclick="saveProfileEdits()">Save changes</button><div class="switch"><a onclick="document.getElementById(\'editProfileModal\').classList.remove(\'show\')">Cancel</a></div></div>';
  document.body.appendChild(editModal);

  const highlightModal = document.getElementById('highlightModal');
  highlightModal.querySelector('p').textContent = 'Add 1–7 photos, then write a caption and your hashtags.';
  const preview = document.createElement('div'); preview.id = 'highlightPreviews'; preview.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 16px';
  document.getElementById('highlightCount').insertAdjacentElement('afterend', preview);
}
setupProductFeatures();

function message(text) { window.alert(text); }
function safeFileName(name) { return String(name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-'); }

async function requireUser() {
  const { data: { user } } = await supabase.auth.getUser();
  signedInUser = user;
  return user;
}

window.continueAuth = async function () {
  const email = document.querySelector('#loginModal input[type="email"]').value.trim();
  const password = document.querySelector('#loginModal input[type="password"]').value;
  if (!email || !password) return message('Enter your email and password first.');
  const isSignUp = document.getElementById('loginTitle').textContent.includes('Start');
  const action = isSignUp ? supabase.auth.signUp({ email, password }) : supabase.auth.signInWithPassword({ email, password });
  const { data, error } = await action;
  if (error) return message(error.message);
  document.getElementById('loginModal').classList.remove('show');
  if (isSignUp && !data.session) return message('Check your email and confirm your account, then log in.');
  if (isSignUp) document.getElementById('onboarding').classList.add('show');
  else await window.launchApp();
};

window.launchApp = async function () {
  const user = await requireUser();
  if (!user) return message('Please log in with your email first.');
  const { data: existing } = await supabase.from('student_profiles').select('*').eq('id', user.id).maybeSingle();
  if (!existing) {
    const setup = document.getElementById('onboarding');
    if (!setup.classList.contains('show')) { setup.classList.add('show'); return; }
    const name = document.getElementById('profileFullName').value.trim();
    if (!name) return message('Please add your name to create your student profile.');
    const university = document.querySelector('.onboard-card select')?.value || 'Not yet selected';
    const course = document.querySelector('.onboard-card input[placeholder*="Business"]')?.value || '';
    const interests = [...document.querySelectorAll('.chip.selected')].map((chip) => chip.textContent);
    let avatar_url = null;
    const photo = document.getElementById('profilePhoto').files[0];
    if (photo) {
      const path = `${user.id}/profile-${crypto.randomUUID()}-${safeFileName(photo.name)}`;
      const { error: photoError } = await supabase.storage.from('highlight-images').upload(path, photo, { contentType: photo.type });
      if (photoError) return message(photoError.message);
      avatar_url = supabase.storage.from('highlight-images').getPublicUrl(path).data.publicUrl;
    }
    const bio = document.getElementById('profileBioInput').value.trim();
    const { error } = await supabase.rpc('create_bondly_profile', {
      profile_name: name,
      profile_university: university,
      profile_course: course,
      profile_interests: interests,
      profile_bio: bio,
      profile_avatar_url: avatar_url
    });
    if (error) return message(`Could not save your profile: ${error.message}`);
  }
  localLaunch();
  const { data: currentProfile } = await supabase.from('student_profiles').select('avatar_url').eq('id', user.id).single();
  if (currentProfile?.avatar_url) document.querySelectorAll('.avatar.me').forEach((avatar) => { avatar.style.backgroundImage = `url("${currentProfile.avatar_url}")`; });
  await loadMembers();
  await loadChats();
  await loadRealPosts();
  await loadNotes();
  await loadNotifications();
  await loadAccommodations();
};

async function loadAccommodations() {
  const list = document.getElementById('accommodationsList'); if (!list) return;
  const { data, error } = await supabase.from('accommodations').select('*, student_profiles(id, full_name, university, avatar_url)').order('created_at', { ascending: false });
  if (error) { list.innerHTML = '<p style="color:#68817c">No accommodation listings yet.</p>'; return; }
  list.innerHTML = '';
  if (!data?.length) { list.innerHTML = '<p style="color:#68817c">No listings yet. Be the first to share one.</p>'; return; }
  data.forEach((item) => {
    const card = document.createElement('div'); card.className = 'list-card';
    card.innerHTML = `<span class="tag">${escapeHtml(item.listing_type)}</span><h3>${escapeHtml(item.title)}</h3><p><b>${escapeHtml(item.area || 'Dubai')}</b>${item.price ? ` · ${escapeHtml(item.price)}` : ''}<br>${escapeHtml(item.description)}<br><br>Posted by <b>${escapeHtml(item.student_profiles?.full_name || 'Student')}</b> · ${escapeHtml(item.student_profiles?.university || '')}</p>`;
    const contact = document.createElement('button'); contact.className = 'secondary-btn'; contact.style.marginTop = '12px'; contact.textContent = 'Message'; contact.onclick = () => openDirectChat(item.student_profiles); card.appendChild(contact); list.appendChild(card);
  });
}

window.publishAccommodation = async function () {
  const listing_type = document.getElementById('accommodationType').value;
  const title = document.getElementById('accommodationTitle').value.trim();
  const area = document.getElementById('accommodationArea').value.trim();
  const price = document.getElementById('accommodationPrice').value.trim();
  const description = document.getElementById('accommodationDescription').value.trim();
  const errorBox = document.getElementById('accommodationError');
  if (!listing_type || !title || !description) { errorBox.textContent = 'Add a type, title, and description.'; return; }
  const { error } = await supabase.from('accommodations').insert({ author_id: signedInUser.id, listing_type, title, area, price, description });
  if (error) { errorBox.textContent = error.message; return; }
  document.getElementById('accommodationModal').classList.remove('show');
  ['accommodationType','accommodationTitle','accommodationArea','accommodationPrice','accommodationDescription'].forEach((id) => { document.getElementById(id).value = ''; });
  await loadAccommodations();
};

async function loadMembers() {
  const { data, error } = await supabase.from('student_profiles').select('*').neq('id', signedInUser.id).order('created_at', { ascending: false });
  if (error) return;
  const explore = document.getElementById('explore');
  const title = explore.querySelector('.view-title');
  explore.innerHTML = '';
  explore.appendChild(title);
  title.querySelector('p').textContent = data.length ? `${data.length} student${data.length === 1 ? '' : 's'} currently on Bondly.` : 'No other students have joined yet.';
  data.forEach((person) => {
    const card = document.createElement('div');
    card.className = 'list-card'; card.style.cursor = 'pointer';
    card.innerHTML = `<h3>${escapeHtml(person.full_name)}</h3><p>${escapeHtml(person.course || 'Student')} · ${escapeHtml(person.university)}</p><span class="tag">View profile →</span>`;
    card.onclick = () => openRealProfile(person);
    explore.appendChild(card);
  });
}

async function loadChats() {
  const { data: memberships } = await supabase.from('chat_members').select('chat_id').eq('profile_id', signedInUser.id);
  if (!memberships) return;
  const list = document.querySelector('.chat-list');
  list.innerHTML = '';
  const shownPeople = new Set();
  for (const membership of memberships) {
    const { data: members } = await supabase.from('chat_members').select('profile_id, student_profiles(id, full_name, university)').eq('chat_id', membership.chat_id);
    const other = members?.map((member) => member.student_profiles).find((person) => person?.id !== signedInUser.id);
    if (!other || shownPeople.has(other.id)) continue;
    shownPeople.add(other.id);
    const row = document.createElement('div'); row.className = 'chat-person';
    row.innerHTML = `<div class="avatar a1"></div><div><strong>${escapeHtml(other.full_name)}</strong><small>${escapeHtml(other.university)}</small></div>`;
    row.onclick = () => resumeChat(membership.chat_id, other); list.appendChild(row);
  }
}

async function resumeChat(chatId, person) {
  activeChatId = chatId; selectedMember = person;
  setChatHeader(person);
  document.querySelectorAll('.chat-person').forEach((row) => row.classList.remove('active'));
  unreadMessageCount = 0; updateMessageBadge();
  await loadMessages(); window.showView('messages');
}

async function openRealProfile(person) {
  selectedMember = person;
  document.getElementById('profileName').textContent = person.full_name;
  document.getElementById('profileStudy').textContent = `${person.course || 'Student'} · ${person.university}`;
  document.getElementById('profileBio').textContent = person.bio || 'Bondly student';
  document.getElementById('profileTagOne').textContent = person.interests?.[0] || 'Student';
  document.getElementById('profileTagTwo').textContent = person.interests?.[1] || 'Bondly';
  const avatar = document.getElementById('profileAvatar');
  avatar.style.backgroundImage = person.avatar_url ? `url("${person.avatar_url}")` : '';
  const button = document.getElementById('connectButton');
  button.style.display = ''; button.textContent = 'Send connection request'; button.disabled = false; button.style.opacity = '1';
  button.onclick = window.sendConnectionRequest;
  const pairFilter = `and(requester_id.eq.${signedInUser.id},recipient_id.eq.${person.id}),and(requester_id.eq.${person.id},recipient_id.eq.${signedInUser.id})`;
  const { data: connection } = await supabase.from('connections').select('status, requester_id').or(pairFilter).maybeSingle();
  if (connection?.status === 'accepted') {
    button.textContent = 'Unfriend'; button.disabled = false; button.style.opacity = '1'; button.onclick = () => unfriendPerson(person.id);
  } else if (connection?.status === 'pending') {
    button.textContent = connection.requester_id === signedInUser.id ? 'Request sent' : 'Request received'; button.disabled = true; button.style.opacity = '.65';
  } else if (connection?.status === 'declined') {
    button.textContent = 'Request declined'; button.disabled = true; button.style.opacity = '.65';
  }
  const messageButton = document.querySelector('#profile .primary-btn');
  messageButton.textContent = 'Message'; messageButton.onclick = () => openDirectChat(person);
  window.showView('profile');
  loadProfilePosts(person.id);
}

async function openMyProfile() {
  const { data: mine } = await supabase.from('student_profiles').select('*').eq('id', signedInUser.id).single();
  if (!mine) return;
  selectedMember = null;
  document.getElementById('profileName').textContent = mine.full_name;
  document.getElementById('profileStudy').textContent = `${mine.course || 'Student'} · ${mine.university}`;
  document.getElementById('profileBio').textContent = mine.bio || 'Add a short bio to help students know you.';
  document.getElementById('profileTagOne').textContent = mine.interests?.[0] || 'Student';
  document.getElementById('profileTagTwo').textContent = mine.interests?.[1] || 'Bondly';
  const avatar = document.getElementById('profileAvatar'); if (mine.avatar_url) avatar.style.backgroundImage = `url("${mine.avatar_url}")`;
  const connect = document.getElementById('connectButton'); connect.style.display = 'none';
  const edit = document.querySelector('#profile .primary-btn'); edit.textContent = 'Edit profile'; edit.onclick = editMyProfile;
  window.showView('profile'); loadProfilePosts(mine.id);
}

async function editMyProfile() {
  const { data: mine } = await supabase.from('student_profiles').select('*').eq('id', signedInUser.id).single();
  document.getElementById('editName').value = mine.full_name || '';
  document.getElementById('editUniversity').value = mine.university || 'University of Dubai';
  document.getElementById('editCourse').value = mine.course || '';
  document.getElementById('editBio').value = mine.bio || '';
  document.getElementById('editInterests').value = (mine.interests || []).join(', ');
  document.getElementById('editProfileModal').classList.add('show');
}

window.saveProfileEdits = async function () {
  const full_name = document.getElementById('editName').value.trim();
  const university = document.getElementById('editUniversity').value;
  const course = document.getElementById('editCourse').value.trim();
  const bio = document.getElementById('editBio').value.trim();
  const interests = document.getElementById('editInterests').value.split(',').map((item) => item.trim()).filter(Boolean);
  const errorBox = document.getElementById('editProfileError');
  if (!full_name) { errorBox.textContent = 'Please add your name.'; return; }
  const update = { full_name, university, course, bio, interests };
  const photo = document.getElementById('editPhoto').files[0];
  if (photo) {
    const path = `${signedInUser.id}/profile-${crypto.randomUUID()}-${safeFileName(photo.name)}`;
    const { error: photoError } = await supabase.storage.from('highlight-images').upload(path, photo, { contentType: photo.type });
    if (photoError) { errorBox.textContent = photoError.message; return; }
    update.avatar_url = supabase.storage.from('highlight-images').getPublicUrl(path).data.publicUrl;
  }
  const { error } = await supabase.from('student_profiles').update(update).eq('id', signedInUser.id);
  if (error) { errorBox.textContent = error.message; return; }
  document.getElementById('editProfileModal').classList.remove('show');
  document.getElementById('editPhoto').value = '';
  await openMyProfile();
  await loadMembers();
  document.querySelectorAll('.avatar.me').forEach((avatar) => { if (update.avatar_url) avatar.style.backgroundImage = `url("${update.avatar_url}")`; });
};

async function loadProfilePosts(profileId) {
  const { data } = await supabase.from('posts').select('id, caption, hashtags, post_images(image_url, position)').eq('author_id', profileId).eq('kind', 'weekly_highlight').order('created_at', { ascending: false });
  let area = document.getElementById('profilePosts');
  if (!area) { area = document.createElement('div'); area.id = 'profilePosts'; area.style.padding = '0 25px 25px'; document.querySelector('.profile-info').appendChild(area); }
  area.innerHTML = '<h3 style="margin:14px 0">Highlights</h3>';
  if (!data?.length) area.innerHTML += '<p style="color:#68817c;font-size:14px">No highlights shared yet.</p>';
  data?.forEach((post) => {
    const card = document.createElement('div'); card.className = 'list-card'; card.style.cursor = 'pointer'; card.title = 'Open highlight'; card.onclick = () => openHighlightPost(post.id);
    const images = document.createElement('div'); images.style.cssText = 'display:flex;gap:6px;overflow:hidden;margin-bottom:10px';
    post.post_images.sort((a,b) => a.position-b.position).forEach((image) => { const photo = document.createElement('img'); photo.src = image.image_url; photo.alt = 'Highlight photo'; photo.style.cssText = 'width:78px;height:78px;border-radius:8px;object-fit:cover'; images.appendChild(photo); });
    card.appendChild(images); card.innerHTML += `<p>${escapeHtml(post.caption || 'Weekly highlight')}</p><p style="color:#176b57">${escapeHtml((post.hashtags || []).join(' '))}</p>`; area.appendChild(card);
  });
  await loadProfileNotes(profileId, area);
}

async function loadProfileNotes(profileId, area) {
  const { data } = await supabase.from('notes').select('subject, topic, study_year, file_url').eq('uploader_id', profileId).order('created_at', { ascending: false });
  const title = document.createElement('h3'); title.style.margin = '22px 0 10px'; title.textContent = 'Notes uploaded'; area.appendChild(title);
  if (!data?.length) { const empty = document.createElement('p'); empty.style.cssText = 'color:#68817c;font-size:14px'; empty.textContent = 'No notes uploaded yet.'; area.appendChild(empty); return; }
  data.forEach((note) => {
    const card = document.createElement('div'); card.className = 'list-card';
    card.innerHTML = `<h3>${escapeHtml(note.subject)} — ${escapeHtml(note.topic)}</h3><p>${escapeHtml(note.study_year)}</p>`;
    const open = document.createElement('a'); open.href = note.file_url; open.target = '_blank'; open.className = 'secondary-btn'; open.style.cssText = 'display:inline-block;margin-top:10px'; open.textContent = 'Open PDF'; card.appendChild(open); area.appendChild(card);
  });
}

window.searchPeople = async function () { await loadMembers(); window.showView('explore'); };

window.sendConnectionRequest = async function () {
  if (!selectedMember) return message('Open a real student profile from Explore first.');
  const { error } = await supabase.from('connections').insert({ requester_id: signedInUser.id, recipient_id: selectedMember.id });
  if (error?.code === '23505') { const button = document.getElementById('connectButton'); button.textContent = 'Request sent'; button.disabled = true; button.style.opacity = '.65'; return; }
  if (error) return message(error.message);
  await supabase.from('notifications').insert({ recipient_id: selectedMember.id, sender_id: signedInUser.id, type: 'connection_request', body: 'sent you a connection request.' });
  const button = document.getElementById('connectButton'); button.textContent = 'Request sent'; button.disabled = true; button.style.opacity = '.65';
};

async function unfriendPerson(personId) {
  if (!window.confirm('Remove this connection?')) return;
  const pairFilter = `and(requester_id.eq.${signedInUser.id},recipient_id.eq.${personId}),and(requester_id.eq.${personId},recipient_id.eq.${signedInUser.id})`;
  const { error } = await supabase.from('connections').delete().or(pairFilter);
  if (error) return message(error.message);
  const button = document.getElementById('connectButton'); button.textContent = 'Send connection request'; button.disabled = false; button.style.opacity = '1'; button.onclick = window.sendConnectionRequest;
}

window.uploadNote = async function () {
  const subject = document.getElementById('noteSubject').value.trim();
  const topic = document.getElementById('noteTopic').value.trim();
  const study_year = document.getElementById('noteYear').value;
  const file = document.getElementById('noteFile').files[0];
  const status = document.getElementById('uploadMessage');
  if (!subject || !topic || !study_year || !file) { status.textContent = 'Please add a subject, topic, year, and PDF.'; return; }
  const filePath = `${signedInUser.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from('note-files').upload(filePath, file, { contentType: file.type });
  if (uploadError) { status.textContent = uploadError.message; return; }
  const { data: url } = supabase.storage.from('note-files').getPublicUrl(filePath);
  const { error } = await supabase.from('notes').insert({ uploader_id: signedInUser.id, subject, topic, study_year, file_url: url.publicUrl });
  if (error) { status.textContent = error.message; return; }
  status.textContent = 'Your PDF is shared with Bondly students.';
  await loadNotes();
};

async function loadNotes() {
  const { data } = await supabase.from('notes').select('*, student_profiles(full_name)').order('created_at', { ascending: false });
  if (!data) return;
  const list = document.getElementById('notesList'); list.innerHTML = '';
  data.forEach((note) => {
    const card = document.createElement('div'); card.className = 'list-card';
    card.innerHTML = `<h3>${escapeHtml(note.subject)} — ${escapeHtml(note.topic)}</h3><p>${escapeHtml(note.study_year)} · Uploaded by ${escapeHtml(note.student_profiles?.full_name || 'student')}</p>`;
    const open = document.createElement('a'); open.href = note.file_url; open.target = '_blank'; open.className = 'secondary-btn'; open.style.cssText = 'display:inline-block;margin-top:10px'; open.textContent = 'Open PDF'; card.appendChild(open);
    if (note.uploader_id === signedInUser.id) { const remove = document.createElement('button'); remove.className = 'secondary-btn'; remove.style.cssText = 'margin:10px 0 0 8px;color:#b5493a;border-color:#b5493a'; remove.textContent = 'Delete'; remove.onclick = () => deleteNote(note); card.appendChild(remove); }
    list.appendChild(card);
  });
}

async function deleteNote(note) {
  if (!window.confirm(`Delete “${note.subject} — ${note.topic}”?`)) return;
  const marker = '/note-files/';
  const path = decodeURIComponent(note.file_url.split(marker)[1] || '');
  const { error } = await supabase.from('notes').delete().eq('id', note.id);
  if (error) return message(error.message);
  if (path) await supabase.storage.from('note-files').remove([path]);
  await loadNotes();
}

window.publishHighlight = async function () {
  const files = [...document.getElementById('highlightFiles').files];
  const caption = document.getElementById('highlightCaption').value.trim();
  const hashtags = document.getElementById('highlightTags').value.trim().split(/\s+/).filter(Boolean);
  const errorBox = document.getElementById('highlightError');
  if (files.length < 1 || files.length > 7) { errorBox.textContent = 'Please choose between 1 and 7 photos.'; return; }
  const { data: post, error } = await supabase.from('posts').insert({ author_id: signedInUser.id, kind: 'weekly_highlight', caption, hashtags }).select().single();
  if (error) { errorBox.textContent = error.message; return; }
  const imageRows = [];
  for (const [position, file] of files.entries()) {
    const path = `${signedInUser.id}/${post.id}/${position}-${safeFileName(file.name)}`;
    const { error: imageError } = await supabase.storage.from('highlight-images').upload(path, file, { contentType: file.type });
    if (imageError) { errorBox.textContent = imageError.message; return; }
    const { data: url } = supabase.storage.from('highlight-images').getPublicUrl(path);
    imageRows.push({ post_id: post.id, image_url: url.publicUrl, position: position + 1 });
  }
  const { error: rowsError } = await supabase.from('post_images').insert(imageRows);
  if (rowsError) { errorBox.textContent = rowsError.message; return; }
  window.closeHighlight(); await loadRealPosts();
};

window.updateHighlightCount = function () {
  const files = [...document.getElementById('highlightFiles').files];
  document.getElementById('highlightCount').textContent = files.length ? `${files.length} photo${files.length === 1 ? '' : 's'} selected` : 'No photos selected';
  const preview = document.getElementById('highlightPreviews'); preview.innerHTML = '';
  files.slice(0, 7).forEach((file) => { const image = document.createElement('img'); image.src = URL.createObjectURL(file); image.alt = 'Selected highlight photo'; image.style.cssText = 'width:76px;height:76px;border-radius:10px;object-fit:cover;border:1px solid #dce8e4'; preview.appendChild(image); });
};

async function loadRealPosts() {
  const { data } = await supabase.from('posts').select('*, student_profiles!posts_author_id_fkey(id, full_name, university, course, interests, bio, avatar_url), post_images(*)').eq('kind', 'weekly_highlight').order('created_at', { ascending: false });
  if (!data) return;
  const { data: myConnections = [] } = await supabase.from('connections').select('requester_id, recipient_id').eq('status', 'accepted').or(`requester_id.eq.${signedInUser.id},recipient_id.eq.${signedInUser.id}`);
  const friendIds = new Set(myConnections.map((link) => link.requester_id === signedInUser.id ? link.recipient_id : link.requester_id));
  data.sort((a, b) => Number(friendIds.has(b.author_id)) - Number(friendIds.has(a.author_id)) || new Date(b.created_at) - new Date(a.created_at));
  const container = document.getElementById('highlightsFeed'); container.innerHTML = '';
  const postIds = data.map((post) => post.id);
  const [{ data: likesData, error: likesError }, { data: commentsData, error: commentsError }] = await Promise.all([
    supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
    supabase.from('post_comments').select('id, post_id, body, created_at, user_id, student_profiles(full_name, avatar_url)').in('post_id', postIds).order('created_at', { ascending: true })
  ]);
  // Keep highlights viewable even before the optional likes/comments SQL has been run.
  const likes = likesError ? [] : (likesData || []);
  const comments = commentsError ? [] : (commentsData || []);
  data.forEach((post) => {
    const element = document.createElement('article'); element.className = 'post';
    const photos = document.createElement('div'); photos.className = 'post-images';
    post.post_images.sort((a,b) => a.position-b.position).forEach((image) => { const tile = document.createElement('div'); tile.style.backgroundImage = `url("${image.image_url}")`; photos.appendChild(tile); });
    element.innerHTML = `<div class="post-head" style="cursor:pointer"><div class="avatar me"></div><div><h4>${escapeHtml(post.student_profiles?.full_name || 'Student')} <small>· ${escapeHtml(post.student_profiles?.university || '')}</small></h4><small>Highlights of the Week</small></div></div>`;
    if (post.student_profiles?.id !== signedInUser.id) element.querySelector('.post-head').onclick = () => openRealProfile(post.student_profiles);
    element.appendChild(photos);
    photos.style.cursor = 'pointer';
    photos.onclick = () => openHighlightPost(post.id);
    const postLikes = likes.filter((like) => like.post_id === post.id);
    const postComments = comments.filter((comment) => comment.post_id === post.id);
    const liked = postLikes.some((like) => like.user_id === signedInUser.id);
    const body = document.createElement('div'); body.className = 'post-body';
    body.innerHTML = `<div class="post-actions"><button class="post-action ${liked ? 'liked' : ''}" aria-label="Like highlight">${liked ? '♥' : '♡'} <span>${postLikes.length || ''}</span></button><button class="post-action comment-toggle" aria-label="Comment on highlight">◌ <span>${postComments.length || ''}</span></button><button class="post-action share-toggle" aria-label="Share highlight">↗</button></div><p>${escapeHtml(post.caption)}</p><p style="color:#176b57">${escapeHtml((post.hashtags || []).join(' '))}</p>`;
    body.querySelector('.post-action').onclick = () => togglePostLike(post.id);
    const commentsArea = document.createElement('div'); commentsArea.className = 'post-comments';
    commentsArea.innerHTML = postComments.map((comment) => `<p><b>${escapeHtml(comment.student_profiles?.full_name || 'Student')}</b> ${escapeHtml(comment.body)}</p>`).join('');
    const composer = document.createElement('div'); composer.className = 'comment-composer'; composer.innerHTML = '<input maxlength="500" placeholder="Add a comment…"><button>Post</button>';
    composer.querySelector('button').onclick = () => addPostComment(post.id, composer.querySelector('input').value);
    composer.querySelector('input').onkeydown = (event) => { if (event.key === 'Enter') addPostComment(post.id, event.currentTarget.value); };
    body.querySelector('.comment-toggle').onclick = () => { commentsArea.classList.toggle('show'); composer.classList.toggle('show'); if (commentsArea.classList.contains('show')) composer.querySelector('input').focus(); };
    body.querySelector('.share-toggle').onclick = () => showSharePost(post);
    body.append(commentsArea, composer); element.appendChild(body); container.appendChild(element);
  });
}

async function showSharePost(post) {
  pendingSharedPost = post;
  const list = document.getElementById('sharePeopleList'); list.innerHTML = 'Loading students…';
  const { data: people = [] } = await supabase.from('student_profiles').select('id, full_name, university, avatar_url').neq('id', signedInUser.id).order('full_name');
  list.innerHTML = '';
  people.forEach((person) => {
    const row = document.createElement('button'); row.className = 'list-card'; row.style.cssText = 'width:100%;text-align:left;cursor:pointer;margin:8px 0'; row.innerHTML = `<b>${escapeHtml(person.full_name)}</b><br><small>${escapeHtml(person.university)}</small>`;
    row.onclick = () => sharePostToPerson(person); list.appendChild(row);
  });
  if (!people.length) list.textContent = 'No other students have joined yet.';
  document.getElementById('sharePostModal').classList.add('show');
}

async function sharePostToPerson(person) {
  if (!pendingSharedPost) return;
  const post = pendingSharedPost;
  const { data: chatId, error } = await supabase.rpc('create_bondly_direct_chat', { other_user_id: person.id });
  if (error) return message(error.message);
  const sharedText = `Shared a highlight from ${post.student_profiles?.full_name || 'a Bondly student'}: ${post.caption || 'Weekly highlight'} ${(post.hashtags || []).join(' ')}`;
  const { error: sendError } = await supabase.from('messages').insert({ chat_id: chatId, sender_id: signedInUser.id, body: sharedText });
  if (sendError) return message(sendError.message);
  document.getElementById('sharePostModal').classList.remove('show'); pendingSharedPost = null; message(`Sent to ${person.full_name}.`);
}

window.closePostModal = function () { document.getElementById('postModal').classList.remove('show'); };

async function openHighlightPost(postId) {
  const { data: post, error } = await supabase.from('posts').select('*, student_profiles!posts_author_id_fkey(id, full_name, university, avatar_url), post_images(*)').eq('id', postId).single();
  if (error) return message(error.message);
  const [{ data: likesData, error: likesError }, { data: commentsData, error: commentsError }] = await Promise.all([
    supabase.from('post_likes').select('post_id, user_id').eq('post_id', postId),
    supabase.from('post_comments').select('id, body, user_id, student_profiles(full_name)').eq('post_id', postId).order('created_at', { ascending: true })
  ]);
  const likes = likesError ? [] : (likesData || []);
  const comments = commentsError ? [] : (commentsData || []);
  const liked = likes.some((like) => like.user_id === signedInUser.id);
  const images = (post.post_images || []).sort((a, b) => a.position - b.position).map((image) => `<img src="${escapeHtml(image.image_url)}" alt="Highlight photo">`).join('');
  const commentList = comments.map((comment) => `<p><b>${escapeHtml(comment.student_profiles?.full_name || 'Student')}</b> ${escapeHtml(comment.body)}</p>`).join('') || '<p style="color:#68817c">No comments yet. Be the first.</p>';
  document.getElementById('openedPost').innerHTML = `<div class="opened-post"><div class="post-head"><div class="avatar me" style="background-image:url('${escapeHtml(post.student_profiles?.avatar_url || '')}')"></div><div><h4>${escapeHtml(post.student_profiles?.full_name || 'Student')} <small>· ${escapeHtml(post.student_profiles?.university || '')}</small></h4><small>Highlights of the Week</small></div></div><div class="opened-post-images">${images}</div><div class="post-body"><div class="post-actions"><button id="modalLikeButton" class="post-action ${liked ? 'liked' : ''}">${liked ? '♥' : '♡'} <span>${likes.length || ''}</span></button><span style="font-size:13px;color:#68817c;padding-top:5px">${comments.length} comment${comments.length === 1 ? '' : 's'}</span></div><p>${escapeHtml(post.caption || '')}</p><p style="color:#176b57">${escapeHtml((post.hashtags || []).join(' '))}</p><div class="opened-comments">${commentList}</div><div class="comment-composer show"><input id="modalCommentInput" maxlength="500" placeholder="Add a comment…"><button id="modalCommentButton">Post</button></div></div></div>`;
  document.getElementById('modalLikeButton').onclick = async () => { await togglePostLike(postId); await openHighlightPost(postId); };
  const publish = async () => { const input = document.getElementById('modalCommentInput'); await addPostComment(postId, input.value); await openHighlightPost(postId); };
  document.getElementById('modalCommentButton').onclick = publish;
  document.getElementById('modalCommentInput').onkeydown = (event) => { if (event.key === 'Enter') publish(); };
  document.getElementById('postModal').classList.add('show');
}

async function togglePostLike(postId) {
  const { data: existing, error: checkError } = await supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', signedInUser.id).maybeSingle();
  if (checkError) return message(checkError.message);
  const result = existing
    ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', signedInUser.id)
    : await supabase.from('post_likes').insert({ post_id: postId, user_id: signedInUser.id });
  if (result.error) return message(result.error.message);
  await loadRealPosts();
}

async function addPostComment(postId, body) {
  const text = String(body || '').trim();
  if (!text) return;
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: signedInUser.id, body: text });
  if (error) return message(error.message);
  await loadRealPosts();
}

async function openDirectChat(person) {
  const { data: chatId, error } = await supabase.rpc('create_bondly_direct_chat', { other_user_id: person.id });
  if (error) return message(error.message);
  activeChatId = chatId;
  unreadMessageCount = 0; updateMessageBadge();
  setChatHeader(person);
  document.getElementById('messageList').innerHTML = '';
  window.showView('messages');
  await loadChats();
  await loadMessages();
}

async function loadMessages() {
  if (!activeChatId) return;
  const { data } = await supabase.from('messages').select('*').eq('chat_id', activeChatId).order('created_at');
  const list = document.getElementById('messageList'); list.innerHTML = '';
  (data || []).forEach(renderMessage);
}

function renderMessage(item) {
  const bubble = document.createElement('div');
  bubble.className = item.sender_id === signedInUser.id ? 'bubble-msg mine' : 'bubble-msg';
  if (item.body) bubble.append(document.createTextNode(item.body));
  if (item.attachment_url) {
    const attachment = document.createElement(item.attachment_type?.startsWith('image/') ? 'img' : 'a');
    if (attachment.tagName === 'IMG') { attachment.src = item.attachment_url; attachment.alt = item.attachment_name || 'Image'; attachment.style.cssText = 'display:block;max-width:190px;max-height:190px;object-fit:cover;border-radius:8px;margin-top:7px'; }
    else { attachment.href = item.attachment_url; attachment.target = '_blank'; attachment.textContent = `Open ${item.attachment_name || 'file'}`; attachment.style.cssText = 'display:block;color:inherit;text-decoration:underline;margin-top:7px'; }
    bubble.appendChild(attachment);
  }
  document.getElementById('messageList').appendChild(bubble);
}

window.sendMessage = async function () {
  if (!activeChatId) return message('Open a student profile and choose Message to start a chat.');
  const input = document.getElementById('messageInput');
  const fileInput = document.getElementById('chatFile');
  const body = input.value.trim(); const file = fileInput.files[0];
  if (!body && !file) return;
  let attachment_url = null, attachment_name = null, attachment_type = null;
  if (file) {
    const path = `${signedInUser.id}/${activeChatId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from('chat-files').upload(path, file, { contentType: file.type });
    if (uploadError) return message(uploadError.message);
    attachment_url = supabase.storage.from('chat-files').getPublicUrl(path).data.publicUrl;
    attachment_name = file.name; attachment_type = file.type;
  }
  const { data, error } = await supabase.from('messages').insert({ chat_id: activeChatId, sender_id: signedInUser.id, body, attachment_url, attachment_name, attachment_type }).select().single();
  if (error) return message(error.message);
  input.value = ''; fileInput.value = ''; document.getElementById('chatFileName').textContent = ''; renderMessage(data);
};

window.showSelectedChatFile = function () {
  const file = document.getElementById('chatFile').files[0];
  document.getElementById('chatFileName').textContent = file ? file.name : '';
};

function setChatHeader(person) {
  document.getElementById('chatHead').innerHTML = `${escapeHtml(person.full_name)} <small style="color:#6b827b;font-weight:400"> · ${escapeHtml(person.university)}</small><button onclick="deleteActiveChat()" style="float:right;border:0;background:transparent;color:#b5493a;font-weight:700;cursor:pointer">Delete chat</button>`;
}

window.deleteActiveChat = async function () {
  if (!activeChatId || !window.confirm('Delete this chat and all its messages? This cannot be undone.')) return;
  const { error } = await supabase.rpc('delete_bondly_chat', { target_chat_id: activeChatId });
  if (error) return message(error.message);
  activeChatId = null; document.getElementById('messageList').innerHTML = ''; document.getElementById('chatHead').textContent = 'Choose a chat'; await loadChats();
};

document.querySelector('#profile .primary-btn').addEventListener('click', (event) => {
  if (!selectedMember) return;
  event.preventDefault(); event.stopImmediatePropagation();
  openDirectChat(selectedMember);
}, true);

supabase.channel('bondly-messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
  if (payload.new.sender_id === signedInUser?.id) return;
  if (payload.new.chat_id === activeChatId) renderMessage(payload.new);
  else { unreadMessageCount += 1; updateMessageBadge(); loadChats(); }
}).subscribe();

function updateMessageBadge() {
  const badge = document.getElementById('messageCount');
  if (!badge) return;
  badge.textContent = unreadMessageCount;
  badge.style.cssText = unreadMessageCount ? 'display:inline-block;margin-left:auto;background:#f0826c;color:#fff;border-radius:99px;padding:2px 6px;font-size:11px' : 'display:none';
}

window.publishInternship = async function () {
  const title = document.getElementById('internshipTitle').value.trim();
  const company = document.getElementById('internshipCompany').value.trim();
  const field = document.getElementById('internshipField').value;
  const location = document.getElementById('internshipLocation').value.trim();
  const description = document.getElementById('internshipDescription').value.trim();
  const application_url = document.getElementById('internshipLink').value.trim();
  const errorBox = document.getElementById('internshipError');
  if (!title || !company || !field || !description) { errorBox.textContent = 'Please add a title, company, field, and description.'; return; }
  const { data: post, error } = await supabase.from('posts').insert({ author_id: signedInUser.id, kind: 'internship', caption: description, hashtags: ['#internship', `#${field.toLowerCase()}`] }).select().single();
  if (error) { errorBox.textContent = error.message; return; }
  const { error: opportunityError } = await supabase.from('opportunities').insert({ post_id: post.id, title, company, field, location, description, application_url });
  if (opportunityError) { errorBox.textContent = opportunityError.message; return; }
  const { data: matches } = await supabase.from('student_profiles').select('id').contains('interests', [field]).neq('id', signedInUser.id);
  if (matches?.length) await supabase.from('notifications').insert(matches.map((student) => ({ recipient_id: student.id, sender_id: signedInUser.id, type: 'internship', body: `${title} at ${company} matches your ${field} interest.` })));
  document.getElementById('internshipModal').classList.remove('show');
  ['internshipTitle','internshipCompany','internshipField','internshipLocation','internshipDescription','internshipLink'].forEach((id) => { document.getElementById(id).value = ''; });
  message('Internship posted. Matching students have been notified.');
};

window.showNotifications = async function () { await loadNotifications(); window.showView('notifications'); };

async function loadNotifications() {
  if (!signedInUser) return;
  const { data } = await supabase.from('notifications').select('*').eq('recipient_id', signedInUser.id).eq('read', false).order('created_at', { ascending: false });
  const list = document.getElementById('notificationsList'); if (!list || !data) return;
  const senderIds = [...new Set(data.map((notice) => notice.sender_id).filter(Boolean))];
  const { data: senders = [] } = senderIds.length
    ? await supabase.from('student_profiles').select('id, full_name, university, avatar_url').in('id', senderIds)
    : { data: [] };
  const senderById = Object.fromEntries(senders.map((sender) => [sender.id, sender]));
  list.innerHTML = '';
  data.forEach((notice) => {
    const card = document.createElement('div'); card.className = 'list-card';
    const sender = senderById[notice.sender_id];
    const senderName = sender?.full_name || (notice.type === 'connection_request' ? 'A student' : 'Bondly');
    const senderUniversity = sender?.university ? ` · ${escapeHtml(sender.university)}` : '';
    card.innerHTML = `<h3>${notice.type === 'connection_request' ? 'Connection request' : 'Internship match'}</h3><p><b>${escapeHtml(senderName)}</b>${senderUniversity} ${escapeHtml(notice.body)}</p>`;
    if (sender?.avatar_url) { const avatar = document.createElement('div'); avatar.className = 'avatar me'; avatar.style.cssText = `width:38px;height:38px;float:right;margin-top:-38px;background-image:url("${sender.avatar_url}")`; card.prepend(avatar); }
    if (notice.type === 'connection_request') {
      const accept = document.createElement('button'); accept.className = 'primary-btn'; accept.style.cssText = 'margin-top:10px;padding:9px 13px'; accept.textContent = 'Accept'; accept.onclick = () => acceptRequest(notice, accept); card.appendChild(accept);
      const reject = document.createElement('button'); reject.className = 'secondary-btn'; reject.style.cssText = 'margin:10px 0 0 8px;color:#b5493a;border-color:#b5493a'; reject.textContent = 'Reject'; reject.onclick = () => rejectRequest(notice, reject); card.appendChild(reject);
    }
    list.appendChild(card);
  });
  const count = document.getElementById('notificationCount'); const unread = data.filter((notice) => !notice.read).length; count.textContent = unread; count.style.display = unread ? 'inline-block' : 'none';
}

async function acceptRequest(notice, button) {
  button.textContent = 'Accepting…'; button.disabled = true;
  const { data, error } = await supabase.from('connections').update({ status: 'accepted' }).eq('requester_id', notice.sender_id).eq('recipient_id', signedInUser.id).select();
  if (error) return message(error.message);
  if (!data?.length) return message('This connection request could not be found. Refresh notifications and try again.');
  await supabase.from('notifications').update({ read: true }).eq('id', notice.id);
  button.textContent = 'Connected'; button.style.opacity = '.65'; await loadNotifications();
}

async function rejectRequest(notice, button) {
  button.textContent = 'Rejecting…'; button.disabled = true;
  const { data, error } = await supabase.from('connections').update({ status: 'declined' }).eq('requester_id', notice.sender_id).eq('recipient_id', signedInUser.id).select();
  if (error) return message(error.message);
  if (!data?.length) return message('This connection request could not be found. Refresh notifications and try again.');
  await supabase.from('notifications').update({ read: true }).eq('id', notice.id);
  await loadNotifications();
}

supabase.channel('bondly-notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
  if (payload.new.recipient_id === signedInUser?.id) loadNotifications();
}).subscribe();

function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char])); }

supabase.auth.onAuthStateChange((_event, session) => { signedInUser = session?.user || null; });

// Supabase keeps a signed-in session in the browser, so returning students skip the cover/login screen.
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) await window.launchApp();
})();
