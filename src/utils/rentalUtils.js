export const calculateRentalPrice = (
  pricePerHour,
  pricePerDay,
  startDate,
  endDate,
  rentalType
) => {
  if (!startDate || !endDate) return { totalPrice: 0 };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);

  let totalPrice = 0;

  if (rentalType === "hourly") {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    totalPrice = diffHours * (pricePerHour || 0);
  } else {
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalPrice = diffDays * (pricePerDay || 0);
  }

  return { totalPrice };
};
