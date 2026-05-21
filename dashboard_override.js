let cachedBankQuestionTotal = null;
let cachedBankQuestionTotalAt = 0;

function saveAnsweredQuestion(q, correct, selected, fromWrongNote) {
  const user = userData();
  const progressKey = `${q.grade || "-"}:${q.subjectName}:${q.chapterTitle}`;
  user.progress[progressKey] ||= { total: 0, correct: 0 };

  if (!fromWrongNote) {
    user.progress[progressKey].total += 1;
    if (correct) user.progress[progressKey].correct += 1;
    user.studyLog ||= [];
    user.studyLog.push({
      at: new Date().toISOString(),
      grade: q.grade || "-",
      subjectName: q.subjectName || "",
      chapterTitle: q.chapterTitle || "",
      difficulty: q.difficulty || "normal",
      correct: Boolean(correct),
      prompt: q.prompt || "",
      choices: q.choices || [],
      answer: q.answer || "",
      selected: selected || "",
      solution: q.solution || "",
      typeIndex: q.typeIndex,
      bankId: q.bankId || q.createdAt || q.prompt || "",
    });
  }

  if (!correct) {
    recordWrongType(q, user);
    user.wrong = user.wrong.filter((item) => item.prompt !== q.prompt);
    user.wrong.push({ ...q, selected, savedAt: new Date().toISOString() });
  }
  saveUser(user);
}

function renderStats() {
  renderStatsAsync();
}

async function renderStatsAsync() {
  if (!state.user) return;
  const user = userData();
  user.studyLog ||= [];
  user.servedBank ||= {};
  const subjects = [...new Set(db.subjects.map((subject) => subject.name))];
  const selectedGrade = localStorage.getItem(`${STORE}:statsGrade`) || "all";
  const selectedSubject = localStorage.getItem(`${STORE}:statsSubject`) || "all";
  const progressStats = Object.values(user.progress || {});
  const totalSolved = progressStats.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const correct = progressStats.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
  const bankTotal = cachedBankQuestionTotal;
  const uniqueSolved = new Set(Object.values(user.servedBank).flat()).size;
  const savedTab = localStorage.getItem(`${STORE}:dashboardTab`) || "daily";
  const activeTab = ["daily", "weekly", "monthly", "overall"].includes(savedTab) ? savedTab : "daily";
  const tabs = [
    ["daily", "일별 현황"],
    ["weekly", "주간 현황"],
    ["monthly", "월간 현황"],
    ["overall", "전체 대비"],
  ];
  window.__edudashStatsContext = { logs: user.studyLog, bankTotal, uniqueSolved, totalSolved, correct };
  const rows = Object.entries(user.progress || {}).filter(([key]) => {
    const [grade, subject] = key.split(":");
    return (selectedGrade === "all" || selectedGrade === grade) && (selectedSubject === "all" || selectedSubject === subject);
  }).map(([key, value]) => {
    const [grade, subject, chapter] = key.split(":");
    return `<div class="stat"><span class="badge">${grade}학년 · ${escapeText(subject)}</span><p>${escapeText(chapter)}</p><strong>${value.correct} / ${value.total}</strong></div>`;
  }).join("");
  const statsBody = rows
    ? `<div class="grid">${rows}</div>`
    : `<div class="panel"><h3>아직 학습 기록이 없습니다</h3><p class="muted">퀴즈를 풀면 학년별·과목별 학습 기록이 쌓입니다.</p></div>`;
  const todayItems = user.studyLog.filter((item) => dateKey(new Date(item.at)) === dateKey(new Date()))
    .filter((item) => selectedGrade === "all" || item.grade === selectedGrade)
    .filter((item) => selectedSubject === "all" || item.subjectName === selectedSubject)
    .slice()
    .reverse();
  $("#stats-view").innerHTML = `
    <div class="grid">
      <div class="stat">전체 풀이<strong>${totalSolved}</strong></div>
      <div class="stat">정답<strong>${correct}</strong></div>
      <div class="stat">오답노트<strong>${user.wrong.length}</strong></div>
      <div class="stat">정답률<strong>${totalSolved ? Math.round((correct / totalSolved) * 100) : 0}%</strong></div>
    </div>
    <div class="panel dashboard-panel">
      <div class="tabs" role="tablist">
        ${tabs.map(([key, label]) => `<button class="tab ${activeTab === key ? "active" : ""}" data-dashboard-tab="${key}" type="button">${label}</button>`).join("")}
      </div>
      <div class="tab-content">
        ${dashboardTabContent(activeTab, user.studyLog, bankTotal, uniqueSolved, totalSolved, correct)}
      </div>
    </div>
    <div class="panel" style="margin-bottom:16px">
      <div class="form-grid">
        <label>학년
          <select id="stats-grade">
            <option value="all">전체</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
        </label>
        <label>과목
          <select id="stats-subject">
            <option value="all">전체</option>
            ${subjects.map((subject) => `<option value="${escapeAttr(subject)}">${escapeText(subject)}</option>`).join("")}
          </select>
        </label>
      </div>
    </div>
    ${statsBody}
    <div class="panel today-review">
      <h3>오늘 푼 문제</h3>
      ${todayItems.length ? `<div class="list">${todayItems.map((item, index) => todayQuestionCard(item, index)).join("")}</div>` : `<p class="muted">오늘 푼 문제 기록이 없습니다. 새로 푼 문제부터 이곳에서 다시 볼 수 있습니다.</p>`}
    </div>
  `;
  $("#stats-grade").value = selectedGrade;
  $("#stats-subject").value = selectedSubject;
  $("#stats-grade").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:statsGrade`, event.target.value);
    renderStats();
  });
  $("#stats-subject").addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:statsSubject`, event.target.value);
    renderStats();
  });
  $$("#stats-view [data-dashboard-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      switchStatsTab(button.dataset.dashboardTab);
    });
  });
  refreshStatsBankTotal();
  renderMath();
}

function switchStatsTab(tab) {
  const allowedTabs = ["daily", "weekly", "monthly", "overall"];
  const activeTab = allowedTabs.includes(tab) ? tab : "daily";
  localStorage.setItem(`${STORE}:dashboardTab`, activeTab);
  const context = window.__edudashStatsContext;
  if (!context) {
    renderStats();
    return;
  }
  $$("#stats-view [data-dashboard-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.dashboardTab === activeTab);
  });
  const content = $("#stats-view .tab-content");
  if (content) {
    content.innerHTML = dashboardTabContent(
      activeTab,
      context.logs,
      context.bankTotal,
      context.uniqueSolved,
      context.totalSolved,
      context.correct
    );
  }
  if (activeTab === "overall" && context.bankTotal === null) {
    refreshStatsBankTotal();
  }
}

async function refreshStatsBankTotal() {
  const context = window.__edudashStatsContext;
  if (!context) return;
  const total = await getTotalBankQuestionCount();
  context.bankTotal = total;
  const activeTab = localStorage.getItem(`${STORE}:dashboardTab`) || "daily";
  if (state.view === "stats" && activeTab === "overall") {
    const content = $("#stats-view .tab-content");
    if (content) {
      content.innerHTML = dashboardTabContent(
        "overall",
        context.logs,
        context.bankTotal,
        context.uniqueSolved,
        context.totalSolved,
        context.correct
      );
    }
  }
}

function todayQuestionCard(item, index) {
  const prompt = item.prompt ? formatMathText(item.prompt) : "이전 버전에서 기록된 문제라 문제 내용이 저장되어 있지 않습니다.";
  const choices = Array.isArray(item.choices) && item.choices.length
    ? `<div class="choices review-choices">${item.choices.map((choice) => {
      const cls = choice === item.answer ? "choice correct" : choice === item.selected && choice !== item.answer ? "choice wrong" : "choice";
      return `<div class="${cls}">${formatMathText(choice)}</div>`;
    }).join("")}</div>`
    : "";
  return `<article class="panel question today-question">
    <div class="bank-meta">
      <span class="badge">#${index + 1}</span>
      <span class="badge">${escapeText(item.grade)}학년 · ${escapeText(item.subjectName)} · ${escapeText(item.chapterTitle)}</span>
      <span class="badge">${item.correct ? "정답" : "오답"}</span>
    </div>
    <h3 class="question-title">${prompt}</h3>
    ${choices}
    <p class="muted">선택: ${formatMathText(item.selected || "-")} · 정답: ${formatMathText(item.answer || "-")}</p>
    ${item.solution ? `<div class="solution">${formatMathText(item.solution)}</div>` : ""}
  </article>`;
}

function resetCurrentUser() {
  showResetDialog();
}

function showResetDialog() {
  const existing = $("#reset-dialog");
  if (existing) existing.remove();
  const subject = db.subjects[0];
  const grade = Object.keys(subject.grades)[0];
  const chapters = subject.grades[grade] || [];
  document.body.insertAdjacentHTML("beforeend", `
    <div id="reset-dialog" class="modal-backdrop">
      <section class="modal-panel">
        <h3>학습 초기화</h3>
        <p class="muted">전체 기록을 지우거나, 선택한 챕터의 기록만 지울 수 있습니다.</p>
        <div class="reset-tabs">
          <button class="tab active" type="button" data-reset-mode="all">전체 초기화</button>
          <button class="tab" type="button" data-reset-mode="chapter">챕터별 초기화</button>
        </div>
        <div id="reset-chapter-options" class="form-grid hidden">
          <label>학년<select id="reset-grade"></select></label>
          <label>과목<select id="reset-subject"></select></label>
          <label>챕터<select id="reset-chapter"></select></label>
        </div>
        <p id="reset-message" class="message"></p>
        <div class="inline-actions">
          <button id="confirm-reset-btn" class="danger" type="button">초기화</button>
          <button id="cancel-reset-btn" class="secondary" type="button">취소</button>
        </div>
      </section>
    </div>
  `);
  fillResetOptions(subject.id, grade, chapters[0]?.id || "");
  bindResetDialogEvents();
}

function bindResetDialogEvents() {
  let mode = "all";
  $$("#reset-dialog [data-reset-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.resetMode;
      $$("#reset-dialog [data-reset-mode]").forEach((item) => item.classList.toggle("active", item === button));
      $("#reset-chapter-options").classList.toggle("hidden", mode !== "chapter");
      $("#reset-message").textContent = "";
    });
  });
  $("#reset-subject").addEventListener("change", () => fillResetOptions($("#reset-subject").value, null, null));
  $("#reset-grade").addEventListener("change", () => fillResetOptions($("#reset-subject").value, $("#reset-grade").value, null));
  $("#cancel-reset-btn").addEventListener("click", closeResetDialog);
  $("#confirm-reset-btn").addEventListener("click", () => {
    if (mode === "all") resetAllLearning();
    else resetChapterLearning();
  });
}

function fillResetOptions(subjectId, gradeValue, chapterId) {
  const subject = getSubject(subjectId);
  const grade = gradeValue && subject.grades[gradeValue] ? gradeValue : Object.keys(subject.grades)[0];
  const chapters = subject.grades[grade] || [];
  $("#reset-subject").innerHTML = db.subjects.map((item) => `<option value="${item.id}">${escapeText(item.name)}</option>`).join("");
  $("#reset-grade").innerHTML = Object.keys(subject.grades).map((item) => `<option value="${item}">${item}학년</option>`).join("");
  $("#reset-chapter").innerHTML = chapters.map((item) => `<option value="${item.id}">${escapeText(item.title)}</option>`).join("");
  $("#reset-subject").value = subject.id;
  $("#reset-grade").value = grade;
  $("#reset-chapter").value = chapters.some((item) => item.id === chapterId) ? chapterId : chapters[0]?.id || "";
}

function resetAllLearning() {
  if (!confirm("전체 학습 기록과 오답노트를 모두 초기화할까요?")) return;
  const user = userData();
  user.progress = {};
  user.wrong = [];
  user.seen = {};
  user.solvedIds = [];
  user.servedBank = {};
  user.studyLog = [];
  user.wrongTypes = {};
  saveUser(user);
  afterReset();
}

function resetChapterLearning() {
  const subject = getSubject($("#reset-subject").value);
  const grade = $("#reset-grade").value;
  const chapter = getChapter(subject.id, grade, $("#reset-chapter").value);
  if (!chapter) {
    $("#reset-message").textContent = "초기화할 챕터를 선택하세요.";
    return;
  }
  if (!confirm(`${subject.name} ${grade}학년 · ${chapter.title} 기록만 초기화할까요?`)) return;
  const user = userData();
  const progressKey = `${grade}:${subject.name}:${chapter.title}`;
  delete user.progress?.[progressKey];
  user.wrong = (user.wrong || []).filter((item) => !(String(item.grade) === String(grade) && item.subjectName === subject.name && item.chapterTitle === chapter.title));
  user.studyLog = (user.studyLog || []).filter((item) => !(String(item.grade) === String(grade) && item.subjectName === subject.name && item.chapterTitle === chapter.title));
  user.seen ||= {};
  delete user.seen[`${subject.id}:${grade}:${chapter.id}`];
  user.servedBank ||= {};
  ["easy", "normal", "hard"].forEach((difficulty) => delete user.servedBank[getBankKey(subject.id, grade, chapter.id, difficulty)]);
  user.wrongTypes ||= {};
  delete user.wrongTypes[`${subject.id}:${grade}:${chapter.id}`];
  saveUser(user);
  afterReset();
}

function afterReset() {
  closeResetDialog();
  state.quiz = null;
  $("#quiz-runner")?.classList.add("hidden");
  $("#quiz-setup")?.classList.remove("hidden");
  render();
}

function closeResetDialog() {
  $("#reset-dialog")?.remove();
}

function renderDashboard() {
  return;
}

async function renderDashboardAsync() {
  if (!state.user) return;
  const view = $("#dashboard-view");
  if (!view) return;

  const user = userData();
  user.studyLog ||= [];
  user.servedBank ||= {};
  const progressStats = Object.values(user.progress || {});
  const totalSolved = progressStats.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const correct = progressStats.reduce((sum, item) => sum + (Number(item.correct) || 0), 0);
  const bankTotal = await getTotalBankQuestionCount();
  const uniqueSolved = new Set(Object.values(user.servedBank).flat()).size;
  const overallRate = bankTotal ? Math.round((Math.min(uniqueSolved, bankTotal) / bankTotal) * 100) : 0;
  const savedTab = localStorage.getItem(`${STORE}:dashboardTab`) || "daily";
  const activeTab = ["daily", "weekly", "monthly", "overall"].includes(savedTab) ? savedTab : "daily";
  const tabs = [
    ["daily", "일별 현황"],
    ["weekly", "주간 현황"],
    ["monthly", "월간 현황"],
    ["overall", "전체 대비"],
  ];

  view.innerHTML = `
    <div class="grid">
      <div class="stat">전체 풀이<strong>${totalSolved}</strong></div>
      <div class="stat">정답<strong>${correct}</strong></div>
      <div class="stat">오답노트<strong>${user.wrong.length}</strong></div>
      <div class="stat">정답률<strong>${totalSolved ? Math.round((correct / totalSolved) * 100) : 0}%</strong></div>
    </div>
    <div class="panel dashboard-panel">
      <div class="tabs" role="tablist">
        ${tabs.map(([key, label]) => `<button class="tab ${activeTab === key ? "active" : ""}" data-dashboard-tab="${key}" type="button">${label}</button>`).join("")}
      </div>
      <div class="tab-content">
        ${dashboardTabContent(activeTab, user.studyLog, bankTotal, uniqueSolved, totalSolved, correct)}
      </div>
    </div>
  `;

  $$("#dashboard-view [data-dashboard-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem(`${STORE}:dashboardTab`, button.dataset.dashboardTab);
      renderDashboard();
    });
  });
}

function dashboardTabContent(tab, logs, bankTotal, uniqueSolved, totalSolved, correct) {
  if (tab === "overall") {
    if (bankTotal === null || bankTotal === undefined) {
      return `
        <div class="grid compact-grid">
          <div class="stat">문제은행 전체<strong>계산 중</strong></div>
          <div class="stat">학습한 문제<strong>${uniqueSolved}</strong></div>
          <div class="stat">남은 문제<strong>-</strong></div>
          <div class="stat">진행률<strong>-</strong></div>
        </div>
        <p class="muted">문제은행 수량을 불러오는 중입니다. 다른 탭은 바로 확인할 수 있습니다.</p>
      `;
    }
    const remaining = Math.max(0, bankTotal - uniqueSolved);
    const rate = bankTotal ? Math.round((Math.min(uniqueSolved, bankTotal) / bankTotal) * 100) : 0;
    return `
      <div class="grid compact-grid">
        <div class="stat">문제은행 전체<strong>${bankTotal}</strong></div>
        <div class="stat">학습한 문제<strong>${Math.min(uniqueSolved, bankTotal)}</strong></div>
        <div class="stat">남은 문제<strong>${remaining}</strong></div>
        <div class="stat">진행률<strong>${rate}%</strong></div>
      </div>
      <table class="summary-table">
        <thead><tr><th>구분</th><th>수량</th><th>비율</th></tr></thead>
        <tbody>
          <tr><td>문제은행에서 중복 없이 학습한 문제</td><td>${Math.min(uniqueSolved, bankTotal)} / ${bankTotal}</td><td>${rate}%</td></tr>
          <tr><td>전체 풀이 기록</td><td>${totalSolved}</td><td>${totalSolved ? Math.round((correct / totalSolved) * 100) : 0}% 정답</td></tr>
        </tbody>
      </table>
    `;
  }

  const rows = groupDetailedStudyLog(logs, tab);
  if (!rows.length) {
    return `<div class="empty-state"><h3>아직 표시할 학습 기록이 없습니다</h3><p class="muted">새로 문제를 풀면 이곳에 학년별, 과목별, 챕터별 기록이 자동으로 쌓입니다.</p></div>`;
  }

  return `
    <table class="summary-table">
      <thead><tr><th>기간</th><th>학년</th><th>과목</th><th>챕터</th><th>풀이</th><th>정답</th><th>오답</th><th>정답률</th></tr></thead>
      <tbody>
        ${rows.map((row) => `<tr><td>${escapeText(row.period)}</td><td>${escapeText(row.grade)}학년</td><td>${escapeText(row.subjectName)}</td><td>${escapeText(row.chapterTitle)}</td><td>${row.total}</td><td>${row.correct}</td><td>${row.total - row.correct}</td><td>${row.total ? Math.round((row.correct / row.total) * 100) : 0}%</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function groupDetailedStudyLog(logs, mode) {
  const map = new Map();
  for (const item of logs || []) {
    const date = new Date(item.at);
    if (Number.isNaN(date.getTime())) continue;
    const period = mode === "weekly" ? weekKey(date) : mode === "monthly" ? monthKey(date) : dateKey(date);
    const grade = item.grade || "-";
    const subjectName = item.subjectName || "";
    const chapterTitle = item.chapterTitle || "";
    const key = `${period}::${grade}::${subjectName}::${chapterTitle}`;
    const row = map.get(key) || { period, grade, subjectName, chapterTitle, total: 0, correct: 0 };
    row.total += 1;
    if (item.correct) row.correct += 1;
    map.set(key, row);
  }

  return [...map.values()].sort((a, b) => {
    const periodOrder = b.period.localeCompare(a.period, "ko");
    if (periodOrder) return periodOrder;
    return `${a.grade}${a.subjectName}${a.chapterTitle}`.localeCompare(`${b.grade}${b.subjectName}${b.chapterTitle}`, "ko");
  });
}

function groupStudyLog(logs, mode) {
  const map = new Map();
  for (const item of logs || []) {
    const date = new Date(item.at);
    if (Number.isNaN(date.getTime())) continue;
    const label = mode === "weekly" ? weekKey(date) : mode === "monthly" ? monthKey(date) : dateKey(date);
    const row = map.get(label) || { label, total: 0, correct: 0 };
    row.total += 1;
    if (item.correct) row.correct += 1;
    map.set(label, row);
  }
  return [...map.values()].sort((a, b) => b.label.localeCompare(a.label)).slice(0, 12);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function weekKey(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOffset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - dayOffset);
  return `${dateKey(monday)} 주`;
}

async function getTotalBankQuestionCount() {
  const now = Date.now();
  if (cachedBankQuestionTotal !== null && now - cachedBankQuestionTotalAt < 60000) {
    return cachedBankQuestionTotal;
  }
  let total = 0;
  const bankMap = typeof loadQuestionBankMap === "function" ? await loadQuestionBankMap() : null;
  for (const subject of db.subjects) {
    for (const [grade, chapters] of Object.entries(subject.grades)) {
      for (const chapter of chapters) {
        for (const difficulty of ["easy", "normal", "hard"]) {
          const bankKey = getBankKey(subject.id, grade, chapter.id, difficulty);
          const bank = bankMap ? (bankMap.get(bankKey) || []) : await getQuestionBank(bankKey);
          total += bank.filter((question) => isQuestionForBank(question, subject.id, grade, chapter.id)).length;
        }
      }
    }
  }
  cachedBankQuestionTotal = total;
  cachedBankQuestionTotalAt = now;
  return total;
}
