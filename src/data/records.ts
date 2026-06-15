import { CheckInRecord, ReminderItem } from '@/types';

export const mockCheckInRecords: CheckInRecord[] = [
  {
    id: 'c1',
    medicineId: 'med1',
    medicineName: '硝苯地平缓释片',
    memberId: 'm1',
    memberName: '张爷爷',
    scheduledTime: '08:00',
    actualTime: '08:05',
    dosage: '1片',
    status: 'taken',
    date: '2026-06-15'
  },
  {
    id: 'c2',
    medicineId: 'med2',
    medicineName: '盐酸二甲双胍片',
    memberId: 'm2',
    memberName: '李奶奶',
    scheduledTime: '07:30',
    actualTime: '07:32',
    dosage: '1片',
    status: 'taken',
    date: '2026-06-15'
  },
  {
    id: 'c3',
    medicineId: 'med4',
    medicineName: '氯雷他定片',
    memberId: 'm3',
    memberName: '小明',
    scheduledTime: '09:00',
    dosage: '半片',
    status: 'pending',
    date: '2026-06-15'
  },
  {
    id: 'c4',
    medicineId: 'med6',
    medicineName: '维生素C泡腾片',
    memberId: 'm5',
    memberName: '爸爸',
    scheduledTime: '10:00',
    dosage: '1片',
    status: 'pending',
    date: '2026-06-15'
  },
  {
    id: 'c5',
    medicineId: 'med8',
    medicineName: '健胃消食片',
    memberId: 'm3',
    memberName: '小明',
    scheduledTime: '12:00',
    dosage: '2片',
    status: 'pending',
    date: '2026-06-15'
  },
  {
    id: 'c6',
    medicineId: 'med2',
    medicineName: '盐酸二甲双胍片',
    memberId: 'm2',
    memberName: '李奶奶',
    scheduledTime: '12:30',
    dosage: '1片',
    status: 'pending',
    date: '2026-06-15'
  },
  {
    id: 'c7',
    medicineId: 'med9',
    medicineName: '阿司匹林肠溶片',
    memberId: 'm1',
    memberName: '张爷爷',
    scheduledTime: '08:00',
    actualTime: '10:30',
    dosage: '1片',
    status: 'supplemented',
    note: '早上忘记了，十点半才补上',
    date: '2026-06-14'
  },
  {
    id: 'c8',
    medicineId: 'med1',
    medicineName: '硝苯地平缓释片',
    memberId: 'm1',
    memberName: '张爷爷',
    scheduledTime: '20:00',
    dosage: '1片',
    status: 'missed',
    note: '外出忘记带药',
    date: '2026-06-14'
  },
  {
    id: 'c9',
    medicineId: 'med2',
    medicineName: '盐酸二甲双胍片',
    memberId: 'm2',
    memberName: '李奶奶',
    scheduledTime: '07:30',
    actualTime: '07:35',
    dosage: '1片',
    status: 'taken',
    date: '2026-06-14'
  },
  {
    id: 'c10',
    medicineId: 'med4',
    medicineName: '氯雷他定片',
    memberId: 'm3',
    memberName: '小明',
    scheduledTime: '09:00',
    actualTime: '09:10',
    dosage: '半片',
    status: 'taken',
    adverseReaction: '有点犯困',
    date: '2026-06-14'
  }
];

export const mockReminders: ReminderItem[] = [
  {
    id: 'r1',
    type: 'expire',
    title: '药品即将到期',
    content: '阿司匹林肠溶片将于10天后到期，请及时处理',
    medicineId: 'med9',
    medicineName: '阿司匹林肠溶片',
    level: 'warning',
    date: '2026-06-15',
    read: false
  },
  {
    id: 'r2',
    type: 'expire',
    title: '药品即将到期',
    content: '布洛芬混悬滴剂将于5天后到期，请及时处理',
    medicineId: 'med3',
    medicineName: '布洛芬混悬滴剂',
    level: 'warning',
    date: '2026-06-15',
    read: false
  },
  {
    id: 'r3',
    type: 'stock',
    title: '库存不足提醒',
    content: '创可贴库存不足（剩余12片），建议及时补充',
    medicineId: 'med5',
    medicineName: '创可贴',
    level: 'warning',
    date: '2026-06-14',
    read: true
  },
  {
    id: 'r4',
    type: 'stock',
    title: '库存不足提醒',
    content: '感冒灵颗粒库存不足（剩余3袋），建议及时补充',
    medicineId: 'med7',
    medicineName: '感冒灵颗粒',
    level: 'warning',
    date: '2026-06-14',
    read: true
  },
  {
    id: 'r5',
    type: 'stock',
    title: '库存不足提醒',
    content: '布洛芬混悬滴剂库存不足（剩余2瓶），建议及时补充',
    medicineId: 'med3',
    medicineName: '布洛芬混悬滴剂',
    level: 'warning',
    date: '2026-06-13',
    read: true
  },
  {
    id: 'r6',
    type: 'stock',
    title: '库存不足提醒',
    content: '碘伏消毒液库存不足（剩余1瓶），建议及时补充',
    medicineId: 'med10',
    medicineName: '碘伏消毒液',
    level: 'warning',
    date: '2026-06-12',
    read: true
  },
  {
    id: 'r7',
    type: 'expire',
    title: '药品即将到期',
    content: '盐酸二甲双胍片将于30天后到期',
    medicineId: 'med2',
    medicineName: '盐酸二甲双胍片',
    level: 'info',
    date: '2026-06-10',
    read: true
  },
  {
    id: 'r8',
    type: 'dose',
    title: '漏服提醒',
    content: '张爷爷昨晚20:00的硝苯地平缓释片漏服了',
    medicineId: 'med1',
    medicineName: '硝苯地平缓释片',
    level: 'danger',
    date: '2026-06-14',
    read: true
  }
];
