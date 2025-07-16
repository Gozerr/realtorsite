import React from 'react';
import { Card, Typography, Button, Collapse, Space, Tooltip } from 'antd';
import { PlayCircleOutlined, CalendarOutlined, VideoCameraOutlined, LinkOutlined } from '@ant-design/icons';
import courses from '../data/real_courses.json';
import events from '../data/real_events.json';
import ModernTutorial from '../components/ModernTutorial';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

// Экспортируем мероприятия для интеграции с календарём
export const educationEvents = events;

const FAQ = [
  {
    q: 'Как добавить объект недвижимости?',
    a: 'Перейдите во вкладку "Объекты недвижимости" и нажмите кнопку "Добавить объект".'
  },
  {
    q: 'Как связаться с агентом?',
    a: 'На карточке объекта есть кнопка звонка. Также можно написать в чат.'
  },
  {
    q: 'Как работает сравнение объектов?',
    a: 'Выберите несколько объектов с помощью чекбоксов и нажмите "Сравнить".'
  },
  {
    q: 'Где посмотреть обучение и вебинары?',
    a: 'Все актуальные вебинары и мероприятия — на этой странице.'
  },
];

// Компонент для карточки курса
interface CourseCardProps {
  item: any;
}
const CourseCard: React.FC<CourseCardProps> = ({ item }) => (
  <Card style={{ minWidth: 260, maxWidth: 340, flex: 1, borderRadius: 14, marginBottom: 12 }}>
    <VideoCameraOutlined style={{ fontSize: 22, color: 'var(--primary-color)' }} />{' '}
    <Text strong style={{ fontSize: 15 }}>{item.title}</Text>
    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{item.dateTime}</div>
    <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Смотреть запись</a>
  </Card>
);
function areEqualCourse(prev: CourseCardProps, next: CourseCardProps) {
  return prev.item.title === next.item.title && prev.item.dateTime === next.item.dateTime;
}
const MemoCourseCard = React.memo(CourseCard, areEqualCourse);

const cleanTitle = (title: string) => title.replace(/\n.*/g, '').trim();

// Компонент для карточки мероприятия
interface EventCardProps {
  item: any;
}
const isLocalImage = (url: string) => url.startsWith('/') || url.startsWith('static/') || url.startsWith('assets/');
const EventCard: React.FC<EventCardProps> = ({ item }) => (
  <Card style={{ minWidth: 260, maxWidth: 340, flex: 1, borderRadius: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
    {item.img && (
      <picture>
        {isLocalImage(item.img) && item.img.match(/\.(jpg|jpeg|png)$/i) && (
          <source srcSet={item.img.replace(/\.(jpg|jpeg|png)$/i, '.webp')} type="image/webp" />
        )}
        <img src={item.img} alt={cleanTitle(item.title)} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, boxShadow: '0 2px 8px #e6eaf1', background: '#f5f5f5' }} loading="lazy" onError={e => { e.currentTarget.src = '/placeholder-image.jpg'; }} />
      </picture>
    )}
    <div style={{ flex: 1 }}>
      <Text strong style={{ fontSize: 16 }}>{cleanTitle(item.title)}</Text>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{item.dateText}</div>
      <a href={item.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Подробнее</a>
    </div>
  </Card>
);
function areEqualEvent(prev: EventCardProps, next: EventCardProps) {
  return prev.item.title === next.item.title && prev.item.dateText === next.item.dateText;
}
const MemoEventCard = React.memo(EventCard, areEqualEvent);

const EducationPage: React.FC = () => {
  const [showTutorial, setShowTutorial] = React.useState(false);
  React.useEffect(() => {
    if (!localStorage.getItem('realtor_tutorial_completed_v1')) {
      // Можно запускать туториал при первом входе
      // setShowTutorial(true);
    }
  }, []);
  const handleStartTutorial = () => setShowTutorial(true);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 0' }}>
      {showTutorial && <ModernTutorial onClose={() => setShowTutorial(false)} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <Title level={1} style={{ fontWeight: 800, margin: 0 }}>Обучение и FAQ</Title>
        <Button type="primary" size="middle" icon={<PlayCircleOutlined style={{ fontSize: 18 }} />} style={{ fontWeight: 700, fontSize: 16, borderRadius: 10, padding: '0 18px', height: 40, boxShadow: '0 2px 12px rgba(80,120,200,0.10)' }} onClick={handleStartTutorial}>
          Запустить обучение
        </Button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
        <Card style={{ flex: 1, minWidth: 320, maxWidth: 480, borderRadius: 18, boxShadow: '0 4px 24px rgba(40,60,90,0.07)', padding: 0 }} bodyStyle={{ padding: 0 }}>
          <div style={{ padding: 24 }}>
            <Title level={4} style={{ margin: 0, marginBottom: 16 }}><VideoCameraOutlined /> Вебинары</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {courses.slice(0, 4).map(item => (
                <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  <VideoCameraOutlined style={{ fontSize: 28, color: 'var(--primary-color)' }} />
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{item.dateTime}</div>
                  </div>
                  <Tooltip title="Подробнее / Смотреть запись">
                    <Button type="link" href={item.link} target="_blank" icon={<LinkOutlined />} style={{ fontSize: 18 }} />
                  </Tooltip>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <a href="#all-courses" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Все вебинары &rarr;</a>
            </div>
          </div>
        </Card>
        <Card style={{ flex: 1, minWidth: 320, maxWidth: 480, borderRadius: 18, boxShadow: '0 4px 24px rgba(40,60,90,0.07)', padding: 0 }} bodyStyle={{ padding: 0 }}>
          <div style={{ padding: 24 }}>
            <Title level={4} style={{ margin: 0, marginBottom: 16 }}><CalendarOutlined /> Мероприятия</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {events.slice(0, 4).map(item => (
                <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
                  {item.img && (
                    <picture>
                      <img src={item.img} alt={cleanTitle(item.title)} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 10, boxShadow: '0 2px 8px #e6eaf1', background: '#f5f5f5' }} loading="lazy" onError={e => { e.currentTarget.src = '/placeholder-image.jpg'; }} />
                    </picture>
                  )}
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: 16 }}>{cleanTitle(item.title)}</Text>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{item.dateText}</div>
                  </div>
                  <Tooltip title="Подробнее о мероприятии">
                    <Button type="link" href={item.link} target="_blank" icon={<LinkOutlined />} style={{ fontSize: 18 }} />
                  </Tooltip>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <a href="#all-events" style={{ color: 'var(--primary-color)', fontWeight: 600 }}>Все мероприятия &rarr;</a>
            </div>
          </div>
        </Card>
      </div>
      <div style={{ marginBottom: 40 }}>
        <Title level={4} style={{ marginBottom: 16 }}>FAQ</Title>
        <Collapse accordion bordered={false} style={{ background: 'transparent' }}>
          {FAQ.map((item, idx) => (
            <Panel header={<span style={{ fontWeight: 600, fontSize: 16 }}>{item.q}</span>} key={idx} style={{ background: 'var(--card-background)', borderRadius: 12, marginBottom: 8, border: '1px solid var(--border-color)' }}>
              <Text style={{ fontSize: 15 }}>{item.a}</Text>
            </Panel>
          ))}
        </Collapse>
      </div>
      {/* Все вебинары и мероприятия (по якорю) */}
      <div id="all-courses" style={{ marginBottom: 40 }}>
        <Title level={4} style={{ marginBottom: 16 }}>Все вебинары</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {courses.map(item => (
            <MemoCourseCard key={item.title} item={item} />
          ))}
        </div>
      </div>
      <div id="all-events" style={{ marginBottom: 40 }}>
        <Title level={4} style={{ marginBottom: 16 }}>Все мероприятия</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          {events.map(item => (
            <MemoEventCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EducationPage; 