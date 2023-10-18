import DateFns from 'date-fns';

export const DateUtils = {
  format(format: string, date: Date | number = Date.now()) {
    return DateFns.format(date, format);
  },
  isInPast(date: Date | number) {
    return DateFns.isPast(date);
  },
  shouldPrintDailyReceipt(printedDateString?: string) {
    const currentDate = new Date();
    const printedDate = printedDateString
      ? DateFns.parseISO(printedDateString)
      : currentDate;

    return (
      DateFns.isAfter(currentDate, printedDate) &&
      !DateFns.isSameDay(currentDate, printedDate)
    );
  },
  currentDateTimeString() {
    return DateFns.formatISO(new Date());
  },
};
