export interface Member {
  id: string;
  name: string;
  avatar: string;
  relation: string;
  age: number;
  gender: 'male' | 'female';
  note?: string;
}

export interface DosageTime {
  time: string;
  dosage: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  form: string;
  memberIds: string[];
  openDate: string;
  expireDate: string;
  storageLocation: string;
  stock: number;
  minStock: number;
  isCommon: boolean;
  reminderTimes: DosageTime[];
  instruction?: string;
  sideEffect?: string;
  image?: string;
}

export type CheckInStatus = 'pending' | 'taken' | 'missed' | 'supplemented';

export interface CheckInRecord {
  id: string;
  medicineId: string;
  medicineName: string;
  memberId: string;
  memberName: string;
  scheduledTime: string;
  actualTime?: string;
  dosage: string;
  status: CheckInStatus;
  adverseReaction?: string;
  note?: string;
  date: string;
  operatorId?: string;
  operatorName?: string;
  operatedAt?: string;
}

export type ReminderHandleType = 'restocked' | 'discarded' | 'snooze';
export type ReminderStatus = 'active' | 'handled' | 'snoozed';

export interface ReminderItem {
  id: string;
  type: 'expire' | 'stock' | 'dose';
  title: string;
  content: string;
  medicineId: string;
  medicineName: string;
  level: 'warning' | 'danger' | 'info';
  date: string;
  read: boolean;
  handled?: boolean;
  handledAt?: string;
  handleType?: ReminderHandleType;
  operatorId?: string;
  operatorName?: string;
  snoozeCount?: number;
  snoozedUntil?: string;
  originalDate?: string;
}

export interface DailyStat {
  total: number;
  taken: number;
  missed: number;
  pending: number;
  supplemented: number;
}

export interface CalendarDayStat {
  date: string;
  total: number;
  taken: number;
  missed: number;
  pending: number;
  supplemented: number;
  hasAdverseReaction: boolean;
}

export interface CalendarMemberStat {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  stats: Record<string, CalendarDayStat>;
}

export interface DayDetail {
  date: string;
  records: CheckInRecord[];
  stats: DailyStat;
  memberGroups: Record<string, CheckInRecord[]>;
}

export interface PrescriptionRisk {
  type: 'expiring' | 'expired' | 'low_stock';
  medicineName: string;
  description: string;
  level: 'warning' | 'danger';
}

export interface PrescriptionAdverseEvent {
  date: string;
  medicineName: string;
  reaction: string;
}

export interface PrescriptionMemberSummary {
  memberId: string;
  memberName: string;
  memberAge: number;
  memberRelation: string;
  periodDays: number;
  activeMedicines: Array<{
    medicine: Medicine;
    takenCount: number;
    missedCount: number;
    supplementedCount: number;
    adherenceRate: number;
  }>;
  expiredMedicines: Medicine[];
  expiringMedicines: Medicine[];
  lowStockMedicines: Medicine[];
  missedDates: string[];
  adverseReactions: PrescriptionAdverseEvent[];
  overallAdherence: number;
  risks: PrescriptionRisk[];
}
