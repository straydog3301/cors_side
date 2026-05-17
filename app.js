// app.js — CORS Dev Panel 主程式
// 功能：視圖路由、渲染、編輯模式、GitHub API、localStorage

(function() {
  'use strict';

  // ── State ──
  const state = {
    currentView: 'dashboard',
    backlogTab: 'orders',
    backlogFilter: '',
    isEditMode: false,
    editTarget: null,      // { file: 'meta', section: 'characters', id: 'lycaon' }
    editDirty: false,
    editData: null,        // working copy of data being edited
    githubToken: localStorage.getItem('cors_gh_token') || '',
    editPassword: localStorage.getItem('cors_edit_password') || '',
    autosave: localStorage.getItem('cors_autosave') !== 'false',
    showIds: localStorage.getItem('cors_show_ids') === 'true',
    localModified: false,
  };

  // ── GitHub API helpers ──
  function utf8ToBase64(str) {
    return btoa(String.fromCharCode(...new Uint8Array(new TextEncoder().encode(str))));
  }
  const API = {
    headers(token) {
      return {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
    },
    async getFile(path, repo) {
      const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: API.headers(state.githubToken) });
      if (!r.ok) throw new Error(`GET ${path}: ${r.status}`);
      return r.json();
    },
    async putFile(path, content, repo, sha, msg) {
      const data = {
        message: msg,
        content: utf8ToBase64(content),
        ...(sha ? { sha } : {})
      };
      const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT', headers: API.headers(state.githubToken), body: JSON.stringify(data)
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ message: r.statusText }));
        throw new Error(`PUT ${path}: ${r.status} — ${err.message}`);
      }
      return r.json();
    }
  };

  // ── Toast ──
  function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg; el.className = `toast ${type} hidden`;
    void el.offsetWidth;
    el.classList.remove('hidden');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add('hidden'), 3500);
  }

  // ── View routing ──
  function switchView(name) {
    state.currentView = name;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === name);
    });
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const v = document.getElementById(`view-${name}`);
    if (v) v.classList.add('active');
    const titles = { dashboard:'Dashboard', backlog:'Backlog', characters:'角色', world:'世界觀', systems:'系統', notes:'開發筆記', settings:'設定' };
    document.getElementById('view-title').textContent = titles[name] || name;
    if (name === 'settings') loadSettings();
    renderCurrentView();
  }

  function renderCurrentView() {
    switch (state.currentView) {
      case 'dashboard': renderDashboard(); break;
      case 'backlog': renderBacklog(); break;
      case 'characters': renderCharacters(); break;
      case 'world': renderWorld(); break;
      case 'systems': renderSystems(); break;
      case 'notes': renderNotes(); break;
    }
  }

  // ── RENDER: Dashboard ──
  function renderDashboard() {
    const meta = GameData.meta;
    const stats = meta.stats;
    const statsEl = document.getElementById('dash-stats');
    statsEl.innerHTML = Object.entries(stats).map(([k,v]) => `
      <div class="dash-stat-card">
        <span class="dash-stat-num">${v}</span>
        <span class="dash-stat-label">${k}</span>
      </div>`).join('');

    // Phases
    const phasesEl = document.getElementById('phases-list');
    phasesEl.innerHTML = meta.phases.map(p => `
      <div class="phase-item ${p.status}" data-phase="${p.name}">
        <div class="phase-status-dot ${p.status}"></div>
        <div>
          <div class="phase-item-name">${p.name}</div>
          <div class="phase-item-desc">${p.desc}</div>
        </div>
        <div class="phase-item-pct">${p.progress}%</div>
        ${state.isEditMode ? `<button class="btn-sm btn-outline" style="margin-left:8px" onclick="app.openEdit('phases','${p.name}')">編輯</button>` : ''}
      </div>`).join('');

    // Orders
    const orders = GameData.orders.slice(0, 5);
    document.getElementById('order-count').textContent = `(${GameData.orders.length})`;
    document.getElementById('dash-orders').innerHTML = orders.map(o => `
      <div class="list-item" onclick="app.openEdit('orders','${o._file}')">
        <span class="list-item-id">${o.orderID || o._file}</span>
        <span class="list-item-name">${o.clientName || '(無名稱)'}</span>
        <span class="list-item-meta">💰 ${o.rewardAmount} 期限${o.timeLimit}s</span>
      </div>`).join('') || '<div class="list-item"><span class="list-item-name text-muted">暫無資料</span></div>';

    // Events
    const evts = GameData.events;
    document.getElementById('event-count').textContent = `(${evts.length})`;
    document.getElementById('dash-events').innerHTML = evts.map(e => `
      <div class="list-item" onclick="app.openEdit('events','${e._file}')">
        <span class="list-item-id">${e.id || e._file}</span>
        <span class="list-item-name">Day ${e.startDay} - ${e.locationId || ''}</span>
        <span class="list-item-meta">${e.startHour}:00 - ${e.endHour}:00</span>
      </div>`).join('') || '<div class="list-item"><span class="list-item-name text-muted">暫無資料</span></div>';

    // Items
    document.getElementById('item-count').textContent = `(${GameData.items.length})`;
    document.getElementById('dash-items').innerHTML = GameData.items.map(i => `
      <div class="list-item" onclick="app.openEdit('items','${i._file}')">
        <span class="list-item-id">${i.id}</span>
        <span class="list-item-name">${i.itemName || '(無名稱)'}</span>
        <span class="list-item-meta">💰 ${i.price || 0}</span>
      </div>`).join('') || '<div class="list-item"><span class="list-item-name text-muted">暫無資料</span></div>';

    // Emails
    document.getElementById('email-count').textContent = `(${GameData.emails.length})`;
    document.getElementById('dash-emails').innerHTML = GameData.emails.slice(0,5).map(m => `
      <div class="list-item" onclick="app.openEdit('emails','${m._file}')">
        <span class="list-item-id">${m.id}</span>
        <span class="list-item-name">${m.subject || '(無主旨)'}</span>
        <span class="list-item-meta">From: ${m.sender}</span>
      </div>`).join('') || '<div class="list-item"><span class="list-item-name text-muted">暫無資料</span></div>';

    // Phase indicator in sidebar
    const activePhase = meta.phases.find(p => p.status === 'active');
    if (activePhase) {
      document.getElementById('current-phase-name').textContent = activePhase.name;
      document.getElementById('phase-progress-fill').style.width = activePhase.progress + '%';
    }

    // Backlog badge
    document.getElementById('badge-backlog').textContent = GameData.orders.length + GameData.events.length;
  }

  // ── RENDER: Backlog ──
  function renderBacklog() {
    let items = [];
    switch (state.backlogTab) {
      case 'orders':   items = GameData.orders; break;
      case 'events':   items = GameData.events; break;
      case 'items':    items = GameData.items; break;
      case 'emails':   items = GameData.emails; break;
      case 'news':     items = GameData.news; break;
    }
    if (state.backlogFilter) {
      const q = state.backlogFilter.toLowerCase();
      items = items.filter(i => JSON.stringify(i).toLowerCase().includes(q));
    }
    const container = document.getElementById('backlog-content');
    if (items.length === 0) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--muted);font-family:var(--font-mono)">暫無資料${state.backlogFilter ? '（無符合搜尋結果）' : ''}</div>`;
      return;
    }
    container.innerHTML = items.map(item => {
      const id = item.orderID || item.id || item.subject || item._file || '';
      const name = item.clientName || item.subject || item.itemName || item.headline || item.title || '(未命名)';
      const meta = [
        item.rewardAmount ? `💰${item.rewardAmount}` : '',
        item.startDay ? `Day ${item.startDay}` : '',
        item.price ? `💵${item.price}` : '',
        item.priority ? `優先${item.priority}` : ''
      ].filter(Boolean).join(' · ');
      const type = item._type ? item._type.split('.').pop() : '';
      return `
        <div class="backlog-item" onclick="app.openEdit('${state.backlogTab}','${item.id || item._file}')">
          <span class="bk-id">${state.showIds ? id : id.substring(0,12)}</span>
          <span class="bk-title">${name}</span>
          ${meta ? `<span class="bk-meta">${meta}</span>` : ''}
          <span class="bk-tag">${type}</span>
        </div>`;
    }).join('');
  }

  function filterBacklog(q) {
    state.backlogFilter = q;
    renderBacklog();
  }

  // ── RENDER: Characters ──
  function renderCharacters() {
    const chars = GameData.meta.characters;
    const el = document.getElementById('chars-layout');
    el.innerHTML = chars.map(c => `
      <div class="char-page-card">
        <div class="char-page-header">
          <div class="char-avatar ${c.id}">${c.id === 'xavier' ? '⚖️' : '🦊'}</div>
          <div>
            <div>
              <span class="char-page-name-zh">${c.name_zh}</span>
              <span class="char-page-name-en ${c.id}">${c.name_en} / ${c.route}</span>
            </div>
            <div class="char-page-role">${c.role}</div>
          </div>
          ${state.isEditMode ? `<button class="btn-sm btn-outline" style="margin-left:auto" onclick="app.openEdit('characters','${c.id}')">編輯</button>` : ''}
        </div>
        <div class="char-page-body">
          <p class="char-page-desc">${c.description}</p>
          <div class="char-tags">${c.tags.map(t => `<span class="char-tag">${t}</span>`).join('')}</div>
        </div>
      </div>`).join('');
  }

  // ── RENDER: World ──
  function renderWorld() {
    const tl = GameData.meta.world_timeline;
    document.getElementById('world-timeline').innerHTML = tl.map(item => `
      <div class="tl-item">
        <div class="tl-marker"></div>
        <div class="tl-year">${item.year}</div>
        <div class="tl-title">${item.title}</div>
        <div class="tl-desc">${item.desc}</div>
      </div>`).join('');
  }

  // ── RENDER: Systems ──
  function renderSystems() {
    const sys = GameData.meta.systems;
    document.getElementById('systems-grid').innerHTML = sys.map(s => `
      <div class="sys-card" onclick="app.openEdit('systems','${s.id}')">
        <div class="sys-card-header">
          <span class="sys-icon">${s.icon}</span>
          <span class="sys-num">${s.num}</span>
          <div>
            <div class="sys-name">${s.name}</div>
          </div>
        </div>
        <p class="sys-desc">${s.desc}</p>
        <div class="sys-tags">${s.tags.map(t => `<span class="sys-tag">${t}</span>`).join('')}</div>
      </div>`).join('');
  }

  // ── RENDER: Notes ──
  function renderNotes() {
    const notes = GameData.notes;
    document.getElementById('notes-list').innerHTML = notes.map(n => `
      <div class="note-card" onclick="app.openEdit('notes','${n.id}')">
        <div class="note-title">${n.title}</div>
        <div class="note-content">${n.content}</div>
        <div class="note-footer">
          ${n.tags.map(t => `<span class="note-tag">${t}</span>`).join('')}
          <span class="note-date">${n.updated}</span>
        </div>
      </div>`).join('') + `<div class="note-card" style="border-style:dashed;opacity:0.5" onclick="app.newNote()"><div class="note-title">+ 新增筆記</div></div>`;
  }

  // ── EDIT MODE ──
  function toggleEdit() {
    if (!state.editPassword && !state.isEditMode) {
      const pw = prompt('請輸入編輯密碼（首次設定於 設定 頁面）：');
      if (!pw) return;
      if (state.editPassword && pw !== state.editPassword) { toast('密碼錯誤', 'error'); return; }
      if (!state.editPassword) { toast('尚無設定密碼，請至 設定 頁面設定', 'info'); state.isEditMode = true; }
    }
    state.isEditMode = !state.isEditMode;
    const icon = document.getElementById('edit-btn-icon');
    icon.textContent = state.isEditMode ? '✅' : '✏️';
    document.body.classList.toggle('edit-mode', state.isEditMode);
    renderCurrentView();
    toast(state.isEditMode ? '已進入編輯模式（僅本地，無推送需手動儲存）' : '已退出編輯模式', 'info');
  }

  function openEdit(type, id) {
    if (!state.isEditMode) {
      toast('請先進入編輯模式（點擊右上角 ✏️ 圖示）', 'info');
      return;
    }
    // Build edit data
    let data;
    if (type === 'orders') data = GameData.orders.find(o => o._file === id);
    else if (type === 'events') data = GameData.events.find(e => e._file === id);
    else if (type === 'items') data = GameData.items.find(i => i._file === id);
    else if (type === 'emails') data = GameData.emails.find(e => e._file === id);
    else if (type === 'news') data = GameData.news.find(n => n.id === id);
    else if (type === 'characters') data = GameData.meta.characters.find(c => c.id === id);
    else if (type === 'notes') data = GameData.notes.find(n => n.id === id);
    else if (type === 'systems') data = GameData.meta.systems.find(s => s.id === id);
    else if (type === 'phases') data = GameData.meta.phases.find(p => p.name === id);

    if (!data) { toast('找不到資料', 'error'); return; }

    state.editTarget = { type, id, file: id };
    state.editData = JSON.parse(JSON.stringify(data));
    state.editDirty = false;
    showEditOverlay(type, data);
  }

  function showEditOverlay(type, data) {
    const overlay = document.getElementById('edit-overlay');
    const body = document.getElementById('edit-body');
    const fname = document.getElementById('edit-file-name');
    fname.textContent = `${type} / ${data.orderID || data.id || data._file || data.name || ''}`;

    // Build block editor
    const fields = Object.entries(data).filter(([k]) => !k.startsWith('_'));
    body.innerHTML = `
      <div class="block-editor">
        ${fields.map(([k, v]) => `
          <div class="block-row">
            <span class="block-handle" title="拖動">⋮⋮</span>
            <input class="block-type-select" value="${k}" readonly style="width:120px" title="欄位名（唯讀）">
            <textarea class="block-content-input" data-field="${k}" rows="${String(v).length > 80 ? 3 : 1}"
              oninput="app.markDirty()">${v}</textarea>
            <button class="block-delete" onclick="app.deleteBlock(this)" title="刪除此欄">✕</button>
          </div>`).join('')}
        <div class="block-add-row">
          <button class="block-add-btn" onclick="app.addBlock()">+ 新增欄位</button>
          <button class="block-add-btn" onclick="app.showJsonEditor()">{} JSON 模式</button>
        </div>
      </div>`;

    overlay.classList.remove('hidden');
  }

  function markDirty() { state.editDirty = true; document.getElementById('edit-dirty').style.display = ''; }

  function showJsonEditor() {
    const body = document.getElementById('edit-body');
    body.innerHTML = `
      <div class="block-editor" style="max-width:100%">
        <div style="margin-bottom:12px;font-family:var(--font-mono);font-size:0.7rem;color:var(--muted)">JSON 模式 — 直接編輯原始資料</div>
        <textarea class="json-editor" id="json-editor">${JSON.stringify(state.editData, null, 2)}</textarea>
        <div style="margin-top:8px"><button class="block-add-btn" onclick="app.showBlockEditor()">← 返回區塊模式</button></div>
      </div>`;
    document.getElementById('json-editor').addEventListener('input', () => markDirty());
  }

  function showBlockEditor() {
    showEditOverlay(state.editTarget.type, state.editData);
  }

  function addBlock() {
    const key = prompt('輸入新欄位名稱（英文）：');
    if (!key || !/^\w+$/.test(key)) { toast('無效的欄位名', 'error'); return; }
    if (key in state.editData) { toast('欄位已存在', 'error'); return; }
    state.editData[key] = '';
    markDirty();
    showEditOverlay(state.editTarget.type, state.editData);
  }

  function deleteBlock(btn) {
    const row = btn.closest('.block-row');
    const field = row.querySelector('.block-content-input').dataset.field;
    delete state.editData[field];
    markDirty();
    row.remove();
  }

  function editCancel() {
    if (state.editDirty && !confirm('放棄未儲存的變更？')) return;
    state.editData = null;
    state.editDirty = false;
    document.getElementById('edit-dirty').style.display = 'none';
    document.getElementById('edit-overlay').classList.add('hidden');
    toast('已取消', 'info');
  }

  function editSave() {
    // Collect from textarea fields
    const textareaEls = document.querySelectorAll('.block-content-input');
    const jsonEditor = document.getElementById('json-editor');
    if (jsonEditor) {
      // JSON mode
      try { state.editData = JSON.parse(jsonEditor.value); }
      catch(e) { toast('JSON 格式錯誤：' + e.message, 'error'); return; }
    } else {
      // Block mode
      textareaEls.forEach(el => {
        const field = el.dataset.field;
        const val = el.value;
        // Try to parse numbers
        state.editData[field] = isNaN(val) || val === '' ? val : (Number(val) || val);
      });
    }

    // Persist to GameData
    applyEdit(state.editTarget.type, state.editTarget.id, state.editData);

    state.editDirty = false;
    document.getElementById('edit-dirty').style.display = 'none';
    document.getElementById('edit-overlay').classList.add('hidden');
    toast('已儲存（本地）', 'success');

    if (state.autosave) saveToLocalStorage();
    renderCurrentView();
  }

  function applyEdit(type, id, newData) {
    if (type === 'orders') { const arr = GameData.orders; const idx = arr.findIndex(o => o._file === id); if (idx >= 0) GameData.orders = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'events') { const arr = GameData.events; const idx = arr.findIndex(e => e._file === id); if (idx >= 0) GameData.events = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'items') { const arr = GameData.items; const idx = arr.findIndex(i => i._file === id); if (idx >= 0) GameData.items = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'emails') { const arr = GameData.emails; const idx = arr.findIndex(e => e._file === id); if (idx >= 0) GameData.emails = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'notes') { const arr = GameData.notes; const idx = arr.findIndex(n => n.id === id); if (idx >= 0) GameData.notes = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'news') { const arr = GameData.news; const idx = arr.findIndex(n => n._file === id); if (idx >= 0) GameData.news = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'characters') {
      const chars = GameData.meta.characters;
      const idx = chars.findIndex(c => c.id === id);
      if (idx >= 0) GameData.meta = {...GameData.meta, characters: [...chars.slice(0,idx), {...chars[idx], ...newData}, ...chars.slice(idx+1)]};
    }
    else if (type === 'systems') {
      const sys = GameData.meta.systems;
      const idx = sys.findIndex(s => s.id === id);
      if (idx >= 0) GameData.meta = {...GameData.meta, systems: [...sys.slice(0,idx), {...sys[idx], ...newData}, ...sys.slice(idx+1)]};
    }
    else if (type === 'phases') {
      const ph = GameData.meta.phases;
      const idx = ph.findIndex(p => p.name === id);
      if (idx >= 0) GameData.meta = {...GameData.meta, phases: [...ph.slice(0,idx), {...ph[idx], ...newData}, ...ph.slice(idx+1)]};
    }
  }

  function newNote() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const title = prompt('筆記標題：');
    if (!title) return;
    const id = 'n' + Date.now();
    const note = { id, title, content: '', tags: ['新增'], updated: new Date().toISOString().split('T')[0] };
    GameData.notes = [...GameData.notes, note];
    renderNotes();
    openEdit('notes', id);
    markDirty();
  }

  // ── SETTINGS ──
  function openSettings() { switchView('settings'); }
  function loadSettings() {
    document.getElementById('setting-gh-token').value = state.githubToken;
    document.getElementById('setting-edit-password').value = state.editPassword;
    document.getElementById('toggle-autosave').checked = state.autosave;
    document.getElementById('toggle-show-ids').checked = state.showIds;
  }
  function saveToken(v) { state.githubToken = v; localStorage.setItem('cors_gh_token', v); toast('Token 已儲存至 localStorage', 'success'); }
  function saveEditPassword(v) { state.editPassword = v; localStorage.setItem('cors_edit_password', v); toast('編輯密碼已設定', 'success'); }
  function toggleAutosave(v) { state.autosave = v; localStorage.setItem('cors_autosave', v); toast('已' + (v?'啟用':'停用') + '自動儲存', 'info'); }
  function toggleShowIds(v) { state.showIds = v; localStorage.setItem('cors_show_ids', v); renderCurrentView(); }
  function resetLocal() { if (!confirm('確定要清除所有本地變更嗎？')) return; GameData.reset(); localStorage.removeItem('cors_local_data'); state.localModified = false; renderCurrentView(); toast('已重置', 'info'); }

  // ── GitHub sync ──
  async function connectGithub() {
    const token = document.getElementById('setting-gh-token').value;
    if (!token) { toast('請輸入 GitHub Token', 'error'); return; }
    state.githubToken = token;
    localStorage.setItem('cors_gh_token', token);
    try {
      const r = await fetch('https://api.github.com/user', { headers: API.headers(token) });
      if (!r.ok) throw new Error(r.status);
      const user = await r.json();
      document.getElementById('connect-status').innerHTML = `<span style="color:var(--success)">✓ 已連接：${user.login}</span>`;
      document.getElementById('user-avatar').textContent = user.login.substring(0,2).toUpperCase();
      document.getElementById('user-name').textContent = user.login;
      document.getElementById('user-status').textContent = 'GitHub 已連接';
      toast(`已連接 GitHub：${user.login}`, 'success');
    } catch(e) {
      document.getElementById('connect-status').innerHTML = `<span style="color:var(--danger)">連接失敗：${e.message}</span>`;
      toast('GitHub 連接失敗', 'error');
    }
  }

  async function pushToGithub() {
    if (!state.githubToken) { toast('請先連接 GitHub（設定頁面）', 'error'); return; }
    const repo = document.getElementById('setting-repo').value || 'straydog3301/cors_side';
    const data = GameData.exportAll();
    const files = {
      'content/orders.json': JSON.stringify(data.orders, null, 2),
      'content/events.json': JSON.stringify(data.events, null, 2),
      'content/items.json': JSON.stringify(data.items, null, 2),
      'content/emails.json': JSON.stringify(data.emails, null, 2),
      'content/news.json': JSON.stringify(data.news, null, 2),
      'content/notes.json': JSON.stringify(data.notes, null, 2),
      'content/meta.json': JSON.stringify(data.meta, null, 2),
    };
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = '推送中...（取 SHA...）';
    let success = 0, fail = 0;
    const shaCache = {};
    // Pre-fetch SHAs for all files
    for (const path of Object.keys(files)) {
      try {
        const file = await API.getFile(path, repo);
        shaCache[path] = file.sha;
      } catch(e) {
        // File doesn't exist yet — no SHA needed
        shaCache[path] = null;
      }
    }
    statusEl.textContent = '推送中...';
    for (const [path, content] of Object.entries(files)) {
      try {
        await API.putFile(path, content, repo, shaCache[path], `docs: update ${path} via CORS Dev Panel`);
        success++;
        statusEl.textContent = `推送中... ${success}/${Object.keys(files).length}`;
      } catch(e) {
        fail++;
        console.error(`Push failed for ${path}:`, e);
        statusEl.innerHTML = `<span style="color:var(--danger)">⚠ 失敗：${e.message}</span>`;
        toast(`推送失敗：${path} — ${e.message}`, 'error');
      }
    }
    if (fail === 0) {
      statusEl.innerHTML = `<span style="color:var(--success)">✓ 成功推送 ${success} 個檔案</span>`;
      toast(`已推送 ${success} 個檔案至 GitHub`, 'success');
    } else {
      statusEl.innerHTML = `<span style="color:var(--warning)">⚠ 推送完成：${success} 成功，${fail} 失敗</span>`;
      toast(`推送完成：${success} 成功，${fail} 失敗`, 'info');
    }
  }

  async function loadFromGithub() {
    if (!state.githubToken) { toast('請先連接 GitHub', 'error'); return; }
    const repo = document.getElementById('setting-repo').value || 'straydog3301/cors_side';
    const files = ['orders','events','items','emails','news','notes','meta'];
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = '拉取中...';
    let loaded = 0;
    for (const name of files) {
      try {
        const file = await API.getFile(`content/${name}.json`, repo);
        const content = atob(file.content);
        const data = JSON.parse(content);
        GameData[name === 'meta' ? 'meta' : name] = data;
        loaded++;
      } catch(e) {
        console.warn(`Load failed for ${name}:`, e);
      }
    }
    statusEl.innerHTML = `<span style="color:var(--cyan)">✓ 已拉取 ${loaded}/${files.length} 個檔案</span>`;
    renderCurrentView();
    toast(`已從 GitHub 拉取 ${loaded} 個檔案`, 'success');
  }

  // ── localStorage ──
  function saveToLocalStorage() {
    localStorage.setItem('cors_local_data', JSON.stringify(GameData.exportAll()));
    state.localModified = true;
    document.getElementById('commit-status').style.display = 'flex';
    document.getElementById('commit-msg').textContent = '已自動儲存至本機';
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('cors_local_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      Object.keys(data).forEach(k => { if (GameData[k] !== undefined) GameData[k] = data[k]; });
    } catch(e) { /* ignore */ }
  }

  function saveAll() {
    saveToLocalStorage();
    toast('已儲存至本機', 'success');
  }

  // ── Init ──
  function init() {
    loadFromLocalStorage();

    // Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Backlog tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.backlogTab = btn.dataset.tab;
        renderBacklog();
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        switchView('backlog');
        document.getElementById('backlog-search').focus();
      }
      if (e.key === 'Escape' && !document.getElementById('edit-overlay').classList.contains('hidden')) {
        editCancel();
      }
    });

    // Try reconnect GitHub if token saved
    if (state.githubToken) {
      fetch('https://api.github.com/user', { headers: API.headers(state.githubToken) })
        .then(r => r.ok ? r.json() : null)
        .then(user => {
          if (user) {
            document.getElementById('user-avatar').textContent = user.login.substring(0,2).toUpperCase();
            document.getElementById('user-name').textContent = user.login;
            document.getElementById('user-status').textContent = 'GitHub 已連接';
          }
        }).catch(() => {});
    }

    renderCurrentView();
  }

  // Expose API
  window.app = {
    switchView, renderCurrentView,
    toggleEdit, openEdit, editCancel, editSave, markDirty,
    showJsonEditor, showBlockEditor, addBlock, deleteBlock,
    newNote, filterBacklog, openSettings,
    saveToken, saveEditPassword, toggleAutosave, toggleShowIds, resetLocal,
    connectGithub, pushToGithub, loadFromGithub,
    saveAll, saveToLocalStorage
  };

  document.addEventListener('DOMContentLoaded', init);
})();