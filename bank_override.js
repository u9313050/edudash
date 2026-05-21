const BANK_DIFFICULTIES = ["easy", "normal", "hard"];
let bankBulkMessage = "";

async function renderQuestionBankView() {
  if (!state.user) return;
  const view = $("#bank-view");
  if (!view) return;

  const bankMap = await loadQuestionBankMap();
  const summaries = await getBankSummaries(bankMap);
  const gradeFilter = localStorage.getItem(`${STORE}:bankFilterGrade`) || "all";
  const subjectFilter = localStorage.getItem(`${STORE}:bankFilterSubject`) || "all";
  const filteredSummaries = summaries.filter((item) => {
    const gradeMatch = gradeFilter === "all" || item.grade === gradeFilter;
    const subjectMatch = subjectFilter === "all" || item.subjectId === subjectFilter;
    return gradeMatch && subjectMatch;
  });
  const availableKeys = new Set(filteredSummaries.map((item) => item.bankKey));
  const checkedKeys = readCheckedBankKeys().filter((key) => availableKeys.has(key));
  writeCheckedBankKeys(checkedKeys);
  const checkedSet = new Set(checkedKeys);

  let selectedKey = localStorage.getItem(`${STORE}:bankSelectedKey`) || "";
  let selected = filteredSummaries.find((item) => item.bankKey === selectedKey);
  if (!selected) {
    selected = filteredSummaries.find((item) => item.count > 0) || filteredSummaries[0] || null;
    selectedKey = selected?.bankKey || "";
    if (selectedKey) localStorage.setItem(`${STORE}:bankSelectedKey`, selectedKey);
  }

  const selectedMeta = selected ? parseBankKey(selected.bankKey) : null;
  const selectedRawBank = selected ? (bankMap.get(selected.bankKey) || []) : [];
  const selectedBank = selected && selectedMeta
    ? selectedRawBank.filter((question) => isQuestionForBank(question, selectedMeta.subjectId, selectedMeta.grade, selectedMeta.chapterId))
    : [];

  const summaryPageSize = 10;
  const summaryTotalPages = Math.max(1, Math.ceil(filteredSummaries.length / summaryPageSize));
  const summaryPage = Math.min(summaryTotalPages, Math.max(1, Number(localStorage.getItem(`${STORE}:bankSummaryPage`)) || 1));
  const summaryItems = filteredSummaries.slice((summaryPage - 1) * summaryPageSize, summaryPage * summaryPageSize);

  const pageSize = 10;
  const pageKey = `${STORE}:bankPage:${selected?.bankKey || "none"}`;
  const totalPages = Math.max(1, Math.ceil(selectedBank.length / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Number(localStorage.getItem(pageKey)) || 1));
  const pageItems = selectedBank.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageKeys = summaryItems.map((item) => item.bankKey);
  const allPageChecked = pageKeys.length > 0 && pageKeys.every((key) => checkedSet.has(key));

  view.innerHTML = `
    <div class="panel">
      <h3>문제은행 수량</h3>
      <div class="form-grid bank-filter-grid">
        <label>학년
          <select id="bank-filter-grade">
            <option value="all">전체 학년</option>
            ${bankGradeOptions(gradeFilter)}
          </select>
        </label>
        <label>과목
          <select id="bank-filter-subject">
            <option value="all">전체 과목</option>
            ${db.subjects.map((subject) => `<option value="${subject.id}" ${subject.id === subjectFilter ? "selected" : ""}>${escapeText(subject.name)}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="batch-bank-panel">
        <div class="inline-actions checked-bank-actions">
          <label class="count-inline">생성 수
            <input id="checked-bank-count" type="number" min="1" max="20" value="5">
          </label>
          <button id="generate-checked-bank-btn" class="primary" type="button" ${checkedKeys.length ? "" : "disabled"}>체크 항목 일괄 생성</button>
          <button id="clear-checked-bank-btn" class="secondary" type="button" ${checkedKeys.length ? "" : "disabled"}>선택 해제</button>
        </div>
        <p class="muted">체크된 항목 ${checkedKeys.length}개를 기준으로 문제를 생성합니다.</p>
        <p id="bank-batch-message" class="message">${escapeText(bankBulkMessage)}</p>
      </div>
      <table class="bank-summary">
        <thead>
          <tr>
            <th class="bank-check-cell"><input id="bank-check-page" type="checkbox" ${allPageChecked ? "checked" : ""} aria-label="현재 페이지 전체 선택"></th>
            <th>학년</th><th>과목</th><th>챕터</th><th>난이도</th><th>수량</th><th>문제</th>
          </tr>
        </thead>
        <tbody>${summaryItems.length ? summaryItems.map((item) => bankSummaryRow(item, selected?.bankKey, checkedSet.has(item.bankKey))).join("") : `<tr><td colspan="7" class="muted">조회된 문제은행이 없습니다.</td></tr>`}</tbody>
      </table>
      ${bankSummaryPagination(summaryPage, summaryTotalPages)}
    </div>
    ${selectedBank.length ? `<div class="list" style="margin-top:16px">${pageItems.map((question, index) => bankItem(question, index + ((currentPage - 1) * pageSize), selected.bankKey)).join("")}</div>${bankPagination(currentPage, totalPages)}` : `<div class="panel" style="margin-top:16px"><h3>저장된 문제가 없습니다</h3><p class="muted">목록에서 항목을 체크한 뒤 일괄 생성 버튼으로 문제를 채워 주세요.</p></div>`}
  `;

  bindBankEvents(filteredSummaries, pageKey, pageKeys);
}

function bindBankEvents(filteredSummaries, pageKey, pageKeys) {
  $("#bank-filter-grade")?.addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankFilterGrade`, event.target.value);
    localStorage.setItem(`${STORE}:bankSummaryPage`, "1");
    localStorage.removeItem(`${STORE}:bankSelectedKey`);
    writeCheckedBankKeys([]);
    renderQuestionBankView();
  });
  $("#bank-filter-subject")?.addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankFilterSubject`, event.target.value);
    localStorage.setItem(`${STORE}:bankSummaryPage`, "1");
    localStorage.removeItem(`${STORE}:bankSelectedKey`);
    writeCheckedBankKeys([]);
    renderQuestionBankView();
  });

  $("#bank-check-page")?.addEventListener("change", (event) => {
    const checked = event.target.checked;
    const keys = new Set(readCheckedBankKeys());
    pageKeys.forEach((key) => {
      if (checked) keys.add(key);
      else keys.delete(key);
    });
    writeCheckedBankKeys([...keys]);
    renderQuestionBankView();
  });
  $$("#bank-view [data-bank-check]").forEach((checkbox) => checkbox.addEventListener("change", () => {
    const keys = new Set(readCheckedBankKeys());
    if (checkbox.checked) keys.add(checkbox.dataset.bankKey);
    else keys.delete(checkbox.dataset.bankKey);
    writeCheckedBankKeys([...keys]);
    renderQuestionBankView();
  }));
  $("#clear-checked-bank-btn")?.addEventListener("click", () => {
    writeCheckedBankKeys([]);
    bankBulkMessage = "";
    renderQuestionBankView();
  });
  $("#generate-checked-bank-btn")?.addEventListener("click", () => generateCheckedBanks(filteredSummaries));

  $$("#bank-view [data-bank-summary]").forEach((button) => button.addEventListener("click", () => {
    localStorage.setItem(`${STORE}:bankSelectedKey`, button.dataset.bankKey);
    localStorage.setItem(`${STORE}:bankPage:${button.dataset.bankKey}`, "1");
    renderQuestionBankView();
  }));
  $$("#bank-view [data-bank-summary-page]").forEach((button) => button.addEventListener("click", () => {
    localStorage.setItem(`${STORE}:bankSummaryPage`, button.dataset.bankSummaryPage);
    renderQuestionBankView();
  }));
  $$("#bank-view [data-bank-page]").forEach((button) => button.addEventListener("click", () => {
    localStorage.setItem(pageKey, button.dataset.bankPage);
    renderQuestionBankView();
  }));
  $$("#bank-view [data-delete-bank]").forEach((button) => button.addEventListener("click", async () => {
    if (!confirm("선택한 문제를 문제은행에서 삭제할까요?")) return;
    await deleteQuestionFromBank(button.dataset.bankKey, button.dataset.createdAt, button.dataset.prompt);
    renderQuestionBankView();
    updateBankStatus();
  }));

}

async function generateCheckedBanks(filteredSummaries) {
  const button = $("#generate-checked-bank-btn");
  const message = $("#bank-batch-message");
  const count = Math.max(1, Math.min(20, Number($("#checked-bank-count").value) || 5));
  const checkedSet = new Set(readCheckedBankKeys());
  const targets = filteredSummaries.filter((item) => checkedSet.has(item.bankKey));
  if (!targets.length) {
    message.textContent = "생성할 항목을 먼저 체크해 주세요.";
    return;
  }

  button.disabled = true;
  button.textContent = "일괄 생성 중...";
  bankBulkMessage = "";

  const results = [];
  try {
    for (const [index, item] of targets.entries()) {
      const label = `${item.grade}학년 · ${item.subjectName} · ${item.chapterTitle} · ${difficultyLabel(item.difficulty)}`;
      message.textContent = `${label} 생성 중 (${index + 1}/${targets.length})`;
      const total = await generateBankQuestions(item.subjectId, item.grade, parseBankKey(item.bankKey).chapterId, item.difficulty, count, ({ current, total, requested, status }) => {
        message.textContent = status === "requesting"
          ? `${label}: ${requested}개 요청 중입니다. 현재 ${current}/${total}개`
          : `${label}: 저장 중입니다. 현재 ${current}/${total}개`;
      });
      results.push(`${label} ${total}/${BANK_LIMIT}개`);
    }
    const first = targets[0];
    bankBulkMessage = `체크 항목 ${targets.length}개 생성 완료: ${results.join(" · ")}`;
    localStorage.setItem(`${STORE}:bankSelectedKey`, first.bankKey);
    renderQuestionBankView();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "체크 항목 일괄 생성";
  }
}

function readCheckedBankKeys() {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${STORE}:bankCheckedKeys`) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeCheckedBankKeys(keys) {
  localStorage.setItem(`${STORE}:bankCheckedKeys`, JSON.stringify([...new Set(keys)]));
}

async function loadQuestionBankMap() {
  if (isServerStorageEnabled()) {
    return loadServerQuestionBankMap();
  }
  const map = new Map();
  for (const subject of db.subjects) {
    for (const [grade, chapters] of Object.entries(subject.grades)) {
      for (const chapter of chapters) {
        for (const difficulty of BANK_DIFFICULTIES) {
          const bankKey = getBankKey(subject.id, grade, chapter.id, difficulty);
          map.set(bankKey, await getQuestionBank(bankKey));
        }
      }
    }
  }
  return map;
}

async function loadServerQuestionBankMap() {
  const session = readServerSession();
  const map = new Map();
  if (!session) return map;
  const url = serverUrl(`/rest/v1/${serverQuestionBankTable()}?select=bank_key,questions`);
  const response = await fetch(url, {
    headers: serverDataHeaders(session.access_token),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("서버 문제은행을 불러오지 못했습니다.");
  const rows = await response.json();
  rows.forEach((row) => {
    map.set(row.bank_key, Array.isArray(row.questions) ? row.questions : []);
  });
  return map;
}

async function getBankSummaries(bankMap = null) {
  const source = bankMap || await loadQuestionBankMap();
  const rows = [];
  for (const subject of db.subjects) {
    for (const [grade, chapters] of Object.entries(subject.grades)) {
      for (const chapter of chapters) {
        for (const difficulty of BANK_DIFFICULTIES) {
          const bankKey = getBankKey(subject.id, grade, chapter.id, difficulty);
          const bank = source.get(bankKey) || [];
          const count = bank.filter((question) => isQuestionForBank(question, subject.id, grade, chapter.id)).length;
          rows.push({
            bankKey,
            subjectId: subject.id,
            grade,
            subjectName: subject.name,
            chapterTitle: chapter.title,
            difficulty,
            count,
          });
        }
      }
    }
  }
  return rows;
}

function bankGradeOptions(selectedGrade) {
  const grades = new Set();
  db.subjects.forEach((subject) => Object.keys(subject.grades).forEach((grade) => grades.add(grade)));
  return [...grades]
    .sort((a, b) => Number(a) - Number(b))
    .map((grade) => `<option value="${grade}" ${grade === selectedGrade ? "selected" : ""}>${grade}학년</option>`)
    .join("");
}

function bankSummaryPagination(currentPage, totalPages) {
  if (totalPages <= 1) return "";
  const prev = Math.max(1, currentPage - 1);
  const next = Math.min(totalPages, currentPage + 1);
  return `<div class="pagination"><button class="secondary" data-bank-summary-page="${prev}" ${currentPage === 1 ? "disabled" : ""}>이전</button><span>${currentPage} / ${totalPages}</span><button class="secondary" data-bank-summary-page="${next}" ${currentPage === totalPages ? "disabled" : ""}>다음</button></div>`;
}

function bankSummaryRow(item, selectedKey, checked) {
  const active = item.bankKey === selectedKey ? " class=\"active\"" : "";
  return `<tr${active}><td class="bank-check-cell"><input type="checkbox" data-bank-check="1" data-bank-key="${escapeAttr(item.bankKey)}" ${checked ? "checked" : ""} aria-label="${escapeAttr(`${item.grade}학년 ${item.subjectName} ${item.chapterTitle} ${difficultyLabel(item.difficulty)} 선택`)}"></td><td>${item.grade}학년</td><td>${escapeText(item.subjectName)}</td><td>${escapeText(item.chapterTitle)}</td><td>${difficultyLabel(item.difficulty)}</td><td><strong>${item.count}</strong> / ${BANK_LIMIT}</td><td><button class="secondary" data-bank-summary="1" data-bank-key="${escapeAttr(item.bankKey)}">보기</button></td></tr>`;
}

function bankItem(question, index, bankKey) {
  const typeNumber = Number(question.typeIndex);
  const typeLabel = Number.isFinite(typeNumber) ? typeNumber + 1 : "-";
  return `<article class="panel bank-item"><div class="bank-meta"><span class="badge">#${index + 1}</span><span class="badge">유형 ${typeLabel}</span></div><p>${formatMathText(question.prompt)}</p><p class="muted">정답: ${formatMathText(question.answer)}</p><button class="danger" data-delete-bank="1" data-bank-key="${escapeAttr(bankKey)}" data-created-at="${escapeAttr(question.createdAt || "")}" data-prompt="${escapeAttr(question.prompt)}">삭제</button></article>`;
}

function difficultyLabel(value) {
  return { easy: "하", normal: "중", hard: "상" }[value] || "중";
}

async function importQuestionBankPayload(payload) {
  const banks = Array.isArray(payload) ? payload : payload.banks;
  if (!Array.isArray(banks)) throw new Error("문제은행 JSON 형식이 맞지 않습니다.");
  let bankCount = 0;
  let questionCount = 0;
  for (const item of banks) {
    const bankKey = item.bankKey || (item.meta ? getBankKey(item.meta.subjectId, item.meta.grade, item.meta.chapterId, item.meta.difficulty) : "");
    const meta = parseBankKey(bankKey);
    if (!meta.subjectId || !meta.grade || !meta.chapterId || !meta.difficulty) continue;
    const questions = Array.isArray(item.questions) ? item.questions : [];
    const cleaned = questions
      .filter((question) => isQuestionForBank({ ...question, subjectId: meta.subjectId, grade: meta.grade, chapterId: meta.chapterId }, meta.subjectId, meta.grade, meta.chapterId))
      .map((question) => ({
        ...question,
        subjectId: meta.subjectId,
        grade: meta.grade,
        chapterId: meta.chapterId,
        difficulty: meta.difficulty,
        bankKey,
        createdAt: question.createdAt || new Date().toISOString(),
      }));
    if (!cleaned.length) continue;
    const current = await getQuestionBank(bankKey);
    const merged = dedupeQuestions([...current, ...cleaned]).slice(0, BANK_LIMIT);
    await saveQuestionBank(bankKey, merged);
    bankCount += 1;
    questionCount += cleaned.length;
  }
  return { bankCount, questionCount };
}
