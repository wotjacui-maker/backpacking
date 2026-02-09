const ARENA_PARENT_URL = "https://www.are.na/jaeseo-choe/backpacking-covuydrlese";
const ARENA_TOKEN = "";

const CHANNELS_PER_PAGE = 100;
const IMAGES_PER_PAGE = 100;

// 채널별 이미지 저장소
const IMAGE_POOL = {};

const displayName = {
  "korea-channel01": "south korea",
  "new-zealand-channel02": "new zealand",
  "italy-channel03": "italy",
  "japan-channel04": "japan"
};

function slugFromUrl(url) {
  const u = new URL(url);
  const parts = u.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}


// 눈송이 생성
function createSnowflake() {
  const snowflake = document.createElement("div");
  snowflake.className = "snowflake";
  snowflake.textContent = "❆"; // 눈송이
  snowflake.style.position = "fixed";
  snowflake.style.top = "-20px";
  snowflake.style.left = Math.random() * window.innerWidth + "px";
  snowflake.style.fontSize = 5 + Math.random() * 5 + "px";
  snowflake.style.zIndex = 9999;
  snowflake.style.pointerEvents = "none";
  snowflake.style.userSelect = "none";
  snowflake.style.transition = "top 5s linear";

  document.body.appendChild(snowflake);

  // 애니메이션
  setTimeout(() => {
    snowflake.style.top = window.innerHeight + "px";
  }, 50);

  // 끝나면 제거
  setTimeout(() => {
    snowflake.remove();
  }, 5000);
}




async function arenaFetch(path, params = {}) {
  const base = "https://api.are.na/v2";
  const sp = new URLSearchParams(params);
  const url = `${base}${path}?${sp.toString()}`;

  const headers = {};
  if (ARENA_TOKEN) headers["Authorization"] = `Bearer ${ARENA_TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function pickImageUrl(img) {
  return (
    (img.display && img.display.url) ||
    (img.large && img.large.url) ||
    (img.original && img.original.url) ||
    ""
  );
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// root details
function getRootDetails() {
  return document.querySelector("details[open]");
}

// 기존 이미지 제거
function clearImages() {
  document.querySelectorAll(".image-strip").forEach(el => el.remove());
}

// 이미지 렌더링
function renderImages(slugs) {
  clearImages();

  const root = getRootDetails();
  const strip = document.createElement("div");
  strip.className = "image-strip indent";
  strip.style.marginTop = "10px";

  let images = [];
  slugs.forEach(slug => {
    if (IMAGE_POOL[slug]) {
      images = images.concat(IMAGE_POOL[slug]);
    }
  });

  shuffle(images);

  images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    strip.appendChild(img);
  });

  root.appendChild(strip);
}

// 부모 채널 → 자식 채널 가져오기
async function fetchAllChildChannels(parentSlug) {
  const children = [];
  let page = 1;

  while (true) {
    const data = await arenaFetch(`/channels/${parentSlug}/contents`, {
      per: CHANNELS_PER_PAGE,
      page
    });

    const chans = (data.contents || []).filter(b => b.class === "Channel");
    chans.forEach(ch => {
      children.push({
        slug: ch.slug,
        title: ch.title
      });
    });

    if (data.contents.length < CHANNELS_PER_PAGE) break;
    page++;
  }

  return children;
}

// 채널 하나의 이미지 전부 로드
async function preloadChannelImages(slug) {
  let page = 1;
  IMAGE_POOL[slug] = [];

  while (true) {
    const data = await arenaFetch(`/channels/${slug}/contents`, {
      per: IMAGES_PER_PAGE,
      page
    });

    const imgs = (data.contents || []).filter(b => b.class === "Image" && b.image);
    imgs.forEach(b => {
      const src = pickImageUrl(b.image);
      if (src) IMAGE_POOL[slug].push(src);
    });

    if (data.contents.length < IMAGES_PER_PAGE) break;
    page++;
  }
}


// 메인
async function bootstrap() {
  const parentSlug = slugFromUrl(ARENA_PARENT_URL);
  const root = getRootDetails();
  const summary = root.querySelector(":scope > summary");

  // 기존 내용 제거
  while (summary.nextSibling) {
    root.removeChild(summary.nextSibling);
  }

  const channels = await fetchAllChildChannels(parentSlug);

  let snowInterval = null;

// 각 채널에 적용할 고정 클래스
const displayClass = {
  "korea-channel01": "left",
  "new-zealand-channel02": "right",
  "italy-channel03": "margin",
  "japan-channel04": "center"
};








  // 채널별 이미지 preload
  for (const ch of channels) {
    await preloadChannelImages(ch.slug);

    const d = document.createElement("details");
    const s = document.createElement("summary");
  
    s.className = "indent " + (displayClass[ch.slug] || "left"); 
    s.textContent = displayName[ch.slug] || ch.title;




    // 클릭 = 필터
    s.addEventListener("click", (e) => {
    e.preventDefault();
    renderImages([ch.slug]);

  // 일단 어떤 summary 클릭하든 기존 눈송이 제거
  if (snowInterval) {
    clearInterval(snowInterval);
    snowInterval = null;
  }

  // Italy 클릭 시만 눈송이 시작
  if (ch.slug === "italy-channel03") {
    snowInterval = setInterval(createSnowflake, 200);
  }
});






    d.appendChild(s);
    root.appendChild(d);
  }





  // 기본: 전체 랜덤
  renderImages(channels.map(ch => ch.slug));
}


document.addEventListener("DOMContentLoaded", bootstrap);




