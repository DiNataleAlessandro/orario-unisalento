export const formatDateForAPI = (data: Date): string => {
  const g = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = data.getFullYear();
  return `${g}-${m}-${a}`;
};
