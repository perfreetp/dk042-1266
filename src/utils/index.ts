export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const getDaysUntil = (targetDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const getExpireStatus = (expireDate: string): { status: 'normal' | 'expiring' | 'expired'; days: number } => {
  const days = getDaysUntil(expireDate);
  if (days < 0) return { status: 'expired', days };
  if (days <= 30) return { status: 'expiring', days };
  return { status: 'normal', days };
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待服药',
    taken: '已服用',
    missed: '漏服',
    supplemented: '补服'
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    pending: '#F59E0B',
    taken: '#10B981',
    missed: '#EF4444',
    supplemented: '#3B82F6'
  };
  return map[status] || '#86909C';
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

export const getCurrentTime = (): string => {
  return formatTime(new Date());
};
