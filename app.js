// app.js — CORS Dev Panel 主程式
// 功能：視圖路由、渲染、編輯模式、GitHub API、localStorage

(function() {
  'use strict';

  // ── State ──
  const state = {
    currentView: 'dashboard',
    isEditMode: false,
    editTarget: null,      // { file: 'meta', section: 'characters', id: 'lycaon' }
    editDirty: false,
    editData: null,        // working copy of data being edited
    githubToken: localStorage.getItem('cors_gh_token') || '',
    editPassword: localStorage.getItem('cors_edit_password') || '',
    autosave: localStorage.getItem('cors_autosave') !== 'false',
    showIds: localStorage.getItem('cors_show_ids') === 'true',
    localModified: false,
    backlogTab: 'orders',
    backlogFilter: '',
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
    const titles = { dashboard:'Dashboard', characters:'角色', world:'世界觀', systems:'系統', notes:'開發筆記', settings:'設定' };
    document.getElementById('view-title').textContent = titles[name] || name;
    if (name === 'settings') loadSettings();
    renderCurrentView();
  }

  function renderCurrentView() {
    switch (state.currentView) {
      case 'dashboard': renderDashboard(); break;
      case 'characters': renderCharacters(); break;
      case 'world': renderWorld(); break;
      case 'systems': renderSystems(); break;
      case 'notes': renderNotes(); break;
    }
  }

  // Helper: progress color class
  function progressColor(pct) {
    if (pct >= 100) return 'done';
    if (pct >= 50) return 'mid';
    if (pct >= 1) return 'low';
    return 'none';
  }

  // ── RENDER: Dashboard ──
  function renderDashboard() {
    const meta = GameData.meta;
    const edit = state.isEditMode;

    // Hero
    const heroEl = document.getElementById('dash-hero');
    if (heroEl) {
      heroEl.innerHTML = `
        <div class="dash-hero-title">${meta.title}</div>
        <div class="dash-hero-tagline">${meta.tagline_zh} — ${meta.tagline_en}</div>
        <div class="dash-hero-badges">${(meta.badges||[]).map(b => `<span class="dash-hero-badge">${b}</span>`).join('')}</div>
      `;
    }

    // Phases
    const phasesEl = document.getElementById('phases-list');
    if (phasesEl) {
      const addBtn = edit ? `<div style="text-align:right;margin-bottom:8px"><button class="btn-sm btn-outline dash-edit-btn" onclick="app.addPhase()">+ 新增階段</button></div>` : '';
      phasesEl.innerHTML = addBtn + meta.phases.map(p => `
        <div class="phase-item ${p.status}" ${edit ? `onclick="app.openEdit('phases','${p.name.replace(/'/g,"\\'")}')"` : ''}>
          <div class="phase-status-dot ${p.status}"></div>
          <div>
            <div class="phase-item-name">${p.name}</div>
            <div class="phase-item-desc">${p.desc}</div>
          </div>
          <div class="phase-item-pct">${p.progress}%</div>
        </div>`).join('');
    }

    // Stats
    const statsEl = document.getElementById('dash-stats');
    if (statsEl) {
      const entries = Object.entries(meta.stats||{});
      statsEl.innerHTML = (edit && entries.length > 0 ? entries.map(([k,v]) => `
        <div class="dash-stat-card dash-stat-edit" onclick="app.editStatKey('${k.replace(/'/g,"\\'")}')">
          <span class="dash-stat-num">${v}</span>
          <span class="dash-stat-label">${k}</span>
        </div>`) :
        entries.map(([k,v]) => `
        <div class="dash-stat-card">
          <span class="dash-stat-num">${v}</span>
          <span class="dash-stat-label">${k}</span>
        </div>`)
      ).join('');
      if (edit) {
        statsEl.innerHTML += `<div class="dash-stat-card dash-stat-add" onclick="app.addStat()"><span class="dash-stat-add-icon">+</span><span class="dash-stat-label">新增</span></div>`;
      }
    }

    // Core Systems (from meta.systems, short summary)
    const sysEl = document.getElementById('systems-list');
    if (sysEl) {
      const systems = meta.systems || [];
      const addBtn = edit ? `<button class="btn-sm btn-outline dash-edit-btn" onclick="app.addSystem()" style="float:right">+ 新增</button>` : '';
      sysEl.innerHTML = (addBtn ? `<div style="text-align:right;margin-bottom:4px">${addBtn}</div>` : '') + systems.map(s => `
        <div class="system-item" ${edit ? `onclick="app.openEdit('systems','${s.id}')" style="cursor:pointer"` : ''}>
          <span class="system-icon">${s.icon}</span>
          <span class="system-name">${s.name}</span>
          <span class="system-desc">${s.desc}</span>
        </div>`).join('');
    }

    // Story Timeline (with progress bars)
    const tlEl = document.getElementById('story-timeline');
    if (tlEl) {
      const stl = meta.story_timeline || [];
      const tagLabels = { common: '共通', xavier: '澤維爾', lycaon: '萊卡翁', secret: '隱藏' };
      const addBtn = edit ? `<div style="text-align:right;margin-bottom:8px"><button class="btn-sm btn-outline dash-edit-btn" onclick="app.addStoryTimeline()">+ 新增</button></div>` : '';
      tlEl.innerHTML = addBtn + `<div class="tl-track">${stl.length > 0 ? stl.map(p => `
        <div class="tl-node" ${edit ? `onclick="app.openEdit('story_timeline','${p.name.replace(/'/g,"\\'")}')" style="cursor:pointer"` : ''}>
          <div class="tl-dot ${progressColor(p.progress)}"></div>
          <div class="tl-content">
            <div class="tl-days">${p.days}</div>
            <div class="tl-name">${p.name}</div>
            ${p.progress !== undefined ? `<div class="dash-tl-progress"><div class="dash-tl-progress-fill ${progressColor(p.progress)}" style="width:${p.progress}%"></div></div><span class="dash-tl-progress-label">${p.progress}%</span>` : ''}
            <span class="tl-route-tag tl-tag-${p.tag}">${tagLabels[p.tag]||p.tag}路線</span>
          </div>
        </div>`).join('') : '<div style="padding:20px;text-align:center;color:var(--muted);font-size:0.75rem">暫無故事時間線資料</div>'}</div>`;
    }

    // Character Routes
    const crEl = document.getElementById('char-routes');
    if (crEl) {
      const chars = meta.characters || [];
      crEl.innerHTML = chars.map(c => `
        <div class="char-route-card" ${edit ? `onclick="app.openEdit('characters','${c.id}')" style="cursor:pointer"` : ''}>
          <div class="char-route-avatar char-avatar-${c.id}">${c.id==='xavier'?'⚖':'🐺'}</div>
          <div class="char-route-info">
            <div class="char-route-name">${c.name_zh} · ${c.name_en}</div>
            <div class="char-route-role">${c.role}</div>
            <div class="char-route-tags">${(c.tags||[]).map(t => `<span class="char-tag char-tag-${c.id}">${t}</span>`).join('')}</div>
          </div>
        </div>`).join('');
    }

    // World Cards (with progress bars)
    const wcEl = document.getElementById('world-cards');
    if (wcEl) {
      const wt = meta.world_timeline||[];
      const addBtn = edit ? `<div style="text-align:right;margin-bottom:8px"><button class="btn-sm btn-outline dash-edit-btn" onclick="app.addWorldEvent()">+ 新增</button></div>` : '';
      wcEl.innerHTML = addBtn + wt.map(w => `
        <div class="world-card" ${edit ? `onclick="app.openEdit('world_timeline','${w.title.replace(/'/g,"\\'")}')" style="cursor:pointer"` : ''}>
          <div class="world-card-year">${w.year}</div>
          <div class="world-card-title">${w.title}</div>
          <div class="world-card-desc">${w.desc}</div>
          ${w.progress !== undefined ? `<div class="dash-tl-progress" style="margin-top:6px"><div class="dash-tl-progress-fill ${progressColor(w.progress)}" style="width:${w.progress}%"></div></div><span class="dash-tl-progress-label">${w.progress}%</span>` : ''}
        </div>`).join('');
    }

    // Sidebar phase indicator
    const activePhase = meta.phases.find(p => p.status === 'active');
    const phaseNameEl = document.getElementById('current-phase-name');
    const phaseFillEl = document.getElementById('phase-progress-fill');
    if (phaseNameEl && activePhase) phaseNameEl.textContent = activePhase.name;
    if (phaseFillEl && activePhase) phaseFillEl.style.width = activePhase.progress + '%';
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
    const infoEl = document.getElementById('backlog-info');
    const typeLabel = { orders:'訂單', events:'時間事件', items:'道具', emails:'郵件', news:'新聞' };
    const countMap = { orders: GameData.orders.length, events: GameData.events.length, items: GameData.items.length, emails: GameData.emails.length, news: GameData.news.length };
    const addBtn = state.isEditMode
      ? `<button class="btn-sm" onclick="app.addRecord('${state.backlogTab}')" style="margin-left:auto">＋ 新增 ${typeLabel[state.backlogTab]||''}</button>`
      : '';
    infoEl.innerHTML = `<span style="font-size:0.75rem;color:var(--muted)">共 ${countMap[state.backlogTab]||items.length} 筆</span>${addBtn}`;
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
      const _keyFor = { orders:'_file', events:'_file', items:'_file', news:'_file', emails:'id', characters:'id', notes:'id' };
      const _k = _keyFor[state.backlogTab] || 'id';
      return `
        <div class="backlog-item" onclick="app.openEdit('${state.backlogTab}','${item[_k] || item._file || item.id}')">
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
    const stl = GameData.meta.story_timeline;
    const endings = GameData.meta.endings;

    const editBtn = state.isEditMode ? `<div style="text-align:right;margin-bottom:12px"><button class="btn-sm btn-outline" onclick="app.addWorldEvent()">+ 新增時間點</button></div>` : '';

    // World Timeline with progress bars
    let html = `<h4 style="font-family:var(--font-title);font-size:0.85rem;color:var(--text);letter-spacing:2px;margin-bottom:16px;">世界觀時間線</h4>` +
      editBtn + tl.map((item, i) => `
      <div class="tl-item ${progressColor(item.progress)}" ${state.isEditMode ? `onclick="app.openEdit('world_timeline','${item.title}' )" style="cursor:pointer"` : ``}>
        <div class="tl-marker ${progressColor(item.progress)}"></div>
        <div class="tl-year">${item.year}</div>
        <div class="tl-title">${item.title}</div>
        <div class="tl-desc">${item.desc}</div>
        ${item.progress !== undefined ? `<div class="tl-progress-bar"><div class="tl-progress-fill ${progressColor(item.progress)}" style="width:${item.progress}%"></div></div><span class="tl-progress-label">${item.progress}%</span>` : ''}
      </div>`).join('');

    // Story Timeline section
    const storyEditBtn = state.isEditMode ? `<div style="text-align:right;margin-bottom:12px"><button class="btn-sm btn-outline" onclick="app.addStoryTimeline()">+ 新增故事階段</button></div>` : '';
    const tagLabels = { common: '共通', xavier: '澤維爾', lycaon: '萊卡翁', secret: '隱藏' };
    html += `<h4 style="margin-top:32px;font-family:var(--font-title);font-size:0.85rem;color:var(--text);letter-spacing:2px;margin-bottom:16px;">故事時間線</h4>` +
      storyEditBtn + (stl||[]).map((item, i) => `
      <div class="tl-item ${progressColor(item.progress)}" ${state.isEditMode ? `onclick="app.openEdit('story_timeline','${item.name}' )" style="cursor:pointer"` : ``}>
        <div class="tl-marker ${progressColor(item.progress)}"></div>
        <div class="tl-year">${item.days}</div>
        <div class="tl-title">${item.name}</div>
        <div class="tl-desc">${item.desc}</div>
        ${item.progress !== undefined ? `<div class="tl-progress-bar"><div class="tl-progress-fill ${progressColor(item.progress)}" style="width:${item.progress}%"></div></div><span class="tl-progress-label">${item.progress}%</span>` : ''}
        <span class="tl-route-tag tl-tag-${item.tag}" style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:0.65rem;margin-top:4px">${tagLabels[item.tag]||item.tag}路線</span>
      </div>`).join('');

    // Ending branches section
    const routeLabels = { common: '共通', xavier: '澤維爾', lycaon: '萊卡翁', secret: '隱藏' };
    const routeColors = { common: 'cyan', xavier: 'gold', lycaon: 'magenta', secret: 'cyan' };
    const routeIcon = (r) => r === 'xavier' ? '⚖' : r === 'lycaon' ? '🐺' : r === 'secret' ? '🌀' : '📖';

    html += `<h4 style="margin-top:32px;font-family:var(--font-title);font-size:0.85rem;color:var(--text);letter-spacing:2px;margin-bottom:16px;">結局分支（共 7 條）</h4>
      <div class="endings-grid">` + endings.map((e) => `
        <div class="ending-card ending-${routeColors[e.route]} ${progressColor(e.progress)}" ${state.isEditMode ? `onclick="app.openEdit('endings','${e.id}' )" style="cursor:pointer"` : ``}>
          <div class="ending-header">
            <span class="ending-route-icon">${routeIcon(e.route)}</span>
            <span class="ending-route-tag tag-${routeColors[e.route]}">${routeLabels[e.route]||e.route}</span>
          </div>
          <div class="ending-name">${e.name}</div>
          <div class="ending-desc">${e.desc}</div>
          <div class="ending-progress-bar"><div class="ending-progress-fill ${progressColor(e.progress)}" style="width:${e.progress}%"></div></div>
          <div class="ending-progress-text">劇本完成度：${e.progress}%</div>
        </div>`).join('') + `</div>`;

    document.getElementById('world-timeline').innerHTML = html;
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
    if (!state.githubToken) {
      toast('請先連接 GitHub（設定頁面）', 'info');
      return;
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
    else if (type === 'emails') data = GameData.emails.find(e => e.id === id);
    else if (type === 'news') data = GameData.news.find(n => n.id === id);
    else if (type === 'characters') data = GameData.meta.characters.find(c => c.id === id);
    else if (type === 'notes') data = GameData.notes.find(n => n.id === id);
    else if (type === 'systems') data = GameData.meta.systems.find(s => s.id === id);
    else if (type === 'phases') data = GameData.meta.phases.find(p => p.name === id);
    else if (type === 'world_timeline') data = GameData.meta.world_timeline.find(w => w.title === id);
    else if (type === 'story_timeline') data = (GameData.meta.story_timeline||[]).find(s => s.name === id);
    else if (type === 'endings') data = GameData.meta.endings.find(e => e.id === id);

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
    // Known enum fields with their options
    const enumFields = {
      status: ['done', 'active', 'pending'],
      tag: ['common', 'xavier', 'lycaon', 'secret'],
      branch: ['common', 'xavier', 'lycaon', 'secret'],
      route: ['common', 'xavier', 'lycaon', 'secret', 'XAVIER_ROUTE', 'LYCAON_ROUTE'],
    };
    const arrayFields = new Set(['tags', 'badges']);
    const fields = Object.entries(data).filter(([k]) => !k.startsWith('_'));
    const renderField = (k, v) => {
      const isEnum = enumFields[k];
      const isArr = arrayFields.has(k);
      const val = isArr && Array.isArray(v) ? v.join(', ') : v;
      const inputHtml = isEnum
        ? `<select class="block-content-input block-select-input" data-field="${k}" onchange="app.markDirty()">${isEnum.map(opt => `<option value="${opt}"${val===opt?' selected':''}>${opt === 'done'?'已完成':opt === 'active'?'進行中':opt === 'pending'?'待開始':opt === 'common'?'共通':opt === 'xavier'?'澤維爾':opt === 'lycaon'?'萊卡翁':opt === 'secret'?'隱藏':opt}</option>`).join('')}</select>`
        : `<textarea class="block-content-input" data-field="${k}" rows="${String(val).length > 80 ? 3 : 1}" oninput="app.markDirty()">${val}</textarea>`;
      return `
        <div class="block-row">
          <input class="block-type-select" value="${k}" readonly style="width:120px" title="欄位名（唯讀）">
          ${inputHtml}
        </div>`;
    };
    body.innerHTML = `
      <div class="block-editor">
        ${fields.map(([k, v]) => renderField(k, v)).join('')}
        <div class="block-add-row" style="display:flex;gap:8px;margin-top:16px;align-items:center">
          <button class="btn-primary btn-sm" onclick="app.showJsonEditor()" style="margin-right:auto">{} JSON 模式</button>
          <button class="btn-danger btn-sm" onclick="app.deleteCurrentRecord()">🗑️ 刪除此筆</button>
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

  function addField() {
    const key = prompt('輸入新欄位名稱（英文）：');
    if (!key || !/^\w+$/.test(key)) { toast('無效的欄位名', 'error'); return; }
    if (key in state.editData) { toast('欄位已存在', 'error'); return; }
    state.editData[key] = '';
    markDirty();
    showEditOverlay(state.editTarget.type, state.editData);
  }

  function addRecord(type, template) {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const t = type || state.editTarget?.type || 'orders';
    const allData = { orders: GameData.orders, events: GameData.events, items: GameData.items, emails: GameData.emails, news: GameData.news, notes: GameData.notes };
    const pool = allData[t];
    if (!pool || pool.length === 0) { toast('無法新增：無範本資料', 'error'); return; }
    const tmpl = template || pool[0];
    const newId = prompt(`新增 ${t} 的 ID（範例：${tmpl.orderID || tmpl.id || 'NewID'}）：`, 'New_' + Date.now());
    if (!newId) return;
    const newRec = JSON.parse(JSON.stringify(tmpl));
    if (t === 'orders') newRec.orderID = newId;
    else newRec.id = newId;
    newRec._file = newId + '.asset';
    // Clear non-essential fields
    Object.keys(newRec).forEach(k => {
      if (!k.startsWith('_') && k !== 'id' && k !== '_file' && k !== 'orderID' && k !== '_type') {
        newRec[k] = '';
      }
    });
    applyAdd(t, newRec);
    state.editDirty = true;
    markDirty();
    if (t === 'notes') { renderNotes(); openEdit('notes', newId); }
    else { renderCurrentView(); openEdit(t, newRec._file || newId); }
    toast(`已新增：${newId}`, 'success');
  }

  function applyAdd(type, newRec) {
    if (type === 'orders') GameData.orders = [...GameData.orders, newRec];
    else if (type === 'events') GameData.events = [...GameData.events, newRec];
    else if (type === 'items') GameData.items = [...GameData.items, newRec];
    else if (type === 'emails') GameData.emails = [...GameData.emails, newRec];
    else if (type === 'news') GameData.news = [...GameData.news, newRec];
    else if (type === 'notes') GameData.notes = [...GameData.notes, newRec];
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
        let val = el.value;
        // Try to parse numbers — BUT only if the original value was numeric
        const orig = state.editData[field];
        if (typeof orig === 'number') {
          val = Number(val);
        }
// Auto-convert array fields: "tag1, tag2" → ["tag1","tag2"]
        const arrayFields = ['tags', 'badges'];
        if (arrayFields.includes(field) && typeof val === 'string' && val.trim()) {
          val = val.split(',').map(t => t.trim()).filter(Boolean);
        }
        // Also auto-convert if value looks numeric and field expects number
        if (typeof val === 'string' && /^[0-9]+(\.[0-9]+)?$/.test(val.trim()) && typeof orig === 'number') {
          val = Number(val.trim());
        } else if (typeof val === 'string' && /^[0-9]+(\.[0-9]+)?$/.test(val.trim()) && field === 'progress') {
          val = Number(val.trim());
        }
        state.editData[field] = val;
      });
    }

    // Persist to GameData
    applyEdit(state.editTarget.type, state.editTarget.id, state.editData);

    state.editDirty = false;
    document.getElementById('edit-dirty').style.display = 'none';
    document.getElementById('edit-overlay').classList.add('hidden');
    toast('已儲存（本地）', 'success');

    saveToLocalStorage();
    renderCurrentView();
  }

  function applyEdit(type, id, newData) {
    if (type === 'orders') { const arr = GameData.orders; const idx = arr.findIndex(o => o._file === id); if (idx >= 0) GameData.orders = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'events') { const arr = GameData.events; const idx = arr.findIndex(e => e._file === id); if (idx >= 0) GameData.events = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'items') { const arr = GameData.items; const idx = arr.findIndex(i => i._file === id); if (idx >= 0) GameData.items = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'emails') { const arr = GameData.emails; const idx = arr.findIndex(e => e.id === id); if (idx >= 0) GameData.emails = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'notes') { const arr = GameData.notes; const idx = arr.findIndex(n => n.id === id); if (idx >= 0) GameData.notes = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
    else if (type === 'news') { const arr = GameData.news; const idx = arr.findIndex(n => n.id === id); if (idx >= 0) GameData.news = [...arr.slice(0,idx), {...arr[idx], ...newData}, ...arr.slice(idx+1)]; }
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
    else if (type === 'world_timeline') {
      const tl = GameData.meta.world_timeline;
      const idx = tl.findIndex(w => w.title === id);
      if (idx >= 0) GameData.meta = {...GameData.meta, world_timeline: [...tl.slice(0,idx), {...tl[idx], ...newData}, ...tl.slice(idx+1)]};
    }
    else if (type === 'story_timeline') {
      const st = GameData.meta.story_timeline || [];
      const idx = st.findIndex(s => s.name === id);
      if (idx >= 0) GameData.meta = {...GameData.meta, story_timeline: [...st.slice(0,idx), {...st[idx], ...newData}, ...st.slice(idx+1)]};
    }
    else if (type === 'endings') {
      const en = GameData.meta.endings;
      const idx = en.findIndex(e => e.id === id);
      if (idx >= 0) GameData.meta = {...GameData.meta, endings: [...en.slice(0,idx), {...en[idx], ...newData}, ...en.slice(idx+1)]};
    }
  }

  function addWorldEvent() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const title = prompt('時間點標題：');
    if (!title) return;
    const event = { year: '2088', title, desc: '請填寫描述', progress: 0, branch: 'common' };
    GameData.meta = {...GameData.meta, world_timeline: [...GameData.meta.world_timeline, event]};
    renderWorld();
    openEdit('world_timeline', title);
    markDirty();
  }

  function addStoryTimeline() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const name = prompt('故事階段名稱：');
    if (!name) return;
    const item = { days: 'Day ?', name, desc: '請填寫描述', tag: 'common', progress: 0 };
    const arr = GameData.meta.story_timeline || [];
    GameData.meta = {...GameData.meta, story_timeline: [...arr, item]};
    renderWorld();
    openEdit('story_timeline', name);
    markDirty();
  }

  function editStatKey(key) {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const action = confirm(`編輯「${key}」？\n確定 = 修改名稱與數值\n取消 = 刪除此項`) ? 'edit' : 'delete';
    if (action === 'delete') {
      return deleteStatKey(key);
    }
    const stats = GameData.meta.stats || {};
    const newKey = prompt('新標籤名稱（留空不變）：', key);
    if (newKey === null) return;
    const finalKey = newKey || key;
    const val = prompt('數值：', stats[key]);
    if (val === null) return;
    const newStats = {...stats};
    delete newStats[key];
    newStats[finalKey] = val;
    GameData.meta = {...GameData.meta, stats: newStats};
    markDirty();
    saveToLocalStorage();
    renderDashboard();
    toast(`統計項目已更新：${finalKey} = ${val}`, 'success');
  }

  function addStat() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const key = prompt('新統計項目標籤（如：角色數量）：');
    if (!key) return;
    const val = prompt('數值（如：2）：', '0');
    if (val === null) return;
    GameData.meta = {...GameData.meta, stats: {...GameData.meta.stats, [key]: val}};
    markDirty();
    saveToLocalStorage();
    renderDashboard();
    toast(`已新增統計項目：${key} = ${val}`, 'success');
  }

  function deleteStatKey(key) {
    if (!confirm(`確定移除統計項目「${key}」？`)) return;
    const newStats = {...GameData.meta.stats};
    delete newStats[key];
    GameData.meta = {...GameData.meta, stats: newStats};
    markDirty();
    renderDashboard();
    toast(`已刪除統計項目：${key}`, 'success');
  }

  function addPhase() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const name = prompt('開發階段名稱：');
    if (!name) return;
    const phase = { name, status: 'pending', desc: '請填寫描述', progress: 0 };
    GameData.meta = {...GameData.meta, phases: [...GameData.meta.phases, phase]};
    markDirty();
    renderDashboard();
    openEdit('phases', name);
    toast(`已新增階段：${name}`, 'success');
  }

  function addSystem() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const name = prompt('系統名稱：');
    if (!name) return;
    const id = 'sys_' + Date.now();
    const sys = { id, num: '99', icon: '⚙️', name, desc: '請填寫描述', tags: [] };
    GameData.meta = {...GameData.meta, systems: [...(GameData.meta.systems||[]), sys]};
    markDirty();
    if (state.currentView === 'dashboard') renderDashboard();
    else renderSystems();
    openEdit('systems', id);
    toast(`已新增系統：${name}`, 'success');
  }

  function deleteCurrentRecord() {
    if (!confirm('確定要刪除此筆資料嗎？')) return;
    const { type, id } = state.editTarget;
    if (type === 'orders') { GameData.orders = GameData.orders.filter(o => o._file !== id); }
    else if (type === 'events') { GameData.events = GameData.events.filter(e => e._file !== id); }
    else if (type === 'items') { GameData.items = GameData.items.filter(i => i._file !== id); }
    else if (type === 'emails') { GameData.emails = GameData.emails.filter(e => e.id !== id); }
    else if (type === 'news') { GameData.news = GameData.news.filter(n => n.id !== id); }
    else if (type === 'notes') { GameData.notes = GameData.notes.filter(n => n.id !== id); }
    else if (type === 'characters') { GameData.meta = {...GameData.meta, characters: GameData.meta.characters.filter(c => c.id !== id)}; }
    else if (type === 'systems') { GameData.meta = {...GameData.meta, systems: GameData.meta.systems.filter(s => s.id !== id)}; }
    else if (type === 'phases') { GameData.meta = {...GameData.meta, phases: GameData.meta.phases.filter(p => p.name !== id)}; }
    else if (type === 'world_timeline') { GameData.meta = {...GameData.meta, world_timeline: GameData.meta.world_timeline.filter(w => w.title !== id)}; }
    else if (type === 'story_timeline') { GameData.meta = {...GameData.meta, story_timeline: (GameData.meta.story_timeline||[]).filter(s => s.name !== id)}; }
    else if (type === 'endings') { GameData.meta = {...GameData.meta, endings: GameData.meta.endings.filter(e => e.id !== id)}; }
    toast('已刪除', 'success');
    state.editDirty = false;
    document.getElementById('edit-dirty').style.display = 'none';
    document.getElementById('edit-overlay').classList.add('hidden');
    saveToLocalStorage();
    renderCurrentView();
  }

  function newNote() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const title = prompt('筆記標題：');
    if (!title) return;
    const id = 'n' + Date.now();
    const note = { id, title, content: '', tags: [], updated: new Date().toISOString().split('T')[0] };
    GameData.notes = [...GameData.notes, note];
    renderNotes();
    openEdit('notes', id);
    markDirty();
  }

  // ── SETTINGS ──
  function openSettings() { switchView('settings'); }
  function loadSettings() {
    document.getElementById('setting-gh-token').value = state.githubToken;
    document.getElementById('toggle-autosave').checked = state.autosave;
    document.getElementById('toggle-show-ids').checked = state.showIds;
    renderFontSizeGrid();
  }
  function saveToken(v) { state.githubToken = v; localStorage.setItem('cors_gh_token', v); toast('Token 已儲存至 localStorage', 'success'); }
  function toggleAutosave(v) { state.autosave = v; localStorage.setItem('cors_autosave', v); toast('已' + (v?'啟用':'停用') + '自動儲存', 'info'); }
  function toggleShowIds(v) { state.showIds = v; localStorage.setItem('cors_show_ids', v); renderCurrentView(); }
  function resetLocal() { if (!confirm('確定要清除所有本地變更嗎？')) return; GameData.reset(); localStorage.removeItem('cors_local_data'); state.localModified = false; renderCurrentView(); toast('已重置', 'info'); }

  // ── Font Size ──
  const FONT_SIZES = [
    { label: '極小', value: '12px' },
    { label: '小', value: '13px' },
    { label: '標準', value: '14px' },
    { label: '大', value: '15px' },
    { label: '特大', value: '16px' },
    { label: '極大', value: '18px' },
  ];

  function renderFontSizeGrid() {
    const el = document.getElementById('font-size-grid');
    if (!el) return;
    const current = localStorage.getItem('cors_font_size') || '14px';
    el.innerHTML = FONT_SIZES.map(fs => `
      <button class="font-size-btn${fs.value === current ? ' active' : ''}" onclick="app.setFontSize('${fs.value}')">
        <span class="font-size-preview" style="font-size:${fs.value}">Aa</span>
        <span class="font-size-label">${fs.label}</span>
      </button>`).join('');
  }

  function setFontSize(val) {
    localStorage.setItem('cors_font_size', val);
    document.documentElement.style.fontSize = val;
    renderFontSizeGrid();
    toast('字體大小已變更為 ' + val, 'success');
  }

  // ── GitHub sync ──
  async function connectGithub() {
    const token = document.getElementById('setting-gh-token').value;
    if (!token) { toast('請輸入 GitHub Token', 'error'); return; }
    // saveToken() already wrote to localStorage via onchange handler
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
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = '準備推送...';
    const data = GameData.exportAll();
    const fileContents = {
      'content/orders.json': JSON.stringify(data.orders, null, 2),
      'content/events.json': JSON.stringify(data.events, null, 2),
      'content/items.json': JSON.stringify(data.items, null, 2),
      'content/emails.json': JSON.stringify(data.emails, null, 2),
      'content/news.json': JSON.stringify(data.news, null, 2),
      'content/notes.json': JSON.stringify(data.notes, null, 2),
      'content/meta.json': JSON.stringify(data.meta, null, 2),
      '.nojekyll': '',  // empty file ensures GitHub Pages doesn't run Jekyll
    };
    try {
      // Also push static frontend files so dev panel code changes go live too
      const staticFiles = ['index.html', 'app.js', 'styles.css', 'data.js'];
      for (const f of staticFiles) {
        try {
          const resp = await fetch(f);
          if (resp.ok) fileContents[f] = await resp.text();
        } catch(e) { /* skip if fetch fails */ }
      }
      statusEl.textContent = '建立 blob...';
      // Step 1: Create blobs for all files
      const blobs = {};
      for (const [path, content] of Object.entries(fileContents)) {
        const blob = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
          method: 'POST',
          headers: API.headers(state.githubToken),
          body: JSON.stringify({
            content,
            encoding: 'utf-8'
          })
        }).then(r => { if (!r.ok) throw new Error(`Blob creation failed: ${r.status}`); return r.json(); });
        blobs[path] = blob.sha;
      }
      statusEl.textContent = '建立 commit...';
      // Step 2: Get current HEAD
      const head = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, {
        headers: API.headers(state.githubToken)
      }).then(r => r.json());
      const parentSha = head.object.sha;
      const parentCommit = await fetch(`https://api.github.com/repos/${repo}/git/commits/${parentSha}`, {
        headers: API.headers(state.githubToken)
      }).then(r => r.json());
      // Step 3: Create new tree
      const treeItems = Object.entries(blobs).map(([path, sha]) => ({
        path,
        mode: '100644',
        type: 'blob',
        sha
      }));
      const newTree = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
        method: 'POST',
        headers: API.headers(state.githubToken),
        body: JSON.stringify({
          base_tree: parentCommit.tree.sha,
          tree: treeItems
        })
      }).then(r => { if (!r.ok) throw new Error(`Tree creation failed: ${r.status}`); return r.json(); });
      // Step 4: Create commit
      const newCommit = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
        method: 'POST',
        headers: API.headers(state.githubToken),
        body: JSON.stringify({
          message: `docs: sync all data files via CORS Dev Panel\n timestamp: ${new Date().toISOString()}`,
          tree: newTree.sha,
          parents: [parentSha]
        })
      }).then(r => { if (!r.ok) throw new Error(`Commit creation failed: ${r.status}`); return r.json(); });
      // Step 5: Update branch ref
      await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/main`, {
        method: 'PATCH',
        headers: API.headers(state.githubToken),
        body: JSON.stringify({ sha: newCommit.sha, force: false })
      }).then(r => { if (!r.ok) throw new Error(`Ref update failed: ${r.status}`); return r.json(); });
      statusEl.innerHTML = `<span style="color:var(--success)">✓ 已推送全部 ${Object.keys(fileContents).length} 個檔案（1 次 commit）</span>`;
      toast(`已推送 ${Object.keys(fileContents).length} 個檔案至 GitHub（1 次 commit）`, 'success');
    } catch(e) {
      console.error('Push error:', e);
      statusEl.innerHTML = `<span style="color:var(--danger)">⚠ 推送失敗：${e.message}</span>`;
      toast(`推送失敗：${e.message}`, 'error');
    }
  }

  // Utility: push a single file to GitHub via PUT /contents (used by data.js rebuild, disabled for now)
  async function pushSingleFile(repo, path, content, msg) {
    try {
      let sha;
      try {
        const existing = await API.getFile(path, repo);
        sha = existing.sha;
      } catch(e) { /* file doesn't exist yet, that's ok */ }
      await API.putFile(path, content, repo, sha, msg);
      return true;
    } catch(e) {
      console.warn(`pushSingleFile failed for ${path}:`, e.message);
      return false;
    }
  }

  // ── Google Sheets → JSON export ──
  const SHEET_ID = '1-7_G0op_RIcdFLczgUcXfoA-HwlFezUdr_Sey9klPuI';
  const SHEET_GIDS = [
    [181815012, '維修訂單'],
    [905775828, '中繼點設定'],
    [1267037659, '障礙物設定'],
    [1060073204, '派遣區域'],
    [952084614, '派遣節點'],
    [1020030094, '掉落物'],
    [1030852645, '道具'],
    [280025507, '天氣修正'],
    [2107340252, '新聞'],
    [1617225367, '郵件'],
    [1375268653, '時間事件'],
    [402598334, '角色狀態'],
  ];

  async function exportSheetJSON() {
    const statusEl = document.getElementById('db-export-status');
    if (!statusEl) return;
    statusEl.textContent = '正在讀取 Google Sheets 資料...';
    try {
      const allData = {};
      for (const [gid, name] of SHEET_GIDS) {
        statusEl.textContent = `正在讀取：${name}...`;
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const text = await resp.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.+)\)/);
        if (!match) continue;
        const raw = JSON.parse(match[1]);
        const rows = raw.table?.rows || [];
        const cols = raw.table?.cols || [];

        // col label format: "orderID string D1_00" → take first token as field name
        // col[0] is a row-note column ("欄位名稱 資料類型 參照") — rename it
        let fieldNames = cols.map((c, i) => {
          const label = c?.label || '';
          const parts = label.trim().split(/\s+/);
          if (i === 0) return '_rowNote'; // first col is metadata/notes
          return parts[0] || `col_${i}`;
        });

        // The rows from Visualization API already skip header rows
        const records = rows.map(row => {
          const cells = row.c || [];
          const rec = {};
          cells.forEach((cell, i) => {
            if (i < fieldNames.length && fieldNames[i]) {
              let val = cell?.v !== undefined ? cell.v : '';
              // Convert numeric strings
              if (typeof val === 'string' && /^[0-9]+(\.[0-9]+)?$/.test(val.trim())) {
                val = Number(val);
              }
              rec[fieldNames[i]] = val;
            }
          });
          // Remove the _rowNote field if empty
          if (rec._rowNote === '' || rec._rowNote === null || rec._rowNote === undefined) {
            delete rec._rowNote;
          }
          return rec;
        }).filter(r => {
          // Skip records where ALL fields are empty/null/undefined
          // (also skip if the primary ID field — the first non-_rowNote field — is empty)
          const entries = Object.entries(r);
          if (entries.length === 0) return false;
          const idField = fieldNames[1]; // B column
          const idVal = r[idField];
          // If the ID field itself is empty, skip
          if (idVal === '' || idVal === null || idVal === undefined) return false;
          // Also skip if every single value is empty/null/undefined/false/0
          const allEmpty = entries.every(([k, v]) =>
            v === '' || v === null || v === undefined || v === false || v === 0
          );
          return !allEmpty;
        });
        allData[name] = records;
      }
      statusEl.textContent = `✓ 已讀取 ${Object.keys(allData).length} 張表，準備下載...`;

      // Trigger download
      const jsonStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cors_sheets_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      statusEl.textContent = `✓ 已匯出 ${Object.keys(allData).length} 張表（${(jsonStr.length/1024).toFixed(0)} KB）`;
      toast(`已匯出 ${Object.keys(allData).length} 張 sheet 為 JSON`, 'success');
    } catch (e) {
      console.error('Sheet export error:', e);
      statusEl.textContent = `⚠ 匯出失敗：${e.message}`;
      toast(`匯出失敗：${e.message}`, 'error');
    }
  }

  async function loadFromGithubSilent() {
    // Same as loadFromGithub but without toast/status — used for auto-pull on init
    const repo = document.getElementById('setting-repo')?.value || 'straydog3301/cors_side';
    const files = ['orders','events','items','emails','news','notes','meta'];
    let loaded = 0;
    for (const name of files) {
      try {
        const file = await fetch(`https://api.github.com/repos/${repo}/contents/content/${name}.json`, { headers: API.headers(state.githubToken) });
        if (!file.ok) continue;
        const json = await file.json();
        const content = base64Utf8Decode(json.content);
        const data = JSON.parse(content);
        GameData[name === 'meta' ? 'meta' : name] = data;
        loaded++;
      } catch(e) { /* skip */ }
    }
    if (loaded > 0) {
      saveToLocalStorage();
      renderCurrentView();
    }
  }

  function base64Utf8Decode(b64) {
    // atob is not safe for UTF-8 Chinese characters.
    const binStr = atob(b64.replace(/\n/g, ''));
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
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
        const content = base64Utf8Decode(file.content);
        const data = JSON.parse(content);
        GameData[name === 'meta' ? 'meta' : name] = data;
        loaded++;
      } catch(e) {
        console.warn(`Load failed for ${name}:`, e);
      }
    }
    statusEl.innerHTML = `<span style="color:var(--success)">✓ 已拉取 ${loaded}/${files.length} 個檔案</span>`;
    saveToLocalStorage();
    renderCurrentView();
    toast(`已從 GitHub 拉取 ${loaded} 個檔案`, 'success');
  }

  // ── localStorage ──
  function saveToLocalStorage() {
    localStorage.setItem('cors_local_data', JSON.stringify(GameData.exportAll()));
    state.localModified = true;
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
    // loadFromLocalStorage() removed — always load fresh from data.js or GitHub pull
    // localStorage now manual-only via "從本機恢復" in Settings page
    // Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Restore font size
    const savedFontSize = localStorage.getItem('cors_font_size');
    if (savedFontSize) document.documentElement.style.fontSize = savedFontSize;

    // Try reconnect GitHub if token saved
    if (state.githubToken) {
      fetch('https://api.github.com/user', { headers: API.headers(state.githubToken) })
        .then(r => r.ok ? r.json() : null)
        .then(user => {
          if (user) {
            document.getElementById('user-avatar').textContent = user.login.substring(0,2).toUpperCase();
            document.getElementById('user-name').textContent = user.login;
            document.getElementById('user-status').textContent = 'GitHub 已連接';
            // Auto-pull latest content from GitHub after connecting
            loadFromGithubSilent();
          }
        }).catch(() => {});
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !document.getElementById('edit-overlay').classList.contains('hidden')) {
        editCancel();
      }
    });

    renderCurrentView();
    // Restore local edits from localStorage after initial render
    loadFromLocalStorage();
  }

  // Expose API
  window.app = {
    switchView, renderCurrentView,
    toggleEdit, openEdit, editCancel, editSave, markDirty,
    showJsonEditor, showBlockEditor, addField, addRecord, deleteBlock,
    newNote, addWorldEvent, addStoryTimeline, editStatKey, addStat, deleteStatKey, addPhase, addSystem, deleteCurrentRecord, filterBacklog, openSettings,
    renderFontSizeGrid, setFontSize,
    saveToken, toggleAutosave, toggleShowIds, resetLocal,
    connectGithub, pushToGithub, loadFromGithub,
    saveAll, saveToLocalStorage,
    exportSheetJSON
  };

  document.addEventListener('DOMContentLoaded', init);
})();