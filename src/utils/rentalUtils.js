export const calculateRentalPrice = (startDate, endDate, dailyRate) => {
  if (!startDate || !endDate || !dailyRate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays * dailyRate;
};
