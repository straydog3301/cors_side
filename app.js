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
    githubUser: null,        // GitHub username of the current user
    editPassword: localStorage.getItem('cors_edit_password') || '',
    autosave: localStorage.getItem('cors_autosave') !== 'false',
    showIds: localStorage.getItem('cors_show_ids') === 'true',
    localModified: false,
    backlogTab: 'orders',
    backlogFilter: '',
    worldFilter: '',       // world view search filter
    githubHasNewContent: false,
    githubDirty: false,    // local edits not yet pushed
    lastSyncSha: null,     // SHA we last successfully pushed (or initial load)
    lastSeenSha: null,     // Latest SHA we've learned about
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
    // Toggle CRT scanlines overlay — off for database view (conflicts with white iframe)
    document.body.classList.toggle('scanlines', name !== 'database');
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
      const addBtn = edit ? `<div style="text-align:right;margin-bottom:8px"><button class="btn-sm btn-primary" onclick="app.addPhase()">+ 新增階段</button></div>` : '';
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
      const addBtn = edit ? `<button class="btn-sm btn-primary" onclick="app.addSystem()" style="float:right">+ 新增</button>` : '';
      sysEl.innerHTML = (addBtn ? `<div style="text-align:right;margin-bottom:4px">${addBtn}</div>` : '') + systems.map(s => `
        <div class="system-item" ${edit ? `onclick="app.openEdit('systems','${s.id}')" style="cursor:pointer"` : ''}>
          <span class="system-label"><span class="system-icon">${s.icon}</span><span class="system-name">${s.name}</span></span>
          <span class="system-desc">${s.desc}</span>
        </div>`).join('');
    }

    // Story Timeline (with progress bars)
    const tlEl = document.getElementById('story-timeline');
    if (tlEl) {
      const stl = meta.story_timeline || [];
      const tagLabels = { common: '共通', xavier: '澤維爾', lycaon: '萊卡翁', secret: '隱藏' };
      const addBtn = edit ? `<div style="text-align:right;margin-bottom:8px"><button class="btn-sm btn-primary" onclick="app.addStoryTimeline()">+ 新增</button></div>` : '';
      tlEl.innerHTML = addBtn + `<div class="tl-track">${stl.length > 0 ? stl.map(p => `
        <div class="tl-node" ${edit ? `onclick="app.openEdit('story_timeline','${p.name.replace(/'/g,"\\'")}')" style="cursor:pointer"` : ''}>
          <div class="tl-dot ${progressColor(p.progress)}"></div>
          <div class="tl-content">
            <div class="tl-days">${p.days}</div>
            <div class="tl-name">${p.name}</div>
            ${p.progress !== undefined ? `<div class="dash-tl-progress"><div class="dash-tl-progress-fill ${progressColor(p.progress)}" style="width:${p.progress}%"></div></div><span class="dash-tl-progress-label">${p.progress}%</span>` : ''}
            <span class="tl-route-tag tl-tag-${p.tag}">${tagLabels[p.tag]||p.tag}路線</span>
          </div>
        </div>`).join('') : '<div style="padding:20px;text-align:center;color:var(--dos-gray);font-size:0.75rem">暫無故事時間線資料</div>'}</div>`;
    }

    // Character Routes
    const crEl = document.getElementById('char-routes');
    if (crEl) {
      const chars = meta.characters || [];
      crEl.innerHTML = chars.map(c => `
        <div class="char-route-card" ${edit ? `onclick="app.openEdit('characters','${c.id}')" style="cursor:pointer"` : ''}>
          <div class="char-route-avatar" style="border-color:${c.color||'#33ff33'}">${c.icon || (c.id==='xavier'?'⚖':c.id==='lycaon'?'🐺':'👤')}</div>
          <div class="char-route-info">
            <div class="char-route-name">${c.name_zh} · ${c.name_en}</div>
            <div class="char-route-role">${c.role}</div>
            <div class="char-route-tags" style="color:${c.color||'var(--dos-gray)'}">${(c.tags||[]).map(t => `<span class="char-tag" style="border-color:${c.color||'var(--dos-border)'};color:${c.color||'var(--dos-gray)'}">${t}</span>`).join('')}</div>
          </div>
        </div>`).join('');
    }

    // World Cards (with progress bars)
    const wcEl = document.getElementById('world-cards');
    if (wcEl) {
      const wt = meta.world_timeline||[];
      const addBtn = edit ? `<div style="text-align:right;margin-bottom:8px"><button class="btn-sm btn-primary" onclick="app.addWorldEvent()">+ 新增</button></div>` : '';
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
    infoEl.innerHTML = `<span style="font-size:0.75rem;color:var(--dos-gray)">共 ${countMap[state.backlogTab]||items.length} 筆</span>${addBtn}`;
    if (items.length === 0) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--dos-gray);font-family:var(--font-mono)">暫無資料${state.backlogFilter ? '（無符合搜尋結果）' : ''}</div>`;
      return;
    }
    container.innerHTML = items.map((item, idx) => {
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
      const itemId = item[_k] || item._file || item.id;
      const editBtn = state.isEditMode
        ? `<button class="bk-edit-btn" onclick="app.openEdit('${state.backlogTab}','${itemId}')">✎ 編輯</button>`
        : '';
      const dragHandle = state.isEditMode
        ? `<span class="drag-handle" draggable="true" ondragstart="app.dragStart(event,${idx})" ondragend="app.dragEnd(event,this)" title="拖曳移動">☰</span>`
        : '';
      const dragHandlers = state.isEditMode
        ? `ondragover="app.dragOver(event)" ondragleave="app.dragLeave(event)" ondrop="app.drop(event,${idx})"`
        : '';
      return `
        <div class="backlog-item" data-drag-idx="${idx}" ${dragHandlers}>
          ${dragHandle}
          <span class="bk-id">${state.showIds ? id : id.substring(0,12)}</span>
          <span class="bk-title">${name}</span>
          ${meta ? `<span class="bk-meta">${meta}</span>` : ''}
          <span class="bk-tag">${type}</span>
          ${editBtn}
        </div>`;
    }).join('');
  }

  function filterBacklog(q) {
    state.backlogFilter = q;
    renderBacklog();
  }

  function filterWorld(q) {
    state.worldFilter = q;
    renderWorld();
  }

  // ── RENDER: Characters ──
  function renderCharacters() {
    const chars = GameData.meta.characters;
    const el = document.getElementById('chars-layout');
    const editHeader = state.isEditMode ? `<div style="text-align:right;margin-bottom:12px"><button class="btn-sm btn-primary" onclick="app.addCharacter()">+ 新增角色</button></div>` : '';

    const charCard = (c, idx) => {
      const dragHandle = state.isEditMode
        ? `<span class="drag-handle" draggable="true" ondragstart="app.charDragStart(event,${idx})" ondragend="app.charDragEnd(event)" title="拖曳調整順序" style="margin-right:8px;align-self:flex-start;padding-top:4px">☰</span>`
        : '';
      const dragHandlers = state.isEditMode
        ? `ondragover="app.charDragOver(event)" ondragleave="app.charDragLeave(event)" ondrop="app.charDrop(event,${idx})"`
        : '';
      return `
      <div class="char-page-card" ${dragHandlers}>
        ${dragHandle}
        <div style="flex:1;min-width:0">
          <div class="char-page-header">
            <div class="char-avatar ${c.id}" style="border-color:${c.color||'var(--dos-green)'}">${c.icon || (c.id === 'xavier' ? '⚖️' : c.id === 'lycaon' ? '🐺' : '👤')}</div>
            <div>
              <div>
                <span class="char-page-name-zh">${c.name_zh}</span>
                <span class="char-page-name-en" style="color:${c.color||'var(--dos-green)'}">${c.name_en} / ${c.route}</span>
              </div>
              <div class="char-page-role">${c.role}</div>
            </div>
            ${state.isEditMode ? `<button class="btn-sm btn-outline" style="margin-left:auto" onclick="app.openEdit('characters','${c.id}')">編輯</button>` : ''}
          </div>
          <div class="char-page-body">
            <p class="char-page-desc">${c.description}</p>
            <div class="char-tags">${c.tags.map(t => `<span class="char-tag" style="border-color:${c.color||'var(--dos-border)'};color:${c.color||'var(--dos-gray)'}">${t}</span>`).join('')}</div>
          </div>
        </div>
      </div>`;
    };

    el.innerHTML = editHeader + chars.map((c, i) => charCard(c, i)).join('');
  }

// ── RENDER: World ──
  function renderWorld() {
    const tl = GameData.meta.world_timeline;
    const stl = GameData.meta.story_timeline;
    const endings = GameData.meta.endings;
    const filterQ = (state.worldFilter || '').toLowerCase();

    const matches = (item) => {
      if (!filterQ) return true;
      return JSON.stringify(item).toLowerCase().includes(filterQ);
    };

    const dragHandleHtml = (section, origIdx) => state.isEditMode
      ? `<span class="drag-handle" draggable="true" ondragstart="app.reorderDragStart(event,'${section}',${origIdx})" ondragend="app.reorderDragEnd(event)" title="拖曳調整順序" style="position:absolute;left:-28px;top:2px;z-index:10;color:var(--dos-dim);cursor:grab;font-size:0.7rem;line-height:1">☰</span>`
      : '';
    const dragHandlers = (section, origIdx) => state.isEditMode
      ? `ondragover="app.reorderDragOver(event)" ondragleave="app.reorderDragLeave(event)" ondrop="app.reorderDrop(event,${origIdx})"`
      : '';

    // Preserve original array index even when filtered (data-idx for drag-drop)
    const filteredTl = tl.map((item, i) => ({ item, origIdx: i })).filter(({ item }) => matches(item));
    const filteredStl = (stl||[]).map((item, i) => ({ item, origIdx: i })).filter(({ item }) => matches(item));

    const editBtn = state.isEditMode ? `<div style="text-align:right;margin-bottom:12px"><button class="btn-sm btn-primary" onclick="app.addWorldEvent()">+ 新增時間點</button></div>` : '';
    const filterHtml = `<div style="margin-bottom:16px"><input type="text" id="world-filter-input" placeholder="🔍 搜尋時間線、結局..." value="${state.worldFilter||''}" oninput="app.filterWorld(this.value)" style="width:100%;padding:8px 12px;background:var(--dos-black);border:1px solid var(--dos-border);color:var(--dos-white);font-family:var(--font-mono);font-size:0.75rem"></div>`;

    let html = filterHtml;

    // World Timeline
    html += `<h4 style="font-family:var(--font-title);font-size:0.85rem;color:var(--dos-white);letter-spacing:2px;margin-bottom:16px;">世界觀時間線</h4>` +
      editBtn + filteredTl.map(({ item, origIdx }) => `
      <div class="tl-item ${progressColor(item.progress)}" ${dragHandlers('world_timeline', origIdx)} ${state.isEditMode ? `onclick="app.openEdit('world_timeline','${item.title}')" style="cursor:pointer"` : ``}>
        ${dragHandleHtml('world_timeline', origIdx)}
        <div class="tl-marker ${progressColor(item.progress)}"></div>
        <div class="tl-year">${item.year}</div>
        <div class="tl-title">${item.title}</div>
        <div class="tl-desc">${item.desc}</div>
        ${item.progress !== undefined ? `<div class="tl-progress-bar"><div class="tl-progress-fill ${progressColor(item.progress)}" style="width:${item.progress}%"></div></div><span class="tl-progress-label">${item.progress}%</span>` : ''}
      </div>`).join('');

    // Story Timeline
    const storyEditBtn = state.isEditMode ? `<div style="text-align:right;margin-bottom:12px"><button class="btn-sm btn-primary" onclick="app.addStoryTimeline()">+ 新增故事階段</button></div>` : '';
    const tagLabels = { common: '共通', xavier: '澤維爾', lycaon: '萊卡翁', secret: '隱藏' };
    html += `<h4 style="margin-top:32px;font-family:var(--font-title);font-size:0.85rem;color:var(--dos-white);letter-spacing:2px;margin-bottom:16px;">故事時間線</h4>` +
      storyEditBtn + filteredStl.map(({ item, origIdx }) => `
      <div class="tl-item ${progressColor(item.progress)}" ${dragHandlers('story_timeline', origIdx)} ${state.isEditMode ? `onclick="app.openEdit('story_timeline','${item.name}')" style="cursor:pointer"` : ``}>
        ${dragHandleHtml('story_timeline', origIdx)}
        <div class="tl-marker ${progressColor(item.progress)}"></div>
        <div class="tl-year">${item.days}</div>
        <div class="tl-title">${item.name}</div>
        <div class="tl-desc">${item.desc}</div>
        ${item.progress !== undefined ? `<div class="tl-progress-bar"><div class="tl-progress-fill ${progressColor(item.progress)}" style="width:${item.progress}%"></div></div><span class="tl-progress-label">${item.progress}%</span>` : ''}
        <span class="tl-route-tag tl-tag-${item.tag}" style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:0.65rem;margin-top:4px">${tagLabels[item.tag]||item.tag}路線</span>
      </div>`).join('');

    // Endings (grid — no drag, no edit onclick)
    const routeLabels = { common: '共通', xavier: '澤維爾', lycaon: '萊卡翁', secret: '隱藏' };
    const routeColors = { common: 'cyan', xavier: 'gold', lycaon: 'magenta', secret: 'cyan' };
    const routeIcon = (r) => r === 'xavier' ? '⚖' : r === 'lycaon' ? '🐺' : r === 'secret' ? '🌀' : '📖';
    const endingAddBtn = state.isEditMode ? `<div style="text-align:right;margin-bottom:8px"><button class="btn-sm btn-primary" onclick="app.addEnding()">+ 新增結局</button></div>` : '';
    const filteredEndings = endings.filter(matches);
    html += endingAddBtn + `<h4 style="margin-top:32px;font-family:var(--font-title);font-size:0.85rem;color:var(--dos-white);letter-spacing:2px;margin-bottom:16px;">結局分支（共 ${filteredEndings.length} 條）</h4>
      <div class="endings-grid">` + filteredEndings.map((e) => `
        <div class="ending-card ending-${routeColors[e.route]} ${progressColor(e.progress)}" ${state.isEditMode ? `onclick="app.openEdit('endings','${e.id}')" style="cursor:pointer"` : ``}>
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
    const addBtn = state.isEditMode ? `<div class="sys-add-btn"><button class="btn-sm btn-primary" onclick="app.addSystem()">+ 新增系統</button></div>` : '';
    const sysRow = (s, idx) => {
      const dragHandle = state.isEditMode
        ? `<span class="drag-handle" draggable="true" ondragstart="app.reorderDragStart(event,'systems',${idx})" ondragend="app.reorderDragEnd(event)" title="拖曳調整順序" style="margin-right:8px;align-self:flex-start;padding-top:2px;flex-shrink:0">☰</span>`
        : '';
      const dragHandlers = state.isEditMode
        ? `ondragover="app.reorderDragOver(event)" ondragleave="app.reorderDragLeave(event)" ondrop="app.reorderDrop(event,${idx})"`
        : '';
      return `
      <div class="sys-row" ${dragHandlers}>
        ${dragHandle}
        <div class="sys-icon">${s.icon}</div>
        <div class="sys-main">
          <div class="sys-meta">
            <span class="sys-num">${s.num}</span>
            <span class="sys-name">${s.name}</span>
          </div>
          <div class="sys-desc">${s.desc}</div>
          <div class="sys-tags">${s.tags.map(t => `<span class="sys-tag">${t}</span>`).join('')}</div>
        </div>
        ${state.isEditMode ? `<div class="card-edit-bar">
          <button class="btn-sm" onclick="app.openEdit('systems','${s.id}')">✎ 編輯</button>
        </div>` : ''}
      </div>`;
    };
    document.getElementById('systems-grid').innerHTML = addBtn + sys.map((s, i) => sysRow(s, i)).join('');
  }

// ── Inline Markdown Renderer (lightweight, no deps) ──
  // Strip markdown syntax for preview text
  function stripMd(text) {
    return text
      .replace(/^#{1,6}\s+/gm, '')     // headers
      .replace(/^---+$/gm, '')          // hr
      .replace(/\*\*(.+?)\*\*/g, '$1')  // bold
      .replace(/__(.+?)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')      // inline code
      .replace(/^- /gm, '')             // list markers
      .replace(/\n{2,}/g, ' · ')        // paragraph breaks → middle dot
      .replace(/\n/g, ' ');             // single newline → space
  }

  function renderMd(text) {
    // Escape HTML first
    let h = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Headers: #### → <h4>, ### → <h3>, ## → <h2>, # → <h1>
    h = h.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    h = h.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    h = h.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    h = h.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // Horizontal rule
    h = h.replace(/^---+$/gm, '<hr>');
    // Bold: **text** or __text__
    h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Inline code: `code`
    h = h.replace(/`([^`]+)`/g, '<code>$1</code>');
    // List items: - text (2-space indent = nested)
    h = h.replace(/^  - (.+)$/gm, '<li class="md-li-nested">$1</li>');
    h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive <li> in <ul>
    h = h.replace(/((?:<li[^>]*>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');
    // Paragraph breaks
    h = h.replace(/\n\n+/g, '</p><p>');
    h = h.replace(/\n/g, '<br>');
    // Wrap in <p> if not already wrapped
    if (!h.startsWith('<h') && !h.startsWith('<hr') && !h.startsWith('<ul') && !h.startsWith('<p>')) {
      h = '<p>' + h + '</p>';
    }
    return h;
  }

// ── Doc cache for fetched .md files ──
  var _docCache = {};

  // ── Fetch doc content by path ──
  function getDocContent(docPath, callback) {
    if (_docCache[docPath]) {
      callback(_docCache[docPath]);
      return;
    }
    fetch(docPath)
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function(text) {
        _docCache[docPath] = text;
        callback(text);
      })
      .catch(function(err) {
        callback('# ❌ 載入錯誤\n無法讀取文檔：' + err.message);
      });
  }

  // ── RENDER: Notes (collapsible & docPath support) ──
  function renderNotes() {
    const notes = GameData.notes;
    const noteCard = (n, idx) => {
      const dragHandle = state.isEditMode
? '<span class="drag-handle" draggable="true" ondragstart="app.reorderDragStart(event,\'notes\',' + idx + ')" ondragend="app.reorderDragEnd(event)" title="拖曳調整順序" style="margin-right:8px;align-self:flex-start;padding-top:2px;flex-shrink:0">☰</span>'
        : '';
      const dragHandlers = state.isEditMode
        ? 'ondragover="app.reorderDragOver(event)" ondragleave="app.reorderDragLeave(event)" ondrop="app.reorderDrop(event,' + idx + ')"'
        : '';

      const hasDocPath = !!n.docPath;
      const hasContent = !!n.content;
      const isLong = hasContent && n.content.length > 300;
      const noteId = 'note-body-' + n.id;

// Determine expand logic
      var expandAttr = '';
      var expandIcon = '';
      var preview = '';
      var expandedBody = '';
      var isExpandable = false;

      if (hasDocPath) {
        // Remote doc — always expandable, initial preview loaded async
        isExpandable = true;
        expandAttr = ''; // click handled by card-level listener
        expandIcon = '<span class="note-expand-icon" id="note-icon-' + n.id + '">▸</span>';
        preview = '📄 點擊載入文檔內容…';
        // Body is empty initially; we'll lazy-load on expand
        expandedBody = '<div class="note-body" id="' + noteId + '" style="display:none"></div>';
      } else if (isLong) {
        // Inline content, long
        isExpandable = true;
        expandAttr = ''; // click handled by card-level listener
        expandIcon = '<span class="note-expand-icon" id="note-icon-' + n.id + '">▸</span>';
        preview = stripMd(n.content).slice(0, 180) + '…';
        expandedBody = '<div class="note-body" id="' + noteId + '" style="display:none">' + renderMd(n.content) + '</div>';
      } else {
        // Short inline content — no expand
        preview = n.content || '';
      }

const expandClickAttr = isExpandable ? ' data-note-id="' + n.id + '" style="cursor:pointer"' : '';
      const expandClass = isExpandable ? ' note-card-expandable' : '';

      return '<div class="note-card' + expandClass + '" ' + dragHandlers + expandClickAttr + '>'
        + dragHandle
        + '<div style="flex:1;min-width:0">'
        + '<div class="note-title">' + n.title + expandIcon + '</div>'
        + '<div class="note-content">' + preview + '</div>'
        + '<div class="note-footer">'
        + n.tags.map(function(t) { return '<span class="note-tag">' + t + '</span>'; }).join('')
        + '<span class="note-date">' + n.updated + '</span>'
        + (state.isEditMode ? '<div class="card-edit-bar"><button class="btn-sm" onclick="app.openEdit(\'notes\',\'' + n.id + '\')">✎ 編輯</button></div>' : '')
        + '</div>'
        + expandedBody
        + '</div></div>';
    };
    document.getElementById('notes-list').innerHTML = notes.map(function(n, i) { return noteCard(n, i); }).join('');
    // Show/hide "新增筆記" button based on edit mode
    var btnNewNote = document.getElementById('btn-new-note');
    if (btnNewNote) btnNewNote.style.display = state.isEditMode ? '' : 'none';
    // Card-level click delegation for expand/collapse — covers entire card area
    // but not .card-edit-bar (edit button), drag handle, or tags
    var notesList = document.getElementById('notes-list');
    if (notesList._expandBound) return; // avoid double binding on re-render
    notesList.addEventListener('click', function(e) {
      var card = e.target.closest('.note-card[data-note-id]');
      if (!card) return;
      // Ignore clicks inside card-edit-bar, drag-handle, or the edit/delete buttons
      if (e.target.closest('.card-edit-bar, .drag-handle, .note-tag, button')) return;
      // Also ignore clicks on the note-body toggle icon
      if (e.target.closest('.note-body')) return;
      app.toggleNoteExpanded(card.dataset.noteId);
    });
    notesList._expandBound = true;
  }

  // ── Toggle note expand/collapse ──
  function toggleNoteExpanded(id) {
    var note = GameData.notes.find(function(n) { return n.id === id; });
    var body = document.getElementById('note-body-' + id);
    var icon = document.getElementById('note-icon-' + id);
    if (!body) return;
    var isHidden = body.style.display === 'none';
    if (!isHidden) {
      // Collapse
      body.style.display = 'none';
      if (icon) icon.textContent = '▸';
      var card = body.closest('.note-card');
      if (card) card.classList.remove('note-expanded');
      return;
    }
    // Expand
    if (note && note.docPath && !body.dataset.loaded) {
      // Lazy-load doc content
      body.innerHTML = '<div style="text-align:center;padding:20px;color:var(--dos-gray)">⏳ 載入中…</div>';
      body.style.display = 'block';
      if (icon) icon.textContent = '▾';
      var card2 = body.closest('.note-card');
      if (card2) card2.classList.add('note-expanded');
      getDocContent(note.docPath, function(md) {
        body.innerHTML = renderMd(md);
        body.dataset.loaded = '1';
      });
    } else {
      body.style.display = 'block';
      if (icon) icon.textContent = '▾';
      var card3 = body.closest('.note-card');
      if (card3) card3.classList.add('note-expanded');
    }
  }

  // ── Drag & Drop Reorder (edit mode) ──
  let _dragSrcIdx = null;
  let _dragTab = null;  // current backlog tab being dragged

  // ── CHARACTER DRAG & DROP ──
  let _charDragSrc = null;

  function charDragStart(e, idx) {
    if (!state.isEditMode) return;
    _charDragSrc = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
    const card = e.target.closest('.char-page-card');
    if (card) card.style.opacity = '0.4';
  }

  function charDragOver(e) {
    if (!state.isEditMode || _charDragSrc === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest ? e.target.closest('.char-page-card') : e.target;
    if (card) card.classList.add('char-drag-over');
  }

  function charDragLeave(e) {
    const card = e.target.closest ? e.target.closest('.char-page-card') : e.target;
    if (card) card.classList.remove('char-drag-over');
  }

  function charDrop(e, targetIdx) {
    if (!state.isEditMode || _charDragSrc === null || _charDragSrc === targetIdx) return;
    e.preventDefault();
    const card = e.target.closest ? e.target.closest('.char-page-card') : e.target;
    if (card) card.classList.remove('char-drag-over');
    const chars = GameData.meta.characters;
    const [moved] = chars.splice(_charDragSrc, 1);
    chars.splice(targetIdx, 0, moved);
    // Immutable update to trigger reactivity
    GameData.meta = { ...GameData.meta, characters: [...chars] };
    markDirty();
    saveToLocalStorage();
    renderCharacters();
    toast('角色順序已調整', 'success');
  }

  function charDragEnd(e) {
    document.querySelectorAll('.char-page-card.char-drag-over').forEach(el => el.classList.remove('char-drag-over'));
    document.querySelectorAll('.char-page-card[style*="opacity"]').forEach(el => el.style.opacity = '');
    _charDragSrc = null;
  }

  // ── GENERIC LIST DRAG & DROP (systems / world_timeline / story_timeline / notes) ──
  // Works with filtered lists: idx refers to the item's ORIGINAL position in GameData array
  let _reorderSection = null;
  let _reorderSrcIdx = null;

  function reorderGetArr(section) {
    const map = {
      systems:        () => GameData.meta.systems,
      world_timeline: () => GameData.meta.world_timeline,
      story_timeline: () => GameData.meta.story_timeline,
      notes:          () => GameData.notes,
    };
    return map[section] ? map[section]() : null;
  }

  function reorderRender(section) {
    if (section === 'world_timeline' || section === 'story_timeline') renderWorld();
    else if (section === 'systems') renderSystems();
    else if (section === 'notes') renderNotes();
  }

  function reorderDragStart(e, section, idx) {
    if (!state.isEditMode) return;
    _reorderSection = section;
    _reorderSrcIdx = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
  }

  function reorderDragOver(e) {
    if (!state.isEditMode || _reorderSection === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const el = e.target.closest ? e.target.closest('.sys-row, .tl-item, .note-card') : e.target;
    if (el) el.classList.add('drag-target');
  }

  function reorderDragLeave(e) {
    const el = e.target.closest ? e.target.closest('.sys-row, .tl-item, .note-card') : e.target;
    if (el) el.classList.remove('drag-target');
  }

  function reorderDrop(e, targetIdx) {
    if (!state.isEditMode || _reorderSection === null || _reorderSrcIdx === null || _reorderSrcIdx === targetIdx) return;
    e.preventDefault();
    const el = e.target.closest ? e.target.closest('.sys-row, .tl-item, .note-card') : e.target;
    if (el) el.classList.remove('drag-target');
    const arr = reorderGetArr(_reorderSection);
    if (!arr) return;
    const [moved] = arr.splice(_reorderSrcIdx, 1);
    arr.splice(targetIdx, 0, moved);
    // Persist
    if (_reorderSection === 'systems') {
      GameData.meta = { ...GameData.meta, systems: [...arr] };
    } else if (_reorderSection === 'world_timeline') {
      GameData.meta = { ...GameData.meta, world_timeline: [...arr] };
    } else if (_reorderSection === 'story_timeline') {
      GameData.meta = { ...GameData.meta, story_timeline: [...arr] };
    }
    markDirty();
    saveToLocalStorage();
    reorderRender(_reorderSection);
    toast('順序已調整', 'success');
  }

  function reorderDragEnd(e) {
    document.querySelectorAll('.drag-target').forEach(el => el.classList.remove('drag-target'));
    _reorderSection = null;
    _reorderSrcIdx = null;
  }

  function dragStart(e, idx) {
    if (!state.isEditMode) return;
    _dragSrcIdx = idx;
    _dragTab = state.backlogTab;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx);
    // Dim the dragged item (navigate up if event from inner handle)
    const item = e.target.closest ? e.target.closest('.backlog-item') : e.target;
    if (item) item.style.opacity = '0.4';
  }

  function dragOver(e) {
    if (!state.isEditMode) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest ? e.target.closest('.backlog-item') : e.target;
    if (item) item.classList.add('drag-over');
  }

  function dragLeave(e) {
    const item = e.target.closest ? e.target.closest('.backlog-item') : e.target;
    if (item) item.classList.remove('drag-over');
  }

  function drop(e, targetIdx) {
    if (!state.isEditMode || _dragSrcIdx === null || _dragSrcIdx === targetIdx) return;
    e.preventDefault();
    const item = e.target.closest ? e.target.closest('.backlog-item') : e.target;
    if (item) item.classList.remove('drag-over');
    const tab = state.backlogTab || _dragTab;
    // Get the correct array
    let arr;
    if (tab === 'orders') arr = GameData.orders;
    else if (tab === 'events') arr = GameData.events;
    else if (tab === 'items') arr = GameData.items;
    else if (tab === 'emails') arr = GameData.emails;
    else if (tab === 'news') arr = GameData.news;
    else return;
    // Move item from src to target
    const [moved] = arr.splice(_dragSrcIdx, 1);
    arr.splice(targetIdx, 0, moved);
    // Re-assign back to GameData
    if (tab === 'orders') GameData.orders = arr;
    else if (tab === 'events') GameData.events = arr;
    else if (tab === 'items') GameData.items = arr;
    else if (tab === 'emails') GameData.emails = arr;
    else if (tab === 'news') GameData.news = arr;
    markDirty();
    renderBacklog();
    toast('已移動項目', 'info');
  }

  function dragEnd(e) {
    document.querySelectorAll('.backlog-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    document.querySelectorAll('.backlog-item[style*="opacity"]').forEach(el => el.style.opacity = '');
    _dragSrcIdx = null;
    _dragTab = null;
  }

  // ── EDIT MODE ──
  function toggleEdit() {
    state.isEditMode = !state.isEditMode;
    const icon = document.getElementById('edit-btn-icon');
    icon.textContent = state.isEditMode ? '✅' : '✏️';
    document.body.classList.toggle('edit-mode', state.isEditMode);
    renderCurrentView();
    toast(state.isEditMode ? '✅ 已進入編輯模式（本機編輯，需按💾儲存）' : '已退出編輯模式', 'info');
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
      const isObj = v !== null && typeof v === 'object' && !Array.isArray(v);
      if (isObj) {
        return `
        <div class="block-row" style="flex-direction:column;align-items:stretch">
          <input class="block-type-select" value="${k}" readonly style="width:120px" title="巢狀物件">
          <div style="padding:8px 12px;background:var(--dos-dark);border:1px solid var(--dos-border);font-family:var(--font-mono);font-size:0.7rem;color:var(--dos-gray);display:flex;align-items:center;justify-content:space-between">
            <span>📦 巢狀物件 — 請用 JSON 模式編輯</span>
            <button class="btn-sm" onclick="app.showJsonEditor()">{} 開啟 JSON</button>
          </div>
        </div>`;
      }
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

  function markDirty() {
    state.editDirty = true;
    document.getElementById('edit-dirty').style.display = '';
    // Track local edit timestamp so we know if user has unsynced changes
    localStorage.setItem('cors-edit-ts', String(Date.now()));
    state.githubDirty = true;
  }

  function showJsonEditor() {
    const body = document.getElementById('edit-body');
    body.innerHTML = `
      <div class="block-editor" style="max-width:100%">
        <div style="margin-bottom:12px;font-family:var(--font-mono);font-size:0.7rem;color:var(--dos-gray)">JSON 模式 — 直接編輯原始資料</div>
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

  function addCharacter() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const newId = 'char_' + Date.now();
    const char = { id: newId, name_zh: '新角色', name_en: 'New Character', route: 'COMMON_ROUTE', icon: '👤', color: '#33ff33', role: '請填寫角色定位', description: '請填寫角色描述', tags: ['標籤1'] };
    GameData.meta = {...GameData.meta, characters: [...(GameData.meta.characters||[]), char]};
    markDirty();
    renderCharacters();
    openEdit('characters', newId);
    toast('已新增角色，請填寫詳細資料', 'success');
  }

  function addWorldEvent() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const newId = 'we_' + Date.now();
    const event = { year: '2088', title: newId, desc: '請填寫描述', progress: 0, branch: 'common' };
    GameData.meta = {...GameData.meta, world_timeline: [...GameData.meta.world_timeline, event]};
    markDirty();
    renderWorld();
    openEdit('world_timeline', newId);
    toast('已新增世界觀時間點，請填寫詳細資料', 'success');
  }

  function addStoryTimeline() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const newId = 'st_' + Date.now();
    const item = { days: 'Day ?', name: newId, desc: '請填寫描述', tag: 'common', progress: 0 };
    const arr = GameData.meta.story_timeline || [];
    GameData.meta = {...GameData.meta, story_timeline: [...arr, item]};
    markDirty();
    renderWorld();
    openEdit('story_timeline', newId);
    toast('已新增故事階段，請填寫詳細資料', 'success');
  }

  function addEnding() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const newId = 'ending_' + String(GameData.meta.endings.length + 1).padStart(2, '0');
    const ending = { id: newId, name: '新結局', route: 'common', desc: '請填寫結局描述', char: null, progress: 0 };
    GameData.meta = {...GameData.meta, endings: [...(GameData.meta.endings||[]), ending]};
    markDirty();
    renderWorld();
    openEdit('endings', newId);
    toast('已新增結局，請填寫詳細資料', 'success');
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
    const newId = 'Phase ' + (GameData.meta.phases.length + 1) + ': ';
    const phase = { name: newId, status: 'pending', desc: '請填寫描述', progress: 0 };
    GameData.meta = {...GameData.meta, phases: [...GameData.meta.phases, phase]};
    markDirty();
    renderDashboard();
    openEdit('phases', newId);
    toast('已新增階段，請填寫詳細資料', 'success');
  }

  function addSystem() {
    if (!state.isEditMode) { toast('請先進入編輯模式', 'info'); return; }
    const id = 'sys_' + Date.now();
    const sys = { id, num: '99', icon: '⚙️', name: id, desc: '請填寫描述', tags: [] };
    GameData.meta = {...GameData.meta, systems: [...(GameData.meta.systems||[]), sys]};
    markDirty();
    if (state.currentView === 'dashboard') renderDashboard();
    else renderSystems();
    openEdit('systems', id);
    toast('已新增系統，請填寫詳細資料', 'success');
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
    const id = 'n' + Date.now();
    const note = { id, title: '新筆記', content: '', tags: [], updated: new Date().toISOString().split('T')[0] };
    GameData.notes = [...GameData.notes, note];
    renderNotes();
    openEdit('notes', id);
    markDirty();
    toast('已新增筆記，請填寫詳細資料', 'success');
  }

  // ── SETTINGS ──
  function openSettings() { switchView('settings'); }
  function renderRestoreSnapshots() {
    const container = document.getElementById('restore-snapshot-list');
    if (!container) return;
    const snaps = getSnapshots();
    if (!snaps.length) {
      container.innerHTML = `<div style="padding:16px;text-align:center;color:var(--dos-gray);font-size:0.75rem">尚無本機快照<br><small>成功推送後會自動保存</small></div>`;
      return;
    }
    container.innerHTML = snaps.map((s, i) => {
      const date = new Date(s.ts).toLocaleString('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
      return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--dos-dark);border:1px solid var(--dos-border)">
        <div style="flex:1;min-width:0">
          <div style="font-size:0.65rem;color:var(--dos-amber);font-family:var(--font-mono)">${escapeHtml(s.sha)}</div>
          <div style="font-size:0.7rem;margin-top:2px;word-break:break-word;color:var(--dos-white)">${escapeHtml(s.label || '')}</div>
          <div style="font-size:0.6rem;color:var(--dos-gray)">${date}</div>
        </div>
        <button class="btn-sm btn-outline" onclick="if(confirm('確定要還原到此版本？')){app.restoreFromSnapshot(${i});app.editCancel();}">還原</button>
      </div>`;
    }).join('');
  }

  function loadSettings() {
    document.getElementById('setting-gh-token').value = state.githubToken;
    document.getElementById('toggle-autosave').checked = state.autosave;
    document.getElementById('toggle-show-ids').checked = state.showIds;
    renderFontSizeGrid();
    renderRestoreSnapshots();
  }
  function saveToken(v) { state.githubToken = v; localStorage.setItem('cors_gh_token', v); toast('Token 已儲存至 localStorage', 'success'); updateReadOnlyUI(); }
  function toggleAutosave(v) { state.autosave = v; localStorage.setItem('cors_autosave', v); toast('已' + (v?'啟用':'停用') + '自動儲存', 'info'); }
function toggleShowIds(v) { state.showIds = v; localStorage.setItem('cors_show_ids', v); renderCurrentView(); }

  // ── Font Size ──
  const FONT_SIZES = [
    { label: '極小', value: '12px' },
    { label: '小', value: '14px' },
    { label: '標準', value: '16px' },
    { label: '大', value: '18px' },
    { label: '特大', value: '20px' },
    { label: '超大', value: '22px' },
    { label: '極大', value: '24px' },
  ];

  function renderFontSizeGrid() {
    const el = document.getElementById('font-size-grid');
    if (!el) return;
    const current = localStorage.getItem('cors_font_size') || '16px';
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

  // ── Data history (content commit snapshots) ──
  let dataHistory = [];  // [{sha, message, date, files: {orders, events, items, emails, news, notes, meta}}]

  async function fetchDataHistory() {
    // Fetch last 5 commits that touched content/ from GitHub API
    if (!state.githubToken) return;
    const repo = document.getElementById('setting-repo')?.value || 'straydog3301/cors_side';
    try {
      const r = await fetch(`https://api.github.com/repos/${repo}/commits?path=content/&per_page=5&sha=main`, {
        headers: API.headers(state.githubToken)
      });
      if (!r.ok) return;
      const commits = await r.json();
      dataHistory = [];
      for (const commit of commits) {
        const entry = {
          sha: commit.sha.substring(0, 7),
          message: commit.commit.message.split('\n')[0],
          date: commit.commit.committer.date,
          files: {}
        };
        // Fetch tree for this commit to get content files
        const treeR = await fetch(commit.commit.tree.url, { headers: API.headers(state.githubToken) });
        if (!treeR.ok) continue;
        const tree = await treeR.json();
        const contentFiles = tree.tree.filter(t => t.path.startsWith('content/') && t.path.endsWith('.json'));
        for (const cf of contentFiles) {
          try {
            const blobR = await fetch(cf.url, { headers: API.headers(state.githubToken) });
            if (!blobR.ok) continue;
            const blob = await blobR.json();
            const name = cf.path.replace('content/', '').replace('.json', '');
            entry.files[name] = JSON.parse(base64Utf8Decode(blob.content));
          } catch(e) { /* skip */ }
        }
        dataHistory.push(entry);
      }
    } catch(e) { console.warn('fetchDataHistory error:', e); }
  }

  function showResetPicker() {
    // Show a simple overlay with commit options
    const overlay = document.getElementById('edit-overlay');
    const body = document.getElementById('edit-body');
    const fname = document.getElementById('edit-file-name');
    fname.textContent = '🔄 選擇要恢復的版本';
    let html = `<div style="padding:12px;font-size:0.75rem;font-family:var(--font-mono);color:var(--dos-gray);margin-bottom:12px">data.js 僅作為初始載入與重置依據。以下列出最近 content/ 的 5 次 commit：</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:8px">`;
    if (dataHistory.length === 0) {
      html += `<div style="padding:20px;text-align:center;color:var(--dos-gray)">暫無歷史記錄（需連接 GitHub）</div>`;
    } else {
      for (const entry of dataHistory) {
        const date = new Date(entry.date).toLocaleString('zh-TW', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
        const fileCount = Object.keys(entry.files).length;
        html += `<button class="reset-picker-btn" onclick="app.restoreFromHistory('${entry.sha}')" style="text-align:left;padding:10px 12px;background:var(--dos-dark);border:1px solid var(--dos-border);color:var(--dos-white);cursor:pointer;border-radius:0;font-family:var(--font-mono)">
          <div style="font-size:0.7rem;color:var(--dos-amber)">${entry.sha} — ${date}</div>
          <div style="font-size:0.7rem;margin-top:4px;word-break:break-word">${escapeHtml(entry.message)}</div>
          <div style="font-size:0.6rem;color:var(--dos-gray);margin-top:2px">${fileCount} 個內容檔案</div>
        </button>`;
      }
    }
    html += `</div>`;
    html += `<div style="text-align:right;margin-top:16px"><button class="btn-sm btn-outline" onclick="app.editCancel()">取消</button></div>`;

    // Also add a "reset to data.js (built-in)" fallback
    html += `<hr style="border-color:var(--dos-border);margin:16px 0"><div style="text-align:center"><button class="btn-sm btn-danger" onclick="if(confirm('確定重置為 data.js 的內建預設資料？（編輯中的變更會遺失）')){app.resetToDataJs();app.editCancel();}">🗑️ 重置為 data.js 預設</button></div>`;

    body.innerHTML = html;
    overlay.classList.remove('hidden');
  }

  // Expose these later in the app object

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function restoreFromHistory(sha) {
    const entry = dataHistory.find(e => e.sha === sha);
    if (!entry) return;
    for (const [name, data] of Object.entries(entry.files)) {
      GameData[name === 'meta' ? 'meta' : name] = JSON.parse(JSON.stringify(data)); // deep clone
    }
    saveToLocalStorage();
    document.getElementById('edit-overlay').classList.add('hidden');
    renderCurrentView();
    toast(`已恢復至 ${sha}（${Object.keys(entry.files).length} 個檔案）`, 'success');
  }

  function resetToDataJs() {
    // Re-initialize from the original data.js global (read-only copy)
    // We need to re-parse the data.js content — data.js is the IIFE bootstrap
    // For now, clear localStorage and reload page
    localStorage.removeItem('cors_local_data');
    location.reload();
  }

  // ── Load content from GitHub Pages (no token needed) ──
  async function loadFromPagesContent() {
    // Fetch 7 content JSON files from GitHub Pages static serve
    // This is the PRIMARY data source for all users (no token required)
    const files = ['orders','events','items','emails','news','notes','meta'];
    const base = '/cors_side/content/';  // relative to GitHub Pages root
    let loaded = 0;
    for (const name of files) {
      try {
        const r = await fetch(`${base}${name}.json`, { headers: { 'Cache-Control': 'no-cache' } });
        if (!r.ok) continue;
        const data = await r.json();
        GameData[name === 'meta' ? 'meta' : name] = data;
        loaded++;
      } catch(e) { /* skip */ }
    }
    if (loaded > 0) {
      renderCurrentView();
    }
    // Returns whether any files were loaded (for init() to know if rendering happened)
    return loaded > 0;
  }

  function resetLocalOrig() {
    if (!confirm('確定要清除所有本地變更嗎？')) return;
    GameData.reset();
    localStorage.removeItem('cors_local_data');
    state.localModified = false;
    renderCurrentView();
    toast('已重置', 'info');
  }
  function resetLocal() {
    if (!state.githubToken) {
      resetLocalOrig();
      return;
    }
    showResetPicker();
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
      state.githubUser = user.login;  // Store for later filtering
      document.getElementById('connect-status').innerHTML = `<span style="color:var(--dos-success)">✓ 已連接：${user.login}</span>`;
      document.getElementById('user-avatar').textContent = user.login.substring(0,2).toUpperCase();
      document.getElementById('user-name').textContent = user.login;
      document.getElementById('user-status').textContent = 'GitHub 已連接';
      // After manual connect, update UI to show edit features + fetch history
      updateReadOnlyUI();
      fetchDataHistory();
      toast(`已連接 GitHub：${user.login}`, 'success');
    } catch(e) {
      document.getElementById('connect-status').innerHTML = `<span style="color:var(--dos-danger)">連接失敗：${e.message}</span>`;
      toast('GitHub 連接失敗', 'error');
    }
  }

  // Save snapshot to localStorage (max 5, newest first)
  // Snapshot format: { sha, label, data, ts }
  function saveSnapshotToStorage(sha, label, data) {
    const KEY = 'cors-snapshots';
    let snaps = [];
    try { snaps = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) {}
    const entry = { sha, label, data, ts: Date.now() };
    // Insert at front, keep max 5
    snaps = [entry, ...snaps].slice(0, 5);
    localStorage.setItem(KEY, JSON.stringify(snaps));
  }

  // Update the SHA of the pending snapshot (called after push succeeds)
  function updateSnapshotSha(realSha) {
    const KEY = 'cors-snapshots';
    let snaps = [];
    try { snaps = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) {}
    if (snaps.length && snaps[0].sha === '__pending__') {
      snaps[0].sha = realSha;
      localStorage.setItem(KEY, JSON.stringify(snaps));
    }
  }

  // Get all snapshots (newest first)
  function getSnapshots() {
    const KEY = 'cors-snapshots';
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { return []; }
  }

  // Restore from a localStorage snapshot (index or sha)
  function restoreFromSnapshot(idxOrSha) {
    const snaps = getSnapshots();
    let snap;
    if (typeof idxOrSha === 'number') {
      snap = snaps[idxOrSha];
    } else {
      snap = snaps.find(s => s.sha === idxOrSha);
    }
    if (!snap) { toast('找不到指定的快照', 'error'); return; }
    const { data } = snap;
    if (!data) { toast('快照資料損壞', 'error'); return; }
    Object.keys(data).forEach(k => { if (GameData[k] !== undefined) GameData[k] = data[k]; });
    saveToLocalStorage();
    renderCurrentView();
    toast(`已還原至：${snap.sha} ${snap.label}`, 'success');
  }

  async function pushToGithub() {
    if (!state.githubToken) { toast('請先連接 GitHub（設定頁面）', 'error'); return; }
    const repo = document.getElementById('setting-repo').value || 'straydog3301/cors_side';
    const statusEl = document.getElementById('sync-status');
    statusEl.textContent = '準備推送...';
    const commitMsgInput = document.getElementById('setting-commit-msg')?.value?.trim() || `docs: sync via CORS Dev Panel`;
    const data = GameData.exportAll();
    // Save snapshot with pending SHA (will update after push succeeds)
    saveSnapshotToStorage('__pending__', commitMsgInput.split('\n')[0], { ...data });
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
      const commitMsg = document.getElementById('setting-commit-msg')?.value?.trim() || `docs: sync all data files via CORS Dev Panel\ntimestamp: ${new Date().toISOString()}`;
      const newCommit = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
        method: 'POST',
        headers: API.headers(state.githubToken),
        body: JSON.stringify({
          message: commitMsg,
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
      statusEl.innerHTML = `<span style="color:var(--dos-success)">✓ 已推送全部 ${Object.keys(fileContents).length} 個檔案</span>`;
      toast(`已推送 ${Object.keys(fileContents).length} 個檔案至 GitHub`, 'success');

      // Update pending snapshot with real SHA and update sync metadata
      const realSha = newCommit.sha.substring(0, 8);
      updateSnapshotSha(realSha);
      setSyncMeta({ syncSha: newCommit.sha, seenSha: newCommit.sha, editTs: null });
      state.lastSyncSha = newCommit.sha;
      state.lastSeenSha = newCommit.sha;
      state.githubDirty = false;
      state.githubHasNewContent = false;
      console.log('[DEBUG] pushToGithub: seenSha set to', newCommit.sha, '| localStorage:', localStorage.getItem('cors-last-seen-sha'));
      renderNewContentBadge();

      // Check GitHub Pages deployment status
      statusEl.innerHTML += `<br><span style="color:var(--dos-gray);font-size:0.7rem">⏳ 檢查 Pages 部署狀態...</span>`;
      checkPagesDeployment(repo).then(result => {
        if (result.skipUpdate) return; // reload already triggered
        statusEl.innerHTML += `<br><span style="color:${result.color}">${result.icon} ${result.text}</span>`;
      });
    } catch(e) {
      console.error('Push error:', e);
      statusEl.innerHTML = `<span style="color:var(--dos-danger)">⚠ 推送失敗：${e.message}</span>`;
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

  // ── GitHub Pages deployment status ──
  async function checkPagesDeployment(repo, opts = {}) {
    try {
      const pagesResp = await fetch(`https://api.github.com/repos/${repo}/pages`, {
        headers: API.headers(state.githubToken)
      });
      if (!pagesResp.ok) return { icon: 'ℹ️', text: 'GitHub Pages 未啟用或無權限', color: 'var(--dos-gray)' };

      // Check latest deployment from Actions
      const deployResp = await fetch(
        `https://api.github.com/repos/${repo}/actions/runs?event=push&branch=main&per_page=1&status=completed`,
        { headers: API.headers(state.githubToken) }
      );
      if (!deployResp.ok) return { icon: '✅', text: '推送成功！（未取得部署狀態）', color: 'var(--dos-success)' };

      const deployData = await deployResp.json();
      const latestRun = deployData.workflow_runs?.[0];
      if (!latestRun) return { icon: '✅', text: '推送成功！（等待 Actions 觸發）', color: 'var(--dos-success)' };

      if (latestRun.conclusion === 'success') {
        statusEl.innerHTML += `<br><span style="color:var(--dos-success)">✅ Pages 部署成功（${latestRun.updated_at?.split('T')[0] || ''}）— 正在刷新頁面...</span>`;
        setTimeout(() => location.reload(true), 1500);
        return { skipUpdate: true };
      } else if (latestRun.conclusion === 'failure') {
        return { icon: '⚠️', text: `Pages 部署失敗 — 請檢查 Actions`, color: 'var(--dos-danger)' };
      } else {
        return { icon: '⏳', text: `Pages 狀態：${latestRun.conclusion || '進行中'}`, color: 'var(--dos-gray)' };
      }
    } catch(e) {
      return { icon: 'ℹ️', text: '推送成功！（Pages 狀態查詢失敗）', color: 'var(--dos-gray)' };
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
        const file = await fetch(`https://api.github.com/repos/${repo}/contents/content/${name}.json`, {
          headers: { ...API.headers(state.githubToken), 'Cache-Control': 'no-cache' }
        });
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
    statusEl.innerHTML = `<span style="color:var(--dos-success)">✓ 已拉取 ${loaded}/${files.length} 個檔案</span>`;
    saveToLocalStorage();
    renderCurrentView();
    toast(`已從 GitHub 拉取 ${loaded} 個檔案`, 'success');
    // Manual pull clears dirty flag and updates sync state
    // Fetch the latest commit SHA so seenSha is accurate for next reload
    let latestSha = state.lastSeenSha;
    try {
      const r2 = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1&sha=main`, {
        headers: API.headers(state.githubToken)
      });
      if (r2.ok) {
        const commits2 = await r2.json();
        if (commits2 && commits2.length) latestSha = commits2[0].sha;
      }
    } catch(e) { /* fallback to lastSeenSha */ }
    setSyncMeta({ syncSha: latestSha, seenSha: latestSha, editTs: null });
    state.lastSyncSha = latestSha;
    state.lastSeenSha = latestSha;
    state.githubDirty = false;
    state.githubHasNewContent = false;
    checkGithubNewContent();
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

  // ── Read-only UI mode (no GitHub token) ──
  function updateReadOnlyUI() {
    const hasToken = !!state.githubToken;
    const editBtn = document.getElementById('btn-edit-toggle');
    const saveBtn = document.getElementById('btn-save-top');
    const contentPanel = document.getElementById('settings-content-files');
    const devPanel = document.getElementById('settings-dev-mode');
    const restorePanel = document.getElementById('settings-restore');
    if (editBtn) editBtn.style.display = hasToken ? '' : 'none';
    if (saveBtn) saveBtn.style.display = hasToken ? '' : 'none';
    if (contentPanel) contentPanel.style.display = hasToken ? '' : 'none';
    if (devPanel) devPanel.style.display = hasToken ? '' : 'none';
    if (restorePanel) restorePanel.style.display = hasToken ? '' : 'none';
    // If user was in edit mode and becomes read-only, force exit
    if (!hasToken && state.isEditMode) {
      state.isEditMode = false;
      document.body.classList.remove('edit-mode');
      const icon = document.getElementById('edit-btn-icon');
      if (icon) icon.textContent = '✏️';
    }
  }

  // ── Sync tracking helpers ──
  function getSyncMeta() {
    return {
      syncSha: localStorage.getItem('cors-sync-sha') || null,
      seenSha: localStorage.getItem('cors-last-seen-sha') || null,
      editTs: localStorage.getItem('cors-edit-ts') || null,
    };
  }
  function setSyncMeta(opts) {
    if (opts.syncSha !== undefined) {
      opts.syncSha ? localStorage.setItem('cors-sync-sha', opts.syncSha) : localStorage.removeItem('cors-sync-sha');
    }
    if (opts.seenSha !== undefined) {
      opts.seenSha ? localStorage.setItem('cors-last-seen-sha', opts.seenSha) : localStorage.removeItem('cors-last-seen-sha');
    }
    if (opts.editTs !== undefined) {
      opts.editTs ? localStorage.setItem('cors-edit-ts', opts.editTs) : localStorage.removeItem('cors-edit-ts');
    }
  }
  function isDirty() {
    const m = getSyncMeta();
    if (!m.editTs) return false;
    // Has edits not yet synced if edit timestamp is newer than last push (or no push yet)
    return !m.syncSha || m.editTs > m.syncSha;
  }

  // ── GitHub new-content badge ──
  function renderNewContentBadge() {
    const badge = document.getElementById('btn-new-content');
    if (!badge) return;
    badge.style.display = (state.githubToken && state.githubHasNewContent) ? '' : 'none';
    if (state.githubHasNewContent && state.githubDirty) {
      badge.classList.add('badge-warn');
      badge.title = '⚠️ GitHub 有新內容（您的本地編輯尚未推送）';
    } else {
      badge.classList.remove('badge-warn');
      badge.title = '🔔 GitHub 有新內容，點擊更新';
    }
  }

  async function checkGithubNewContent() {
    if (!state.githubToken) return;
    const repo = document.getElementById('setting-repo')?.value || 'straydog3301/cors_side';
    try {
      // Fetch the latest commit to compare SHA — no user filtering needed.
      // pushToGithub() and performPull() both update seenSha, so a simple
      // comparison is enough: if the latest SHA differs from seenSha, someone
      // else pushed new content since we last synced.
      const r = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1&sha=main`, {
        headers: API.headers(state.githubToken)
      });
      if (!r.ok) return;
      const commits = await r.json();
      if (!commits || !commits.length) return;
      const meta = getSyncMeta();
      const latestSha = commits[0].sha;
      // IMPORTANT: Do NOT update seenSha here — it would always overwrite to
      // latestSha and silence the bell. Only update seenSha when the user
      // actually pushes or pulls (pushToGithub / performPull handle that).
      // If seenSha differs from latestSha → new content is available.
      if (meta.seenSha !== latestSha) {
        console.log('[DEBUG] checkGithubNewContent: showing bell | seenSha:', meta.seenSha, '| latestSha:', latestSha);
        state.githubHasNewContent = true;
        state.githubDirty = isDirty();
        renderNewContentBadge();
      } else {
        console.log('[DEBUG] checkGithubNewContent: bell hidden | seenSha:', meta.seenSha, '| latestSha:', latestSha);
      }
    } catch(e) { /* silent */ }
  }

  function handleNewContentAction() {
    if (!state.githubHasNewContent) return;
    const msg = state.githubDirty
      ? '⚠️ GitHub 有新內容，但您的本地編輯尚未推送。\n\n「確定」會用 GitHub 內容覆蓋本地編輯（可透過「還原設定」救回）。\n「取消」則保留本地編輯，稍後再手動 pull。'
      : '🔔 GitHub 有新內容，是否拉取並覆蓋本地資料？';
    if (confirm(msg)) {
      performPull(false);
    }
  }

  async function performPull(forceDirty) {
    // Load latest from GitHub API → write to localStorage → clear edit flag
    const repo = document.getElementById('setting-repo')?.value || 'straydog3301/cors_side';
    const files = ['orders','events','items','emails','news','notes','meta'];
    let loaded = 0;
    for (const name of files) {
      try {
        const file = await fetch(`https://api.github.com/repos/${repo}/contents/content/${name}.json`, {
          headers: { ...API.headers(state.githubToken), 'Cache-Control': 'no-cache' }
        });
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
    // Clear dirty flag and update sync state
    // Fetch the latest commit SHA so seenSha is accurate for next reload
    let latestSha = state.lastSeenSha;
    try {
      const r2 = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=1&sha=main`, {
        headers: API.headers(state.githubToken)
      });
      if (r2.ok) {
        const commits2 = await r2.json();
        if (commits2 && commits2.length) latestSha = commits2[0].sha;
      }
    } catch(e) { /* fallback to lastSeenSha */ }
    setSyncMeta({ syncSha: latestSha, seenSha: latestSha, editTs: null });
    state.lastSyncSha = latestSha;
    state.lastSeenSha = latestSha;
    state.githubDirty = false;
    state.githubHasNewContent = false;
    renderNewContentBadge();
    toast(`已從 GitHub 拉取 ${loaded} 個檔案`, 'success');
  }

  // ── Init ──
  function init() {
    // Load persisted sync state
    const meta = getSyncMeta();
    state.lastSyncSha = meta.syncSha;
    state.lastSeenSha = meta.seenSha;
    state.githubDirty = isDirty();

    // Show loading overlay immediately — cleared after first data load
    const loadingEl = document.getElementById('loading-overlay');
    if (loadingEl) loadingEl.classList.remove('hidden');

    // Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Restore font size
    const savedFontSize = localStorage.getItem('cors_font_size');
    if (savedFontSize) document.documentElement.style.fontSize = savedFontSize;

    // Start with scanlines overlay on (dashboard is default view)
    document.body.classList.add('scanlines');

    // Apply read-only UI based on token presence
    updateReadOnlyUI();
    renderNewContentBadge();

    // Step 1: All users load from GitHub Pages content/*.json (primary source, no token needed)
    loadFromPagesContent().then(() => {
      // Restore local edits BEFORE first render so saved changes appear immediately
      loadFromLocalStorage();
      renderCurrentView();

      // Hide loading overlay
      const loadingEl = document.getElementById('loading-overlay');
      if (loadingEl) loadingEl.classList.add('hidden');

      // Step 2: Token users → fetch user + pull from API
      if (state.githubToken) {
        fetch('https://api.github.com/user', { headers: API.headers(state.githubToken) })
          .then(r => r.ok ? r.json() : null)
          .then(user => {
            if (user) {
              state.githubUser = user.login;  // Store for filtering self-commits
              document.getElementById('user-avatar').textContent = user.login.substring(0,2).toUpperCase();
              document.getElementById('user-name').textContent = user.login;
              document.getElementById('user-status').textContent = 'GitHub 已連接';
              // Pull latest + check for new content on GitHub
              loadFromGithubSilent().then(() => {
                fetchDataHistory();
                checkGithubNewContent(); // compares SHA and may show badge
              });
            }
          }).catch(() => {});
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !document.getElementById('edit-overlay').classList.contains('hidden')) {
        editCancel();
      }
    });

    // Initial render is deferred until after loadFromPagesContent resolves
    // to avoid briefly flashing data.js default content before the fetch completes
  }

  // Expose API
window.app = {
    switchView, renderCurrentView,
    toggleEdit, openEdit, editCancel, editSave, markDirty,
    showJsonEditor, showBlockEditor, addField, addRecord, deleteBlock,
    newNote, addCharacter, addWorldEvent, addStoryTimeline, addEnding, editStatKey, addStat, deleteStatKey, addPhase, addSystem, deleteCurrentRecord, filterBacklog, filterWorld, openSettings,
    renderFontSizeGrid, setFontSize, renderRestoreSnapshots,
    saveToken, toggleAutosave, toggleShowIds, resetLocal,
    connectGithub, pushToGithub, loadFromGithub,
    handleNewContentAction, performPull, getSnapshots, restoreFromSnapshot,
    saveAll, saveToLocalStorage,
    exportSheetJSON,
    restoreFromHistory, resetToDataJs,
    // Drag & drop
    toggleNoteExpanded,
    dragStart, dragOver, dragLeave, drop, dragEnd,
    charDragStart, charDragOver, charDragLeave, charDrop, charDragEnd,
    reorderDragStart, reorderDragOver, reorderDragLeave, reorderDrop, reorderDragEnd,
  };

  document.addEventListener('DOMContentLoaded', init);
})();

/* ════════════════════════════════════════════════════
   MOBILE NAV — standalone functions (no app dependency)
   ════════════════════════════════════════════════════ */
function toggleMobileNav() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');
  const isOpen = !drawer.classList.contains('hidden');
  if (isOpen) { closeMobileNav(); }
  else { openMobileNav(); }
}
function openMobileNav() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');
  drawer.classList.remove('hidden');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeMobileNav() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const overlay = document.getElementById('mobile-nav-overlay');
  drawer.classList.add('hidden');
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}
function mobileNavGo(view) {
  if (window.app && window.app.switchView) {
    window.app.switchView(view);
  }
  // Update active state on mobile nav items
  document.querySelectorAll('.mobile-nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  closeMobileNav();
}