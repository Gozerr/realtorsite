interface DetectedDateTime {
  text: string;
  start: number;
  end: number;
  parsedDate: Date;
  type: 'date' | 'time' | 'datetime';
  confidence: number; // Уверенность в том, что это действительно событие
}

// Регулярные выражения для распознавания дат и времени
const patterns = {
  // Сегодня/завтра/послезавтра
  relativeDay: /(сегодня|завтра|послезавтра)/gi,
  
  // Дни недели
  weekDay: /(понедельник|вторник|среда|четверг|пятница|суббота|воскресенье|пн|вт|ср|чт|пт|сб|вс)/gi,
  
  // Даты в формате DD.MM.YYYY или DD/MM/YYYY
  dateFormat: /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/g,
  
  // Время в формате HH:MM
  timeFormat: /(\d{1,2}):(\d{2})/g,
  
  // Комбинации: "завтра в 14:30", "сегодня в 15:00"
  relativeDateTime: /(сегодня|завтра|послезавтра)\s+в\s+(\d{1,2}):(\d{2})/gi,
  
  // Комбинации: "завтра в 17", "сегодня в 15" (без минут)
  relativeDateTimeShort: /(сегодня|завтра|послезавтра)\s+в\s+(\d{1,2})\b/gi,
  
  // "через час", "через 2 часа"
  relativeTime: /через\s+(\d+)\s+(час|часа|часов|минут|минуты)/gi,
  
  // "в 14:30", "в 15:00"
  timeOnly: /в\s+(\d{1,2}):(\d{2})/g,
  
  // "в 17", "в 15" (без минут)
  timeOnlyShort: /в\s+(\d{1,2})\b/g,
};

// Ключевые слова, которые указывают на событие/встречу
const eventKeywords = [
  'встреча', 'встретимся', 'встретиться', 'встречаемся',
  'показ', 'покажу', 'показать', 'показываю',
  'обсуждение', 'обсудим', 'обсудить',
  'удобно', 'подходит', 'свободно',
  'время', 'дата', 'когда',
  'звонок', 'перезвоню', 'позвоню',
  'приеду', 'приду', 'приходите',
  'договорились', 'согласовали', 'запланировали'
];

// Слова, которые НЕ указывают на событие
const nonEventKeywords = [
  'родился', 'родилась', 'рождение', 'день рождения',
  'умер', 'умерла', 'смерть',
  'год назад', 'месяц назад', 'неделю назад',
  'в прошлом году', 'в прошлом месяце',
  'история', 'было', 'была', 'прошло'
];

const weekDays = {
  'понедельник': 1, 'вторник': 2, 'среда': 3, 'четверг': 4,
  'пятница': 5, 'суббота': 6, 'воскресенье': 0,
  'пн': 1, 'вт': 2, 'ср': 3, 'чт': 4, 'пт': 5, 'сб': 6, 'вс': 0
};

// Функция для анализа контекста вокруг даты
function analyzeContext(text: string, start: number, end: number): number {
  const contextStart = Math.max(0, start - 50);
  const contextEnd = Math.min(text.length, end + 50);
  const context = text.slice(contextStart, contextEnd).toLowerCase();
  
  let score = 0;
  
  // Проверяем наличие ключевых слов события
  eventKeywords.forEach(keyword => {
    if (context.includes(keyword)) {
      score += 2;
    }
  });
  
  // Проверяем наличие слов, которые НЕ указывают на событие
  nonEventKeywords.forEach(keyword => {
    if (context.includes(keyword)) {
      score -= 3;
    }
  });
  
  // Дополнительные проверки
  if (context.includes('?')) score += 1; // Вопрос о времени
  if (context.includes('!')) score += 0.5; // Восклицание
  if (context.includes('встреча') || context.includes('показ')) score += 3;
  if (context.includes('удобно') || context.includes('подходит')) score += 2;
  
  return Math.max(0, Math.min(10, score)); // Ограничиваем от 0 до 10
}

export function parseDateTime(text: string): DetectedDateTime[] {
  const results: DetectedDateTime[] = [];
  const now = new Date();

  // Функция для добавления результата
  const addResult = (match: RegExpMatchArray, type: 'date' | 'time' | 'datetime', parsedDate: Date) => {
    const confidence = analyzeContext(text, match.index!, match.index! + match[0].length);
    
    // Добавляем только если уверенность достаточно высокая
    if (confidence >= 1) {
      results.push({
        text: match[0],
        start: match.index!,
        end: match.index! + match[0].length,
        parsedDate,
        type,
        confidence
      });
    }
  };

  // 1. Относительные даты и время: "завтра в 14:30" (высокая уверенность)
  let match;
  const relativeDateTimeRegex = new RegExp(patterns.relativeDateTime.source, 'gi');
  while ((match = relativeDateTimeRegex.exec(text)) !== null) {
    const day = match[1].toLowerCase();
    const hour = parseInt(match[2]);
    const minute = parseInt(match[3]);
    
    const date = new Date(now);
    if (day === 'завтра') {
      date.setDate(date.getDate() + 1);
    } else if (day === 'послезавтра') {
      date.setDate(date.getDate() + 2);
    }
    
    date.setHours(hour, minute, 0, 0);
    addResult(match, 'datetime', date);
  }

  // 1.5. Относительные даты и время без минут: "завтра в 17" (высокая уверенность)
  const relativeDateTimeShortRegex = new RegExp(patterns.relativeDateTimeShort.source, 'gi');
  while ((match = relativeDateTimeShortRegex.exec(text)) !== null) {
    const day = match[1].toLowerCase();
    const hour = parseInt(match[2]);
    
    const date = new Date(now);
    if (day === 'завтра') {
      date.setDate(date.getDate() + 1);
    } else if (day === 'послезавтра') {
      date.setDate(date.getDate() + 2);
    }
    
    date.setHours(hour, 0, 0, 0); // По умолчанию 00 минут
    addResult(match, 'datetime', date);
  }

  // 2. Относительные даты: "завтра", "сегодня", "послезавтра" (средняя уверенность)
  const relativeDayRegex = new RegExp(patterns.relativeDay.source, 'gi');
  while ((match = relativeDayRegex.exec(text)) !== null) {
    const day = match[1].toLowerCase();
    const date = new Date(now);
    
    if (day === 'завтра') {
      date.setDate(date.getDate() + 1);
    } else if (day === 'послезавтра') {
      date.setDate(date.getDate() + 2);
    }
    
    date.setHours(9, 0, 0, 0); // По умолчанию 9:00
    addResult(match, 'date', date);
  }

  // 3. Дни недели: "в понедельник", "в пятницу" (средняя уверенность)
  const weekDayRegex = new RegExp(`в\\s+(${Object.keys(weekDays).join('|')})`, 'gi');
  while ((match = weekDayRegex.exec(text)) !== null) {
    const dayName = match[1].toLowerCase();
    const targetDay = weekDays[dayName as keyof typeof weekDays];
    const currentDay = now.getDay();
    
    const date = new Date(now);
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // Следующая неделя
    
    date.setDate(date.getDate() + daysToAdd);
    date.setHours(9, 0, 0, 0);
    addResult(match, 'date', date);
  }

  // 4. Формат даты: "15.12.2024", "15/12/2024" (низкая уверенность - нужен контекст)
  const dateFormatRegex = new RegExp(patterns.dateFormat.source, 'g');
  while ((match = dateFormatRegex.exec(text)) !== null) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // Месяцы начинаются с 0
    const year = parseInt(match[3]);
    
    const date = new Date(year, month, day, 9, 0, 0, 0);
    addResult(match, 'date', date);
  }

  // 5. Время: "14:30", "15:00" (низкая уверенность - нужен контекст)
  const timeFormatRegex = new RegExp(patterns.timeFormat.source, 'g');
  while ((match = timeFormatRegex.exec(text)) !== null) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    addResult(match, 'time', date);
  }

  // 6. Относительное время: "через час", "через 30 минут" (высокая уверенность)
  const relativeTimeRegex = new RegExp(patterns.relativeTime.source, 'gi');
  while ((match = relativeTimeRegex.exec(text)) !== null) {
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const date = new Date(now);
    if (unit.includes('час')) {
      date.setHours(date.getHours() + amount);
    } else if (unit.includes('минут')) {
      date.setMinutes(date.getMinutes() + amount);
    }
    
    addResult(match, 'time', date);
  }

  // 7. Только время: "в 14:30", "в 15:00"
  const timeOnlyRegex = new RegExp(patterns.timeOnly.source, 'g');
  while ((match = timeOnlyRegex.exec(text)) !== null) {
    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    
    const date = new Date(now);
    date.setHours(hour, minute, 0, 0);
    addResult(match, 'time', date);
  }

  // 8. Только время без минут: "в 17", "в 15"
  const timeOnlyShortRegex = new RegExp(patterns.timeOnlyShort.source, 'g');
  while ((match = timeOnlyShortRegex.exec(text)) !== null) {
    const hour = parseInt(match[1]);
    
    const date = new Date(now);
    date.setHours(hour, 0, 0, 0); // По умолчанию 00 минут
    addResult(match, 'time', date);
  }

  // Сортируем результаты по позиции в тексте и фильтруем по уверенности
  return results
    .sort((a, b) => a.start - b.start)
    .filter(result => result.confidence >= 1); // Показываем только уверенные результаты
}

// Функция для форматирования даты в читаемый вид
export function formatDateTime(date: Date): string {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `сегодня в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `завтра в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 2) {
    return `послезавтра в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
} 