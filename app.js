// DOM 요소 참조
const inputTag = document.getElementById('inputTag');
const dynamicLinesContainer = document.getElementById('dynamicLinesContainer');
const btnAddLine = document.getElementById('btnAddLine');

const ltTag = document.getElementById('ltTag');
const ltTagWrap = document.getElementById('ltTagWrap');
const ltContentLines = document.getElementById('ltContentLines');

const lowerThirdContainer = document.getElementById('lowerThirdContainer');
const lowerThirdBanner = document.getElementById('lowerThirdBanner');
const monitorScreen = document.getElementById('monitorScreen');

// 자석 스냅 가이드라인 DOM
const guideV = document.getElementById('guide-v');
const guideH = document.getElementById('guide-h');

const presetCards = document.querySelectorAll('.preset-card');
const bgBtns = document.querySelectorAll('.bg-btn');

const checkGlitter = document.getElementById('checkGlitter');
const rangeGlitterSpeed = document.getElementById('rangeGlitterSpeed');
const rangeGlitterWidth = document.getElementById('rangeGlitterWidth');
const speedVal = document.getElementById('speedVal');
const widthVal = document.getElementById('widthVal');

// 자막 개별 위치 조작용 DOM
const selectedElementText = document.getElementById('selectedElementText');
const rangePosX = document.getElementById('rangePosX');
const rangePosY = document.getElementById('rangePosY');
const rangeWidth = document.getElementById('rangeWidth');
const xPosVal = document.getElementById('xPosVal');
const yPosVal = document.getElementById('yPosVal');
const widthCardVal = document.getElementById('widthCardVal');

// 즐겨찾기 필터용 DOM
const checkFavOnly = document.getElementById('checkFavOnly');
const starToggles = document.querySelectorAll('.star-toggle');

const btnReplay = document.getElementById('btnReplay');
const btnDownload = document.getElementById('btnDownload');
const glitterSheen = document.getElementById('glitterSheen');

// 설정 상태 객체
let currentSettings = {
  preset: 'netflix',
  glitterEnabled: true,
  glitterSpeed: 3.5, // 초
  glitterWidth: 180, // px
  bg: 'cinematic'
};

// 동적 자막 라인 배열
let textLines = [
  "김 태 리 (KIM TAE-RI)",
  "최우수 연기상 수상자 | 배우",
  "영화 '아가씨' & 드라마 '스물다섯 스물하나' 출연"
];

// 개별 요소 좌표 상태 관리 (banner: 전체 배경, tag: 뱃지, line0..: 설명줄)
let elementPositions = {
  banner: { x: 8, y: 6, w: 70 },
  tag: { x: 5, y: 76 },
  line0: { x: 5, y: 52 },
  line1: { x: 5, y: 30 },
  line2: { x: 5, y: 10 }
};

// 현재 포커스 선택된 요소 ID (기본값: line0 - 이름)
let selectedElementId = 'line0';

// 로컬스토리지 즐겨찾기 프리셋 목록
let starredPresets = JSON.parse(localStorage.getItem('starredPresets')) || ['netflix', 'oscar', 'cnn'];

// Ctrl+Z 언두 히스토리 스택
let positionHistory = [];

/* ─────────────────────────────────────────────────────────────────────────────
   1. 텍스트 라인 렌더링 & 개별 좌표 동기화
   ───────────────────────────────────────────────────────────────────────────── */

// 1) 좌측 인풋 폼 드로잉
function renderInputFields() {
  dynamicLinesContainer.innerHTML = '';
  
  textLines.forEach((text, index) => {
    const lineItem = document.createElement('div');
    lineItem.className = 'dynamic-line-item';
    lineItem.dataset.index = index;

    const label = document.createElement('span');
    label.className = 'line-label';
    label.textContent = index === 0 ? '이름 (L1)' : `설명 (L${index + 1})`;
    lineItem.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-line';
    input.value = text;
    input.placeholder = index === 0 ? '메인 이름/타이틀' : `설명 및 추가 크레딧`;
    input.dataset.index = index;
    
    input.addEventListener('input', (e) => {
      textLines[index] = e.target.value;
      updatePreviewLines();
    });
    lineItem.appendChild(input);

    if (index > 0) {
      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btn-remove-line';
      btnRemove.innerHTML = '×';
      btnRemove.addEventListener('click', () => {
        removeTextLine(index);
      });
      lineItem.appendChild(btnRemove);
    }

    dynamicLinesContainer.appendChild(lineItem);
  });
}

// 2) 우측 16:9 배너 프리뷰 렌더링 (각 요소를 개별 absolute 드래그 오브젝트화)
function updatePreviewLines() {
  ltContentLines.innerHTML = '';
  
  textLines.forEach((text, index) => {
    if (text.trim() === '') return;

    if (index === 0) {
      // 메인 타이틀 (이름)
      const mainEl = document.createElement('div');
      mainEl.id = 'line0';
      mainEl.className = 'lt-line-0 canvas-draggable lt-text-item';
      mainEl.dataset.id = 'line0';
      mainEl.textContent = text;
      ltContentLines.appendChild(mainEl);
    } else {
      // 추가 설명 라인들
      const subEl = document.createElement('div');
      const lineId = 'line' + index;
      subEl.id = lineId;
      subEl.className = 'lt-line-sub canvas-draggable lt-text-item';
      subEl.dataset.id = lineId;
      subEl.textContent = text;
      ltContentLines.appendChild(subEl);
    }
  });

  // 태그/뱃지 노출 조절
  const tagValue = inputTag.value.trim();
  if (tagValue === '' || currentSettings.preset === 'apple-accent') {
    ltTagWrap.style.display = 'none';
  } else {
    ltTagWrap.style.display = 'block';
    ltTag.textContent = tagValue;
  }

  // 드래그 마우스 이벤트 및 포커스 갱신 바인딩
  bindCanvasDragEvents();
  applyAllPositions();
  updateFocusUI();
}

// 3) 새로운 설명 줄 추가
function addTextLine() {
  if (textLines.length >= 8) {
    alert("화면 비율 및 디자인상 최대 8줄까지만 생성 가능합니다.");
    return;
  }
  
  const newIndex = textLines.length;
  textLines.push(`추가 설명 문구 라인 ${newIndex + 1}`);
  
  // 신규 요소 디폴트 좌표 배치 (이전 요소 아래에 계단식 생성)
  const prevKey = 'line' + (newIndex - 1);
  const prevY = elementPositions[prevKey] ? elementPositions[prevKey].y : 10;
  elementPositions['line' + newIndex] = {
    x: elementPositions[prevKey] ? elementPositions[prevKey].x : 5,
    y: Math.max(0, prevY - 20)
  };

  saveHistory(); // 히스토리 기록
  renderInputFields();
  updatePreviewLines();
  triggerIntroAnimation();
}

// 4) 설명 줄 삭제
function removeTextLine(index) {
  textLines.splice(index, 1);

  // 삭제된 인덱스 이후 좌표들 앞으로 한 단계씩 쉬프트
  const len = textLines.length;
  for (let i = index; i < len; i++) {
    const nextKey = 'line' + (i + 1);
    const currKey = 'line' + i;
    if (elementPositions[nextKey]) {
      elementPositions[currKey] = JSON.parse(JSON.stringify(elementPositions[nextKey]));
    } else {
      elementPositions[currKey] = { x: 5, y: Math.max(0, 52 - i * 22) };
    }
  }
  delete elementPositions['line' + len];

  // 만약 삭제된 요소를 선택 중이었다면 선택 타겟을 메인 타이틀로 변경
  if (selectedElementId === 'line' + len || !elementPositions[selectedElementId]) {
    selectedElementId = 'line0';
  }

  saveHistory(); // 히스토리 기록
  renderInputFields();
  updatePreviewLines();
  triggerIntroAnimation();
}

inputTag.addEventListener('input', updatePreviewLines);
btnAddLine.addEventListener('click', addTextLine);

/* ─────────────────────────────────────────────────────────────────────────────
   2. 개별 드래그 앤 드롭 & 자석 스냅 가이드라인 연산
   ───────────────────────────────────────────────────────────────────────────── */

let activeDragId = null;
let isDragging = false;
let startMouseX = 0;
let startMouseY = 0;
let startPercentX = 0;
let startPercentY = 0;

function bindCanvasDragEvents() {
  const dragItems = document.querySelectorAll('.canvas-draggable');
  
  dragItems.forEach(item => {
    // 마우스 누름 -> 드래그 시작 & 포커스 선택
    item.addEventListener('mousedown', (e) => {
      if (item.contentEditable === 'true') return; // 편집 중에는 드래그 방지
      e.stopPropagation();
      e.preventDefault();
      
      const elementId = item.dataset.id;
      selectElement(elementId);
      
      activeDragId = elementId;
      isDragging = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;
      startPercentX = elementPositions[elementId].x;
      startPercentY = elementPositions[elementId].y;

      item.style.transition = 'none'; // 드래그 시 딜레이 제거
    });

    // 더블클릭 -> 인라인 텍스트 편집 (contenteditable) - 배경 카드는 제외
    if (item.id !== 'lowerThirdBanner') {
      item.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        item.contentEditable = 'true';
        item.focus();
        
        // 브라우저 텍스트 드래그 선택 처리
        const range = document.createRange();
        range.selectNodeContents(item);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        // 편집 저장 공통 처리
        const finishEdit = () => {
          if (item.contentEditable !== 'true') return;
          item.contentEditable = 'false';
          const newText = item.textContent.trim();
          
          const elementId = item.dataset.id;
          if (elementId === 'tag') {
            inputTag.value = newText;
          } else {
            const idx = parseInt(elementId.replace('line', ''));
            textLines[idx] = newText;
          }
          
          saveHistory();
          renderInputFields();
          updatePreviewLines();
        };

        item.addEventListener('blur', finishEdit, { once: true });
        
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            item.blur();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            // ESC 키 입력 시 원본 텍스트 롤백
            const elementId = item.dataset.id;
            if (elementId === 'tag') {
              item.textContent = inputTag.value;
            } else {
              const idx = parseInt(elementId.replace('line', ''));
              item.textContent = textLines[idx];
            }
            item.contentEditable = 'false';
            item.blur();
          }
        }, { once: true });
      });
    }
  });
}

// 드래그 무브 & 자석 스냅 핵심 로직
document.addEventListener('mousemove', (e) => {
  if (!isDragging || !activeDragId) return;

  const deltaX = e.clientX - startMouseX;
  const deltaY = e.clientY - startMouseY;

  const isBanner = activeDragId === 'banner';
  const screenWidth = isBanner ? monitorScreen.clientWidth : lowerThirdBanner.clientWidth;
  const screenHeight = isBanner ? monitorScreen.clientHeight : lowerThirdBanner.clientHeight;

  // 픽셀 이동 수치를 비율 퍼센트로 환산
  const percentDeltaX = (deltaX / screenWidth) * 100;
  const percentDeltaY = -(deltaY / screenHeight) * 100; // Y축 뒤집음

  let targetX = startPercentX + percentDeltaX;
  let targetY = startPercentY + percentDeltaY;

  // ── 자석 스냅 (Snapping) 및 PPT 빨간 가이드선 감지 ──
  const snapThreshold = 1.6; // 스냅 감도 (%)
  let snappedX = false;
  let snappedY = false;

  if (isBanner) {
    // 1) 화면 중앙선 스냅
    if (Math.abs(targetX - 50) < snapThreshold) {
      targetX = 50;
      snappedX = true;
      showVerticalGuide(50);
    }
    if (Math.abs(targetY - 50) < snapThreshold) {
      targetY = 50;
      snappedY = true;
      showHorizontalGuide(50);
    }

    // 2) 기본 여백 마진선 스냅 (가로 8%, 세로 6%)
    if (!snappedX && Math.abs(targetX - 8) < snapThreshold) {
      targetX = 8;
      snappedX = true;
      showVerticalGuide(8);
    }
    if (!snappedY && Math.abs(targetY - 6) < snapThreshold) {
      targetY = 6;
      snappedY = true;
      showHorizontalGuide(6);
    }
  } else {
    // 텍스트 조각은 배너 내부 50% 센터선 스냅 및 타 텍스트 정렬 스냅
    if (Math.abs(targetX - 50) < snapThreshold) {
      targetX = 50;
      snappedX = true;
      const screenX = elementPositions.banner.x + (50 * lowerThirdBanner.clientWidth / monitorScreen.clientWidth);
      showVerticalGuide(screenX);
    }
    if (!snappedX && Math.abs(targetX - 5) < snapThreshold) {
      targetX = 5;
      snappedX = true;
      const screenX = elementPositions.banner.x + (5 * lowerThirdBanner.clientWidth / monitorScreen.clientWidth);
      showVerticalGuide(screenX);
    }

    // 타 텍스트 요소들과의 정렬 스냅
    Object.keys(elementPositions).forEach(id => {
      if (id === 'banner' || id === activeDragId) return;
      const otherPos = elementPositions[id];

      if (!snappedX && Math.abs(targetX - otherPos.x) < snapThreshold) {
        targetX = otherPos.x;
        snappedX = true;
        const screenX = elementPositions.banner.x + (otherPos.x * lowerThirdBanner.clientWidth / monitorScreen.clientWidth);
        showVerticalGuide(screenX);
      }
      if (!snappedY && Math.abs(targetY - otherPos.y) < snapThreshold) {
        targetY = otherPos.y;
        snappedY = true;
        const screenY = elementPositions.banner.y + (otherPos.y * lowerThirdBanner.clientHeight / monitorScreen.clientHeight);
        showHorizontalGuide(screenY);
      }
    });
  }

  // 스냅 가이드선 가시성 정리
  if (!snappedX) hideVerticalGuide();
  if (!snappedY) hideHorizontalGuide();

  // 경계 밖 탈출 방지 클램핑
  targetX = Math.max(0, Math.min(95, targetX));
  targetY = Math.max(0, Math.min(95, targetY));

  // 위치 업데이트
  elementPositions[activeDragId].x = targetX;
  elementPositions[activeDragId].y = targetY;

  applyPositionToDOM(activeDragId);
  syncSlidersWithTarget(activeDragId);
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    
    // 드래그 종료 시점 위치 복구 복원
    const item = document.getElementById(activeDragId === 'tag' ? 'ltTagWrap' : (activeDragId === 'banner' ? 'lowerThirdBanner' : activeDragId));
    if (item) item.style.transition = '';

    activeDragId = null;
    hideVerticalGuide();
    hideHorizontalGuide();
    saveHistory(); // 동작 완료 시점 히스토리 스택에 저장
  }
});

// 가이드라인 렌더
function showVerticalGuide(xPercent) {
  guideV.style.left = `${xPercent}%`;
  guideV.style.display = 'block';
}
function hideVerticalGuide() {
  guideV.style.display = 'none';
}
function showHorizontalGuide(yPercent) {
  guideH.style.bottom = `${yPercent}%`;
  guideH.style.display = 'block';
}
function hideHorizontalGuide() {
  guideH.style.display = 'none';
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. 포커스 요소 제어 & 슬라이더 양방향 연동
   ───────────────────────────────────────────────────────────────────────────── */

// 1) 요소 클릭 시 포커스 타겟 설정
function selectElement(id) {
  selectedElementId = id;
  updateFocusUI();
}

function updateFocusUI() {
  // 전체 포커스 아웃라인 제거 후 선택 대상에만 테두리 추가
  document.querySelectorAll('.canvas-draggable').forEach(el => {
    el.classList.remove('focused-item');
  });

  const activeEl = document.getElementById(selectedElementId === 'tag' ? 'ltTagWrap' : (selectedElementId === 'banner' ? 'lowerThirdBanner' : selectedElementId));
  if (activeEl) {
    activeEl.classList.add('focused-item');
  }

  // 조작 패널 텍스트 갱신
  selectedElementText.textContent = getFriendlyName(selectedElementId);

  // 슬라이더 활성화 및 동기화
  if (elementPositions[selectedElementId]) {
    rangePosX.disabled = false;
    rangePosY.disabled = false;
    if (selectedElementId === 'banner') {
      rangeWidth.disabled = false;
    } else {
      rangeWidth.disabled = true;
    }
    syncSlidersWithTarget(selectedElementId);
  } else {
    rangePosX.disabled = true;
    rangePosY.disabled = true;
    rangeWidth.disabled = true;
  }
}

function getFriendlyName(id) {
  if (id === 'banner') return '자막 뒷배경 카드 (Banner Plate)';
  if (id === 'tag') return '카테고리 태그 (Badge)';
  if (id === 'line0') return '이름 / 타이틀 (Line 1)';
  const idx = parseInt(id.replace('line', ''));
  return `설명 문구 라인 (Line ${idx + 1})`;
}


// 2) 선택 타겟 좌표를 슬라이더 조작계로 투사
function syncSlidersWithTarget(id) {
  const pos = elementPositions[id];
  if (!pos) return;
  rangePosX.value = Math.round(pos.x);
  rangePosY.value = Math.round(pos.y);
  xPosVal.textContent = `${Math.round(pos.x)}%`;
  yPosVal.textContent = `${Math.round(pos.y)}%`;

  if (id === 'banner') {
    rangeWidth.value = Math.round(pos.w);
    widthCardVal.textContent = `${Math.round(pos.w)}%`;
  } else {
    rangeWidth.value = 70;
    widthCardVal.textContent = '--';
  }
}

// 3) 슬라이더 직접 조정 리스너
rangePosX.addEventListener('input', (e) => {
  if (!selectedElementId || !elementPositions[selectedElementId]) return;
  elementPositions[selectedElementId].x = parseFloat(e.target.value);
  applyPositionToDOM(selectedElementId);
  syncSlidersWithTarget(selectedElementId);
});

rangePosX.addEventListener('change', () => {
  saveHistory(); // 변경 끝난 뒤 역사 기록
});

rangePosY.addEventListener('input', (e) => {
  if (!selectedElementId || !elementPositions[selectedElementId]) return;
  elementPositions[selectedElementId].y = parseFloat(e.target.value);
  applyPositionToDOM(selectedElementId);
  syncSlidersWithTarget(selectedElementId);
});

rangePosY.addEventListener('change', () => {
  saveHistory();
});

rangeWidth.addEventListener('input', (e) => {
  if (selectedElementId !== 'banner' || !elementPositions.banner) return;
  elementPositions.banner.w = parseFloat(e.target.value);
  applyPositionToDOM('banner');
  syncSlidersWithTarget('banner');
});

rangeWidth.addEventListener('change', () => {
  saveHistory();
});

// 4) 개별/전체 요소를 DOM에 강제 업데이트
function applyPositionToDOM(id) {
  const pos = elementPositions[id];
  if (!pos) return;
  
  if (id === 'banner') {
    lowerThirdBanner.style.setProperty('--banner-x', `${pos.x}%`);
    lowerThirdBanner.style.setProperty('--banner-y', `${pos.y}%`);
    lowerThirdBanner.style.setProperty('--banner-w', `${pos.w}%`);
  } else {
    const el = document.getElementById(id === 'tag' ? 'ltTagWrap' : id);
    if (el) {
      el.style.setProperty('--item-x', `${pos.x}%`);
      el.style.setProperty('--item-y', `${pos.y}%`);
    }
  }
}

function applyAllPositions() {
  Object.keys(elementPositions).forEach(id => {
    applyPositionToDOM(id);
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. Ctrl + Z 작업 취소 히스토리 엔진 (Undo System)
   ───────────────────────────────────────────────────────────────────────────── */

function saveHistory() {
  const snapshot = {
    positions: JSON.parse(JSON.stringify(elementPositions)),
    textLines: JSON.parse(JSON.stringify(textLines)),
    inputTag: inputTag.value,
    selectedElementId: selectedElementId
  };

  // 동일한 상태의 연속 저장 방어
  if (positionHistory.length > 0) {
    const last = positionHistory[positionHistory.length - 1];
    if (JSON.stringify(last) === JSON.stringify(snapshot)) {
      return;
    }
  }

  positionHistory.push(snapshot);
  
  // 최대 50개 제한
  if (positionHistory.length > 50) {
    positionHistory.shift();
  }
}

function undo() {
  if (positionHistory.length > 1) {
    // 현재 상태 팝
    positionHistory.pop();
    // 이전 상태로 복원
    const prevState = positionHistory[positionHistory.length - 1];

    elementPositions = JSON.parse(JSON.stringify(prevState.positions));
    textLines = JSON.parse(JSON.stringify(prevState.textLines));
    inputTag.value = prevState.inputTag;
    
    // UI 및 프리뷰 전면 재렌더링
    renderInputFields();
    updatePreviewLines();
    applyAllPositions();

    // 선택 포커스 복원
    if (elementPositions[prevState.selectedElementId]) {
      selectElement(prevState.selectedElementId);
    } else {
      selectElement('line0');
    }

    triggerIntroAnimation();
    console.log("Ctrl+Z: 작업이 이전 상태로 되돌아갔습니다.");
  } else {
    console.log("Ctrl+Z: 더 이상 되돌릴 작업이 없습니다.");
  }
}

// 전역 단축키 바인딩
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault();
    undo();
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   5. 즐겨찾기 별표 및 필터 연동
   ───────────────────────────────────────────────────────────────────────────── */
function updateStarsDisplay() {
  starToggles.forEach(toggle => {
    const targetPreset = toggle.dataset.target;
    if (starredPresets.includes(targetPreset)) {
      toggle.classList.add('active');
      toggle.textContent = '★';
    } else {
      toggle.classList.remove('active');
      toggle.textContent = '☆';
    }
  });
}

function applyFavoriteFilter() {
  const showOnlyFav = checkFavOnly.checked;
  presetCards.forEach(card => {
    const presetName = card.dataset.preset;
    if (showOnlyFav) {
      if (starredPresets.includes(presetName)) {
        card.classList.remove('hidden-preset');
      } else {
        card.classList.add('hidden-preset');
      }
    } else {
      card.classList.remove('hidden-preset');
    }
  });
}

starToggles.forEach(toggle => {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const presetName = toggle.dataset.target;
    const favIndex = starredPresets.indexOf(presetName);

    if (favIndex > -1) {
      if (starredPresets.length <= 1) {
        alert("즐겨찾기는 최소 1개 이상 유지되어야 합니다.");
        return;
      }
      starredPresets.splice(favIndex, 1);
    } else {
      starredPresets.push(presetName);
    }

    localStorage.setItem('starredPresets', JSON.stringify(starredPresets));
    updateStarsDisplay();
    applyFavoriteFilter();
  });
});

checkFavOnly.addEventListener('change', applyFavoriteFilter);

/* ─────────────────────────────────────────────────────────────────────────────
   6. 디자인 프리셋 제어
   ───────────────────────────────────────────────────────────────────────────── */
function setPreset(presetName) {
  currentSettings.preset = presetName;

  // 이전 테마 클래스 청소
  lowerThirdBanner.className = 'lower-third-banner canvas-draggable';
  lowerThirdBanner.classList.add(`theme-${presetName}`);

  presetCards.forEach(card => {
    if (card.dataset.preset === presetName) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  // CNN 혹은 긴급 뉴스 속보는 방송 규칙상 글리터를 숨김 처리
  if (presetName === 'cnn' || presetName === 'breaking-news') {
    checkGlitter.checked = false;
    checkGlitter.disabled = true;
  } else {
    checkGlitter.disabled = false;
    checkGlitter.checked = currentSettings.glitterEnabled;
  }

  updatePreviewLines();
  updateGlitterSettings();
  triggerIntroAnimation();
}

function triggerIntroAnimation() {
  lowerThirdBanner.classList.remove('animate-intro');
  void lowerThirdBanner.offsetWidth;
  lowerThirdBanner.classList.add('animate-intro');
}

presetCards.forEach(card => {
  card.addEventListener('click', () => {
    setPreset(card.dataset.preset);
  });
});

btnReplay.addEventListener('click', triggerIntroAnimation);

/* ─────────────────────────────────────────────────────────────────────────────
   7. 글리터 (Shimmer Sheen) 연동
   ───────────────────────────────────────────────────────────────────────────── */
function updateGlitterSettings() {
  const enabled = checkGlitter.checked && !checkGlitter.disabled;
  const speed = parseFloat(rangeGlitterSpeed.value);
  const width = parseInt(rangeGlitterWidth.value);

  if (!checkGlitter.disabled) {
    currentSettings.glitterEnabled = checkGlitter.checked;
  }
  currentSettings.glitterSpeed = speed;
  currentSettings.glitterWidth = width;

  speedVal.textContent = `${speed.toFixed(1)}초`;
  widthVal.textContent = `${width}px`;

  if (enabled) {
    glitterSheen.classList.add('animate-glitter');
  } else {
    glitterSheen.classList.remove('animate-glitter');
  }

  glitterSheen.style.setProperty('--glitter-duration', `${speed}s`);

  // 두께(폭) 비율에 따른 그라데이션 정지점 계산
  const borderPercent = Math.min(45, (width / 400) * 45);
  const leftStop = 50 - borderPercent;
  const rightStop = 50 + borderPercent;

  let gradStr = '';
  const p = currentSettings.preset;
  if (p === 'gold' || p === 'oscar' || p === 'gold-brushed') {
    gradStr = `linear-gradient(90deg, rgba(197, 160, 89, 0) 0%, rgba(197, 160, 89, 0) ${leftStop}%, rgba(255, 230, 160, 0.8) 50%, rgba(197, 160, 89, 0) ${rightStop}%, rgba(197, 160, 89, 0) 100%)`;
  } else if (p === 'cyber' || p === 'hologram' || p === 'synthwave' || p === 'cyber-glitch' || p === 'neon-pulse') {
    gradStr = `linear-gradient(90deg, rgba(0, 255, 204, 0) 0%, rgba(0, 255, 204, 0) ${leftStop}%, rgba(0, 255, 204, 0.7) 48%, rgba(255, 0, 127, 0.7) 52%, rgba(0, 255, 204, 0) ${rightStop}%, rgba(0, 255, 204, 0) 100%)`;
  } else if (p === 'minimal' || p === 'apple-accent' || p === 'vintage-journal') {
    gradStr = `linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) ${leftStop}%, rgba(0, 0, 0, 0.15) 50%, rgba(0, 0, 0, 0) ${rightStop}%, rgba(0, 0, 0, 0) 100%)`;
  } else {
    gradStr = `linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) ${leftStop}%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) ${rightStop}%, rgba(255, 255, 255, 0) 100%)`;
  }

  glitterSheen.style.backgroundImage = gradStr;
}

checkGlitter.addEventListener('change', updateGlitterSettings);
rangeGlitterSpeed.addEventListener('input', updateGlitterSettings);
rangeGlitterWidth.addEventListener('input', updateGlitterSettings);

/* ─────────────────────────────────────────────────────────────────────────────
   8. 가상 모니터 배경화면
   ───────────────────────────────────────────────────────────────────────────── */
function setMonitorBackground(bgName) {
  currentSettings.bg = bgName;
  monitorScreen.className = 'monitor-screen';
  monitorScreen.classList.add(`bg-${bgName}`);

  bgBtns.forEach(btn => {
    if (btn.dataset.bg === bgName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

bgBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    setMonitorBackground(btn.dataset.bg);
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   9. html2canvas 기반 PNG 정적 캡처 및 VP9 기반 투명 WebM 동영상 녹화
   ───────────────────────────────────────────────────────────────────────────── */
function downloadBanner() {
  const originalText = btnDownload.innerHTML;
  btnDownload.disabled = true;
  btnDownload.innerHTML = '📥 렌더링 및 캡처 중...';

  // 1) 캡처 품질 옵션 (2.5배 해상도, 배경 제거)
  const options = {
    backgroundColor: null,
    scale: 2.5,
    useCORS: true,
    logging: false
  };

  // 2) 캡처를 위해 임시로 선택선(focused-item) 제거
  const focusedEl = document.querySelector('.canvas-draggable.focused-item');
  if (focusedEl) {
    focusedEl.classList.remove('focused-item');
  }

  // 3) 글리터 광원 인쇄 보정 처리
  const wasGlittering = glitterSheen.classList.contains('animate-glitter');
  if (wasGlittering) {
    glitterSheen.classList.remove('animate-glitter');
  }
  glitterSheen.classList.add('capture-static');

  // 4) 개별 분산 배치를 수용하기 위해, 배너 본체가 아닌 16:9 캔버스 자체를 투명화 캡처
  const prevBgClass = monitorScreen.className;
  monitorScreen.className = 'monitor-screen'; // 클래스 리셋 -> 투명 배경으로 인식하게 함
  
  html2canvas(lowerThirdContainer, options).then(canvas => {
    // 5) 원래 상태 복원
    monitorScreen.className = prevBgClass;
    glitterSheen.classList.remove('capture-static');
    if (wasGlittering) {
      glitterSheen.classList.add('animate-glitter');
    }
    if (focusedEl) {
      focusedEl.classList.add('focused-item');
    }

    try {
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      
      const rawName = textLines[0].trim() || 'lower_third';
      const safeName = rawName.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣-_]/g, '_');
      
      link.download = `${safeName}_lower_third_layout.png`;
      link.href = imgData;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('파일 저장 중 에러 발생: ' + e.message);
    } finally {
      btnDownload.disabled = false;
      btnDownload.innerHTML = originalText;
    }
  }).catch(err => {
    alert('자막 이미지 생성 실패: ' + err.message);
    // 복구 처리
    monitorScreen.className = prevBgClass;
    glitterSheen.classList.remove('capture-static');
    if (wasGlittering) {
      glitterSheen.classList.add('animate-glitter');
    }
    if (focusedEl) {
      focusedEl.classList.add('focused-item');
    }
    btnDownload.disabled = false;
    btnDownload.innerHTML = originalText;
  });
}

// 🌟 투명 VP9 WebM 비디오 생성 및 녹화 엔진 (OBS/영상 편집 지원)
async function recordWebM() {
  const originalText = btnDownload.innerHTML;
  btnDownload.disabled = true;
  btnDownload.innerHTML = '🎬 WebM 비디오 생성 중...';

  // 1) 렌더링용 임시 캔버스 생성 및 스크린 크기 맞춤
  const recordCanvas = document.createElement('canvas');
  const rect = lowerThirdContainer.getBoundingClientRect();
  recordCanvas.width = rect.width * 2;
  recordCanvas.height = rect.height * 2;
  const ctx = recordCanvas.getContext('2d');

  // 2) 스트림 추출 및 MediaRecorder 구성 (투명 비디오 vp9 우선)
  const stream = recordCanvas.captureStream(25);
  
  let options = { mimeType: 'video/webm;codecs=vp9' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm;codecs=vp8' };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm' };
  }

  const chunks = [];
  const mediaRecorder = new MediaRecorder(stream, options);
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const rawName = textLines[0].trim() || 'lower_third';
    const safeName = rawName.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣-_]/g, '_');
    link.download = `${safeName}_lower_third_motion.webm`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    btnDownload.disabled = false;
    btnDownload.innerHTML = originalText;
  };

  // 3) 녹화 개시
  mediaRecorder.start();

  // 4) 캡처 직전 가이드 점선 일시 제거
  const focusedEl = document.querySelector('.canvas-draggable.focused-item');
  if (focusedEl) {
    focusedEl.classList.remove('focused-item');
  }

  // 5) 글리터 1주기 시간(3.5초) 동안 캔버스 프레임 드로잉 루프
  const duration = 3500; // ms
  const fps = 20;
  const interval = 1000 / fps;
  const totalFrames = (duration / 1000) * fps;

  // 글리터 애니메이션 타임라인 동기화 재생
  const wasGlittering = glitterSheen.classList.contains('animate-glitter');
  if (wasGlittering) {
    glitterSheen.classList.remove('animate-glitter');
    void glitterSheen.offsetWidth;
    glitterSheen.classList.add('animate-glitter');
  }

  for (let i = 0; i < totalFrames; i++) {
    btnDownload.innerHTML = `🎬 비디오 렌더링 (${Math.round((i / totalFrames) * 100)}%)`;
    
    const frameCanvas = await html2canvas(lowerThirdContainer, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false
    });

    ctx.clearRect(0, 0, recordCanvas.width, recordCanvas.height);
    ctx.drawImage(frameCanvas, 0, 0);

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  // 6) 녹화 중지 및 포커스 복원
  mediaRecorder.stop();
  if (focusedEl) {
    focusedEl.classList.add('focused-item');
  }
}

// 다운로드 형식 라우팅 바인딩
btnDownload.addEventListener('click', () => {
  const downloadType = document.getElementById('downloadType').value;
  if (downloadType === 'webm') {
    recordWebM();
  } else {
    downloadBanner();
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   10. 초기화 실행
   ───────────────────────────────────────────────────────────────────────────── */
function init() {
  renderInputFields();
  setPreset('netflix');
  setMonitorBackground('cinematic');
  updateGlitterSettings();
  updateStarsDisplay();
  applyFavoriteFilter();
  updatePreviewLines();
  
  // 최초 히스토리 스택 기초값 저장
  saveHistory();
}

window.addEventListener('DOMContentLoaded', init);
