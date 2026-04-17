// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Subtle parallax tilt on the hero app window
const appWindow = document.querySelector('.app-window');
const heroVisual = document.querySelector('.hero-visual');

if (appWindow && heroVisual && window.matchMedia('(pointer: fine)').matches) {
  let rafId = null;
  let targetX = -8;
  let targetY = 4;
  let currentX = -8;
  let currentY = 4;

  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    targetX = -8 + x * 6;
    targetY = 4 - y * 4;
    if (!rafId) rafId = requestAnimationFrame(update);
  });

  heroVisual.addEventListener('mouseleave', () => {
    targetX = -8;
    targetY = 4;
    if (!rafId) rafId = requestAnimationFrame(update);
  });

  function update() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;
    appWindow.style.transform = `rotateY(${currentX}deg) rotateX(${currentY}deg) rotate(0.5deg)`;
    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      rafId = requestAnimationFrame(update);
    } else {
      rafId = null;
    }
  }
}

// Close other FAQ items when one opens (single-open accordion)
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (item.open) {
      faqItems.forEach((other) => {
        if (other !== item) other.removeAttribute('open');
      });
    }
  });
});
