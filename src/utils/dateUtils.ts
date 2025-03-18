export const formatDate = (date: string | null | undefined): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}; 