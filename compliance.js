const topics = {
  all: "전체",
  network: "정보통신망·정보보호",
  location: "위치정보",
  privacy: "개인정보",
  finance: "전자금융·금융보안",
};

const menu = document.querySelector("#catalogMenu");
const licensing = !menu;
const query = document.querySelector("#catalogQuery");
const type = document.querySelector("#catalogType");
const status = document.querySelector("#catalogStatus");
const notice = document.querySelector("#catalogNotice");
const list = document.querySelector("#catalogList");
let catalog;

function documentDate(item) {
  // Law detail pages put the effective date before the promulgation date.
  const match = (item.date || "").match(/^(?:\[시행\s+)?(\d{4})[-.]\s*(\d{1,2})[-.]\s*(\d{1,2})\b/);
  return match ? Number(match[1]) * 10000 + Number(match[2]) * 100 + Number(match[3]) : 0;
}

function render() {
  const requested = location.hash.slice(1);
  const topic = Object.hasOwn(topics, requested) ? requested : "all";
  for (const button of menu?.children ?? []) {
    button.setAttribute("aria-pressed", button.dataset.topic === topic);
  }
  const rows = licensing ? catalog.licenses : catalog.documents.filter(
    (item) => topic === "all" || item.topic === topic,
  );
  const kinds = [...new Set(rows.map((item) => item.kind))];
  const selected = type.value;
  type.replaceChildren(new Option("전체", ""), ...kinds.map((kind) => new Option(kind)));
  if (kinds.includes(selected)) type.value = selected;
  const term = query.value.trim().toLowerCase();
  const matches = rows.filter((item) =>
    (!type.value || type.value === item.kind) &&
    `${item.title} ${item.publisher}`.toLowerCase().includes(term)
  );
  if (!licensing) matches.sort((a, b) => documentDate(b) - documentDate(a));
  const failures = licensing
    ? matches.filter((item) => item.warning).length
    : catalog.sources.filter((source) => source.error).length;
  const failureLabel = licensing ? "검토 필요" : "확인 불가";
  status.textContent = `${matches.length}건 · 자동 확인 시도 ${catalog.checked}${failures ? ` · ${failureLabel} ${failures}건` : ""}`;
  notice.textContent = licensing
    ? "공식 이용 조건 페이지의 변경을 감지합니다. 변경 감지는 이용 허가 변경을 확정하지 않으므로, 원문과 개별 자료 조건을 확인하세요."
    : "법령 원문은 시행일, 기관 게시물은 게시일 기준 최신순입니다. 날짜가 없는 자료는 마지막에 표시합니다.";
  list.replaceChildren(...matches.map((item) => {
    const row = document.createElement("li");
    const link = document.createElement("a");
    link.href = item.url;
    link.textContent = item.title;
    const details = document.createElement("small");
    details.textContent = [item.kind, item.publisher, item.date, item.status].filter(Boolean).join(" · ");
    if (item.warning) details.className = "attention";
    row.append(link, details);
    return row;
  }));
  if (!matches.length) {
    const empty = document.createElement("li");
    empty.textContent = "검색 조건에 맞는 자료가 없습니다.";
    list.append(empty);
  }
}

if (menu && location.hash === "#licenses") {
  location.replace("licenses.html");
} else {
  loadCatalog();
}

async function loadCatalog() {
  try {
    const response = await fetch("compliance-data.json", { cache: "no-cache" });
    if (!response.ok) throw new Error(response.status);
    catalog = await response.json();
    for (const [id, label] of menu ? Object.entries(topics) : []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.topic = id;
      button.addEventListener("click", () => { location.hash = id; });
      menu.append(button);
    }
    if (menu) window.addEventListener("hashchange", () => {
      if (location.hash === "#licenses") {
        location.replace("licenses.html");
        return;
      }
      type.value = "";
      render();
    });
    query.addEventListener("input", render);
    type.addEventListener("change", render);
    render();
  } catch {
    status.textContent = "자료 목록을 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.";
  }
}
