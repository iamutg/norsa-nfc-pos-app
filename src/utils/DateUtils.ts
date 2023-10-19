import {
  format as dateFnsFormat,
  parseISO,
  formatISO,
  isPast,
  isAfter,
  isSameDay,
} from 'date-fns';

export const DateUtils = {
  format(format: string, date: Date | number = Date.now()) {
    return dateFnsFormat(date, format);
  },
  isInPast(date: Date | number) {
    return isPast(date);
  },
  shouldPrintDailyReceipt(printedDateString?: string) {
    const currentDate = new Date();
    const printedDate = printedDateString
      ? parseISO(printedDateString)
      : currentDate;

    return (
      isAfter(currentDate, printedDate) && !isSameDay(currentDate, printedDate)
    );
  },
  currentDateTimeString() {
    return formatISO(new Date());
  },
};
