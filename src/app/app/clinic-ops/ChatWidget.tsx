'use client';

import { useState } from 'react';

type ChatMsg = { from: 'bot' | 'user'; text: string };

const QUICK_QUESTIONS: { q: string; a: string }[] = [
  { q: 'Do you take my insurance?', a: 'We’re in-network with most major providers, including Cigna, Aetna, and UnitedHealthcare. Send your plan name and we’ll confirm before your visit.' },
  { q: 'Can I book a Saturday appointment?', a: 'Yes — Saturday slots open at 9am. Want me to hold one? Just share your preferred time.' },
  { q: 'What if I need to cancel?', a: 'No penalty with 24 hours’ notice. Reply here or use the link in your reminder text.' },
  { q: 'Do you see new patients?', a: 'Always. New-patient exams include a full set of x-rays and a cleaning — usually a 45-minute visit.' },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'bot', text: 'Hi — I can help with appointments, insurance, or hours. What do you need?' },
  ]);

  function ask(q: string, a: string) {
    setMessages((m) => [...m, { from: 'user', text: q }]);
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { from: 'bot', text: a }]);
    }, 650);
  }

  return (
    <>
      <button className="chatFab" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close chat' : 'Open chat'}>
        {open ? '✕' : 'Ai'}
      </button>
      {open && (
        <div className="chatPanel">
          <div className="chatHead">
            Practice Assistant <span className="chatStatus">● online</span>
          </div>
          <div className="chatBody">
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.from}`}>
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="bubble bot typingBubble">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
          <div className="chatQuick">
            {QUICK_QUESTIONS.map((item) => (
              <button key={item.q} onClick={() => ask(item.q, item.a)}>
                {item.q}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .chatFab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: #3B39E0; color: #fff; border: none; font-family: var(--font-display, var(--font-fraunces)), sans-serif; font-weight: 700; font-size: 1rem; cursor: pointer; z-index: 50; box-shadow: 0 3px 0 #2C2AB8, 0 6px 18px rgba(59,57,224,0.35); transition: transform 0.15s ease; }
        .chatFab:hover { transform: translateY(-1px); }
        .chatPanel { position: fixed; bottom: 92px; right: 24px; width: 320px; max-height: 440px; background: #fff; border: 2px solid #0a0a0a; border-radius: 18px; display: flex; flex-direction: column; z-index: 50; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.2); font-family: var(--font-body, var(--font-instrument)), sans-serif; }
        .chatHead { padding: 14px 16px; border-bottom: 1px solid #e5e5e5; font-weight: 700; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; }
        .chatStatus { font-size: 0.66rem; color: #3B39E0; font-weight: 700; }
        .chatBody { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; min-height: 130px; }
        .bubble { font-size: 0.83rem; padding: 9px 12px; border-radius: 12px; max-width: 85%; line-height: 1.4; font-weight: 500; }
        .bubble.bot { background: #f2f2f2; align-self: flex-start; }
        .bubble.user { background: #3B39E0; color: #fff; align-self: flex-end; }
        .typingBubble { display: flex; gap: 4px; align-items: center; padding: 11px; }
        .typingBubble span { width: 5px; height: 5px; border-radius: 50%; background: #999; animation: blink 1.1s infinite; }
        .typingBubble span:nth-child(2) { animation-delay: 0.15s; }
        .typingBubble span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
        .chatQuick { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-top: 1px solid #e5e5e5; }
        .chatQuick button { text-align: left; font-size: 0.76rem; padding: 7px 10px; border: 1px solid #e5e5e5; border-radius: 8px; background: #fff; cursor: pointer; font-family: inherit; }
        .chatQuick button:hover { border-color: #3B39E0; color: #3B39E0; }
        @media (max-width: 760px) {
          .chatPanel { width: calc(100vw - 32px); right: 16px; }
        }
      `}</style>
    </>
  );
}
