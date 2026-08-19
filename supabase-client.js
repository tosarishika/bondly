import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://vcennazfnqccvrnmfuvn.supabase.co',
  'sb_publishable_YNz9KMB4mp758x2gtV99sQ_q6R5Ajrr'
);

let signedInUser = null;
let selectedMember = null;
let activeChatId = null;
const localLaunch = window.launchApp;

function message(text) { window.alert(text); }

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
    const name = window.prompt('What name should other students see?')?.trim();
    if (!name) return message('A name is needed to create your student profile.');
    const university = document.querySelector('.onboard-card select')?.value || 'Not yet selected';
    const course = document.querySelector('.onboard-card input')?.value || '';
    const interests = [...document.querySelectorAll('.chip.selected')].map((chip) => chip.textContent);
    const { error } = await supabase.from('student_profiles').insert({ id: user.id, full_name: name, university, course, interests });
    if (error) return message(error.message);
  }
  localLaunch();
  await loadMembers();
  await loadChats();
  await loadRealPosts();
  await loadNotes();
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
  for (const membership of memberships) {
    const { data: members } = await supabase.from('chat_members').select('profile_id, student_profiles(id, full_name, university)').eq('chat_id', membership.chat_id);
    const other = members?.map((member) => member.student_profiles).find((person) => person?.id !== signedInUser.id);
    if (!other) continue;
    const row = document.createElement('div'); row.className = 'chat-person';
    row.innerHTML = `<div class="avatar a1"></div><div><strong>${escapeHtml(other.full_name)}</strong><small>${escapeHtml(other.university)}</small></div>`;
    row.onclick = () => resumeChat(membership.chat_id, other); list.appendChild(row);
  }
}

async function resumeChat(chatId, person) {
  activeChatId = chatId; selectedMember = person;
  document.getElementById('chatHead').innerHTML = `${escapeHtml(person.full_name)} <small style="color:#6b827b;font-weight:400"> · ${escapeHtml(person.university)}</small>`;
  document.querySelectorAll('.chat-person').forEach((row) => row.classList.remove('active'));
  await loadMessages(); window.showView('messages');
}

function openRealProfile(person) {
  selectedMember = person;
  document.getElementById('profileName').textContent = person.full_name;
  document.getElementById('profileStudy').textContent = `${person.course || 'Student'} · ${person.university}`;
  document.getElementById('profileBio').textContent = person.bio || 'Bondly student';
  document.getElementById('profileTagOne').textContent = person.interests?.[0] || 'Student';
  document.getElementById('profileTagTwo').textContent = person.interests?.[1] || 'Bondly';
  const button = document.getElementById('connectButton');
  button.textContent = 'Send connection request'; button.disabled = false; button.style.opacity = '1';
  window.showView('profile');
}

window.searchPeople = async function () { await loadMembers(); window.showView('explore'); };

window.sendConnectionRequest = async function () {
  if (!selectedMember) return message('Open a real student profile from Explore first.');
  const { error } = await supabase.from('connections').insert({ requester_id: signedInUser.id, recipient_id: selectedMember.id });
  if (error && error.code !== '23505') return message(error.message);
  const button = document.getElementById('connectButton'); button.textContent = 'Request sent'; button.disabled = true; button.style.opacity = '.65';
};

window.uploadNote = async function () {
  const subject = document.getElementById('noteSubject').value.trim();
  const topic = document.getElementById('noteTopic').value.trim();
  const study_year = document.getElementById('noteYear').value;
  const file = document.getElementById('noteFile').files[0];
  const status = document.getElementById('uploadMessage');
  if (!subject || !topic || !study_year || !file) { status.textContent = 'Please add a subject, topic, year, and PDF.'; return; }
  const filePath = `${signedInUser.id}/${crypto.randomUUID()}-${file.name}`;
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
    const open = document.createElement('a'); open.href = note.file_url; open.target = '_blank'; open.className = 'secondary-btn'; open.style.cssText = 'display:inline-block;margin-top:10px'; open.textContent = 'Open PDF'; card.appendChild(open); list.appendChild(card);
  });
}

window.publishHighlight = async function () {
  const files = [...document.getElementById('highlightFiles').files];
  const caption = document.getElementById('highlightCaption').value.trim();
  const hashtags = document.getElementById('highlightTags').value.trim().split(/\s+/).filter(Boolean);
  const errorBox = document.getElementById('highlightError');
  if (files.length < 4 || files.length > 7) { errorBox.textContent = 'Please choose between 4 and 7 photos.'; return; }
  const { data: post, error } = await supabase.from('posts').insert({ author_id: signedInUser.id, kind: 'weekly_highlight', caption, hashtags }).select().single();
  if (error) { errorBox.textContent = error.message; return; }
  const imageRows = [];
  for (const [position, file] of files.entries()) {
    const path = `${signedInUser.id}/${post.id}/${position}-${file.name}`;
    const { error: imageError } = await supabase.storage.from('highlight-images').upload(path, file, { contentType: file.type });
    if (imageError) { errorBox.textContent = imageError.message; return; }
    const { data: url } = supabase.storage.from('highlight-images').getPublicUrl(path);
    imageRows.push({ post_id: post.id, image_url: url.publicUrl, position: position + 1 });
  }
  const { error: rowsError } = await supabase.from('post_images').insert(imageRows);
  if (rowsError) { errorBox.textContent = rowsError.message; return; }
  window.closeHighlight(); await loadRealPosts();
};

async function loadRealPosts() {
  const { data } = await supabase.from('posts').select('*, student_profiles(id, full_name, university, course, interests, bio), post_images(*)').eq('kind', 'weekly_highlight').order('created_at', { ascending: false });
  if (!data) return;
  const container = document.getElementById('highlightsFeed'); container.innerHTML = '';
  data.forEach((post) => {
    const element = document.createElement('article'); element.className = 'post';
    const photos = document.createElement('div'); photos.className = 'post-images';
    post.post_images.sort((a,b) => a.position-b.position).forEach((image) => { const tile = document.createElement('div'); tile.style.backgroundImage = `url("${image.image_url}")`; photos.appendChild(tile); });
    element.innerHTML = `<div class="post-head" style="cursor:pointer"><div class="avatar me"></div><div><h4>${escapeHtml(post.student_profiles?.full_name || 'Student')} <small>· ${escapeHtml(post.student_profiles?.university || '')}</small></h4><small>Highlights of the Week</small></div></div>`;
    if (post.student_profiles?.id !== signedInUser.id) element.querySelector('.post-head').onclick = () => openRealProfile(post.student_profiles);
    element.appendChild(photos);
    const body = document.createElement('div'); body.className = 'post-body'; body.innerHTML = `<p>${escapeHtml(post.caption)}</p><p style="color:#176b57">${escapeHtml((post.hashtags || []).join(' '))}</p>`; element.appendChild(body); container.appendChild(element);
  });
}

async function openDirectChat(person) {
  const { data: chat, error } = await supabase.from('chats').insert({ is_group: false }).select().single();
  if (error) return message(error.message);
  const { error: membersError } = await supabase.from('chat_members').insert([
    { chat_id: chat.id, profile_id: signedInUser.id },
    { chat_id: chat.id, profile_id: person.id }
  ]);
  if (membersError) return message(membersError.message);
  activeChatId = chat.id;
  document.getElementById('chatHead').innerHTML = `${escapeHtml(person.full_name)} <small style="color:#6b827b;font-weight:400"> · ${escapeHtml(person.university)}</small>`;
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
  bubble.textContent = item.body;
  document.getElementById('messageList').appendChild(bubble);
}

window.sendMessage = async function () {
  if (!activeChatId) return message('Open a student profile and choose Message to start a chat.');
  const input = document.getElementById('messageInput');
  const body = input.value.trim(); if (!body) return;
  const { data, error } = await supabase.from('messages').insert({ chat_id: activeChatId, sender_id: signedInUser.id, body }).select().single();
  if (error) return message(error.message);
  input.value = ''; renderMessage(data);
};

document.querySelector('#profile .primary-btn').addEventListener('click', (event) => {
  if (!selectedMember) return;
  event.preventDefault(); event.stopImmediatePropagation();
  openDirectChat(selectedMember);
}, true);

supabase.channel('bondly-messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
  if (payload.new.chat_id === activeChatId && payload.new.sender_id !== signedInUser?.id) renderMessage(payload.new);
}).subscribe();

function escapeHtml(value) { return String(value || '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char])); }

supabase.auth.onAuthStateChange((_event, session) => { signedInUser = session?.user || null; });
