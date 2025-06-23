export function formatFlightTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatFlightDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

export function formatLayoverDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins} min layover`;
  } else if (mins === 0) {
    return `${hours}h layover`;
  } else {
    return `${hours}h ${mins}m layover`;
  }
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

export function getRelativeDate(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  } else if (isTomorrow(date)) {
    return 'Tomorrow';
  } else {
    return formatFlightDate(date);
  }
}

export function getDaysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function parseFlexibleDate(input: string): Date | null {
  // Handle common date inputs like "today", "tomorrow", "next week", etc.
  const today = new Date();
  const lowercaseInput = input.toLowerCase().trim();
  
  if (lowercaseInput === 'today') {
    return today;
  } else if (lowercaseInput === 'tomorrow') {
    return addDays(today, 1);
  } else if (lowercaseInput === 'next week') {
    return addDays(today, 7);
  } else if (lowercaseInput === 'this weekend') {
    const daysUntilSaturday = (6 - today.getDay()) % 7;
    return addDays(today, daysUntilSaturday);
  }
  
  // Try parsing as regular date
  const parsed = new Date(input);
  return isValidDate(parsed) ? parsed : null;
}