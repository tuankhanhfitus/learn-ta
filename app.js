const $ = s => document.querySelector(s);
let S = {}; try { S = JSON.parse(localStorage.getItem('eng900') || '{}') } catch (e) { }
const save = () => { try { localStorage.setItem('eng900', JSON.stringify(S)) } catch (e) { } };
const hasTTS = 'speechSynthesis' in window;
function say(t, r) { if (!hasTTS) { alert('Trình duyệt chưa hỗ trợ đọc giọng nói.'); return } speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = r || (S.rate || 0.95); speechSynthesis.speak(u) }
function sayList(a) { if (!hasTTS) return; speechSynthesis.cancel(); a.forEach(t => { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = S.rate || 0.95; speechSynthesis.speak(u) }) }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/* ---------- TABS ---------- */
const MODES = {
  toeic: { n: "Luyện thi TOEIC", d: "Mục tiêu 900+ · Nghe, Nói, Đọc, Viết", tabs: [["plan", "Lộ trình"], ["gram", "Ngữ pháp"], ["listen", "Nghe"], ["read", "Đọc"], ["speak", "Nói"], ["write", "Viết"], ["vocab", "Từ vựng"]] },
  chat: { n: "Tiếng Anh giao tiếp", d: "Hội thoại, mẫu câu, phản xạ nói", tabs: [["chat", "Hội thoại"], ["gram", "Ngữ pháp"], ["speak", "Luyện nói"], ["vocab", "Cụm từ"]] }
};
let mode = MODES[S.mode] ? S.mode : 'toeic';
let curTab = '', gl = -1;
const V = {}, I = {};

function drawModes() {
  document.documentElement.dataset.mode = mode;
  $('#modes').innerHTML = Object.entries(MODES).map(([k, m]) => `<button data-m="${k}" aria-pressed="${k === mode}">${m.n}<small>${m.d}</small></button>`).join('');
  $('#tabs').innerHTML = MODES[mode].tabs.map(([k, n]) => `<button role="tab" data-k="${k}">${n}</button>`).join('');
}
$('#modes').onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.m !== mode) { mode = b.dataset.m; S.mode = mode; save(); vi = 0; flip = false; vcat = 'all'; Q = null; gl = -1; drawModes(); go(MODES[mode].tabs[0][0]) } };
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) go(b.dataset.k) };
function go(k) { const prev = curTab; curTab = k; if (hasTTS) speechSynthesis.cancel(); const v = $('#view'); v.onclick = v.onchange = v.oninput = null; document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.k === k)); v.innerHTML = V[k](); if (prev !== k) window.scrollTo(0, 0); if (I[k]) I[k]() }

/* ---------- PLAN ---------- */
V.plan = () => {
  const d = S.plan || {}; const all = PLAN.reduce((a, p) => a + p[1].length, 0); const n = Object.values(d).filter(Boolean).length;
  return `<h2>Lộ trình 12 tuần</h2><p class="mut">Mục tiêu 900+/990 cho Nghe–Đọc, và 160+/200 mỗi kỹ năng Nói, Viết.</p>
<div class="score"><div><b>450+</b><span class="mut">Listening / 495</span></div><div><b>450+</b><span class="mut">Reading / 495</span></div><div><b>160+</b><span class="mut">Speaking / 200</span></div><div><b>160+</b><span class="mut">Writing / 200</span></div></div>
<div class="card"><h3>Tiến độ: ${n}/${all} việc</h3><div class="bar"><i style="width:${n / all * 100}%"></i></div></div>
${PLAN.map((p, i) => `<div class="card"><h3>${p[0]}</h3>${p[1].map((t, j) => `<label class="chk"><input type="checkbox" data-id="${i}-${j}" ${d[i + '-' + j] ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>`).join('')}
<div class="card"><h3>Thói quen mỗi ngày (90 phút)</h3><p style="margin:0">30 phút nghe và shadowing · 30 phút ngữ pháp và đọc · 15 phút từ vựng · 15 phút nói hoặc viết. Đều đặn mỗi ngày hiệu quả hơn học dồn cuối tuần.</p></div>`;
};
I.plan = () => { $('#view').onchange = e => { if (e.target.dataset.id) { S.plan = S.plan || {}; S.plan[e.target.dataset.id] = e.target.checked; save(); go('plan') } } };

/* ---------- QUIZ (Listen + Read + Grammar) ---------- */
function quiz(key, data, listen) {
  const saved = (S.qans && S.qans[key]) || {};
  const doneCount = Object.keys(saved).length;
  const correctCount = Object.entries(saved).filter(([i, ansTxt]) => data[i] && data[i][1][data[i][2]] === ansTxt).length;
  return data.map((q, i) => {
    const pickedTxt = saved[i];
    const isDone = pickedTxt !== undefined;
    const rightTxt = q[1][q[2]];
    return `<div class="card" data-q="${i}">
      <div class="row" style="justify-content:space-between">
        <b>Câu ${i + 1}</b>
        ${listen ? `<button class="btn" data-play="${i}">▶ Nghe câu hỏi</button>` : `<button class="sp" data-qsay="${esc(q[0].replace(/____/g, rightTxt))}" title="Nghe câu hoàn chỉnh">🔊</button>`}
      </div>
      <p>${listen ? `<span class="mut">Nghe rồi chọn câu trả lời phù hợp nhất.</span>` : esc(q[0])}</p>
      ${q[1].map((o, j) => {
        let cls = '';
        if (isDone) {
          if (o === rightTxt) cls = ' ok';
          else if (o === pickedTxt) cls = ' no';
        }
        return `<button class="btn opt${cls}" data-q="${key}" data-i="${i}" data-j="${j}" ${isDone ? 'disabled' : ''}>${'ABCD'[j]}. ${esc(o)}</button>`;
      }).join('')}
      <div class="exp" ${isDone ? '' : 'hidden'}>${isDone ? (listen ? 'Bản gốc: “' + q[0] + '” — ' : '') + q[3] : ''}</div>
    </div>`;
  }).join('') + `<div class="card row" style="justify-content:space-between">
    <b class="res" id="${key}Res">${doneCount ? `Đúng ${correctCount}/${doneCount} câu đã làm` + (doneCount === data.length ? (correctCount >= data.length * .85 ? ' — Rất tốt, đúng tiêu chuẩn 900+!' : ' — Xem lại phần giải thích để rút kinh nghiệm.') : '') : 'Hãy chọn đáp án để bắt đầu.'}</b>
    ${doneCount ? `<button class="btn" data-qreset="${key}">Làm lại bài này</button>` : ''}
  </div>`;
}

function bindQuiz(key, data, listen) {
  const v = $('#view');
  v.onclick = e => {
    const pl = e.target.closest('[data-play]');
    if (pl) { const q = data[pl.dataset.play]; sayList([q[0], 'A. ' + q[1][0], 'B. ' + q[1][1], 'C. ' + q[1][2]]); return; }
    const qs = e.target.closest('[data-qsay]');
    if (qs) { say(qs.dataset.qsay); return; }
    const rs = e.target.closest('[data-qreset]');
    if (rs && rs.dataset.qreset === key) {
      if (S.qans) delete S.qans[key];
      save();
      go(curTab);
      return;
    }
    const b = e.target.closest('.opt');
    if (!b || b.dataset.q !== key) return;
    const i = +b.dataset.i, j = +b.dataset.j;
    S.qans = S.qans || {};
    S.qans[key] = S.qans[key] || {};
    if (S.qans[key][i] !== undefined) return;
    S.qans[key][i] = data[i][1][j];
    save();
    go(curTab);
  };
}

V.listen = () => `<h2>Luyện nghe</h2><p class="mut">Mô phỏng TOEIC Part 2 (hỏi – đáp). Giọng đọc do trình duyệt tạo, nên bạn nên bổ sung audio thật khi luyện đề.</p>
<div class="card row"><label for="rate">Tốc độ đọc</label><input id="rate" type="range" min="0.6" max="1.2" step="0.05" value="${S.rate || 0.95}"><span class="mut" id="rv">${S.rate || 0.95}x</span></div>${quiz('l', PART2, true)}
<div class="card"><h3>Mẹo Part 2 – Nghe</h3><p style="margin:0">Chú ý từ để hỏi (Who, When, Why…) ở đầu câu. Cẩn thận bẫy đồng âm như “meeting/meet” và đáp án gián tiếp như “I'll check with Ms. Park.”</p></div>`;
I.listen = () => { bindQuiz('l', PART2, true); $('#rate').oninput = e => { S.rate = +e.target.value; $('#rv').textContent = S.rate + 'x'; save() } };
V.read = () => `<h2>Luyện đọc – Ngữ pháp (Part 5)</h2><p class="mut">Chọn đáp án đúng, sau đó đọc giải thích ngay bên dưới.</p>${quiz('r', PART5, false)}`;
I.read = () => bindQuiz('r', PART5, false);

/* ---------- SPEAK ---------- */
const SP = () => mode === 'chat' ? SPEAKC : SPEAK;
V.speak = () => `<h2>${mode === 'chat' ? 'Luyện nói giao tiếp' : 'Luyện nói TOEIC'}</h2><p class="mut">Nghe mẫu, bấm ghi âm và đọc lại. Hệ thống so khớp từng từ (cần Chrome hoặc Edge và quyền micro).</p>
${SP().map((s, i) => `<div class="card"><p style="margin:0 0 10px;font-weight:500">${esc(s)}</p><div class="row"><button class="btn" data-say="${i}">🔊 Nghe mẫu</button><button class="btn p" data-rec="${i}">🎙 Ghi âm</button></div><div class="res" id="sp${i}"></div></div>`).join('')}`;
I.speak = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; $('#view').onclick = e => {
    const a = e.target.closest('[data-say]'); if (a) return say(SP()[a.dataset.say]); const r = e.target.closest('[data-rec]'); if (!r) return; const i = r.dataset.rec, out = $('#sp' + i);
    if (!SR) { out.textContent = 'Trình duyệt chưa hỗ trợ nhận dạng giọng nói. Hãy thử Chrome/Edge, hoặc tự ghi âm và so với bản mẫu.'; return }
    const rc = new SR(); rc.lang = 'en-US'; out.textContent = 'Đang nghe…'; rc.onresult = ev => { const heard = ev.results[0][0].transcript.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/); const tgt = SP()[i].toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/); const miss = tgt.filter(w => !heard.includes(w)); const p = Math.round((tgt.length - miss.length) / tgt.length * 100); out.innerHTML = `Khớp ${p}% — bạn nói: “${esc(ev.results[0][0].transcript)}”` + (miss.length ? `<br><span class="mut">Từ cần luyện lại: ${esc([...new Set(miss)].join(', '))}</span>` : '<br>Rất chuẩn!') }; rc.onerror = ev => { out.innerHTML = micMsg(ev.error) }; rc.start()
  }
};

/* ---------- WRITE ---------- */
V.write = () => `<h2>Luyện viết</h2><p class="mut">Viết xong, tự chấm theo checklist rồi so với bài mẫu.</p>
${WRITE.map((w, i) => `<div class="card"><span class="tag">Đề ${i + 1}</span><h3 style="margin-top:8px">${w.t}</h3><p>${esc(w.p)}</p><textarea data-w="${i}" placeholder="Viết bài của bạn ở đây…">${esc((S.w || {})[i] || '')}</textarea><div class="row" style="justify-content:space-between"><span class="mut" id="wc${i}">0 từ</span><button class="btn" data-model="${i}">Xem bài mẫu</button></div><pre id="md${i}" hidden style="white-space:pre-wrap;font:inherit;background:var(--bg);padding:12px;border-radius:10px;margin:10px 0 0">${esc(w.m)}</pre></div>`).join('')}
<div class="card"><h3>Checklist tự chấm</h3>${CHK.map(c => `<label class="chk"><input type="checkbox"><span>${c}</span></label>`).join('')}</div>`;
I.write = () => {
  const upd = t => { $('#wc' + t.dataset.w).textContent = (t.value.trim() ? t.value.trim().split(/\s+/).length : 0) + ' từ' }; document.querySelectorAll('textarea').forEach(upd);
  $('#view').oninput = e => { if (e.target.dataset.w !== undefined) { upd(e.target); S.w = S.w || {}; S.w[e.target.dataset.w] = e.target.value; save() } };
  $('#view').onclick = e => { const b = e.target.closest('[data-model]'); if (b) { const p = $('#md' + b.dataset.model); p.hidden = !p.hidden } }
};

/* ---------- CHAT ---------- */
V.chat = () => `<h2>Tiếng Anh giao tiếp</h2><p class="mut">Chọn tình huống, bấm vào từng câu để nghe. Bật “Đóng vai B” để làm mờ lời của B và tự nói trước khi xem.</p>
<div class="card row"><select id="sc" class="btn">${CONV.map((c, i) => `<option value="${i}">${c[0]}</option>`).join('')}</select><button class="btn p" id="all">▶ Nghe cả đoạn</button><label class="row mut"><input type="checkbox" id="vi" checked> Dịch</label><label class="row mut"><input type="checkbox" id="rp"> Đóng vai B</label></div><div class="card" id="dlg"></div>`;
I.chat = () => {
  const draw = () => { const c = CONV[$('#sc').value][1]; $('#dlg').className = 'card' + ($('#vi').checked ? '' : ' hide') + ($('#rp').checked ? ' blur' : ''); $('#dlg').innerHTML = c.map((l, i) => `<div class="line ${l[0] === 'B' ? 'me' : ''}" data-i="${i}"><b>${l[0]}</b><div><span class="en">${esc(l[1])}</span><span class="vi">${esc(l[2])}</span></div></div>`).join('') };
  draw();['sc', 'vi', 'rp'].forEach(id => $('#' + id).onchange = draw); $('#all').onclick = () => sayList(CONV[$('#sc').value][1].map(l => l[1]));
  $('#dlg').onclick = e => { const l = e.target.closest('.line'); if (l) say(CONV[$('#sc').value][1][l.dataset.i][1]) }
};

/* ---------- GRAMMAR VIEW ---------- */
V.gram = () => {
  const G = GRAM[mode], dn = S.gdone || {}, nd = G.filter((g, i) => dn[mode + i]).length;
  if (gl < 0) return `<h2>Ngữ pháp ${mode === 'toeic' ? 'TOEIC' : 'giao tiếp'}</h2><p class="mut">Đọc lý thuyết ngắn, xem ví dụ rồi làm bài tập kèm giải thích. Tích “Đã học” để theo dõi tiến độ.</p>
<div class="card"><h3>Đã học ${nd}/${G.length} bài</h3><div class="bar"><i style="width:${nd / G.length * 100}%"></i></div></div>`
    + G.map((g, i) => {
      const sv = (S.qans && S.qans['g' + mode + i]) || {};
      const doneN = Object.keys(sv).length;
      return `<div class="card row" style="justify-content:space-between"><div><b>${i + 1}. ${g[0]}</b>${dn[mode + i] ? ' ✓' : ''}<div class="mut" style="font-size:13px">${g[3].length} câu bài tập${doneN ? ` · Đã làm ${doneN}/${g[3].length}` : ''}</div></div><button class="btn p" data-gl="${i}">${dn[mode + i] ? 'Ôn lại' : 'Học'}</button></div>`;
    }).join('');
  const g = G[gl], k = 'g' + mode + gl;
  return `<button class="btn" id="gback">← Danh sách bài</button><h2 style="margin-top:12px">${gl + 1}. ${g[0]}</h2>
<div class="card">${g[1]}<h3 style="margin-top:12px">Ví dụ</h3>${g[2].map((x, i) => `<p style="margin:6px 0"><button class="sp" data-gs="${i}" aria-label="Đọc ví dụ">🔊</button> <b>${esc(x[0])}</b><br><span class="mut">${esc(x[1])}</span></p>`).join('')}
<label class="chk"><input type="checkbox" id="gdone" ${dn[mode + gl] ? 'checked' : ''}><span>Đã học xong bài này</span></label></div>
<h3>Bài tập</h3>${quiz(k, g[3], false)}${gl + 1 < G.length ? '<button class="btn p" id="gnext">Bài tiếp theo →</button>' : ''}`;
};
let gramScrollY = 0; // Lưu vị trí cuộn của danh sách bài ngữ pháp

const scrollToView = () => {
  const nav = document.querySelector('nav');
  const navH = nav ? nav.offsetHeight : 0;
  const top = $('#view').getBoundingClientRect().top + window.scrollY - navH - 6;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
};

I.gram = () => {
  const v = $('#view'), G = GRAM[mode];
  if (gl < 0) {
    v.onclick = e => {
      const b = e.target.closest('[data-gl]');
      if (b) {
        gramScrollY = window.scrollY; // Nhớ vị trí đang đứng ở danh sách
        gl = +b.dataset.gl;
        go('gram');
        scrollToView(); // Nhảy thẳng tới chỗ nút "← Danh sách bài" như ảnh
      }
    };
    return;
  }
  const g = G[gl], k = 'g' + mode + gl;
  bindQuiz(k, g[3], false);
  const h = v.onclick;
  v.onclick = e => {
    if (e.target.closest('#gback')) {
      gl = -1;
      go('gram');
      window.scrollTo({ top: gramScrollY, behavior: 'instant' }); // Trả về đúng chỗ bài vừa bấm
      return;
    }
    if (e.target.closest('#gnext')) {
      gl++;
      go('gram');
      scrollToView(); // Sang bài tiếp theo cũng căn ngay đầu bài học
      return;
    }
    const s = e.target.closest('[data-gs]');
    if (s) { say(g[2][s.dataset.gs][0]); return; }
    h(e);
  };
  v.onchange = e => {
    if (e.target.id === 'gdone') {
      S.gdone = S.gdone || {};
      S.gdone[mode + gl] = e.target.checked;
      save();
    }
  };
};

/* ---------- VOCAB LOGIC & GEMINI API ---------- */
let vi = 0, flip = false, vcat = 'all', vview = 'card', Q = null, vonly = false;
const VL = () => mode === 'chat' ? VOCC : VOC, KK = () => 'known_' + mode;
const IDX = () => VL().map((w, i) => i).filter(i => vcat === 'all' || VL()[i][3] === vcat);
const DECK = () => { const k = S[KK()] || {}; return vonly ? IDX().filter(i => !k[i]) : IDX() };
const BAD = /→| = /, POOL = () => IDX().filter(i => !BAD.test(VL()[i][0]));
const shuf = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const norm = t => String(t).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');

function pos0(w) {
  if (mode === 'chat') return 'cụm từ'; if (CATPOS[w[3]]) return CATPOS[w[3]]; const t = w[0]; if (WN[t]) return WN[t]; if (!/^[a-z]+$/.test(t)) return '';
  if (/ly$/.test(t) && !/^(assembly\vert{}supply\vert{}apply\vert{}reply\vert{}rely\vert{}family)$/.test(t)) return 'adv';
  if (/(tion|sion|ity|ness)$/.test(t)) return 'n';
  if (/ment$/.test(t) && !/^(implement\vert{}complement\vert{}compliment\vert{}supplement)$/.test(t)) return 'n';
  if (/(ance|ence)$/.test(t) && t !== 'commence') return 'n';
  if (/(ize|ify)$/.test(t)) return 'v';
  if (/(ous|ful|ible|able)$/.test(t)) return 'adj'; return '';
}

let E = {}, vErr = ''; try { E = JSON.parse(localStorage.getItem('eng900_ex') || '{}') } catch (e) { }
const saveE = () => { try { localStorage.setItem('eng900_ex', JSON.stringify(E)) } catch (e) { } };
const ek = i => mode + '|' + VL()[i][0], busy = new Set();
const info = i => { const w = VL()[i], c = E[ek(i)] || {}; return { pos: c.pos || pos0(w), ex: c.ex || w[2] || '', vi: c.vi || '' } };

const ipaS = i => {
  const c = E[ek(i)] || {};
  const t = c.ipa || IPA[VL()[i][0]];
  if (!t) return '';
  const clean = String(t).replace(/^\/+|\/+$/g, '').trim();
  return clean ? '/' + clean + '/' : '';
};
const ipaB = i => { const t = ipaS(i); return t ? ` <span class="ipa">${esc(t)}</span>` : '' };
const posS = i => { const p = info(i).pos; return p ? ' (' + esc(p) + ')' : '' };
const exS = i => { const x = info(i); return x.ex ? '<br>“' + esc(x.ex) + '”' + (x.vi ? '<br>' + esc(x.vi) : '') : '' };
const setMsg = t => { const m = $('#vmsg'); if (m) m.textContent = t };
const vstat = () => { const idx = IDX(); const c = idx.filter(i => E[ek(i)]).length; return c + '/' + idx.length + ' mục trong danh sách đã có IPA, loại từ và ví dụ' + (busy.size ? ' · đang tạo…' : '') + (vErr ? ' · ' + vErr : '') };
const lineHTML = (i, k) => { const L = VL(), x = info(i); return `<div class="line" data-i="${i}"><div><span class="en"><strong>${esc(L[i][0])}</strong><button class="sp" data-w="${i}" aria-label="Đọc từ">🔊</button>${BAD.test(L[i][0]) ? '' : `<button class="sp" data-m="${i}" aria-label="Đọc thử">🎙</button>`}${ipaB(i)}${x.pos ? ` <i class="mut">(${esc(x.pos)})</i>` : ''} ${k[i] ? '✓' : ''} – ${esc(L[i][1])}</span>${x.ex ? `<span class="vi"><button class="sp" data-e="${i}" aria-label="Đọc ví dụ">🔊</button> “${esc(x.ex)}”${x.vi ? ' — ' + esc(x.vi) : ''}</span>` : ''}<span class="vi" id="lr${i}" aria-live="polite"></span></div></div>` };
const cardFace = (i, f, n, t) => {
  const w = VL()[i], x = info(i);
  if (!f) return `${esc(w[0])}${ipaS(i) ? `<small class="ipa">${esc(ipaS(i))}</small>` : ''}<small>${x.pos ? '(' + esc(x.pos) + ') · ' : ''}${esc(w[3])} · ${n}/${t}</small>`;
  return `${esc(w[1])}<small>${x.pos ? '(' + esc(x.pos) + ') ' : ''}${esc(w[0])} ${esc(ipaS(i))}</small>${x.ex ? `<small>“${esc(x.ex)}”</small>${x.vi ? `<small>${esc(x.vi)}</small>` : ''}` : `<small>${busy.size ? 'Đang tạo ví dụ…' : 'Mục này chưa có ví dụ (Bấm ✨ Tạo ví dụ ở trên)'}</small>`}`;
};

function startQuiz(type, n, ids) {
  const L = VL(); const base = ids || shuf(POOL()).slice(0, n);
  const qs = base.map(i => {
    let t = type; if (t === 'mix') t = ['en2vi', 'vi2en', 'listen', mode === 'toeic' ? 'type' : 'vi2en'][Math.floor(Math.random() * 4)];
    const same = L.map((w, k) => k).filter(k => k !== i && L[k][3] === L[i][3] && !BAD.test(L[k][0]));
    const oth = shuf(same.length >= 3 ? same : L.map((w, k) => k).filter(k => k !== i && !BAD.test(L[k][0]))).slice(0, 3);
    return { i, t, opts: shuf([i, ...oth]) };
  }); Q = { qs, k: 0, score: 0, wrong: [], type, ans: null };
}

function quizView() {
  const L = VL(), pl = POOL().length;
  if (!Q) return `<div class="card"><h3>Bài tập từ vựng</h3><p class="mut">Chủ đề: ${vcat === 'all' ? 'tất cả' : esc(vcat)} · ${pl} mục khả dụng. Đáp đúng sẽ tự đánh dấu "Đã thuộc", đáp sai sẽ đánh dấu "Chưa thuộc". Mẹo: chọn một chủ đề ở trên để ôn theo nhóm.</p><div class="row"><select id="qt" class="btn"><option value="mix">Tổng hợp</option><option value="en2vi">Anh → Việt (chọn nghĩa)</option><option value="vi2en">Việt → Anh (chọn từ)</option><option value="listen">Nghe và chọn từ</option>${mode === 'toeic' ? '<option value="type">Gõ lại từ tiếng Anh</option>' : ''}</select><select id="qn" class="btn"><option>10</option><option>20</option><option>30</option></select><button class="btn p" id="qs" ${pl < 4 ? 'disabled' : ''}>Bắt đầu</button></div></div>`;
  if (Q.k >= Q.qs.length) { const pc = Math.round(Q.score / Q.qs.length * 100); return `<div class="card"><h3>Kết quả: ${Q.score}/${Q.qs.length} (${pc}%)</h3><p>${pc >= 90 ? 'Xuất sắc!' : pc >= 70 ? 'Khá tốt, ôn lại vài từ nhé.' : 'Cần luyện thêm, hãy làm lại các câu sai.'}</p>${Q.wrong.length ? '<h3>Từ cần ôn (bấm để nghe)</h3>' + [...new Set(Q.wrong)].map(i => `<div class="line" data-s="${i}"><div><span class="en"><strong>${esc(L[i][0])}</strong> –${esc(L[i][1])}</span></div></div>`).join('') : ''}<div class="row" style="margin-top:12px">${Q.wrong.length ? '<button class="btn p" id="qr">Làm lại câu sai</button>' : ''}<button class="btn" id="qx">Bài mới</button></div></div>` }
  const q = Q.qs[Q.k], w = L[q.i], done = Q.ans !== null;
  const ok = done && (q.t === 'type' ? norm(Q.ans) === norm(w[0]) : q.opts[Q.ans] === q.i);
  const pr = { en2vi: `<div style="font-size:28px;font-weight:800;margin:6px 0">${esc(w[0])} <button class="btn" id="qp" aria-label="Nghe">🔊</button>${ipaS(q.i) ? `<div class="ipa" style="font-size:18px;font-weight:500">${esc(ipaS(q.i))}</div>` : ''}</div>`, vi2en: `<p style="font-size:20px;font-weight:700;margin:6px 0">Từ nào có nghĩa: “${esc(w[1])}”?</p>`, listen: `<p style="margin:6px 0">Nghe và chọn từ bạn nghe được. <button class="btn" id="qp">🔊 Nghe lại</button></p>`, type: `<p style="font-size:20px;font-weight:700;margin:6px 0">Gõ từ tiếng Anh có nghĩa: “${esc(w[1])}”</p>` }[q.t];
  let opt = '';
  if (q.t === 'type') opt = done ? '' : `<div class="row"><input id="qi" class="btn" style="flex:1;min-width:180px;font:inherit" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ tiếng Anh"><button class="btn p" id="qc">Kiểm tra</button></div>`;
  else opt = q.opts.map((o, j) => { const txt = q.t === 'en2vi' ? L[o][1] : L[o][0]; let c = ''; if (done) { if (o === q.i) c = ' ok'; else if (j === Q.ans) c = ' no' } return `<button class="btn opt${c}" data-o="${j}" ${done ? 'disabled' : ''}>${esc(txt)}</button>` }).join('');
  const fb = done ? `<div class="exp"><b>${ok ? '✓ Chính xác!' : '✗ Chưa đúng.'}</b> ${esc(w[0])}${ipaB(q.i)}${posS(q.i)} – ${esc(w[1])}${exS(q.i)}</div><div class="row" style="margin-top:12px"><button class="btn" id="qw">🔊 Đọc từ</button><button class="btn" id="qm">🎙 Đọc thử từ</button>${info(q.i).ex ? '<button class="btn" id="qe">🔊 Đọc ví dụ</button>' : ''}<button class="btn p" id="qnx">${Q.k + 1 < Q.qs.length ? 'Câu tiếp theo' : 'Xem kết quả'}</button></div><div id="qres" aria-live="polite" style="margin-top:10px"></div>` : '';
  return `<div class="card"><div class="bar"><i style="width:${Q.k / Q.qs.length * 100}%"></i></div><p class="mut" style="margin:0">Câu ${Q.k + 1}/${Q.qs.length} · Điểm ${Q.score}</p>${pr}${opt}${fb}</div>`;
}

function quizBind() {
  const L = VL(), v = $('#view');
  if (!Q) { $('#qs').onclick = () => { startQuiz($('#qt').value, Math.min(+$('#qn').value, POOL().length)); go('vocab') }; return }
  if (Q.k >= Q.qs.length) { const r = $('#qr'); if (r) r.onclick = () => { startQuiz(Q.type, 0, shuf([...new Set(Q.wrong)])); go('vocab') }; $('#qx').onclick = () => { Q = null; go('vocab') }; v.onclick = e => { const l = e.target.closest('[data-s]'); if (l) say(L[l.dataset.s][0]) }; return }
  const q = Q.qs[Q.k], w = L[q.i];
  const fin = ok => { if (ok) Q.score++; else Q.wrong.push(q.i); S[KK()] = S[KK()] || {}; S[KK()][q.i] = ok; save(); go('vocab') };
  if ((q.t === 'listen' && Q.ans === null) || Q.ans !== null) say(w[0]);
  const rp = $('#qp'); if (rp) rp.onclick = () => say(w[0]);
  const chk = () => { const t = $('#qi').value.trim(); if (!t || Q.ans !== null) return; Q.ans = t; fin(norm(t) === norm(w[0])) };
  v.onclick = e => {
    const o = e.target.closest('[data-o]'); if (o && Q.ans === null) { Q.ans = +o.dataset.o; fin(q.opts[Q.ans] === q.i); return }
    if (e.target.id === 'qnx') { Q.k++; Q.ans = null; go('vocab') } else if (e.target.id === 'qc') chk(); else if (e.target.id === 'qw') say(w[0]); else if (e.target.id === 'qm') recCheck(w[0], h => { const o = $('#qres'); if (o) o.innerHTML = h }); else if (e.target.id === 'qe') say(info(q.i).ex)
  };
  const qi = $('#qi'); if (qi) { qi.focus(); qi.onkeydown = e => { if (e.key === 'Enter') chk() } }
}

const getApiKey = () => S.geminiKey || '';
let cachedModels = null;
const setApiKey = (k) => { S.geminiKey = k.trim(); cachedModels = null; save(); };
let isCallingApi = false;

async function getAvailableFlashModels(apiKey) {
  if (cachedModels && cachedModels.length) return cachedModels;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`);
    const data = await res.json();
    if (data && Array.isArray(data.models)) {
      const list = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace("models/", ""))
        .filter(name => name.includes("flash") || name.includes("gemini"));
      if (list.length) return (cachedModels = list);
    }
  } catch (e) { }
  return (cachedModels = ["gemini-3.8-flash", "gemini-3.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]);
}

async function callGemini(promptText) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa nhập API Key");
  const models = await getAvailableFlashModels(apiKey);
  let lastError = "";
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      vErr = `đang gọi model ${model}…`;
      setMsg(vstat());
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
        rawText = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        return JSON.parse(rawText);
      }
      const errMsg = data?.error?.message || `HTTP ${res.status}`;
      lastError = `[${model}] ${errMsg}`;
      if (res.status === 400 || res.status === 403) {
        if (errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("permission") || errMsg.toLowerCase().includes("referer")) {
          throw new Error(errMsg);
        }
      }
    } catch (err) {
      lastError = err.message;
      if (lastError.toLowerCase().includes("api key not valid")) throw err;
    }
  }
  throw new Error(lastError || "Tất cả các model đều chạm giới hạn 429.");
}

async function enrich(ids) {
  if (!getApiKey()) {
    vErr = 'chưa nhập Gemini API Key (bấm "🔑 Nhập API Key" để cài đặt)';
    setMsg(vstat());
    return false;
  }
  if (isCallingApi) return false;
  const L = VL(), m = mode;
  const need = ids.filter(i => (!E[ek(i)] || !E[ek(i)].ipa) && !busy.has(ek(i))).slice(0, 6);
  if (!need.length) return true;

  isCallingApi = true;
  const keys = {};
  need.forEach(i => { keys[L[i][0]] = m + '|' + L[i][0]; busy.add(m + '|' + L[i][0]); });
  setMsg(vstat());

  const items = JSON.stringify(need.map(i => ({ w: L[i][0], vi: L[i][1] })));
  const kind = m === 'chat'
    ? 'a short, natural everyday spoken line that uses the phrase'
    : 'one natural business-English sentence in TOEIC style (8-15 words) that uses the word';
  const prompt = `For each item return a JSON array of objects {"w": the item text exactly as given, "ipa": US English IPA transcription without surrounding slashes, "pos": its part of speech in the example using only n, v, adj, adv, prep, conj, phr. v, phr. or n/v, "ex": ${kind}, "vi": the Vietnamese translation of the sentence}. Return only the JSON array. Items: ${items}`;

  try {
    const r = await callGemini(prompt);
    (Array.isArray(r) ? r : (r && r.items) || []).forEach(o => {
      if (o && keys[o.w] && o.ex) {
        const cleanIpa = o.ipa ? String(o.ipa).replace(/^\/+|\/+$/g, '').trim() : '';
        E[keys[o.w]] = { ipa: cleanIpa, pos: o.pos || '', ex: o.ex, vi: o.vi || '' };
      }
    });
    saveE();
    vErr = '';
    return true;
  } catch (e) {
    console.error("Gemini Error:", e);
    vErr = 'Chi tiết lỗi: ' + (e.message || 'Không xác định');
    return false;
  } finally {
    isCallingApi = false;
    Object.values(keys).forEach(k => busy.delete(k));
    if (curTab === 'vocab' && vview !== 'quiz' && !(document.activeElement && document.activeElement.id === 'qi')) go('vocab');
    else setMsg(vstat());
  }
}

async function genBtn() {
  if (isCallingApi) return;
  let ids = [];
  if (vview === 'card') {
    const dk = DECK();
    if (dk.length) {
      const ordered = [...Array(dk.length)].map((_, j) => dk[(vi + j) % dk.length]);
      ids = ordered.filter(i => !E[ek(i)] || !E[ek(i)].ipa).slice(0, 6);
    }
  } else {
    ids = IDX().filter(i => !E[ek(i)] || !E[ek(i)].ipa).slice(0, 6);
  }
  if (!ids.length) {
    vErr = 'Tất cả các từ trong mục này đều đã có IPA, loại từ và ví dụ!';
    setMsg(vstat());
    return;
  }
  await enrich(ids);
  setMsg(vstat());
}

const micBlocked = () => { try { const p = document.permissionsPolicy || document.featurePolicy; return !!(p && p.allowsFeature && !p.allowsFeature('microphone')) } catch (e) { return false } };
const micMsg = er => er === 'not-allowed' || er === 'service-not-allowed' ? (micBlocked() ? '<b>Micro bị chặn bởi khung chứa trang này</b>, hãy dùng bản web riêng (GitHub Pages) để ghi âm.' : '<b>Chưa có quyền micro.</b> Bấm biểu tượng ổ khóa cạnh thanh địa chỉ, chọn Micro → Cho phép, rồi tải lại trang.') : er === 'no-speech' ? 'Không nghe thấy tiếng. Hãy thử lại và đọc to hơn.' : 'Không ghi âm được, hãy thử lại.';
let vres = null;
const nz = t => String(t).toLowerCase().replace(/'/g, '').replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean);
function recCheck(target, show) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { show('<span class="mut">Trình duyệt chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge (địa chỉ https).</span>'); return }
  if (hasTTS) speechSynthesis.cancel(); const rc = new SR(); rc.lang = 'en-US'; rc.maxAlternatives = 5; show('🎙 Đang nghe… hãy đọc to và rõ.');
  const tw = nz(target), tj = tw.join(''); let done = false;
  rc.onresult = ev => {
    done = true; const alts = [...ev.results[0]]; let best = null;
    alts.forEach(a => { const hw = nz(a.transcript), sc = hw.join('') === tj ? tw.length + 1 : tw.filter(w => hw.includes(w)).length; if (!best || sc > best.sc) best = { sc, a, hw } });
    const hit = Math.min(best.sc, tw.length), pc = Math.round(hit / tw.length * 100), conf = Math.round((best.a.confidence || 0) * 100), miss = tw.filter(w => !best.hw.includes(w)); let v;
    if (pc === 100) v = conf && conf < 50 ? '<b>◐ Đúng từ nhưng giọng chưa rõ.</b> Hãy đọc rõ hơn.' : '<b style="color:var(--ok)">✓ Phát âm đúng!</b>';
    else if (pc >= 50) v = `<b>◐ Gần đúng (${pc}%).</b> Cần đọc rõ: ${esc(miss.join(', '))}`;
    else v = `<b style="color:var(--bad)">✗ Chưa đúng.</b> Máy nghe thành “${esc(alts[0].transcript)}”.`;
    show(v + `<br><span class="mut">Máy nghe được: “${esc(best.a.transcript)}”${conf ? ' · độ tin cậy ' + conf + '%' : ''}. Bấm 🔊 nghe mẫu rồi thử lại.</span>`);
  };
  rc.onerror = ev => { done = true; show('<span class="mut">' + micMsg(ev.error) + '</span>') };
  rc.onend = () => { if (!done) show('<span class="mut">Không nghe thấy tiếng. Hãy thử lại.</span>') };
  try { rc.start() } catch (e) { }
}

let showKeyBox = false;
V.vocab = () => {
  const L = VL(), idx = IDX(), k = S[KK()] || {}; const n = Object.values(k).filter(Boolean).length;
  const cats = [...new Set(L.map(w => w[3]))]; if (vcat !== 'all' && !cats.includes(vcat)) vcat = 'all';
  const hasKey = !!getApiKey();
  const head = `<h2>${mode === 'chat' ? 'Cụm từ giao tiếp' : 'Từ vựng TOEIC'}</h2><p class="mut">${L.length} mục theo ${cats.length} chủ đề. Đã thuộc ${n}/${L.length}.</p><div class="bar"><i style="width:${n / L.length * 100}%"></i></div>
<div class="row" style="margin:12px 0"><select id="vc" class="btn" aria-label="Chủ đề"><option value="all">Tất cả (${L.length})</option>${cats.map(c => `<option ${c === vcat ? 'selected' : ''} value="${esc(c)}">${esc(c)} (${L.filter(w => w[3] === c).length})</option>`).join('')}</select>${[['card', 'Thẻ lật'], ['list', 'Danh sách'], ['quiz', 'Bài tập']].map(([a, t]) => `<button class="btn ${vview === a ? 'p' : ''}" data-v="${a}">${t}</button>`).join('')}<button class="btn" id="vg" ${isCallingApi ? 'disabled' : ''}>${isCallingApi ? '⏳ Đang tạo…' : '✨ Tạo ví dụ & loại từ'}</button><button class="btn" id="vkeyBtn">${hasKey ? '🔑 Đã có Key' : '🔑 Nhập API Key'}</button></div>
<div class="card" id="vkeyBox" ${showKeyBox ? '' : 'hidden'} style="margin:8px 0">
  <div class="row">
    <input type="password" id="vkeyInp" class="btn" style="flex:1;min-width:220px" placeholder="Dán Gemini API Key (AIzaSy...) vào đây" value="${esc(getApiKey())}">
    <button class="btn p" id="vkeySave">Lưu Key</button>
    ${hasKey ? '<button class="btn" id="vkeyDel">Xóa Key</button>' : ''}
  </div>
  <p class="mut" style="margin:6px 0 0;font-size:12px">Key chỉ lưu cục bộ trong trình duyệt máy bạn (localStorage), tuyệt đối không bị lộ lên GitHub. Lấy miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener" style="color:var(--acc)">Google AI Studio</a>.</p>
</div>
<p class="mut" id="vmsg" style="margin:0 0 10px;font-size:13px">${vstat()}</p>`;
  if (vview === 'quiz') return head + quizView();
  if (vview === 'list') return head + `<div class="card" id="vl">${idx.map(i => lineHTML(i, k)).join('')}</div>`;
  const dk = DECK();
  if (!dk.length) return head + `<div class="card"><h3>🎉 Bạn đã thuộc hết các từ trong danh sách này</h3><p class="mut">Chọn chủ đề khác, hoặc tắt chế độ “Chỉ ôn từ chưa thuộc” để xem lại tất cả.</p><button class="btn p" id="vo">Xem lại tất cả</button></div>`;
  const cur = vi % dk.length;
  return head + `<label class="row mut" style="margin:0 0 8px"><input type="checkbox" id="vonly" ${vonly ? 'checked' : ''}> Chỉ ôn các từ chưa thuộc (${dk.length} từ)</label>
<div class="card flash" id="fc" tabindex="0" role="button" aria-label="Lật thẻ"><div>${cardFace(dk[cur], flip, cur + 1, dk.length)}</div></div>
<div class="row" style="justify-content:center;margin-bottom:8px"><button class="btn" id="vs">🔊 Đọc từ</button><button class="btn p" id="vm" ${BAD.test(L[dk[cur]][0]) ? 'disabled' : ''}>🎙 Đọc thử từ</button></div>
<div class="row" style="justify-content:center;margin-bottom:8px"><button class="btn" id="ve" ${info(dk[cur]).ex ? '' : 'disabled'}>🔊 Đọc ví dụ</button><button class="btn p" id="vme" ${info(dk[cur]).ex ? '' : 'disabled'}>🎙 Đọc thử ví dụ</button></div>
<div id="vres" aria-live="polite" style="min-height:24px;margin:6px 0 12px;text-align:center">${vres && vres.i === dk[cur] ? vres.h : ''}</div>
<div class="row" style="justify-content:space-between"><button class="btn" id="vpv">← Từ trước</button><button class="btn" id="vnx">Từ tiếp →</button></div>
<div class="row" style="margin-top:10px"><button class="btn" id="vn">✗ Chưa thuộc</button><button class="btn p" id="vk">✓ Đã thuộc</button></div>
<p class="mut" style="font-size:13px;margin:12px 0 8px"><b>Đã thuộc</b>: tính vào thanh tiến độ ở trên, và khi bật “Chỉ ôn từ chưa thuộc” thì từ đó biến khỏi bộ thẻ. <b>Chưa thuộc</b>: giữ từ lại để ôn tiếp. Cả hai nút đều tự chuyển sang từ kế tiếp. Có thể dùng phím ← → để đổi từ và Enter để lật thẻ.</p>
<button class="btn" id="vr">Xóa tiến độ</button>`;
};

I.vocab = () => {
  const L = VL(), idx = IDX(); document.onkeydown = null; $('#vc').onchange = e => { vcat = e.target.value; vi = 0; flip = false; Q = null; go('vocab') };
  document.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { vview = b.dataset.v; go('vocab') });
  $('#vg').onclick = genBtn;
  $('#vkeyBtn').onclick = () => { showKeyBox = !showKeyBox; go('vocab') };
  const kbSave = $('#vkeySave'); if (kbSave) kbSave.onclick = () => {
    const val = $('#vkeyInp').value.trim();
    setApiKey(val);
    showKeyBox = false;
    vErr = '';
    go('vocab');
  };
  const kbDel = $('#vkeyDel'); if (kbDel) kbDel.onclick = () => {
    setApiKey('');
    showKeyBox = false;
    go('vocab');
  };
  if (vview === 'quiz') return quizBind();
  if (vview === 'list') { $('#vl').onclick = e => { const a = e.target.closest('[data-w]'), b = e.target.closest('[data-e]'), m = e.target.closest('[data-m]'); if (a) say(L[a.dataset.w][0]); else if (b) say(info(+b.dataset.e).ex); else if (m) recCheck(L[m.dataset.m][0], h => { const o = $('#lr' + m.dataset.m); if (o) o.innerHTML = h }) }; return }
  const dk = DECK(); if (!dk.length) { $('#vo').onclick = () => { vonly = false; go('vocab') }; return }
  const real = () => dk[vi % dk.length];
  const step = d => { vi = ((vi % dk.length) + d + dk.length) % dk.length; flip = false; go('vocab') };
  const mark = v => { S[KK()] = S[KK()] || {}; S[KK()][real()] = v; save(); if (vonly && v) vi = vi % dk.length; else vi = (vi + 1) % dk.length; flip = false; go('vocab') };
  $('#vonly').onchange = e => { vonly = e.target.checked; vi = 0; flip = false; go('vocab') };
  $('#fc').onclick = () => { flip = !flip; go('vocab') }; $('#fc').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip = !flip; go('vocab') } };
  document.onkeydown = e => { if (curTab === 'vocab' && vview === 'card' && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) { if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1) } };
  $('#vpv').onclick = () => step(-1); $('#vnx').onclick = () => step(1);
  $('#vs').onclick = () => say(L[real()][0]); $('#ve').onclick = () => { const x = info(real()).ex; if (x) say(x) };
  const rshow = i => h => { vres = { i, h }; const o = $('#vres'); if (o && real() === i) o.innerHTML = h };
  $('#vm').onclick = () => recCheck(L[real()][0], rshow(real())); $('#vme').onclick = () => { const x = info(real()).ex; if (x) recCheck(x, rshow(real())) }; $('#vn').onclick = () => mark(false); $('#vk').onclick = () => mark(true);
  $('#vr').onclick = () => { if (confirm('Xóa toàn bộ tiến độ “đã thuộc” của chương trình này?')) { S[KK()] = {}; save(); vi = 0; flip = false; go('vocab') } }
};

drawModes();
go(MODES[mode].tabs[0][0]);
