(() => {
  const intro = document.querySelector('.intro');
  const work = document.querySelector('.work');
  const workScene = document.querySelector('.work-scene');
  const journal = document.querySelector('.journal');
  const progress = document.querySelector('.progress');
  const links = Array.from(document.querySelectorAll('.top nav a[href^="#"]'));
  const targets = links.map((link) => document.querySelector(link.hash));
  const gallery = document.querySelector('.gallery');
  const track = document.querySelector('.gallery-track');
  const plates = Array.from(track.querySelectorAll('.plate'));
  const controls = Array.from(document.querySelectorAll('.gallery-nav button'));
  const nativeGallery = window.matchMedia('(max-width: 720px), (prefers-reduced-motion: reduce)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (number) => Math.min(1, Math.max(0, number));
  let offset = window.scrollY;
  let easedOffset = offset;
  let viewportHeight = window.innerHeight;
  let maxScroll = 1;
  let introDistance = 1;
  let targetsY = [];
  let workStart = 0;
  let workLength = 1;
  let galleryLength = 1;
  let lastFrameTime = 0;
  let activeChapter = -2;
  let activePlate = -1;
  let frame = 0;

  const measure = () => {
    viewportHeight = window.innerHeight;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
    introDistance = Math.max(1, intro.offsetHeight);
    targetsY = targets.map((target) => target.getBoundingClientRect().top + window.scrollY);
    const headerHeight = document.querySelector('.top').offsetHeight;
    workStart = targetsY[0] - headerHeight;
    workLength = Math.max(1, work.offsetHeight - workScene.offsetHeight);
    galleryLength = Math.max(1, track.scrollWidth - gallery.clientWidth);
  };

  const updatePlate = (amount) => {
    const selected = Math.round(amount * (plates.length - 1));
    work.style.setProperty('--gallery-progress', String(amount));
    if (activePlate === selected) return;
    for (const [index, button] of controls.entries()) {
      button.setAttribute('aria-pressed', String(index === selected));
    }
    activePlate = selected;
  };

  const animate = (time) => {
    frame = 0;
    const elapsed = lastFrameTime ? Math.min(time - lastFrameTime, 45) : 16;
    lastFrameTime = time;
    const smooth = !reduceMotion.matches;
    easedOffset = smooth ? easedOffset + (offset - easedOffset) * (1 - Math.exp(-elapsed / 72)) : offset;
    if (Math.abs(offset - easedOffset) < .3) easedOffset = offset;

    progress.style.setProperty('--progress', String(clamp(offset / maxScroll)));
    if (smooth) {
      const hero = clamp(easedOffset / (introDistance * .9));
      const entrance = clamp((easedOffset + viewportHeight * .68 - targetsY[0]) / (viewportHeight * .68));
      const writing = clamp((easedOffset + viewportHeight * .77 - targetsY[1]) / (viewportHeight * .62));
      intro.style.setProperty('--cover-y', (hero * 36) + 'px');
      intro.style.setProperty('--cover-img-y', (hero * 41) + 'px');
      intro.style.setProperty('--cover-scale', String(1.04 + hero * .145));
      intro.style.setProperty('--cover-clip', (hero * 2.5) + '%');
      intro.style.setProperty('--headline-first', (-hero * 32) + 'px');
      intro.style.setProperty('--headline-second', (hero * 21) + 'px');
      intro.style.setProperty('--headline-y', (-hero * 87) + 'px');
      intro.style.setProperty('--headline-opacity', String(1 - hero * .50));
      work.style.setProperty('--project-copy-y', ((1 - entrance) * 50) + 'px');
      journal.style.setProperty('--journal-y', ((1 - writing) * 22) + 'px');
      journal.style.setProperty('--journal-second-y', ((1 - writing) * 44) + 'px');
    }

    if (nativeGallery.matches) {
      updatePlate(clamp(gallery.scrollLeft / galleryLength));
    } else {
      const galleryProgress = clamp((easedOffset - workStart) / workLength);
      work.style.setProperty('--gallery-x', (-galleryProgress * galleryLength) + 'px');
      updatePlate(galleryProgress);
    }

    const atEnd = maxScroll > 1 && offset >= maxScroll - 4;
    const chapter = atEnd ? targets.length - 1 : targetsY.findLastIndex((top) => top <= offset + 118);
    if (chapter !== activeChapter) {
      for (const [index, link] of links.entries()) {
        if (index === chapter) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
      activeChapter = chapter;
    }
    if (easedOffset !== offset) frame = requestAnimationFrame(animate);
    else lastFrameTime = 0;
  };

  const schedule = () => {
    offset = window.scrollY;
    if (!frame) frame = requestAnimationFrame(animate);
  };
  const resize = () => { measure(); schedule(); };
  for (const button of controls) {
    button.addEventListener('click', () => {
      const selected = Number(button.dataset.plate);
      if (nativeGallery.matches) {
        gallery.scrollTo({
          left: plates[selected].offsetLeft,
          behavior: reduceMotion.matches ? 'instant' : 'smooth',
        });
      } else {
        const amount = selected / (plates.length - 1);
        window.scrollTo({ top: workStart + workLength * amount, behavior: 'smooth' });
      }
    });
  }
  window.addEventListener('scroll', schedule, { passive: true });
  gallery.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize);
  nativeGallery.addEventListener('change', resize);
  reduceMotion.addEventListener('change', resize);
  new ResizeObserver(resize).observe(document.querySelector('main'));
  resize();
})();
