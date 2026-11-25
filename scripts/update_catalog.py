"""Refresh the public link catalog and record changes to official license pages."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from html import unescape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import parse_qs, quote, urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "compliance-data.json"
KST = timezone(timedelta(hours=9))
NETWORK = "정보통신망 이용촉진 및 정보보호 등에 관한 법률"
LOCATION = "위치정보의 보호 및 이용 등에 관한 법률"
LAWS = {
    "network": [NETWORK, "정보통신기반 보호법", "정보보호산업의 진흥에 관한 법률"],
    "location": [LOCATION],
    "privacy": ["개인정보 보호법"],
    "finance": ["전자금융거래법", "신용정보의 이용 및 보호에 관한 법률"],
}
RULES = {
    "network": ["정보보호 및 개인정보보호 관리체계 인증 등에 관한 고시"],
    "location": [
        "위치정보의 관리적·기술적 보호조치 기준", "위치정보보호 법규 위반에 대한 과징금 부과기준",
        "개인위치정보사업등록 세부심사기준별 평가방법",
    ],
    "privacy": [
        "개인정보의 안전성 확보조치 기준", "표준 개인정보 보호지침",
        "개인정보 영향평가에 관한 고시", "개인정보 국외 이전 운영 등에 관한 규정",
    ],
    "finance": ["전자금융감독규정", "전자금융감독규정시행세칙", "신용정보업감독규정"],
}
PIPC = "https://www.pipc.go.kr/np/cop/bbs/selectBoardList.do?bbsId=BS217&mCode=D010030040"
FSEC = "https://www.fsec.or.kr/bbs/222"
LBSC = "https://www.lbsc.kr/front/bbs/BbsMain.do?menuNo=1000001"
KISA = "https://www.kisa.or.kr"
FSC = "https://www.fsc.go.kr/po040200?srchCtgry=1&srchKey=sj&srchText=" + quote("전자금융")
SPAM = "https://spam.kisa.or.kr/spam/na/ntt/selectNttList.do?bbsId=1002&mi=1020"
BOARDS = {
    "pipc": (PIPC, "privacy", "개인정보보호위원회", "가이드·안내서", "pageIndex"),
    "kisa-guide": (KISA + "/2060207", "network", "한국인터넷진흥원", "가이드", "page"),
    "kisa-manual": (KISA + "/2060307", "network", "한국인터넷진흥원", "안내서", "page"),
    "location-board": (LBSC, "location", "위치정보지원센터", "법령·고시", "pageIndex"),
    "location-forms": (LBSC.replace("1000001", "1000004"), "location", "위치정보지원센터", "서식·안내", "pageIndex"),
    "spam": (SPAM, "network", "한국인터넷진흥원 불법스팸대응센터", "안내서·자료", "currPage"),
    "kisa-spam": (KISA + "/401?searchDiv=10&searchWord=" + quote("불법스팸"),
                  "network", "한국인터넷진흥원", "안내서·자료", "page"),
    "fsc": (FSC, "finance", "금융위원회", "고시·공고", "curPage"),
    "fsec": (FSEC, "finance", "금융보안원", "가이드·안내서", None),
}
MAX_PAGES = 30
POLICIES = [
    ("kogl", "공공누리 유형별 이용 조건", "공공누리", "https://www.kogl.or.kr/info/license.do"),
    ("fsc-policy", "금융위원회 저작권정책", "금융위원회", "https://www.fsc.go.kr/ut020104"),
    ("kisa-policy", "정보보호산업진흥포털 저작권정책", "한국인터넷진흥원", "https://www.ksecurity.or.kr/kisis/subIndex/188.do"),
]


def fetch(url, data=None):
    headers = {"User-Agent": "AegisAX-Resources/1.0 (+https://res.aegisax.com/)"}
    if data is not None:
        headers["Content-Type"] = "application/json; charset=UTF-8"
        data = json.dumps(data).encode()
    with urlopen(Request(url, data, headers), timeout=12) as response:
        raw = response.read(6_000_001)
        if len(raw) > 6_000_000:
            raise ValueError("Response too large")
        return raw.decode(response.headers.get_content_charset() or "utf-8", errors="replace")


def normalize(text):
    return " ".join(unescape(text).split())


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = []
        self.visible = []
        self.skip = None
        self.anchor = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in {"script", "style", "noscript"}:
            self.skip = tag
        if tag == "a":
            self.anchor = (attrs.get("href", ""), attrs.get("title", ""), attrs.get("data-id", ""), [])

    def handle_endtag(self, tag):
        if tag == self.skip:
            self.skip = None
        if tag == "a" and self.anchor:
            href, title, identifier, pieces = self.anchor
            self.links.append((href, normalize(" ".join(pieces)) or normalize(title), identifier))
            self.anchor = None

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.visible.append(data)
            if self.anchor:
                self.anchor[3].append(data)


def document(title, url, topic, publisher, kind, date="", status=""):
    return dict(title=title, url=url, topic=topic, publisher=publisher, kind=kind, date=date, status=status)


def law_entries():
    for topic, names in LAWS.items():
        for name in names:
            yield topic, "법률", name
            yield topic, "시행령", name + " 시행령"
    for topic, names in RULES.items():
        for name in names:
            yield topic, "고시·행정규칙", name


def law_document(topic, kind, title):
    path = "행정규칙" if kind == "고시·행정규칙" else "법령"
    url = "https://www.law.go.kr/" + quote(path) + "/" + quote(title, safe="")
    html = fetch(url)
    subtitle = re.search(r'<p\b[^>]*class=["\']subTit["\'][^>]*>(.*?)</p>', html, re.S)
    if not subtitle:
        raise ValueError("Missing official version")
    version = normalize(" ".join(Page(subtitle[1]).visible))
    return [document(title, url, topic, "국가법령정보센터", kind, version)]


def board_link(key, base, href, identifier):
    url = urljoin(base, href)
    parts = urlsplit(url)
    query = parse_qs(parts.query)
    if key == "spam" and href == "javascript:" and identifier.isdecimal():
        return "https://spam.kisa.or.kr/spam/na/ntt/selectNttInfo.do?bbsId=1002&mi=1020&nttSn=" + identifier
    if key.startswith("location-"):
        match = re.fullmatch(r'''javascript:selectBoardView\('(\d+)',\s*'(NTT_\d+)'\);?''', href)
        if match:
            return f"{base}&cmd=view&selectbbsId={match[1]}&selectId={match[2]}"
        return None
    if parts.scheme != "https" or parts.hostname != urlsplit(base).hostname:
        return None
    if key == "pipc" and "selectBoardArticle.do" in parts.path and query.get("bbsId") == ["BS217"] and "nttId" in query:
        return url
    if key == "kisa-spam" and parts.path == "/401/form" and "postSeq" in query:
        return KISA + "/401/form?" + urlencode({"postSeq": query["postSeq"][0]})
    if key.startswith("kisa-") and re.fullmatch(r"/2060[23]\d+/form", parts.path) and "postSeq" in query:
        return KISA + parts.path + "?" + urlencode({"postSeq": query["postSeq"][0]})
    if key == "fsc" and re.fullmatch(r"/po040200/\d+", parts.path):
        return "https://www.fsc.go.kr" + parts.path
    return None


def board_documents(key):
    base, topic, publisher, kind, page_key = BOARDS[key]
    result = {}
    for number in range(1, MAX_PAGES + 1):
        if page_key is None:
            payload = dict(menuNo="222", pagingSearchDto=dict(page=number, pageSize=20, searchContents="", searchType=""))
            response = json.loads(fetch("https://www.fsec.or.kr/bbs/list", payload))
            if number > 1 and response.get("resultCode") == "40" and "마지막" in response.get("resultMsg", ""):
                break
            if response.get("resultCode") != "00":
                raise ValueError("Unexpected board response")
            items = [
                (f"https://www.fsec.or.kr/bbs/detail?bbsNo={int(item['bbsNo'])}&menuNo=222",
                 normalize(item["title"]), str(item.get("regDate") or "")[:10])
                for item in response["resultData"]
            ]
        else:
            url = base if number == 1 else base + ("&" if "?" in base else "?") + urlencode({page_key: number})
            html = fetch(url)
            items = []
            dates = {}
            for row in re.findall(r"<tr\b[^>]*>.*?</tr>", html, re.S | re.I):
                date = re.search(r"<td\b[^>]*>\s*(\d{4}[-.]\d{2}[-.]\d{2})\s*</td>", row, re.I)
                if date:
                    for href, _, identifier in Page(row).links:
                        dates[(href, identifier)] = date[1].replace(".", "-")
            for href, title, identifier in Page(html).links:
                items.append((board_link(key, base, href, identifier), title, dates.get((href, identifier), "")))
        fresh = False
        for url, title, date in items:
            if not url or not title or url in result:
                continue
            if key == "kisa-spam" and "스팸" not in title.replace(" ", ""):
                continue
            fresh = True
            item_topic = topic
            if key.startswith("kisa-"):
                if re.search("위치정보|위치기반", title):
                    item_topic = "location"
                elif re.search("개인정보|가명정보|합성데이터", title):
                    item_topic = "privacy"
            item_kind = kind
            if key == "pipc" and title.startswith("[현재 안내서]"):
                item_kind = "현행 안내서"
            elif key == "pipc" and title.startswith("[과거 안내서]"):
                item_kind = "과거 안내서"
            result[url] = document(title, url, item_topic, publisher, item_kind, date)
        if not fresh:
            break
    if not result:
        raise ValueError("No document links in official board")
    return sorted(result.values(), key=lambda item: item["date"], reverse=True)


def as_review_url(url):
    match = re.fullmatch(r"https://github\.com/([^/]+/[^/]+)/blob/(.+)", url)
    if match:
        return f"https://raw.githubusercontent.com/{match[1]}/{match[2]}"
    return url


def license_record(resource, previous, today):
    url = resource["licenseUrl"]
    publisher = resource.get("publisher", "디자인 자료")
    kind = "공공저작물·저작권 정책" if "publisher" in resource else "라이선스·이용 조건"
    record = document(resource["name"], url, "licenses", publisher, kind)
    record["id"] = resource["id"]
    try:
        html = fetch(as_review_url(url))
        text = normalize(" ".join(Page(html).visible))
        if len(text) < 80 or re.search(r"just a moment|enable javascript and cookies to continue|access denied", text[:600], re.I):
            raise ValueError("No readable license text")
        digest = sha256(text.encode()).hexdigest()
        same_source = previous.get("url") == url
        baseline = previous.get("baseline", digest) if same_source else digest
        changed = digest != baseline
        record.update(baseline=baseline, digest=digest, date=today, warning=changed,
                      status="원문 변경 감지 · 검토 필요" if changed else "원문 응답 확인")
    except (OSError, ValueError) as error:
        print(f"License check failed for {resource['id']}: {error}")
        if previous.get("url") == url:
            record.update({key: previous[key] for key in ("baseline", "digest", "date") if key in previous})
        record.update(warning=True, status="원문 자동 확인 불가 · 직접 확인 필요")
    return record


def main():
    today = datetime.now(KST).date().isoformat()
    old = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    previous_sources = {source["id"]: source for source in old.get("sources", [])}
    previous_licenses = {item["id"]: item for item in old.get("licenses", [])}
    resources = json.loads((ROOT / "resources.json").read_text(encoding="utf-8"))
    resources += [dict(id=key, name=title, publisher=publisher, licenseUrl=url)
                  for key, title, publisher, url in POLICIES]
    sources = {}
    documents = [
        document("금융보안 레그테크 포털", "https://regtech.fsec.or.kr/main/main", "finance", "금융보안원", "공식 자료실"),
        document("개인위치정보사업 등록·변경 안내", "https://www.lbsc.kr/front/content/contentViewer.do?contentId=CONTENT_0000041", "location", "위치정보지원센터", "안내"),
        document("위치기반서비스사업 신고 안내", "https://www.lbsc.kr/front/content/contentViewer.do?contentId=CONTENT_0000081", "location", "위치정보지원센터", "안내"),
    ]
    documents += [document(publisher + " " + kind + " 목록", url, topic, publisher, "공식 자료실")
                  for url, topic, publisher, kind, _ in BOARDS.values()]
    with ThreadPoolExecutor(max_workers=8) as pool:
        jobs = {
            **{title: pool.submit(law_document, topic, kind, title) for topic, kind, title in law_entries()},
            **{key: pool.submit(board_documents, key) for key in BOARDS},
        }
        licenses = [
            pool.submit(license_record, item, previous_licenses.get(item["id"], {}), today)
            for item in resources
        ]
        for key, job in jobs.items():
            source = {"id": key}
            try:
                rows = job.result()
                source["checked"] = today
            except (OSError, ValueError, KeyError, TypeError) as error:
                print(f"Catalog check failed for {key}: {error}")
                source.update(previous_sources.get(key, {}), error=True)
                rows = [{**item, "warning": True, "status": "최근 자동 확인 불가"}
                        for item in old.get("documents", []) if item.get("source") == key]
            sources[key] = source
            documents.extend({**item, "source": key} for item in rows)
        data = dict(checked=today, sources=list(sources.values()), documents=documents,
                    licenses=[job.result() for job in licenses])
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Collected {len(documents)} documents and checked {len(resources)} license and policy links.")


if __name__ == "__main__":
    main()
