const STATES = ['map', 'peek', 'half', 'full'];

export function createBottomSheet(content) {
  const aside = document.createElement('aside');
  aside.className = 'bottom-sheet';
  aside.setAttribute('aria-label', 'Tree information and nearby results');

  const sheetHeader = document.createElement('div');
  sheetHeader.className = 'sheet-header';
  const handle = document.createElement('button');
  handle.className = 'sheet-handle';
  handle.type = 'button';
  const grip = document.createElement('span');
  grip.className = 'sheet-grip';
  grip.setAttribute('aria-hidden', 'true');
  const handleLabel = document.createElement('span');
  handleLabel.className = 'sheet-handle-label';
  handle.append(grip, handleLabel);
  handle.setAttribute('aria-controls', 'inspector-content');
  const showMap = document.createElement('button');
  showMap.className = 'sheet-map-button';
  showMap.type = 'button';
  showMap.textContent = 'Map';
  showMap.setAttribute('aria-label', 'Show full map');
  const close = document.createElement('button');
  close.className = 'sheet-close';
  close.type = 'button';
  close.textContent = 'Close';
  close.hidden = true;
  sheetHeader.append(handle, showMap, close);
  content.id = 'inspector-content';
  aside.append(sheetHeader, content);

  const mobileViewport = matchMedia('(max-width: 767px)');
  let startY;
  let dragged = false;
  let suppressHandleClick = false;
  let onClose = () => {};
  handle.addEventListener('click', event => {
    if (suppressHandleClick) {
      event.preventDefault();
      suppressHandleClick = false;
      return;
    }
    setState(aside.dataset.state === 'map' ? 'peek' : aside.dataset.state === 'full' ? 'peek' : 'full');
  });
  handle.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setState(nextState(aside.dataset.state, 1));
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setState(nextState(aside.dataset.state, -1));
    }
  });
  const beginDrag = clientY => {
    startY = clientY;
    dragged = false;
    aside.classList.add('is-dragging');
  };
  const moveDrag = clientY => {
    if (startY == null) return;
    const delta = Math.max(-120, Math.min(120, clientY - startY));
    if (Math.abs(delta) > 5) dragged = true;
    aside.style.translate = `0 ${delta}px`;
  };
  const finishDrag = clientY => {
    if (startY == null) return;
    const delta = clientY - startY;
    startY = undefined;
    aside.classList.remove('is-dragging');
    aside.style.removeProperty('translate');
    if (dragged) {
      suppressHandleClick = true;
      setTimeout(() => suppressHandleClick = false, 400);
    }
    if (Math.abs(delta) > 36) setState(nextState(aside.dataset.state, delta < 0 ? 1 : -1));
  };
  const cancelDrag = () => {
    startY = undefined;
    dragged = false;
    aside.classList.remove('is-dragging');
    aside.style.removeProperty('translate');
  };
  handle.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') return;
    beginDrag(event.clientY);
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    moveDrag(event.clientY);
  });
  handle.addEventListener('pointerup', event => {
    if (event.pointerType === 'touch') return;
    finishDrag(event.clientY);
  });
  handle.addEventListener('pointercancel', event => {
    if (event.pointerType !== 'touch') cancelDrag();
  });
  handle.addEventListener('touchstart', event => {
    if (event.touches.length === 1) beginDrag(event.touches[0].clientY);
  }, { passive: true });
  handle.addEventListener('touchmove', event => {
    if (event.touches.length !== 1) return;
    event.preventDefault();
    moveDrag(event.touches[0].clientY);
  }, { passive: false });
  handle.addEventListener('touchend', event => {
    const touch = event.changedTouches[0];
    if (touch) finishDrag(touch.clientY);
  });
  handle.addEventListener('touchcancel', cancelDrag);
  showMap.addEventListener('click', () => setState('map'));
  close.addEventListener('click', () => onClose());
  aside.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !close.hidden) onClose();
  });

  function setState(state) {
    aside.dataset.state = STATES.includes(state) ? state : 'peek';
    const index = STATES.indexOf(aside.dataset.state);
    handle.setAttribute('aria-expanded', String(index > 0));
    handle.setAttribute('aria-label', aside.dataset.state === 'map' ? 'Show tree information' : aside.dataset.state === 'full' ? 'Show less tree information' : 'Show more tree information');
    handleLabel.textContent = aside.dataset.state === 'map' ? 'Explore trees' : aside.dataset.state === 'full' ? 'Less detail' : 'More detail';
    showMap.hidden = aside.dataset.state === 'map';
    syncContentAvailability();
  }

  function syncContentAvailability() {
    const mapOnly = mobileViewport.matches && aside.dataset.state === 'map';
    content.inert = mapOnly;
    content.setAttribute('aria-hidden', String(mapOnly));
  }

  function setSelectionActive(active) {
    close.hidden = !active;
  }

  mobileViewport.addEventListener('change', syncContentAvailability);
  setState('peek');
  return {
    element: aside,
    setState,
    setSelectionActive,
    onClose(callback) { onClose = callback; }
  };
}

function nextState(current, direction) {
  const index = Math.max(0, STATES.indexOf(current));
  return STATES[Math.max(0, Math.min(STATES.length - 1, index + direction))];
}
