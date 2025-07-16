import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';

const steps = [
  {
    selector: '[data-tutorial="sidebar-main"]',
    title: 'Главная',
    content: 'Здесь ваша основная лента и быстрый доступ к ключевым функциям.'
  },
  {
    selector: '[data-tutorial="sidebar-properties"]',
    title: 'Объекты недвижимости',
    content: 'Здесь вы управляете всеми объектами недвижимости.'
  },
  {
    selector: '[data-tutorial="sidebar-clients"]',
    title: 'Мои клиенты',
    content: 'Здесь вы можете управлять базой клиентов и отслеживать их статусы.'
  },
  {
    selector: '[data-tutorial="sidebar-selection"]',
    title: 'Подбор',
    content: 'Создавайте подборки объектов для клиентов.'
  },
  {
    selector: '[data-tutorial="sidebar-chats"]',
    title: 'Чаты',
    content: 'Общайтесь с клиентами и коллегами.'
  },
  {
    selector: '[data-tutorial="sidebar-notifications"]',
    title: 'Уведомления',
    content: 'Все важные уведомления будут здесь.'
  },
  {
    selector: '[data-tutorial="sidebar-education"]',
    title: 'Обучение',
    content: 'В этом разделе — обучение, вебинары и FAQ.'
  },
  {
    selector: '[data-tutorial="sidebar-profile"]',
    title: 'Мой профиль',
    content: 'Здесь вы можете изменить свои данные.'
  },
  {
    selector: '[data-tutorial="sidebar-settings"]',
    title: 'Настройки',
    content: 'Настройте платформу под себя.'
  },
  {
    selector: '[data-tutorial="header-search"]',
    title: 'Поиск по сайту',
    content: 'Быстрый поиск по объектам, клиентам, чатам, уведомлениям и обучению.'
  },
  {
    selector: '[data-tutorial="header-calendar"]',
    title: 'Календарь мероприятий',
    content: 'Все ваши события, вебинары и мероприятия — в едином календаре.'
  },
  {
    selector: '[data-tutorial="property-card"]',
    title: 'Карточки объектов',
    content: 'В карточке — вся ключевая информация, статус, агент, цена, быстрые действия.'
  },
  {
    selector: '[data-tutorial="faq-block"]',
    title: 'FAQ и вопросы',
    content: 'В этом блоке — быстрые ответы на частые вопросы.'
  },
  {
    selector: '[data-tutorial="faq"]',
    title: 'FAQ и обучение',
    content: 'В разделе "Обучение" — быстрые ответы на вопросы и актуальные вебинары.'
  },
];

const LOCAL_KEY = 'realtor_tutorial_completed_v1';

const ModernTutorial: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [coords, setCoords] = useState<{top: number, left: number, width: number, height: number, element?: HTMLElement} | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const prevElementRef = useRef<HTMLElement | null>(null);

  const clearHighlight = (el?: HTMLElement) => {
    if (!el) return;
    el.style.filter = '';
    el.style.zIndex = '';
    el.style.position = '';
    el.style.boxShadow = '';
    el.style.transition = '';
    el.style.background = '';
    el.style.pointerEvents = '';
    el.style.removeProperty('filter');
    el.style.removeProperty('backdrop-filter');
    el.style.removeProperty('-webkit-backdrop-filter');
    // Сбросить стили со всех потомков
    el.querySelectorAll('*').forEach(child => {
      (child as HTMLElement).style.filter = '';
      (child as HTMLElement).style.removeProperty('filter');
      (child as HTMLElement).style.removeProperty('backdrop-filter');
      (child as HTMLElement).style.removeProperty('-webkit-backdrop-filter');
    });
  };

  useEffect(() => {
    // Сбросить стили с предыдущего элемента до применения новых
    if (prevElementRef.current) {
      clearHighlight(prevElementRef.current);
      prevElementRef.current = null;
    }
    const el = document.querySelector(steps[step].selector) as HTMLElement;
    if (el) {
      prevElementRef.current = el;
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        element: el
      });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Снимаем фильтр blur и делаем элемент четким поверх overlay
      el.style.filter = 'none';
      el.style.zIndex = '10001';
      el.style.position = 'relative';
      el.style.boxShadow = '0 0 0 4px #7c3aed55, 0 8px 32px #7c3aed22';
      el.style.transition = 'box-shadow 0.2s, filter 0.2s';
      el.style.background = 'rgba(255,255,255,0.85)';
      el.style.pointerEvents = 'auto';
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('backdrop-filter', 'none', 'important');
      el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      // Снимаем blur со всех потомков
      el.querySelectorAll('*').forEach(child => {
        (child as HTMLElement).style.setProperty('filter', 'none', 'important');
        (child as HTMLElement).style.setProperty('backdrop-filter', 'none', 'important');
        (child as HTMLElement).style.setProperty('-webkit-backdrop-filter', 'none', 'important');
      });
    }
    localStorage.setItem('realtor_tutorial_step', String(step));
    return () => {
      // Сбросить стили с предыдущего элемента (на всякий случай)
      if (prevElementRef.current) {
        clearHighlight(prevElementRef.current);
        prevElementRef.current = null;
      }
    };
  }, [step]);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(LOCAL_KEY, '1');
    localStorage.removeItem('realtor_tutorial_step');
    if (coords && coords.element) {
      clearHighlight(coords.element);
    }
    if (onClose) onClose();
  };

  const handleNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const handlePrev = () => setStep(s => Math.max(s - 1, 0));

  // Overlay и подсветка
  return ReactDOM.createPortal(
    <>
      {/* Overlay с дыркой */}
      {coords && (
        <>
          {/* Top overlay */}
          <div style={{
            position: 'fixed',
            zIndex: 9998,
            top: 0,
            left: 0,
            width: '100vw',
            height: coords.top - 8,
            background: 'rgba(30,40,60,0.25)',
            backdropFilter: 'blur(2px)',
            transition: 'background 0.2s',
          }} onClick={handleNext} />
          {/* Bottom overlay */}
          <div style={{
            position: 'fixed',
            zIndex: 9998,
            top: coords.top + coords.height + 8,
            left: 0,
            width: '100vw',
            height: `calc(100vh - ${coords.top + coords.height + 8}px)`,
            background: 'rgba(30,40,60,0.25)',
            backdropFilter: 'blur(2px)',
            transition: 'background 0.2s',
          }} onClick={handleNext} />
          {/* Left overlay */}
          <div style={{
            position: 'fixed',
            zIndex: 9998,
            top: coords.top - 8,
            left: 0,
            width: coords.left - 8,
            height: coords.height + 16,
            background: 'rgba(30,40,60,0.25)',
            backdropFilter: 'blur(2px)',
            transition: 'background 0.2s',
          }} onClick={handleNext} />
          {/* Right overlay */}
          <div style={{
            position: 'fixed',
            zIndex: 9998,
            top: coords.top - 8,
            left: coords.left + coords.width + 8,
            width: `calc(100vw - ${coords.left + coords.width + 8}px)`,
            height: coords.height + 16,
            background: 'rgba(30,40,60,0.25)',
            backdropFilter: 'blur(2px)',
            transition: 'background 0.2s',
          }} onClick={handleNext} />
        </>
      )}
      {/* Highlight */}
      {coords && (
        <div style={{
          position: 'absolute',
          zIndex: 9999,
          top: coords.top - 8,
          left: coords.left - 8,
          width: coords.width + 16,
          height: coords.height + 16,
          borderRadius: 14,
          boxShadow: '0 0 0 4px #7c3aed55, 0 8px 32px #7c3aed22',
          border: '2.5px solid #7c3aed',
          pointerEvents: 'none',
          transition: 'all 0.2s',
        }} />
      )}
      {/* Tooltip */}
      <div
        ref={ref}
        style={{
          position: 'absolute',
          zIndex: 10000,
          top: coords ?
            (coords.top + coords.height + 18 + 220 > window.innerHeight + window.scrollY
              ? coords.top - 18 - 180
              : coords.top + coords.height + 18)
            : '40%',
          left: coords ?
            (coords.left + 380 > window.innerWidth + window.scrollX
              ? Math.max(16, window.innerWidth + window.scrollX - 400)
              : coords.left)
            : '50%',
          minWidth: 320,
          maxWidth: 380,
          transform: coords ? 'none' : 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: 18,
          boxShadow: '0 8px 32px rgba(80,60,180,0.10)',
          padding: 28,
          color: '#222',
          fontSize: 17,
          fontWeight: 500,
          lineHeight: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: '1.5px solid #e6e6fa',
          animation: 'fadeIn 0.3s',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 2 }}>{steps[step].title}</div>
        <div>{steps[step].content}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={handlePrev} disabled={step === 0} style={{ opacity: step === 0 ? 0.5 : 1, border: 'none', background: '#f3f3fa', borderRadius: 8, padding: '6px 16px', fontWeight: 500, cursor: step === 0 ? 'not-allowed' : 'pointer' }}>Назад</button>
          {step < steps.length - 1 ? (
            <button onClick={handleNext} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #e6eaf1' }}>Далее</button>
          ) : (
            <button onClick={handleClose} style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #e6eaf1' }}>Завершить</button>
          )}
          <button onClick={handleClose} style={{ marginLeft: 'auto', background: 'none', color: '#888', border: 'none', fontWeight: 500, cursor: 'pointer' }}>Пропустить</button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
      `}</style>
    </>,
    document.body
  );
};

export default ModernTutorial; 