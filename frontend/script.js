/* =========================================================
   Futebol API - Front-end
   Rotas usadas:
     GET    /                       -> status (indicador no topo)
     GET    /api/jogadores          -> tabela de jogadores
     POST   /api/jogadores          -> formulário "Cadastrar"
     PUT    /api/jogadores/:id      -> "Editar" + "Salvar"
     DELETE /api/jogadores/:id      -> "Remover"
     GET    /api/gols               -> ranking de artilharia
     GET    /api/assistencia        -> ranking de assistências
   ========================================================= */

const API_URL = 'http://localhost:3000';

// Times do futebol.sql (a API não tem rota de times)
const TIMES = { 1: 'Flamengo', 2: 'Palmeiras', 3: 'Real Madrid', 4: 'Inter Miami' };

const state = { jogadores: [], editId: null, pendingDelete: null, logCount: 0 };

const $ = (s) => document.querySelector(s);

const el = {
    status: $('#btnStatus'),
    statusText: $('#statusText'),
    body: $('#playersBody'),
    count: $('#playersCount'),
    search: $('#searchInput'),
    btnRefresh: $('#btnRefresh'),
    form: $('#playerForm'),
    formPanel: $('#formPanel'),
    formTitle: $('#formTitle'),
    formRoute: $('#formRoute'),
    btnSubmit: $('#btnSubmit'),
    btnCancel: $('#btnCancelEdit'),
    btnDemo: $('#btnFillDemo'),
    golsList: $('#golsList'),
    assistList: $('#assistList'),
    btnGols: $('#btnLoadGols'),
    btnAssist: $('#btnLoadAssist'),
    console: $('#console'),
    consoleBody: $('#consoleBody'),
    consoleCount: $('#consoleCount'),
    modal: $('#modal'),
    modalText: $('#modalText'),
    modalConfirm: $('#modalConfirm'),
    modalCancel: $('#modalCancel'),
    toasts: $('#toasts'),
    f: {
        nome: $('#fNome'),
        idade: $('#fIdade'),
        posicao: $('#fPosicao'),
        camisa: $('#fCamisa'),
        nacionalidade: $('#fNacionalidade'),
        gols: $('#fGols'),
        assist: $('#fAssist'),
        time: $('#fTime'),
    },
};

/* ---------- Cliente HTTP ---------- */
async function api(method, path, body) {
    const url = API_URL + path;
    const options = { method, headers: {} };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const start = performance.now();
    let status = 0, ok = false, data = null;

    try {
        const res = await fetch(url, options);
        status = res.status;
        ok = res.ok;
        const text = await res.text();
        try { data = JSON.parse(text); } catch { data = text; }
    } catch {
        data = { erro: 'Não foi possível conectar à API. O servidor está rodando?' };
    }

    addLog({ method, path, status, ok, ms: Math.round(performance.now() - start), body, data });
    return { ok, status, data };
}

const errorMessage = (data) =>
    (data && data.erro) || (typeof data === 'string' && data) || 'Erro inesperado';

/* ---------- Console de requisições ---------- */
function addLog({ method, path, status, ok, ms, body, data }) {
    el.consoleCount.textContent = ++state.logCount;
    el.consoleBody.querySelector('.console__empty')?.remove();

    const log = document.createElement('div');
    log.className = 'log';
    log.innerHTML = `
        <button class="log__head" type="button">
            <span class="log__method ${method.toLowerCase()}">${method}</span>
            <span class="log__url">${escapeHtml(path)}</span>
            <span class="log__status ${ok ? 'ok' : 'err'}">${status || 'ERR'}</span>
            <span class="log__time">${ms}ms</span>
        </button>
        <div class="log__body">
            ${body !== undefined ? `Body<pre>${escapeHtml(JSON.stringify(body, null, 2))}</pre>` : ''}
            Resposta<pre>${escapeHtml(typeof data === 'string' ? data : JSON.stringify(data, null, 2))}</pre>
        </div>`;
    log.querySelector('.log__head').addEventListener('click', () => log.classList.toggle('expanded'));
    el.consoleBody.prepend(log);
}

$('#btnToggleConsole').addEventListener('click', () => el.console.classList.toggle('open'));
$('#btnClearConsole').addEventListener('click', () => {
    state.logCount = 0;
    el.consoleCount.textContent = '0';
    el.consoleBody.innerHTML = '<p class="console__empty">Nenhuma requisição ainda.</p>';
});

/* ---------- GET / ---------- */
async function checkStatus() {
    el.status.className = 'status';
    el.statusText.textContent = 'Verificando...';
    const { ok } = await api('GET', '/');
    el.status.classList.add(ok ? 'online' : 'offline');
    el.statusText.textContent = ok ? 'API online' : 'API offline';
    return ok;
}

el.status.addEventListener('click', async () => {
    const ok = await checkStatus();
    toast(ok ? 'API respondendo normalmente' : 'API offline', ok ? 'success' : 'error');
});

/* ---------- GET /api/jogadores ---------- */
async function loadPlayers() {
    el.btnRefresh.classList.add('loading');
    const { ok, data } = await api('GET', '/api/jogadores');
    el.btnRefresh.classList.remove('loading');

    if (!ok) {
        state.jogadores = [];
        renderPlayers(errorMessage(data));
        return false;
    }
    state.jogadores = Array.isArray(data) ? data : [];
    renderPlayers();
    return true;
}

function renderPlayers(errorMsg) {
    el.count.textContent = state.jogadores.length || '';

    if (errorMsg) {
        el.body.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(errorMsg)}</td></tr>`;
        return;
    }

    const term = el.search.value.trim().toLowerCase();
    const list = state.jogadores.filter((j) =>
        `${j.nome} ${j.posicao} ${j.nacionalidade ?? ''} ${TIMES[j.time_id] ?? ''}`.toLowerCase().includes(term)
    );

    if (!list.length) {
        const msg = state.jogadores.length ? 'Nenhum resultado.' : 'Nenhum jogador cadastrado.';
        el.body.innerHTML = `<tr><td colspan="7" class="empty">${msg}</td></tr>`;
        return;
    }

    el.body.innerHTML = list.map((j) => `
        <tr class="${state.editId === j.id ? 'editing' : ''}">
            <td>
                <div class="name">${escapeHtml(j.nome)}</div>
                <div class="sub">${j.numero_camisa ? `#${j.numero_camisa}` : ''}${j.numero_camisa && j.nacionalidade ? ' · ' : ''}${escapeHtml(j.nacionalidade ?? '')}</div>
            </td>
            <td>${escapeHtml(j.posicao)}</td>
            <td>${escapeHtml(TIMES[j.time_id] ?? (j.time_id ? `Time #${j.time_id}` : '—'))}</td>
            <td class="num">${j.idade}</td>
            <td class="num">${j.gols ?? 0}</td>
            <td class="num">${j.assistencias ?? 0}</td>
            <td>
                <div class="row-actions">
                    <button class="icon-btn" data-edit="${j.id}" id="edit-${j.id}" title="PUT /api/jogadores/${j.id}">Editar</button>
                    <button class="icon-btn del" data-del="${j.id}" id="del-${j.id}" title="DELETE /api/jogadores/${j.id}">Remover</button>
                </div>
            </td>
        </tr>`).join('');
}

el.search.addEventListener('input', () => renderPlayers());
el.btnRefresh.addEventListener('click', loadPlayers);

el.body.addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    if (edit) startEdit(Number(edit.dataset.edit));
    if (del) askDelete(Number(del.dataset.del));
});

/* ---------- POST / PUT ---------- */
function readForm() {
    const num = (v) => (v === '' ? null : Number(v));
    return {
        nome: el.f.nome.value.trim(),
        idade: num(el.f.idade.value),
        posicao: el.f.posicao.value,
        numero_camisa: num(el.f.camisa.value),
        nacionalidade: el.f.nacionalidade.value.trim() || null,
        gols: num(el.f.gols.value) ?? 0,
        assistencias: num(el.f.assist.value) ?? 0,
        time_id: num(el.f.time.value),
    };
}

function validateForm() {
    const required = [el.f.nome, el.f.idade, el.f.posicao];
    required.forEach((i) => i.classList.toggle('invalid', !i.value.trim()));
    return required.every((i) => i.value.trim());
}

[el.f.nome, el.f.idade, el.f.posicao].forEach((i) =>
    i.addEventListener('input', () => i.classList.remove('invalid'))
);

el.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm()) return toast('Preencha nome, idade e posição', 'warn');

    const payload = readForm();
    const editing = state.editId;
    el.btnSubmit.classList.add('loading');
    const res = editing
        ? await api('PUT', `/api/jogadores/${editing}`, payload)
        : await api('POST', '/api/jogadores', payload);
    el.btnSubmit.classList.remove('loading');

    if (!res.ok) return toast(errorMessage(res.data), 'error');

    toast(editing ? 'Jogador atualizado' : 'Jogador cadastrado');
    resetForm();
    refreshAll();
});

function startEdit(id) {
    const j = state.jogadores.find((p) => p.id === id);
    if (!j) return;

    state.editId = id;
    el.f.nome.value = j.nome ?? '';
    el.f.idade.value = j.idade ?? '';
    el.f.posicao.value = j.posicao ?? '';
    el.f.camisa.value = j.numero_camisa ?? '';
    el.f.nacionalidade.value = j.nacionalidade ?? '';
    el.f.gols.value = j.gols ?? 0;
    el.f.assist.value = j.assistencias ?? 0;
    el.f.time.value = j.time_id ?? '';

    el.formTitle.textContent = 'Editar jogador';
    el.formRoute.textContent = `PUT /api/jogadores/${id}`;
    el.btnSubmit.textContent = 'Salvar';
    el.btnCancel.classList.remove('hidden');
    el.btnDemo.classList.add('hidden');
    el.formPanel.classList.add('edit-mode');
    renderPlayers();
    el.f.nome.focus();
}

function resetForm() {
    state.editId = null;
    el.form.reset();
    [el.f.nome, el.f.idade, el.f.posicao].forEach((i) => i.classList.remove('invalid'));

    el.formTitle.textContent = 'Novo jogador';
    el.formRoute.textContent = 'POST /api/jogadores';
    el.btnSubmit.textContent = 'Cadastrar';
    el.btnCancel.classList.add('hidden');
    el.btnDemo.classList.remove('hidden');
    el.formPanel.classList.remove('edit-mode');
    renderPlayers();
}

el.btnCancel.addEventListener('click', resetForm);

// Preenche o formulário com um jogador de exemplo
const DEMO = [
    ['Kylian Mbappé', 27, 'Atacante', 9, 'França', 31, 9, 3],
    ['Gerson', 29, 'Meio-campo', 8, 'Brasil', 6, 11, 1],
    ['Gustavo Gómez', 33, 'Zagueiro', 15, 'Paraguai', 4, 1, 2],
    ['Jordi Alba', 37, 'Lateral', 18, 'Espanha', 3, 13, 4],
    ['Thibaut Courtois', 34, 'Goleiro', 1, 'Bélgica', 0, 0, 3],
];
el.btnDemo.addEventListener('click', () => {
    const d = DEMO[Math.floor(Math.random() * DEMO.length)];
    const f = el.f;
    [f.nome.value, f.idade.value, f.posicao.value, f.camisa.value,
        f.nacionalidade.value, f.gols.value, f.assist.value, f.time.value] = d;
    [f.nome, f.idade, f.posicao].forEach((i) => i.classList.remove('invalid'));
});

/* ---------- DELETE ---------- */
function askDelete(id) {
    const j = state.jogadores.find((p) => p.id === id);
    if (!j) return;
    state.pendingDelete = id;
    el.modalText.innerHTML = `<strong>${escapeHtml(j.nome)}</strong> será removido permanentemente.`;
    el.modal.classList.remove('hidden');
}

function closeModal() {
    el.modal.classList.add('hidden');
    state.pendingDelete = null;
}

el.modalCancel.addEventListener('click', closeModal);
el.modal.addEventListener('click', (e) => { if (e.target === el.modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

el.modalConfirm.addEventListener('click', async () => {
    const id = state.pendingDelete;
    closeModal();
    if (!id) return;

    const { ok, data } = await api('DELETE', `/api/jogadores/${id}`);
    if (!ok) return toast(errorMessage(data), 'error');

    if (state.editId === id) resetForm();
    toast('Jogador removido');
    refreshAll();
});

/* ---------- GET /api/gols e /api/assistencia ---------- */
async function loadRanking(path, listEl, field, btn) {
    btn.classList.add('loading');
    const { ok, data } = await api('GET', path);
    btn.classList.remove('loading');

    if (!ok) {
        listEl.innerHTML = `<li class="empty">${escapeHtml(errorMessage(data))}</li>`;
        return;
    }

    const rows = Array.isArray(data) ? data : [];
    if (!rows.length) {
        listEl.innerHTML = '<li class="empty">Sem dados.</li>';
        return;
    }

    const max = Math.max(1, ...rows.map((r) => Number(r[field]) || 0));
    listEl.innerHTML = rows.map((r, i) => `
        <li>
            <span class="pos">${i + 1}</span>
            <div>
                ${escapeHtml(r.nome)}
                <div class="bar"><div class="fill" data-w="${((Number(r[field]) || 0) / max) * 100}"></div></div>
            </div>
            <span class="val">${r[field] ?? 0}</span>
        </li>`).join('');

    requestAnimationFrame(() =>
        listEl.querySelectorAll('.fill').forEach((f) => (f.style.width = f.dataset.w + '%'))
    );
}

const loadGols = () => loadRanking('/api/gols', el.golsList, 'gols', el.btnGols);
const loadAssist = () => loadRanking('/api/assistencia', el.assistList, 'assistencias', el.btnAssist);

el.btnGols.addEventListener('click', loadGols);
el.btnAssist.addEventListener('click', loadAssist);

/* ---------- Utilidades ---------- */
function toast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    el.toasts.appendChild(t);
    setTimeout(() => {
        t.classList.add('out');
        setTimeout(() => t.remove(), 300);
    }, 2800);
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function refreshAll() {
    return Promise.all([loadPlayers(), loadGols(), loadAssist()]);
}

/* ---------- Inicialização ---------- */
(async function init() {
    if (await checkStatus()) {
        refreshAll();
    } else {
        renderPlayers('API offline — inicie o backend com "npm run dev" na pasta backend.');
    }
})();
