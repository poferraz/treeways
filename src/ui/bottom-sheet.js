const STATES = ['peek', 'half', 'full'];

export function createBottomSheet(content) {
  const aside = document.createElement('aside');
  aside.className = 'bottom-sheet';
  aside.setAttribute('aria-label', 'Tree information and nearby results');

  const sheetHeader = document.createElement('div');
  sheetHeader.className = 'sheet-header';
  const handle = document.createElement('button');
  handle.className = 'sheet-handle';
  handle.type = 'button';
  handle.setAttribute('aria-label', 'Expand tree information');
  handle.setAttribute('aria-controls', 'inspector-content');
  const close = document.createElement('button');
  close.className = 'sheet-close';
  close.type = 'button';
  close.textContent = 'Close details';
  close.hidden = true;
  sheetHeader.append(handle, close);
  content.id = 'inspector-content';
  aside.append(sheetHeader, content);

  let startY;
  let onClose = () => {};
  handle.addEventListener('click', () => setState(nextState(aside.dataset.state, 1)));
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
  handle.addEventListener('pointerdown', event => {
    startY = event.clientY;
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointerup', event => {
    if (startY == null) return;
    const delta = event.clientY - startY;
    startY = undefined;
    if (Math.abs(delta) > 40) setState(nextState(aside.dataset.state, delta < 0 ? 1 : -1));
  });
  close.addEventListener('click', () => onClose());
  aside.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !close.hidden) onClose();
  });

  function setState(state) {
    aside.dataset.state = STATES.includes(state) ? state : 'peek';
    const index = STATES.indexOf(aside.dataset.state);
    handle.setAttribute('aria-expanded', String(index > 0));
    handle.setAttribute('aria-label', index === STATES.length - 1 ? 'Collapse tree information' : 'Expand tree information');
  }

  function setSelectionActive(active) {
    close.hidden = !active;
  }

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
