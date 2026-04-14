const IST_TIME_ZONE = 'Asia/Kolkata';

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HAS_TZ_REGEX = /(Z|[+-]\d{2}:?\d{2})$/i;

const toDate = (value: string | number | Date): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  const raw = value.trim();
  if (!raw) return new Date('');

  if (DATE_ONLY_REGEX.test(raw)) {
    return new Date(`${raw}T00:00:00+05:30`);
  }

  const normalized = raw.replace(' ', 'T');
  if (HAS_TZ_REGEX.test(normalized)) {
    return new Date(normalized);
  }

  // Treat timezone-naive backend timestamps as IST.
  return new Date(`${normalized}+05:30`);
};

const getParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  };
};

export const formatDateTimeIST = (value: string | number | Date): string => {
  if (!value && value !== 0) return '—';

  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export const getCurrentISTDateTimeLocalValue = (): string => {
  const now = new Date();
  const { year, month, day, hour, minute } = getParts(now);
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

export const getCurrentISTDateValue = (): string => {
  const now = new Date();
  const { year, month, day } = getParts(now);
  return `${year}-${month}-${day}`;
};
