const BANNED_WORDS = [
  'abuse', 'badword', 'offensive', 'spam', 'scam' 
]; // Expand as needed

export function filterContent(content: string): string {
  let filtered = content;
  BANNED_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}
