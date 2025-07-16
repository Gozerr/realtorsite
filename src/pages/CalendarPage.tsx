import React, { useEffect, useState, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Modal, Button, Form, Input, Select, DatePicker, Tag, Tooltip, Space, Tabs } from 'antd';
import { fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, CalendarEvent } from '../services/calendar.service';
import { PlusOutlined, EditOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { message } from 'antd';
import { educationEvents } from './EducationPage';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import courses from '../data/real_courses.json';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const eventColors = {
  personal: '#1976d2',
  public: '#ff9800',
  education: '#ede7f6',
};

const elegantLink = {
  color: '#6c38a1',
  fontWeight: 500,
  textDecoration: 'underline',
  transition: 'color 0.15s',
};
const elegantLinkHover = {
  color: '#4b256e',
};

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function parseCourseDate(dateTime: string) {
  // Пример: "19.06.2025, четверг, 11:00" => 2025-06-19T11:00
  const match = dateTime.match(/(\d{2})\.(\d{2})\.(\d{4}).*?(\d{2}):(\d{2})/);
  if (match) {
    const [_, d, m, y, h, min] = match;
    return `${y}-${m}-${d}T${h}:${min}`;
  }
  return undefined;
}

function renderEventContent(eventInfo: any) {
  const { event } = eventInfo;
  const isEducation = event.extendedProps?.isEducation;
  const isCourse = event.extendedProps?.isCourse;
  if (isEducation) {
    return (
      <Tooltip
        title={
          <div style={{ minWidth: 220 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{event.title}</div>
            <div style={{ color: '#888', fontSize: 13 }}>{event.extendedProps.dateText || event.extendedProps.dateTime || event.startStr}</div>
            {event.extendedProps.place && <div style={{ color: '#1976d2', fontSize: 13, margin: '4px 0' }}>{event.extendedProps.place}</div>}
            {event.extendedProps.description && <div style={{ fontSize: 13, margin: '4px 0' }}>{event.extendedProps.description}</div>}
            {event.extendedProps.link && <a href={event.extendedProps.link} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', fontWeight: 600, opacity: 0.8 }}>Подробнее</a>}
          </div>
        }
      >
        <span style={{
          background: isCourse ? '#e0f7fa' : eventColors.education,
          color: '#333',
          fontWeight: 500,
          maxWidth: 110,
          display: 'inline-block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: 14,
          padding: '0 2px',
          borderRadius: 6,
          transition: 'color 0.15s',
        }}>{event.title}</span>
      </Tooltip>
    );
  }
  // Обычные события
  return <span>{truncate(event.title, 22)}</span>;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<'personal' | 'public'>('personal');
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const calendarRef = useRef<any>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (calendarRef.current && calendarRef.current.getApi) {
      const api = calendarRef.current.getApi();
      if (api) {
        setCurrentMonth(dayjs(api.getDate()));
      }
    }
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await fetchCalendarEvents();
    setEvents(data);
    setLoading(false);
  };

  // Фильтрация дублей по title+start
  function getUniqueEvents(events: CalendarEvent[]) {
    const seen = new Set<string>();
    return events.filter(e => {
      const key = `${e.title.trim()}|${dayjs(e.start).toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Фильтрация по типу события
  function getFilteredEvents() {
    return getUniqueEvents(events).filter(e =>
      activeTab === 'personal' ? e.type === 'personal' : e.type === 'public'
    );
  }

  // Получить события для календаря (включая educationEvents для public)
  function getCalendarEvents() {
    const baseEvents = getUniqueEvents(events).filter(e =>
      activeTab === 'personal' ? e.type === 'personal' : e.type === 'public'
    ).map(e => ({ ...e, id: e.id.toString() }));
    if (activeTab === 'public') {
      // Преобразуем educationEvents к формату FullCalendar
      const eduEvents = educationEvents.map((e, idx) => ({
        id: `edu-${idx}`,
        title: e.title,
        start: e.startDate,
        end: e.endDate,
        backgroundColor: eventColors.education,
        borderColor: eventColors.education,
        extendedProps: { ...e, isEducation: true },
      }));
      // Добавляем курсы
      const courseEvents = courses.map((c, idx) => ({
        id: `course-${idx}`,
        title: c.title,
        start: parseCourseDate(c.dateTime),
        end: undefined,
        backgroundColor: '#e0f7fa',
        borderColor: '#e0f7fa',
        extendedProps: { ...c, isEducation: true, isCourse: true },
      }));
      return [...baseEvents, ...eduEvents, ...courseEvents];
    }
    return baseEvents;
  }

  const handleDateSelect = (selectInfo: any) => {
    setEditingEvent(null);
    setModalOpen(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        start: dayjs(selectInfo.startStr),
        end: dayjs(selectInfo.endStr),
        type: 'personal',
      });
    }, 0);
  };

  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === Number(clickInfo.event.id));
    if (event) {
      setEditingEvent(event);
      form.setFieldsValue({
        ...event,
        start: dayjs(event.start),
        end: event.end ? dayjs(event.end) : undefined,
      });
      setModalOpen(true);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('values', values);
      const payload = {
        ...values,
        start: values.start.format('YYYY-MM-DDTHH:mm:ss'),
        end: values.end ? values.end.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        type: values.type || 'personal',
      };
      console.log('payload', payload);
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, payload);
      } else {
        await createCalendarEvent(payload);
      }
      setModalOpen(false);
      form.resetFields();
      loadEvents();
    } catch (err) {
      // Показываем подробное сообщение об ошибке
      // @ts-ignore
      message.error(err?.response?.data?.message || err.message || 'Ошибка');
    }
  };

  const handleDelete = async () => {
    if (editingEvent) {
      try {
        await deleteCalendarEvent(editingEvent.id);
        setModalOpen(false);
        form.resetFields();
        loadEvents();
      } catch (err) {
        // Показываем подробное сообщение об ошибке
        // @ts-ignore
        message.error(err?.response?.data?.message || err.message || 'Ошибка');
      }
    }
  };

  const monthEvents = useMemo(() => {
    const monthStart = currentMonth.startOf('month').startOf('day');
    const monthEnd = currentMonth.endOf('month').endOf('day');
    return educationEvents.filter((e: any) => {
      const start = dayjs(e.startDate).startOf('day');
      const end = e.endDate ? dayjs(e.endDate).endOf('day') : start;
      // Событие попадает в месяц, если его диапазон дат пересекается с диапазоном месяца (включительно)
      return start.isSameOrBefore(monthEnd) && end.isSameOrAfter(monthStart);
    });
  }, [currentMonth, educationEvents]);

  const monthCourses = useMemo(() => {
    const monthStart = currentMonth.startOf('month').startOf('day');
    const monthEnd = currentMonth.endOf('month').endOf('day');
    return courses.filter((c: any) => {
      const start = dayjs(parseCourseDate(c.dateTime)).startOf('day');
      return start.isSameOrBefore(monthEnd) && start.isSameOrAfter(monthStart);
    });
  }, [currentMonth, courses]);

  return (
    <div style={{ padding: 32, background: 'var(--background-color)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <CalendarOutlined style={{ fontSize: 32, color: '#1976d2' }} />
          <span style={{ fontSize: 28, fontWeight: 700 }}>Календарь событий</span>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
          setEditingEvent(null);
          setModalOpen(true);
          setTimeout(() => {
            form.resetFields();
          }, 0);
        }}>
          Добавить событие
        </Button>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'personal' | 'public')}
        items={[
          {
            key: 'personal',
            label: 'Мои мероприятия',
          },
          {
            key: 'public',
            label: 'Все события',
          },
        ]}
        style={{ marginBottom: 24 }}
      />
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        events={getCalendarEvents().map(e => {
          const isEducation = (e as any).extendedProps && (e as any).extendedProps.isEducation;
          return {
            ...e,
            title: isEducation ? e.title : truncate(e.title, 30),
          };
        })}
        selectable
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
        eventContent={renderEventContent}
        locale="ru"
        datesSet={arg => setCurrentMonth(dayjs(arg.view.currentStart))}
      />
      {/* Список мероприятий текущего месяца */}
      {activeTab === 'public' && (() => {
        return monthEvents.length > 0 && (
          <div style={{ marginTop: 32, background: 'var(--card-background)', borderRadius: 14, boxShadow: '0 2px 12px #e6eaf1', padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Мероприятия этого месяца</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {monthEvents.map((e: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <CalendarOutlined style={{ color: eventColors.education, fontSize: 22 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{e.title}</div>
                    <div style={{ color: '#888', fontSize: 14 }}>{e.dateText || e.startDate}</div>
                    {e.place && <div style={{ color: '#1976d2', fontSize: 14 }}>{e.place}</div>}
                  </div>
                  {e.link && (
                    <a
                      href={e.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={elegantLink}
                      onMouseOver={e => (e.currentTarget.style.color = elegantLinkHover.color)}
                      onMouseOut={e => (e.currentTarget.style.color = elegantLink.color)}
                    >
                      Подробнее
                    </a>
                  )}
                </div>
              ))}
            </div>
            {/* Список вебинаров (курсов) этого месяца */}
            {monthCourses.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Вебинары этого месяца</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {monthCourses.map((c: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <CalendarOutlined style={{ color: '#e0f7fa', fontSize: 22 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{c.title}</div>
                        <div style={{ color: '#888', fontSize: 14 }}>{c.dateTime}</div>
                      </div>
                      {c.link && (
                        <a
                          href={c.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={elegantLink}
                          onMouseOver={e => (e.currentTarget.style.color = elegantLinkHover.color)}
                          onMouseOut={e => (e.currentTarget.style.color = elegantLink.color)}
                        >
                          Смотреть
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}
      <Modal
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleModalOk}
        title={editingEvent ? 'Редактировать событие' : 'Новое событие'}
        okText={editingEvent ? 'Сохранить' : 'Создать'}
        footer={[
          editingEvent && <Button key="delete" danger icon={<DeleteOutlined />} onClick={handleDelete}>Удалить</Button>,
          <Button key="cancel" onClick={() => { setModalOpen(false); form.resetFields(); }}>Отмена</Button>,
          <Button key="ok" type="primary" onClick={handleModalOk}>{editingEvent ? 'Сохранить' : 'Создать'}</Button>,
        ]}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}><Input placeholder="Название события" /></Form.Item>
          <Form.Item name="description" label="Описание"><Input.TextArea placeholder="Описание события" autoSize /></Form.Item>
          <Form.Item name="type" label="Тип" rules={[{ required: true }]}><Select><Select.Option value="personal">Личное</Select.Option><Select.Option value="public">Общее</Select.Option></Select></Form.Item>
          <Form.Item name="start" label="Начало" rules={[{ required: true, message: 'Укажите дату и время' }]}><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="end" label="Окончание"><DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
      <div style={{ marginTop: 32 }}>
        <Tag color={eventColors.personal} style={{ fontSize: 16, padding: '4px 12px' }}>Личное событие</Tag>
        <Tag color={eventColors.public} style={{ fontSize: 16, padding: '4px 12px', marginLeft: 12 }}>Общее мероприятие</Tag>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .calendar-main {
            flex-direction: column !important;
            gap: 16px !important;
            padding: 12px !important;
          }
          .ant-btn, .ant-input, .ant-select {
            font-size: 18px !important;
            height: 48px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage; 