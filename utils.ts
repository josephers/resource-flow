/**
 * Calculates the number of business days (Mon-Fri) in a specific month of a year.
 */
export const getBusinessDaysInMonth = (year: number, month: number): number => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    const day = date.getDay();
    // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      days.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days.length;
};

/**
 * Calculates total business hours in a month assuming an 8-hour workday.
 */
export const getBusinessHoursInMonth = (monthStr: string): number => {
  const [year, month] = monthStr.split('-').map(Number);
  // Month in JS Date is 0-indexed (0 = Jan, 11 = Dec), but YYYY-MM usually has 01 = Jan
  const businessDays = getBusinessDaysInMonth(year, month - 1);
  return businessDays * 8;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getMonthName = (monthStr: string) => {
  const date = new Date(monthStr + '-02'); // Avoid timezone issues with -01
  // Short format: Jan '24
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

// Generate next 18 months for Gantt view
export const getNextMonths = (count: number = 18): string[] => {
  const months: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    months.push(`${yyyy}-${mm}`);
  }
  return months;
};