import {
  format as dateFnsFormat,
  parseISO,
  formatISO,
  isPast,
  differenceInHours,
} from 'date-fns';

export const DateUtils = {
  format(format: string, date: Date | number = Date.now()) {
    return dateFnsFormat(date, format);
  },
  isInPast(date: Date | number) {
    return isPast(date);
  },
  shouldPrintDailyReceipt(printedDateString: string) {
    const currentDate = new Date();
    const printedDate = printedDateString
      ? parseISO(printedDateString)
      : currentDate;

    return (
      differenceInHours(currentDate, printedDate, {
        roundingMethod: 'round',
      }) >= 24
    );
  },
  currentDateTimeString() {
    return formatISO(new Date());
  },
};
