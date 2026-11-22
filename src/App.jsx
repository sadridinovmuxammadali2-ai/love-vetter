import { useEffect, useRef, useState } from 'react';
import Hearts, { burst } from './Hearts.jsx';
import { audio } from './audio.js';
import { api } from './api.js';

const REASONS = [
  { icon: '🌸', title: 'Your smile', text: 'It lights up even my darkest days, like sunshine breaking through the clouds.' },
  { icon: '✨', title: 'Your eyes', text: 'Somewhere deep inside them lives the kindest warmth in the whole universe.' },
  { icon: '💗', title: 'Your heart', text: 'The softness in every word you say leaves me amazed, every single day.' },
  { icon: '🌙', title: 'Just you', text: 'You exist in my life — and that alone turned my life into the greatest gift.' },
];

const POEM = [
  [
    'When morning spills its gold on you,',
    'the world forgets to turn,',
    'and every sky I ever knew',
    'has one more thing to learn.',
  ],
  [
    'Your laughter is my favorite song,',
    'your hand, my safest place —',
    'I think I loved you all along,',
    'before I saw your face.',
  ],
  [
    'And if the stars should lose their light',
    'and seasons drift apart,',
    'I’ll find my way through any night:',
    'the map is in my heart.',
  ],
];

function useReveal(active) {
  useEffect(() => {
    if (!active) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.12 }
    );
    const scan = () => document.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [active]);
}

const NOTES = [
  { icon: '🌧️', when: 'you feel sad', text: 'Breathe slowly. Whatever it is, it will pass — and I will be right here when it does. You are so much stronger than this moment, and you never have to carry it alone.' },
  { icon: '💭', when: 'you miss me', text: 'Close your eyes and put your hand on your heart. Feel that? That is exactly where I am, every second of every day. Distance is only a number; you are always with me.' },
  { icon: '🌙', when: 'you can’t sleep', text: 'Picture us under a sky full of stars, your head on my shoulder, the whole world quiet. Count my heartbeats instead of sheep. Goodnight, my moon.' },
  { icon: '🌷', when: 'you need a smile', text: 'Remember the way you laugh when something is really funny — the one where you cover your face? That is my favorite sound in the universe. Now smile, I can feel it from here.' },
];

const PROMISES = [
  'I promise to always listen — even to the little things.',
  'I promise to make you laugh on your hardest days.',
  'I promise to hold your hand through every storm.',
  'I promise to never stop choosing you.',
  'I promise to be your safest place.',
  'I promise to cheer for every dream you have.',
  'I promise to love you a little more each morning.',
  'I promise to keep your heart gentle and warm.',
  'I promise to always find my way back to you.',
  'I promise forever — and then a little longer.',
];

// 10 stars placed along a heart curve (viewBox 100 × 92)
const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const t = (i / 10) * Math.PI * 2;
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return { x: 50 + x * 2.75, y: 40 - y * 2.75 };
});
const HEART_PATH = Array.from({ length: 80 }, (_, i) => {
  const t = (i / 80) * Math.PI * 2;
  const x = 50 + 16 * Math.sin(t) ** 3 * 2.75;
  const y = 40 - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 2.75;
  return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
}).join(' ') + 'Z';

// Twinkling stars and shooting stars (night sky on the site)
const STARS = Array.from({ length: 90 }, () => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() * 2.2 + 0.6,
  delay: Math.random() * 5,
  dur: 2.5 + Math.random() * 4,
}));

// Falling rose petals
const PETALS = Array.from({ length: 18 }, () => ({
  left: Math.random() * 100,
  delay: Math.random() * 12,
  dur: 10 + Math.random() * 10,
  size: 10 + Math.random() * 12,
  drift: (Math.random() - 0.5) * 200,
}));

// Shown if the server can't be reached, so the page never breaks
const FALLBACK_LETTER = {
  recipient: 'Xusniya',
  sender: 'Yours, forever',
  caption: 'You are my everything',
  photo: null,
  message: `Ever since you walked into my life, my whole world has been painted in brighter colors.

Every gentle smile of yours fills my heart with a joy and calm that never runs out. When I look into your eyes, it feels like I'm seeing the purest beauty the universe has to offer.

I love you not only in the happy moments, but in every second, with every breath — exactly as you are. You are my most beautiful dream and my most precious happiness.

Keep smiling, always. Because when you smile, the whole world becomes a little more beautiful.`,
};

export default function App() {
  const [letter, setLetter] = useState(null);
  const [stage, setStage] = useState('sealed'); // sealed → opening → open
  const [musicOn, setMusicOn] = useState(false);
  const [flipped, setFlipped] = useState({});
  const [openNote, setOpenNote] = useState(null);
  const progressRef = useRef(null);
  useReveal(stage === 'open');

  useEffect(() => {
    let cancelled = false;
    let retry;
    const load = () => {
      api.getLetter()
        .then((l) => { if (!cancelled) setLetter(l); })
        .catch(() => {
          if (cancelled) return;
          // keep the page working with the built-in letter, and keep retrying quietly
          setLetter((cur) => cur ?? FALLBACK_LETTER);
          retry = setTimeout(load, 5000);
        });
    };
    load();
    return () => { cancelled = true; clearTimeout(retry); };
  }, []);

  useEffect(() => {
    if (letter) document.title = `For ${letter.recipient} 💌`;
  }, [letter]);

  // her song (if uploaded) replaces the built-in piano
  useEffect(() => {
    if (letter) audio.setTrack(letter.music || null);
  }, [letter?.music]);

  // gold reading-progress bar
  useEffect(() => {
    if (stage !== 'open') return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [stage]);

  // lock scrolling while the envelope is on screen
  useEffect(() => {
    document.body.style.overflow = stage === 'open' ? '' : 'hidden';
  }, [stage]);

  const openEnvelope = () => {
    if (stage !== 'sealed' || !letter) return;
    audio.init();
    audio.playSealBreak();
    audio.playSparkleHarp();
    audio.startMusic();
    setMusicOn(true);
    setStage('open');
    window.scrollTo(0, 0);
    burst(window.innerWidth / 2, window.innerHeight * 0.45, 55);
  };

  const toggleMusic = () => {
    audio.init();
    setMusicOn(audio.toggleMusic());
  };

  const readLetter = () => document.getElementById('letter')?.scrollIntoView({ behavior: 'smooth' });

  const flip = (i) => {
    audio.init();
    audio.playChime(950 + Math.random() * 200, 0.35, 0.05);
    setFlipped((f) => ({ ...f, [i]: !f[i] }));
  };

  const showNote = (i) => {
    audio.init();
    audio.playPaperRustle();
    setOpenNote(i);
  };

  // tap anywhere on the page → a tiny burst of hearts
  const onPageTap = (e) => {
    if (stage !== 'open' || e.target.closest('button, a, input, textarea, label, .modal')) return;
    burst(e.clientX, e.clientY, 10);
  };

  if (!letter) {
    return (
      <div className="loading">
        <div className="page-bg" aria-hidden="true"><div className="blob b1" /><div className="blob b2" /></div>
        <span className="loading-heart">💗</span>
      </div>
    );
  }

  const style = letter.photo ? { '--photo': `url("${letter.photo}")` } : undefined;
  // each step has its own colors: envelope → site
  const phase = stage === 'open' ? 'phase-site' : 'phase-envelope';

  return (
    <div className={`love ${phase} ${letter.photo ? 'has-photo' : ''}`} style={style} onClick={onPageTap}>
      <div className="page-bg" aria-hidden="true">
        <div className="page-photo" />
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        <div className="stars">
          {STARS.map((st, i) => (
            <i key={i} style={{ left: `${st.left}%`, top: `${st.top}%`, width: st.size, height: st.size, animationDelay: `${st.delay}s`, animationDuration: `${st.dur}s` }} />
          ))}
          <b className="shoot s1" /><b className="shoot s2" /><b className="shoot s3" />
        </div>
      </div>
      <div className="petals" aria-hidden="true">
        {PETALS.map((p, i) => (
          <span
            key={i}
            style={{
              left: `${p.left}%`, width: p.size, height: p.size,
              animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
              '--drift': `${p.drift}px`,
            }}
          />
        ))}
      </div>
      <Hearts />

      {/* ENVELOPE INTRO */}
      {stage !== 'open' && (
        <div className={`intro ${stage}`}>
          <button className="envelope" onClick={openEnvelope} aria-label="Open the envelope">
            <span className="env-back" />
            <span className="env-front" />
            <span className="env-flap" />
            <span className="env-ribbon" />
            <span className="env-seal"><span className="seal-letter">X</span></span>
          </button>
        </div>
      )}

      {stage === 'open' && (
        <>
          <div className="progress" aria-hidden="true"><span ref={progressRef} /></div>
          <header className="topbar">
            <div className="top-actions">
              <button className="soft-btn" onClick={toggleMusic} title="Music">{musicOn ? '🎵' : '🔇'}<span>Music</span></button>
            </div>
          </header>

          {/* HERO */}
          <section className="hero">
            <div className="hero-photo" aria-hidden="true" />
            <div className="hero-veil" aria-hidden="true" />
            <div className="hero-content">
              <div className="heart-frame rv" aria-label="Her photo">
                <span className="heart-glow" />
                <span className="heart-pic">
                  {!letter.photo && <span className="heart-empty">💗</span>}
                </span>
              </div>
              <p className="tiny rv">a little love letter for</p>
              <h1 className="name rv">{letter.recipient}</h1>
              <p className="subtitle rv">{letter.caption}</p>
              <button className="cta rv" onClick={readLetter}>Read my letter <span>💌</span></button>
            </div>
            <button className="scroll-cue" onClick={readLetter} aria-label="Scroll down"><span /></button>
          </section>

          {/* LETTER */}
          <section className="letter-sec" id="letter">
            <div className="letter-row">
            <div className="letter-portrait rv" aria-hidden="true">
              <span className="letter-portrait-pic" />
            </div>
            <article className="letter glow-border rv">
              <div className="letter-photo" aria-hidden="true" />
              <div className="letter-inner">
                <span className="flourish">❦</span>
                <h2 className="dear">Dear {letter.recipient},</h2>
                {letter.message.split(/\n\s*\n/).map((p, i) => (
                  <p key={i} className="para rv" style={{ transitionDelay: `${i * 120}ms` }}>{p}</p>
                ))}
                <div className="sign">
                  <span>with all my love,</span>
                  <strong>{letter.sender}</strong>
                </div>
              </div>
            </article>
            </div>
          </section>

          {/* TOGETHER COUNTER */}
          {letter.since && (
            <section className="together-sec">
              <Divider />
              <p className="eyebrow rv">every second counts</p>
              <h2 className="sec-title rv">Together for</h2>
              <Together since={letter.since} />
            </section>
          )}

          {/* REASONS */}
          <section className="reasons-sec">
            <Divider />
            <p className="eyebrow rv">a few of a thousand reasons</p>
            <h2 className="sec-title rv">Why I love you</h2>
            <p className="sec-sub rv">tap a card 💕</p>
            <div className="cards">
              {REASONS.map((r, i) => (
                <button
                  key={r.title}
                  className={`card rv ${flipped[i] ? 'flipped' : ''}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                  onClick={() => flip(i)}
                >
                  <span className="card-inner">
                    <span className="face front">
                      <span className="card-icon">{r.icon}</span>
                      <span className="card-title">{r.title}</span>
                    </span>
                    <span className="face back">
                      <span className="card-text">{r.text}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* PHOTO + POEM */}
          <section className="promise-sec">
            <div className="promise">
              <div className="portrait rv" aria-label="Her photo">
                <span className="portrait-pic">
                  {!letter.photo && <span className="heart-empty">💗</span>}
                </span>
                <span className="portrait-cap">my favorite view</span>
              </div>
              <div className="promise-text">
                <p className="eyebrow left rv">written for you</p>
                <h2 className="sec-title rv">A poem for you</h2>
                <div className="poem glow-border rv">
                  {POEM.map((stanza, i) => (
                    <p key={i} className="stanza">
                      {stanza.map((line) => <span key={line}>{line}</span>)}
                    </p>
                  ))}
                  <p className="poem-sign">{letter.sender}</p>
                </div>
              </div>
            </div>
          </section>

          {/* OPEN WHEN */}
          <section className="notes-sec">
            <Divider />
            <p className="eyebrow rv">little letters for later</p>
            <h2 className="sec-title rv">Open when…</h2>
            <p className="sec-sub rv">keep these for the moments you need them</p>
            <div className="notes">
              {NOTES.map((n, i) => (
                <button key={n.when} className="note-env rv" style={{ transitionDelay: `${i * 90}ms` }} onClick={() => showNote(i)}>
                  <span className="note-flap" />
                  <span className="note-seal">{n.icon}</span>
                  <span className="note-label"><small>open when</small>{n.when}</span>
                </button>
              ))}
            </div>
          </section>

          {/* THE QUESTION */}
          <section className="question-sec">
            <Divider />
            <Constellation recipient={letter.recipient} />
          </section>

          <footer className="foot">made with all my love, only for {letter.recipient} ♡</footer>
        </>
      )}

      {openNote !== null && (
        <Modal onClose={() => setOpenNote(null)}>
          <div className="note-paper">
            <button type="button" className="x" onClick={() => setOpenNote(null)} aria-label="Close">×</button>
            <span className="note-paper-icon">{NOTES[openNote].icon}</span>
            <p className="note-paper-when">Open when {NOTES[openNote].when}</p>
            <p className="note-paper-text">{NOTES[openNote].text}</p>
            <p className="note-paper-sign">{letter.sender}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Divider() {
  return <div className="divider rv" aria-hidden="true"><span>❦</span></div>;
}

function Together({ since }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const start = new Date(`${since}T00:00:00`);
  const diff = Math.max(0, now - start.getTime());
  const units = [
    ['days', Math.floor(diff / 864e5)],
    ['hours', Math.floor(diff / 36e5) % 24],
    ['minutes', Math.floor(diff / 6e4) % 60],
    ['seconds', Math.floor(diff / 1e3) % 60],
  ];
  return (
    <>
      <div className="counter rv">
        {units.map(([label, v]) => (
          <div key={label} className="count-tile">
            <strong key={label === 'seconds' ? v : undefined}>{String(v).padStart(2, '0')}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="since rv">since {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} — and counting, forever</p>
    </>
  );
}

function Constellation({ recipient }) {
  const [lit, setLit] = useState([]);
  const [current, setCurrent] = useState(null);
  const litRef = useRef([]);
  const done = lit.length === STAR_POINTS.length;

  const light = (i, e) => {
    audio.init();
    setCurrent(i);
    if (litRef.current.includes(i)) return;
    const next = [...litRef.current, i];
    litRef.current = next;
    setLit(next);
    audio.playChime(700 + next.length * 70, 0.6, 0.06);
    const r = e.currentTarget.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 8);
    if (next.length === STAR_POINTS.length) {
      setTimeout(() => {
        audio.playCelebration();
        [0, 350, 700].forEach((d) => setTimeout(() => burst(window.innerWidth * (0.3 + Math.random() * 0.4), window.innerHeight * (0.3 + Math.random() * 0.3), 50), d));
      }, 400);
    }
  };

  // lines connect the stars in heart order, once both ends are lit
  const segs = STAR_POINTS.map((p, i) => [p, STAR_POINTS[(i + 1) % STAR_POINTS.length], i]);

  return (
    <div className="constellation question glow-border rv">
      <p className="eyebrow">written in the stars</p>
      <h2 className="sec-title">My promises to you</h2>
      <p className="sec-sub">tap every star to light our sky ✨</p>
      <div className={`sky ${done ? 'done' : ''}`}>
        <svg viewBox="0 0 100 92" className="sky-svg" aria-hidden="true">
          <defs>
            <radialGradient id="heartGlow"><stop offset="0%" stopColor="#f7dd9c" stopOpacity="0.55" /><stop offset="100%" stopColor="#f7dd9c" stopOpacity="0" /></radialGradient>
          </defs>
          <path className="sky-heart" d={HEART_PATH} />
          {segs.map(([a, b, i]) => (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={lit.includes(i) && lit.includes((i + 1) % STAR_POINTS.length) ? 'on' : ''} />
          ))}
        </svg>
        {STAR_POINTS.map((p, i) => (
          <button
            key={i}
            className={`sky-star ${lit.includes(i) ? 'lit' : ''} ${current === i ? 'current' : ''}`}
            style={{ left: `${p.x}%`, top: `${(p.y / 92) * 100}%`, animationDelay: `${i * 0.3}s` }}
            onClick={(e) => light(i, e)}
            aria-label={`Star ${i + 1}`}
          >
            <span />
          </button>
        ))}
        <div className="sky-center">
          {done
            ? <p key="done" className="promise-line final">Forever yours, {recipient} ♡</p>
            : current !== null
              ? <p key={current} className="promise-line">{PROMISES[current]}</p>
              : <p className="promise-hint">{lit.length} / {STAR_POINTS.length}</p>}
        </div>
      </div>
      <p className="sky-count">{done ? 'every star is yours now' : `${lit.length} of ${STAR_POINTS.length} stars lit`}</p>
    </div>
  );
}

function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal">
      <div className="modal-bg" onClick={onClose} />
      <div className="modal-box">{children}</div>
    </div>
  );
}
