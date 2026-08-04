export const formatDateForAPI = (data: Date): string => {
  const g = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = data.getFullYear();
  return `${g}-${m}-${a}`;
};

export const getAcademicYear = (date: Date = new Date()): string => {
  const month = date.getMonth(); // 0 = Gennaio, 7 = Agosto
  const year = date.getFullYear();
  // In Italia il nuovo anno accademico inizia ad autunno. Se la data è da Agosto in poi, usiamo l'anno corrente,
  // altrimenti usiamo l'anno precedente.
  return month >= 7 ? year.toString() : (year - 1).toString();
};
