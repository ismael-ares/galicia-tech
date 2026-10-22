(() => {
  const stages = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let instance = 0;

  function stageFor(button) {
    return button.closest('.card, .variant, .hero')?.querySelector('.logo-stage');
  }
  const controls = [...document.querySelectorAll('[data-animate]')];
  controls.forEach(button => { button.disabled = true; });

  async function play(stage, target) {
    if (!stage?.isConnected || !stage.querySelector('svg')) return;
    const run = (stage.animationRun || 0) + 1;
    stage.animationRun = run;
    stage.classList.remove('is-playing');
    stage.dataset.target = target;
    if (reducedMotion.matches) return;
    void stage.offsetWidth;
    stage.classList.add('is-playing');
    void stage.offsetWidth;
    await Promise.all(stage.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
    if (stage.animationRun === run) stage.classList.remove('is-playing');
  }

  function uniqueIds(svg) {
    const prefix = `brand-${++instance}-`;
    const ids = new Map();
    svg.querySelectorAll('[id]').forEach(element => {
      ids.set(element.id, prefix + element.id);
      element.id = prefix + element.id;
    });
    svg.querySelectorAll('*').forEach(element => {
      [...element.attributes].forEach(attribute => {
        let value = attribute.value;
        if (['aria-labelledby', 'aria-describedby'].includes(attribute.name)) {
          value = value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
        } else if (['href', 'xlink:href'].includes(attribute.name) && value.startsWith('#')) {
          value = '#' + (ids.get(value.slice(1)) || value.slice(1));
        } else {
          value = value.replace(/url\(#([^)]*)\)/g, (match, id) => ids.has(id) ? `url(#${ids.get(id)})` : match);
        }
        if (value !== attribute.value) element.setAttribute(attribute.name, value);
      });
    });
  }

  function pageParameters(url) {
    const parameters = new URLSearchParams(url.search);
    parameters.delete('v'); // Asset-preview cache keys do not identify another page.
    parameters.sort();
    return parameters.toString();
  }

  function connectHeader(stage, svg) {
    const link = stage.closest('a.brand');
    svg.classList.add('brand-logo');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.removeAttribute('tabindex');
    svg.removeAttribute('aria-label');
    const cue = () => {
      if (!stage.classList.contains('is-playing')) play(stage, 'brand');
    };
    link.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') cue(); });
    link.addEventListener('focusin', cue);
    link.addEventListener('click', event => {
      // Modified clicks and links to other pages keep native navigation.
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const destination = new URL(link.href);
      if (destination.origin === location.origin && destination.pathname === location.pathname && pageParameters(destination) === pageParameters(new URL(location.href)) && !destination.hash) {
        event.preventDefault();
        history.replaceState(history.state, '', destination.pathname + destination.search);
        scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        play(stage, 'all');
      }
    });
  }

  function prepareSvg(stage, svg) {
    uniqueIds(svg);
    svg.classList.add('animated-brand-mark');
    svg.setAttribute('role', 'img');
    svg.removeAttribute('aria-labelledby');
    svg.removeAttribute('aria-describedby');
    const shell = svg.querySelector('.component-shell');
    stage.dataset.logoKind = shell ? 'shell' : 'route';
    if (shell) {
      const outline = svg.querySelector('.shell-outline');
      if (outline) {
        outline.classList.add('component-outline');
        outline.setAttribute('pathLength', '1');
      }
      svg.querySelectorAll('.component-ribs path').forEach((path, index) => {
        path.classList.add('component-rib');
        path.setAttribute('pathLength', '1');
        path.style.setProperty('--rib-index', index);
      });
      svg.querySelectorAll('.component-route').forEach(path => path.setAttribute('pathLength', '1'));
    } else {
      svg.querySelectorAll('path').forEach((path, index) => {
        path.classList.add(index === 0 ? 'component-route' : 'component-links');
        path.setAttribute('pathLength', '1');
      });
    }
    svg.querySelector('rect')?.classList.add('component-tile');
    svg.querySelectorAll('circle').forEach(node => {
      node.classList.add('component-node');
      node.style.transformBox = 'fill-box';
      node.style.transformOrigin = 'center';
    });
    svg.querySelectorAll('text').forEach((text, index) => {
      text.classList.add(index === 0 ? 'component-wordmark' : 'component-tagline');
    });
    if (stage.classList.contains('app-brand')) {
      connectHeader(stage, svg);
    } else {
      svg.setAttribute('role', 'button');
      svg.setAttribute('tabindex', '0');
      svg.setAttribute('focusable', 'true');
      svg.setAttribute('aria-label', `Reproducir la animación de ${stage.dataset.label || 'Galicia Tech'}`);
      svg.addEventListener('click', () => play(stage, 'all'));
      svg.addEventListener('keydown', event => {
        if (!event.repeat && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          play(stage, 'all');
        }
      });
    }
  }

  async function initialize(stage) {
    if (stages.has(stage)) return;
    stages.add(stage);
    try {
      const response = await fetch(stage.dataset.src, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`Logo no disponible: ${response.status}`);
      const parsed = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      const svg = parsed.documentElement;
      if (svg.localName !== 'svg' || parsed.querySelector('parsererror')) throw new Error('SVG no válido');
      if (!stage.isConnected) return;
      const inlineSvg = document.importNode(svg, true);
      prepareSvg(stage, inlineSvg);
      stage.replaceChildren(inlineSvg);
      stage.dataset.ready = 'true';
      controls.filter(button => stageFor(button) === stage).forEach(button => { button.disabled = false; });
      if (stage.classList.contains('app-brand')) requestAnimationFrame(() => play(stage, 'brand'));
    } catch (error) {
      // The original image remains usable when animation cannot load.
      stage.dataset.ready = 'false';
      console.warn('No se pudo preparar la animación del logo.', error);
    }
  }

  function enhanceHeader(image) {
    if (image.closest('.logo-stage')) return;
    const link = image.closest('a.brand');
    if (!link) return;
    const stage = document.createElement('span');
    stage.className = 'logo-stage app-brand';
    stage.dataset.src = image.getAttribute('src');
    stage.dataset.label = 'Galicia Tech';
    if (!document.documentElement.hasAttribute('data-theme')) {
      stage.dataset.brandTheme = stage.dataset.src.includes('-dark.svg') ? 'dark' : 'light';
    }
    if (!link.hasAttribute('aria-label')) link.setAttribute('aria-label', 'Galicia Tech, agenda');
    image.replaceWith(stage);
    stage.append(image);
    initialize(stage);
  }

  document.querySelectorAll('.logo-stage[data-src]').forEach(initialize);
  document.querySelectorAll('img.brand-logo').forEach(enhanceHeader);
  controls.forEach(button => button.addEventListener('click', () => play(stageFor(button), button.dataset.animate)));

  // Style comparisons can replace their header without loading a new page.
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.matches('img.brand-logo')) enhanceHeader(node);
      node.querySelectorAll('img.brand-logo').forEach(enhanceHeader);
    }));
    stages.forEach(stage => { if (!stage.isConnected) stages.delete(stage); });
  }).observe(document.body, { childList: true, subtree: true });

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) stages.forEach(stage => {
      stage.animationRun = (stage.animationRun || 0) + 1;
      stage.classList.remove('is-playing');
    });
  });
})();
