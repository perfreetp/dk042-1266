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
}

export type ReminderHandleType = 'restocked' | 'discarded' | 'snooze';

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
}

export interface DailyStat {
  total: number;
  taken: number;
  missed: number;
  pending: number;
}
