(function () {
  var track = document.querySelector('[data-phone-track]');
  var sticky = document.querySelector('.phone-sticky');
  var viewport = document.querySelector('[data-phone-viewport]');
  var content = document.querySelector('[data-phone-content]');
  if (!track || !sticky || !viewport || !content) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // How quickly the displayed position "catches up" to the scroll-derived
  // target each frame. Lower = smoother/more damped but laggier behind the
  // finger; higher = snappier but closer to the old direct-mapped feel.
  var SMOOTHING = 0.16;
  var SNAP_EPSILON = 0.0008;

  var maxTranslate = 0;
  var runway = 0;
  var pinStartScrollY = 0;
  var targetProgress = 0;
  var currentProgress = 0;
  var lastDrawnProgress = -1;
  var rafId = null;

  function recalcLayout() {
    var header = document.querySelector('.site-header');
    var headerHeight = header ? header.offsetHeight : 0;
    document.documentElement.style.setProperty('--header-h', headerHeight + 'px');

    if (reduceMotion) {
      track.style.height = '';
      content.style.transform = '';
      return;
    }

    var viewportHeight = viewport.clientHeight;
    var contentTop = content.offsetTop; // resolves the CSS top:6.6% to px
    maxTranslate = Math.max(0, content.offsetHeight - (viewportHeight - contentTop));

    var stickyTopPx = window.innerHeight * 0.12 + headerHeight; // matches .phone-sticky { top: calc(12vh + var(--header-h)) }
    runway = maxTranslate;

    // The track must be tall enough to hold the sticky element for its
    // full height while pinned (stickyTopPx + its own height), not just
    // one viewport — otherwise, when the hero-copy column grows taller
    // than the phone (e.g. large/zoomed text), the sticky content
    // overflows the track and bleeds into the next section.
    var stickyHeight = sticky.getBoundingClientRect().height;
    var minTrackHeight = Math.max(window.innerHeight, stickyTopPx + stickyHeight);
    track.style.height = (minTrackHeight + runway) + 'px';

    var trackDocTop = track.getBoundingClientRect().top + window.scrollY;
    // Clamp to 0: if the header (sticky) pushes stickyTopPx past the
    // track's natural document position, the raw value goes negative,
    // which made progress nonzero even at scrollY 0 — pre-scrolling the
    // content and clipping the greeting before the user scrolled at all.
    pinStartScrollY = Math.max(0, trackDocTop - stickyTopPx);

    // Snap (don't ease) on layout recalcs — this fires on load/resize, and
    // easing in from a stale position there would look like an unwanted
    // animation rather than a response to scrolling.
    targetProgress = computeTargetProgress();
    currentProgress = targetProgress;
    lastDrawnProgress = -1; // force a redraw even if the numeric progress is unchanged
    draw();
  }

  function computeTargetProgress() {
    if (runway <= 0) return 0;
    var p = (window.scrollY - pinStartScrollY) / runway;
    return Math.min(1, Math.max(0, p));
  }

  function draw() {
    if (currentProgress === lastDrawnProgress) return;
    lastDrawnProgress = currentProgress;
    // translate3d (not translateY) + a standing will-change hint keeps this
    // on its own compositor layer throughout, rather than promoting/
    // demoting mid-gesture, which is what reads as stutter on iOS Safari.
    content.style.transform = 'translate3d(0, -' + (currentProgress * maxTranslate).toFixed(2) + 'px, 0)';
  }

  // A scroll *event* is the wrong signal to drive this off on mobile:
  // Safari (and Chrome on Android to a lesser extent) coalesces/throttles
  // scroll events during momentum scrolling, so an event-driven update
  // visibly lags/jumps behind the finger. Sampling window.scrollY every
  // animation frame instead stays locked to the browser's own paint
  // cadence regardless of how scroll events are dispatched — and easing
  // currentProgress toward that target (rather than snapping straight to
  // it) smooths out the remaining jumpiness from raw scroll deltas. The
  // IntersectionObserver just keeps this rAF loop from running for the
  // entire life of the page — it's only active while the hero track is
  // actually on/near screen.
  function loop() {
    targetProgress = computeTargetProgress();
    var delta = targetProgress - currentProgress;
    currentProgress = Math.abs(delta) < SNAP_EPSILON ? targetProgress : currentProgress + delta * SMOOTHING;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (rafId === null && !reduceMotion) rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) startLoop();
        else stopLoop();
      },
      { rootMargin: '20% 0px 20% 0px' }
    );
    observer.observe(track);
  } else {
    startLoop(); // fallback: just run continuously
  }

  window.addEventListener('resize', recalcLayout);

  if (content.complete) {
    recalcLayout();
  } else {
    content.addEventListener('load', recalcLayout);
  }
  window.addEventListener('load', recalcLayout);
})();
