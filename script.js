'use strict';
const $ = (selector) => document.querySelector(selector);
const slides = [...document.querySelectorAll('.slide')];
const chapters = ['THE CHALLENGE', 'THE PROBLEM', 'MEET THE TOOL', 'CREATE OUR SECRET', 'THE INTERCEPTION', 'UNLOCK THE MESSAGE', 'FOLLOW THE EVIDENCE', 'THE KEY DISTINCTION', 'THE VERDICT', 'GROUP 5'];
const officialURL = 'https://textmechanic.com/text-tools/obfuscation-tools/encryption-generator/';
let current = 0, encrypted = null, attempts = 0, busy = false, generation = 0, toastTimer;
document.querySelectorAll('.official').forEach(a => { a.href = officialURL; });
function go(index) {
  const previousIndex = current;
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => { slide.hidden = i !== current; slide.classList.toggle('active', i === current); });
  $('#counter').innerHTML = `${String(current + 1).padStart(2, '0')} <i>/ ${String(slides.length).padStart(2, '0')}</i>`;
  $('#chapter').textContent = chapters[current];
  $('#progress').style.width = `${(current + 1) / slides.length * 100}%`;
  $('#previous').disabled = current === 0; $('#next').disabled = current === slides.length - 1;
  document.querySelectorAll('.slide-dots button').forEach((button, i) => { button.classList.toggle('current', i === current); button.setAttribute('aria-current', i === current ? 'step' : 'false'); });
  window.scrollTo({ top: 0, behavior: 'instant' });
  animateSlide(slides[current], current >= previousIndex ? 1 : -1);
}
slides.forEach((_, i) => { const button = document.createElement('button'); button.setAttribute('aria-label', `Slide ${i + 1}: ${chapters[i]}`); button.onclick = () => go(i); $('.slide-dots').append(button); });
$('#previous').onclick = () => go(current - 1); $('#next').onclick = () => go(current + 1);
$('.brand').onclick = event => { event.preventDefault(); go(0); };
document.querySelectorAll('[data-go]').forEach(button => { button.onclick = () => go(Number(button.dataset.go)); });
$('#start').onclick = async () => { const button = $('#start'); button.disabled = true; button.textContent = 'INITIALIZING CHALLENGE…'; await new Promise(resolve => setTimeout(resolve, 650)); if (current === 0) go(1); button.innerHTML = 'START CHALLENGE <span>↗</span>'; button.disabled = false; };
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500); }
async function fullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('Fullscreen is unavailable in this browser.'); } catch { toast('Fullscreen is unavailable. Try your browser’s fullscreen control.'); } }
$('#fullscreen').onclick = fullscreen;
document.addEventListener('fullscreenchange', () => $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));
document.addEventListener('keydown', event => { if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, select, [contenteditable="true"]') || $('#quiz-dialog').open) return; if (event.code === 'Space' && event.target.closest('button, a, summary')) return; if (event.key === 'ArrowRight' || event.code === 'Space') { event.preventDefault(); go(current + 1); } else if (event.key === 'ArrowLeft') { event.preventDefault(); go(current - 1); } else if (event.key.toLowerCase() === 'f') { event.preventDefault(); fullscreen(); } });
document.querySelectorAll('[data-quiz]').forEach(quiz => quiz.querySelectorAll('[data-answer]').forEach(button => { button.onclick = () => { const correct = button.dataset.answer === 'correct'; quiz.querySelectorAll('[data-answer]').forEach(b => { b.classList.remove('chosen-correct', 'chosen-wrong'); b.setAttribute('aria-pressed', 'false'); }); button.classList.add(correct ? 'chosen-correct' : 'chosen-wrong'); button.setAttribute('aria-pressed', 'true'); const feedback = quiz.querySelector('.feedback'); feedback.textContent = `${correct ? '✓' : '×'} ${correct ? feedback.dataset.success : feedback.dataset.retry}`; feedback.classList.toggle('error', !correct); const reveal = quiz.querySelector('.reveal'); if (reveal) reveal.hidden = !correct; }; }));
$('#example').onclick = () => { $('#message').value = 'IPAPASA TAYONG LAHAT NI SIR ENGELBERT!'; $('#password').focus(); };
$('#show-password').onclick = () => { const visible = $('#password').type === 'password'; $('#password').type = visible ? 'text' : 'password'; $('#show-password').textContent = visible ? 'HIDE' : 'SHOW'; $('#show-password').setAttribute('aria-pressed', String(visible)); };
const encoder = new TextEncoder();
async function deriveKey(password, salt) { const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256'}, material, {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']); }
function status(selector, message, error = false) { $(selector).textContent = message; $(selector).classList.toggle('error', error); }
function resetUnlock() { attempts = 0; $('#attempts').textContent = 'ATTEMPTS: 0'; $('#guess').value = ''; status('#decrypt-status', ''); $('#unlock-panel').classList.remove('success'); $('#unlock-heading').textContent = 'Waiting for the right key.'; $('#recovered').textContent = 'The original message stays hidden until the correct password is used.'; $('#celebration').replaceChildren(); }
$('#encrypt-form').addEventListener('submit', async event => { event.preventDefault(); if (busy) return; if (!globalThis.crypto?.subtle) { status('#encrypt-status', 'Web Crypto is unavailable. Open this presentation through localhost with VS Code Live Server.', true); return; } const message = $('#message').value, password = $('#password').value; if (!message.trim() || !password) { status('#encrypt-status', 'Enter a message and a password first.', true); return; } busy = true; const token = generation; $('#encrypt-button').disabled = true; status('#encrypt-status', 'ENCRYPTING…'); try { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)); const key = await deriveKey(password, salt); const data = new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, encoder.encode(message))); if (token !== generation) return; encrypted = { salt, iv, data }; const packed = new Uint8Array(salt.length + iv.length + data.length); packed.set(salt); packed.set(iv, 16); packed.set(data, 28); const ciphertext = 'LAB1.' + btoa(String.fromCharCode(...packed)); $('#plaintext-output').textContent = message; $('#cipher-output').textContent = ciphertext; document.querySelectorAll('.cipher-shared').forEach(node => node.textContent = ciphertext); document.querySelectorAll('.needs-message').forEach(node => node.hidden = true); $('#encrypt-empty').hidden = true; $('#encrypt-result').hidden = false; $('#password').value = ''; $('#password').type = 'password'; $('#show-password').textContent = 'SHOW'; $('#show-password').setAttribute('aria-pressed', 'false'); resetUnlock(); status('#encrypt-status', '✓ MESSAGE ENCRYPTED — ready for interception.'); } catch { status('#encrypt-status', 'Encryption could not finish. Please try again in a modern browser.', true); } finally { busy = false; $('#encrypt-button').disabled = false; } });
$('#copy').onclick = async () => { try { await navigator.clipboard.writeText($('#cipher-output').textContent); toast('Ciphertext copied to clipboard.'); } catch { const range = document.createRange(); range.selectNodeContents($('#cipher-output')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); toast('Ciphertext selected. Press Ctrl+C (or Cmd+C) to copy.'); } };
$('#decrypt-form').addEventListener('submit', async event => { event.preventDefault(); if (busy) return; if (!encrypted) { status('#decrypt-status', 'Create and encrypt a secret on slide 4 first.', true); return; } busy = true; const token = generation; $('#decrypt-button').disabled = true; attempts++; $('#attempts').textContent = `ATTEMPTS: ${attempts}`; $('#unlock-panel').classList.remove('success'); $('#unlock-heading').textContent = 'Checking the key…'; $('#recovered').textContent = 'The original message remains hidden.'; status('#decrypt-status', 'DECRYPTING…'); try { const key = await deriveKey($('#guess').value, encrypted.salt); const plaintext = await crypto.subtle.decrypt({name:'AES-GCM', iv:encrypted.iv}, key, encrypted.data); if (token !== generation) return; $('#unlock-panel').classList.add('success'); $('#unlock-heading').textContent = 'ORIGINAL MESSAGE'; $('#recovered').textContent = new TextDecoder().decode(plaintext); $('#recovered').animate([{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0)'}], {duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600}); status('#decrypt-status', '✓ DECRYPTION SUCCESSFUL'); $('#celebration').replaceChildren(); for (let i = 0; i < 18; i++) { const confetti = document.createElement('span'); confetti.style.setProperty('--angle', `${i * 20}deg`); $('#celebration').append(confetti); } } catch { if (token !== generation) return; $('#unlock-heading').textContent = 'Access denied.'; status('#decrypt-status', '× ACCESS DENIED · WRONG PASSWORD — try again.', true); } finally { busy = false; $('#decrypt-button').disabled = false; $('#guess').value = ''; } });
$('#final-quiz').onclick = () => $('#quiz-dialog').showModal(); $('.dialog-close').onclick = () => $('#quiz-dialog').close(); $('#quiz-dialog').addEventListener('click', event => { if (event.target === $('#quiz-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });
$('#restart').onclick = () => { generation++; encrypted = null; $('#encrypt-form').reset(); $('#encrypt-result').hidden = true; $('#encrypt-empty').hidden = false; $('#plaintext-output').textContent = ''; $('#cipher-output').textContent = ''; status('#encrypt-status', ''); resetUnlock(); document.querySelectorAll('.cipher-shared').forEach(node => node.textContent = 'No ciphertext yet. Create a secret on slide 4.'); document.querySelectorAll('.needs-message').forEach(node => node.hidden = false); document.querySelectorAll('[data-quiz] .feedback').forEach(node => { node.textContent = ''; node.classList.remove('error'); }); document.querySelectorAll('[data-answer]').forEach(node => { node.classList.remove('chosen-correct','chosen-wrong'); node.setAttribute('aria-pressed','false'); }); document.querySelectorAll('.reveal').forEach(node => node.hidden = true); $('#quiz-dialog').close(); $('#password').type = 'password'; $('#show-password').textContent = 'SHOW'; $('#show-password').setAttribute('aria-pressed', 'false'); go(0); toast('New challenge. All messages, passwords, and answers cleared.'); };
for (let i = 0; i < 20; i++) { const particle = document.createElement('span'); particle.className = 'particle'; particle.style.left = `${(i * 47 + 13) % 100}%`; particle.style.top = `${(i * 31 + 9) % 100}%`; particle.style.animationDelay = `${-i * .7}s`; $('#particles').append(particle); }
// The correct final answer completes the challenge and reveals the team.
document.querySelector('[data-quiz="final"] [data-answer="correct"]').addEventListener('click', () => {
  $('#quiz-dialog').close();
  go(9);
  toast('Correct! Same secret, symmetric process. Challenge complete.');
  $('#title-10').setAttribute('tabindex', '-1');
  $('#title-10').focus({ preventScroll: true });
});
// Presentation-only effects: never modify messages, quiz logic, or navigation order.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
function animateSlide(slide, direction) {
  if (reducedMotion.matches || !slide.animate) return;
  document.querySelectorAll('.slide').forEach(node => node.getAnimations({ subtree: true }).forEach(animation => {
    if (animation.id === 'slide-reveal') animation.cancel();
  }));
  const elements = [...slide.children].filter(element => !element.hidden);
  elements.forEach((element, i) => {
    const animation = element.animate([
      { opacity: 0, transform: `translateY(12px) translateX(${direction * 10}px)` },
      { opacity: 1, transform: 'translate(0, 0)' }
    ], { duration: 420, delay: Math.min(i * 45, 180), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    animation.id = 'slide-reveal';
  });
}
document.querySelectorAll('.panel, .hero-art').forEach(element => {
  let frame = 0;
  element.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = element.getBoundingClientRect();
      const x = event.clientX - bounds.left, y = event.clientY - bounds.top;
      element.style.setProperty('--spot-x', `${x}px`);
      element.style.setProperty('--spot-y', `${y}px`);
      if (element.classList.contains('hero-art')) {
        element.style.setProperty('--art-x', `${(x / bounds.width - .5) * 10}px`);
        element.style.setProperty('--art-y', `${(y / bounds.height - .5) * 8}px`);
      }
    });
  });
  element.addEventListener('pointerleave', () => {
    cancelAnimationFrame(frame);
    ['--spot-x', '--spot-y', '--art-x', '--art-y'].forEach(property => element.style.removeProperty(property));
  });
});
document.addEventListener('click', event => {
  const button = event.target.closest('.primary, .secondary, .choices button');
  if (!button || button.disabled || reducedMotion.matches) return;
  const bounds = button.getBoundingClientRect();
  const wave = document.createElement('span');
  wave.className = 'click-wave';
  wave.setAttribute('aria-hidden', 'true');
  wave.style.left = `${event.detail ? event.clientX - bounds.left : bounds.width / 2}px`;
  wave.style.top = `${event.detail ? event.clientY - bounds.top : bounds.height / 2}px`;
  button.append(wave);
  setTimeout(() => wave.remove(), 700);
});
document.querySelectorAll('.feedback').forEach(element => {
  new MutationObserver(() => {
    if (!element.textContent || reducedMotion.matches || !element.animate) return;
    element.animate([{ opacity: .35, translate: '0 4px' }, { opacity: 1, translate: '0 0' }], { duration: 250 });
  }).observe(element, { childList: true });
});
go(0);
