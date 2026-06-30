export const getDocId = (siteId: string, date: string): string => {
  if (siteId === 'SMI' || !siteId) return date;
  return `${siteId}_${date}`;
};

export const getDocSiteId = (docId: string, date: string): string => {
  if (docId === date) return 'SMI';
  const prefix = docId.replace(`_${date}`, '');
  return prefix || 'SMI';
};
