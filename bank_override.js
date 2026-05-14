async function renderQuestionBankView() {
  if (!state.user) return;
  const view = $("#bank-view");
  if (!view) return;
  const summaries = await getBankSummaries();
  const gradeFilter = localStorage.getItem(`${STORE}:bankFilterGrade`) || "all";
  const subjectFilter = localStorage.getItem(`${STORE}:bankFilterSubject`) || "all";
  const filteredSummaries = summaries.filter((item) => {
    const gradeMatch = gradeFilter === "all" || item.grade === gradeFilter;
    const subjectMatch = subjectFilter === "all" || item.subjectId === subjectFilter;
    return gradeMatch && subjectMatch;
  });
  const selectedKey = localStorage.getItem(`${STORE}:bankSelectedKey`) || filteredSummaries.find((item) => item.count > 0)?.bankKey || filteredSummaries[0]?.bankKey || "";
  const selected = filteredSummaries.find((item) => item.bankKey === selectedKey) || filteredSummaries[0];
  const selectedMeta = selected ? parseBankKey(selected.bankKey) : null;
  const bank = selected ? (await getQuestionBank(selected.bankKey)).filter((question) => isQuestionForBank(question, selectedMeta.subjectId, selectedMeta.grade, selectedMeta.chapterId)) : [];
  const summaryPageSize = 10;
  const summaryTotalPages = Math.max(1, Math.ceil(filteredSummaries.length / summaryPageSize));
  const summaryPage = Math.min(summaryTotalPages, Math.max(1, Number(localStorage.getItem(`${STORE}:bankSummaryPage`)) || 1));
  const summaryItems = filteredSummaries.slice((summaryPage - 1) * summaryPageSize, summaryPage * summaryPageSize);
  const pageSize = 10;
  const pageKey = `${STORE}:bankPage:${selected?.bankKey || "none"}`;
  const totalPages = Math.max(1, Math.ceil(bank.length / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, Number(localStorage.getItem(pageKey)) || 1));
  const pageItems = bank.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  view.innerHTML = `
    <div class="panel">
      <h3>문제은행 수량</h3>
      <div class="inline-actions bank-file-actions">
        <button id="export-bank-btn" class="secondary" type="button">문제은행 파일로 저장</button>
        <button id="import-bank-btn" class="secondary" type="button">문제은행 파일 불러오기</button>
        <input id="import-bank-file" class="hidden" type="file" accept="application/json,.json">
      </div>
      <p id="bank-file-message" class="message"></p>
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
      <table class="bank-summary">
        <thead><tr><th>학년</th><th>과목</th><th>챕터</th><th>난이도</th><th>수량</th><th>문제</th></tr></thead>
        <tbody>${summaryItems.length ? summaryItems.map((item) => bankSummaryRow(item, selected?.bankKey)).join("") : `<tr><td colspan="6" class="muted">조회된 문제은행이 없습니다.</td></tr>`}</tbody>
      </table>
      ${bankSummaryPagination(summaryPage, summaryTotalPages)}
    </div>
    <div class="panel" style="margin-top:16px">
      <h3>${selected ? `${selected.grade}학년 · ${selected.subjectName} · ${selected.chapterTitle} · ${difficultyLabel(selected.difficulty)}` : "문제 내용"}</h3>
      <p class="muted">저장 문제 ${bank.length}/${BANK_LIMIT}개 · ${currentPage}/${totalPages}페이지</p>
      ${selected ? `<div class="inline-actions"><button id="generate-bank-btn" class="primary">AI로 요청 수만큼 생성</button><input id="generate-bank-count" type="number" min="1" max="20" value="5" style="max-width:120px"></div><p id="bank-message" class="message"></p>` : ""}
    </div>
    ${bank.length ? `<div class="list" style="margin-top:16px">${pageItems.map((question, index) => bankItem(question, index + ((currentPage - 1) * pageSize), selected.bankKey)).join("")}</div>${bankPagination(currentPage, totalPages)}` : `<div class="panel" style="margin-top:16px"><h3>저장된 문제가 없습니다</h3><p class="muted">퀴즈를 시작하면 AI가 생성한 문제가 이곳에 저장됩니다.</p></div>`}
  `;
  $("#export-bank-btn")?.addEventListener("click", () => exportQuestionBankFile(summaries));
  $("#import-bank-btn")?.addEventListener("click", () => $("#import-bank-file")?.click());
  $("#import-bank-file")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const message = $("#bank-file-message");
    message.textContent = "문제은행 파일을 불러오는 중입니다.";
    try {
      const result = await importQuestionBankFile(file);
      message.textContent = `문제은행 파일을 반영했습니다. ${result.bankCount}개 묶음, ${result.questionCount}개 문제`;
      event.target.value = "";
      renderQuestionBankView();
    } catch (error) {
      message.textContent = error.message;
    }
  });
  $("#bank-filter-grade")?.addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankFilterGrade`, event.target.value);
    localStorage.setItem(`${STORE}:bankSummaryPage`, "1");
    localStorage.removeItem(`${STORE}:bankSelectedKey`);
    renderQuestionBankView();
  });
  $("#bank-filter-subject")?.addEventListener("change", (event) => {
    localStorage.setItem(`${STORE}:bankFilterSubject`, event.target.value);
    localStorage.setItem(`${STORE}:bankSummaryPage`, "1");
    localStorage.removeItem(`${STORE}:bankSelectedKey`);
    renderQuestionBankView();
  });
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
  const generateBtn = $("#generate-bank-btn");
  if (generateBtn && selected) {
    generateBtn.addEventListener("click", async () => {
      const message = $("#bank-message");
      const count = Math.max(1, Math.min(20, Number($("#generate-bank-count").value) || 5));
      generateBtn.disabled = true;
      generateBtn.textContent = "생성 중...";
      message.textContent = "AI에 문제 생성을 요청 중입니다.";
      try {
        const { subjectId, grade, chapterId, difficulty } = parseBankKey(selected.bankKey);
        const total = await generateBankQuestions(subjectId, grade, chapterId, difficulty, count, ({ current, total, requested, status }) => {
          message.textContent = status === "requesting"
            ? `AI에 ${requested}개 생성을 요청 중입니다. 현재 ${current}/${total}개`
            : `문제 저장 중입니다. 현재 ${current}/${total}개`;
        });
        message.textContent = `문제은행이 ${total}/${BANK_LIMIT}개로 갱신되었습니다.`;
        renderQuestionBankView();
      } catch (error) {
        message.textContent = error.message;
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "AI로 요청 수만큼 생성";
      }
    });
  }
}

async function getBankSummaries() {
  const rows = [];
  for (const subject of db.subjects) {
    for (const [grade, chapters] of Object.entries(subject.grades)) {
      for (const chapter of chapters) {
        for (const difficulty of ["easy", "normal", "hard"]) {
          const bankKey = getBankKey(subject.id, grade, chapter.id, difficulty);
          const bank = await getQuestionBank(bankKey);
          rows.push({ bankKey, subjectId: subject.id, grade, subjectName: subject.name, chapterTitle: chapter.title, difficulty, count: bank.length });
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

function bankSummaryRow(item, selectedKey) {
  const active = item.bankKey === selectedKey ? " class=\"active\"" : "";
  return `<tr${active}><td>${item.grade}학년</td><td>${escapeText(item.subjectName)}</td><td>${escapeText(item.chapterTitle)}</td><td>${difficultyLabel(item.difficulty)}</td><td><strong>${item.count}</strong> / ${BANK_LIMIT}</td><td><button class="secondary" data-bank-summary="1" data-bank-key="${escapeAttr(item.bankKey)}">보기</button></td></tr>`;
}

function bankItem(question, index, bankKey) {
  const preview = formatMathText(question.prompt);
  return `<article class="panel bank-item"><div class="bank-meta"><span class="badge">#${index + 1}</span><span class="badge">유형 ${Number(question.typeIndex) + 1}</span></div><p>${preview}</p><p class="muted">정답: ${formatMathText(question.answer)}</p><button class="danger" data-delete-bank="1" data-bank-key="${escapeAttr(bankKey)}" data-created-at="${escapeAttr(question.createdAt || "")}" data-prompt="${escapeAttr(question.prompt)}">삭제</button></article>`;
}

function difficultyLabel(value) {
  return { easy: "하", normal: "중", hard: "상" }[value] || "중";
}

async function exportQuestionBankFile(summaries) {
  const banks = [];
  for (const item of summaries) {
    const questions = await getQuestionBank(item.bankKey);
    if (!questions.length) continue;
    banks.push({
      bankKey: item.bankKey,
      meta: parseBankKey(item.bankKey),
      grade: item.grade,
      subjectName: item.subjectName,
      chapterTitle: item.chapterTitle,
      difficulty: item.difficulty,
      questions,
    });
  }
  const payload = {
    app: "EduDash",
    type: "question-bank",
    version: 1,
    exportedAt: new Date().toISOString(),
    banks,
  };
  const fileName = "question-bank.json";
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const total = banks.reduce((sum, item) => sum + item.questions.length, 0);
  const message = $("#bank-file-message");

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "EduDash question bank JSON", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      if (message) message.textContent = `question-bank.json 파일로 저장했습니다. dist/문제은행 폴더에 저장하면 로그인 시 자동 업로드됩니다. ${banks.length}개 묶음, ${total}개 문제`;
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        if (message) message.textContent = "문제은행 파일 저장을 취소했습니다.";
        return;
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  if (message) message.textContent = `문제은행 파일을 만들었습니다. ${banks.length}개 묶음, ${total}개 문제`;
}

async function importQuestionBankFile(file) {
  const text = await file.text();
  return importQuestionBankPayload(JSON.parse(text));
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
