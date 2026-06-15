import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import {
  Member, Medicine, CheckInRecord, ReminderItem, DailyStat, ReminderHandleType,
  DayDetail, CalendarDayStat, PrescriptionMemberSummary, PrescriptionRisk
} from '@/types';
import { mockMembers } from '@/data/members';
import { mockMedicines as medicinesData } from '@/data/medicines';
import { mockCheckInRecords, mockReminders } from '@/data/records';
import { getCurrentDate, generateId, getCurrentTime, getExpireStatus, getDaysUntil } from '@/utils';

const STORAGE_KEYS = {
  members: 'medicine_app_members',
  medicines: 'medicine_app_medicines',
  checkInRecords: 'medicine_app_checkin_records',
  reminders: 'medicine_app_reminders',
  initialized: 'medicine_app_initialized',
  operator: 'medicine_app_operator'
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = Taro.getStorageSync(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`[AppContext] 读取 ${key} 失败:`, e);
  }
  return fallback;
}

function saveStorage<T>(key: string, data: T): void {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[AppContext] 保存 ${key} 失败:`, e);
  }
}

function getInitialOperator(members: Member[]): Member {
  const saved = loadStorage<Member | null>(STORAGE_KEYS.operator, null);
  if (saved) return saved;
  const defaultOp = members[0] || { id: 'self', name: '我', avatar: '', relation: '自己', age: 30, gender: 'female' };
  saveStorage(STORAGE_KEYS.operator, defaultOp);
  return defaultOp;
}

function getInitialState(): {
  members: Member[];
  medicines: Medicine[];
  checkInRecords: CheckInRecord[];
  reminders: ReminderItem[];
} {
  const initialized = Taro.getStorageSync(STORAGE_KEYS.initialized);
  if (initialized) {
    return {
      members: loadStorage(STORAGE_KEYS.members, mockMembers),
      medicines: loadStorage(STORAGE_KEYS.medicines, medicinesData),
      checkInRecords: loadStorage(STORAGE_KEYS.checkInRecords, mockCheckInRecords),
      reminders: loadStorage(STORAGE_KEYS.reminders, mockReminders),
    };
  }

  Taro.setStorageSync(STORAGE_KEYS.initialized, 'true');
  return {
    members: mockMembers,
    medicines: medicinesData,
    checkInRecords: mockCheckInRecords,
    reminders: mockReminders,
  };
}

function generateCheckInRecordsForMedicine(
  medicine: Medicine,
  members: Member[],
  existingRecords: CheckInRecord[]
): CheckInRecord[] {
  const today = getCurrentDate();
  if (medicine.reminderTimes.length === 0) return [];

  const alreadyExists = existingRecords.filter(
    r => r.medicineId === medicine.id && r.date === today
  );

  const newRecords: CheckInRecord[] = [];
  for (const rt of medicine.reminderTimes) {
    const timeAlreadyExists = alreadyExists.some(r => r.scheduledTime === rt.time);
    if (timeAlreadyExists) continue;

    if (medicine.memberIds.length > 0) {
      for (const mid of medicine.memberIds) {
        const member = members.find(m => m.id === mid);
        if (member) {
          newRecords.push({
            id: generateId(),
            medicineId: medicine.id,
            medicineName: medicine.name,
            memberId: mid,
            memberName: member.name,
            scheduledTime: rt.time,
            dosage: rt.dosage,
            status: 'pending',
            date: today,
          });
        }
      }
    } else {
      newRecords.push({
        id: generateId(),
        medicineId: medicine.id,
        medicineName: medicine.name,
        memberId: '',
        memberName: '全家',
        scheduledTime: rt.time,
        dosage: rt.dosage,
        status: 'pending',
        date: today,
      });
    }
  }
  return newRecords;
}

function generateRemindersForMedicine(
  medicine: Medicine,
  existingReminders: ReminderItem[]
): ReminderItem[] {
  const today = getCurrentDate();
  const newReminders: ReminderItem[] = [];

  const expireInfo = getExpireStatus(medicine.expireDate);
  if (expireInfo.status === 'expiring' || expireInfo.status === 'expired') {
    const alreadyHasExpireReminder = existingReminders.some(
      r => r.medicineId === medicine.id && r.type === 'expire' && !r.handled && !r.snoozedUntil
    );
    if (!alreadyHasExpireReminder) {
      newReminders.push({
        id: generateId(),
        type: 'expire',
        title: expireInfo.status === 'expired' ? '药品已过期' : '药品即将到期',
        content: `${medicine.name}${expireInfo.status === 'expired' ? '已过期' : `将于${expireInfo.days}天后到期`}，请及时处理`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        level: expireInfo.status === 'expired' ? 'danger' : 'warning',
        date: today,
        read: false,
      });
    }
  }

  if (medicine.stock <= medicine.minStock) {
    const alreadyHasStockReminder = existingReminders.some(
      r => r.medicineId === medicine.id && r.type === 'stock' && !r.handled && !r.snoozedUntil
    );
    if (!alreadyHasStockReminder) {
      newReminders.push({
        id: generateId(),
        type: 'stock',
        title: '库存不足提醒',
        content: `${medicine.name}库存不足（剩余${medicine.stock}），建议及时补充`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        level: 'warning',
        date: today,
        read: false,
      });
    }
  }

  return newReminders;
}

function isReminderVisible(r: ReminderItem): boolean {
  if (r.handled) return true;
  const today = getCurrentDate();
  if (r.snoozedUntil) {
    if (r.snoozedUntil <= today) return true;
    return true;
  }
  return true;
}

function isReminderUnread(r: ReminderItem): boolean {
  if (r.handled) return false;
  const today = getCurrentDate();
  if (r.snoozedUntil) {
    if (r.snoozedUntil > today) return false;
    if (r.snoozedUntil <= today && !r.read) return true;
    if (r.snoozedUntil <= today && r.read) return false;
    return false;
  }
  return !r.read;
}

function refreshSnoozedReminder(r: ReminderItem): ReminderItem {
  if (r.handled || !r.snoozedUntil) return r;
  const today = getCurrentDate();
  if (r.snoozedUntil <= today && r.read === true) {
    return { ...r, read: false };
  }
  return r;
}

interface AppState {
  members: Member[];
  medicines: Medicine[];
  checkInRecords: CheckInRecord[];
  reminders: ReminderItem[];
  operator: Member;
}

interface AppContextType extends AppState {
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicine: (id: string, data: Partial<Medicine>) => void;
  updateMedicineFull: (id: string, data: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  addMember: (member: Omit<Member, 'id' | 'avatar'>) => void;
  setOperator: (member: Member) => void;
  updateCheckIn: (id: string, status: CheckInRecord['status'], note?: string, adverseReaction?: string) => void;
  handleReminder: (id: string, handleType: ReminderHandleType, snoozeDays?: number) => void;
  getTodayRecords: () => CheckInRecord[];
  getTodayStats: () => DailyStat;
  getDayDetail: (date: string) => DayDetail;
  getCalendarStats: (startDate: string, days: number) => Record<string, CalendarDayStat>;
  getMemberMedicines: (memberId: string) => Medicine[];
  getMemberRecords: (memberId: string, days?: number) => CheckInRecord[];
  getPrescriptionSummary: (memberId: string, days?: number) => PrescriptionMemberSummary;
  getVisibleReminders: () => ReminderItem[];
  markReminderRead: (id: string) => void;
  markAllRemindersRead: () => void;
  getUnreadRemindersCount: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const init = getInitialState();
    return { ...init, operator: getInitialOperator(init.members) };
  });

  useEffect(() => {
    saveStorage(STORAGE_KEYS.members, state.members);
    saveStorage(STORAGE_KEYS.medicines, state.medicines);
    saveStorage(STORAGE_KEYS.checkInRecords, state.checkInRecords);
    saveStorage(STORAGE_KEYS.reminders, state.reminders);
    saveStorage(STORAGE_KEYS.operator, state.operator);
  }, [state]);

  const setOperator = useCallback((member: Member) => {
    setState(prev => ({ ...prev, operator: member }));
  }, []);

  const addMedicine = useCallback((medicine: Omit<Medicine, 'id'>) => {
    const newMedicine: Medicine = { ...medicine, id: generateId() };

    setState(prev => {
      const newCheckIns = generateCheckInRecordsForMedicine(newMedicine, prev.members, prev.checkInRecords);
      const newReminders = generateRemindersForMedicine(newMedicine, prev.reminders);

      console.info('[AppContext] 新增药品:', newMedicine.name,
        '| 生成打卡记录:', newCheckIns.length,
        '| 生成提醒:', newReminders.length);

      return {
        ...prev,
        medicines: [newMedicine, ...prev.medicines],
        checkInRecords: [...newCheckIns, ...prev.checkInRecords],
        reminders: [...newReminders, ...prev.reminders],
      };
    });
  }, []);

  const updateMedicine = useCallback((id: string, data: Partial<Medicine>) => {
    setState(prev => {
      const updatedMedicines = prev.medicines.map(m => m.id === id ? { ...m, ...data } : m);
      const updatedMed = updatedMedicines.find(m => m.id === id);
      let newReminders = prev.reminders;

      if (updatedMed) {
        const existingRemindersForMed = prev.reminders.filter(r => r.medicineId === id);
        const unhandledForMed = existingRemindersForMed.filter(r => !r.handled && !r.snoozedUntil);
        const handledForMed = existingRemindersForMed.filter(r => r.handled || r.snoozedUntil);
        const freshReminders = generateRemindersForMedicine(updatedMed, unhandledForMed);
        const otherReminders = prev.reminders.filter(r => r.medicineId !== id);
        newReminders = [...freshReminders, ...handledForMed, ...otherReminders];
      }

      return {
        ...prev,
        medicines: updatedMedicines,
        reminders: newReminders,
      };
    });
  }, []);

  const updateMedicineFull = useCallback((id: string, data: Partial<Medicine>) => {
    setState(prev => {
      const updatedMedicines = prev.medicines.map(m => m.id === id ? { ...m, ...data } : m);
      const updatedMed = updatedMedicines.find(m => m.id === id);

      const today = getCurrentDate();
      const existingTodayForMed = prev.checkInRecords.filter(
        r => r.medicineId === id && r.date === today
      );
      const alreadyHandledToday = existingTodayForMed.filter(
        r => r.status !== 'pending'
      );
      const otherRecords = prev.checkInRecords.filter(
        r => !(r.medicineId === id && r.date === today && r.status === 'pending')
      );

      let newCheckIns = otherRecords;
      if (updatedMed) {
        const generated = generateCheckInRecordsForMedicine(updatedMed, prev.members, alreadyHandledToday);
        newCheckIns = [...alreadyHandledToday, ...generated, ...otherRecords];
      }

      let newReminders = prev.reminders;
      if (updatedMed) {
        const allForMed = prev.reminders.filter(r => r.medicineId === id);
        const handledHistory = allForMed.filter(r => r.handled === true);
        const snoozed = allForMed.filter(r => r.snoozedUntil !== undefined);
        const unhandledActive = allForMed.filter(r => !r.handled && !r.snoozedUntil);

        const expireInfo = getExpireStatus(updatedMed.expireDate);
        const expireStillNeeded = expireInfo.status === 'expiring' || expireInfo.status === 'expired';
        const stockStillNeeded = updatedMed.stock <= updatedMed.minStock;

        const preservedActive: ReminderItem[] = [];
        unhandledActive.forEach(r => {
          if (r.type === 'expire' && expireStillNeeded) preservedActive.push(r);
          else if (r.type === 'stock' && stockStillNeeded) preservedActive.push(r);
        });

        const stillNeededTypes = new Set(preservedActive.map(r => r.type));
        const freshReminders = generateRemindersForMedicine(updatedMed, preservedActive);
        const otherReminders = prev.reminders.filter(r => r.medicineId !== id);

        console.info('[AppContext] 更新药品提醒:',
          '原未处理:', unhandledActive.length,
          '保留未处理:', preservedActive.length,
          '新增未处理:', freshReminders.length,
          '已处理历史:', handledHistory.length,
          '延后中的:', snoozed.length);

        newReminders = [
          ...preservedActive.filter(r => !stillNeededTypes.has(r.type) || true),
          ...freshReminders,
          ...snoozed,
          ...handledHistory,
          ...otherReminders
        ];
      }

      console.info('[AppContext] 完整更新药品:', id,
        '| 今日打卡(保留历史):', alreadyHandledToday.length,
        '| 新增待服:', updatedMed ? (newCheckIns.filter(r => r.medicineId === id && r.date === today).length - alreadyHandledToday.length) : 0);

      return {
        ...prev,
        medicines: updatedMedicines,
        checkInRecords: newCheckIns,
        reminders: newReminders,
      };
    });
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => m.id !== id),
      checkInRecords: prev.checkInRecords.filter(r => r.medicineId !== id),
      reminders: prev.reminders.filter(r => r.medicineId !== id),
    }));
  }, []);

  const addMember = useCallback((member: Omit<Member, 'id' | 'avatar'>) => {
    const newMember: Member = {
      ...member,
      id: generateId(),
      avatar: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/200/200`
    };
    setState(prev => ({ ...prev, members: [...prev.members, newMember] }));
  }, []);

  const updateCheckIn = useCallback((id: string, status: CheckInRecord['status'], note?: string, adverseReaction?: string) => {
    setState(prev => ({
      ...prev,
      checkInRecords: prev.checkInRecords.map(r =>
        r.id === id
          ? {
              ...r,
              status,
              actualTime: (status === 'taken' || status === 'supplemented') ? getCurrentTime() : undefined,
              note: note !== undefined ? note : r.note,
              adverseReaction: adverseReaction !== undefined ? adverseReaction : r.adverseReaction,
              operatorId: prev.operator.id,
              operatorName: prev.operator.name,
              operatedAt: getCurrentTime(),
            }
          : r
      )
    }));
  }, []);

  const handleReminder = useCallback((id: string, handleType: ReminderHandleType, snoozeDays: number = 3) => {
    setState(prev => {
      const today = getCurrentDate();
      const reminders = prev.reminders.map(r => {
        if (r.id !== id) return r;

        const handled: ReminderItem = {
          ...r,
          handled: true,
          handledAt: today,
          handleType,
          read: true,
          operatorId: prev.operator.id,
          operatorName: prev.operator.name,
          snoozeCount: (r.snoozeCount || 0) + (handleType === 'snooze' ? 1 : 0),
          originalDate: r.originalDate || r.date,
        };

        if (handleType === 'snooze') {
          const snoozeDate = new Date();
          snoozeDate.setDate(snoozeDate.getDate() + snoozeDays);
          const snoozedUntil = snoozeDate.toISOString().split('T')[0];
          handled.handled = false;
          handled.read = true;
          handled.snoozedUntil = snoozedUntil;
          handled.date = snoozedUntil;
          handled.title = r.snoozeCount ? r.title : r.title.replace('（', '（再次');
          handled.content = `${r.content}（第${(r.snoozeCount || 0) + 1}次延后，${snoozedUntil}后继续提醒）`;
        }

        return handled;
      });

      let medicines = prev.medicines;
      const reminder = prev.reminders.find(r => r.id === id);
      if (reminder && handleType === 'restocked' && reminder.type === 'stock') {
        medicines = prev.medicines.map(m =>
          m.id === reminder.medicineId
            ? { ...m, stock: Math.max(m.minStock * 5, 20) }
            : m
        );
      }
      if (reminder && handleType === 'discarded' && reminder.type === 'expire') {
        medicines = prev.medicines.filter(m => m.id !== reminder.medicineId);
      }

      console.info('[AppContext] 处理提醒:', id, '类型:', handleType, '操作人:', prev.operator.name);

      return {
        ...prev,
        reminders,
        medicines,
      };
    });
  }, []);

  const getTodayRecords = useCallback((): CheckInRecord[] => {
    const today = getCurrentDate();
    return state.checkInRecords.filter(r => r.date === today);
  }, [state.checkInRecords]);

  const getTodayStats = useCallback((): DailyStat => {
    const records = getTodayRecords();
    return {
      total: records.length,
      taken: records.filter(r => r.status === 'taken').length,
      missed: records.filter(r => r.status === 'missed').length,
      pending: records.filter(r => r.status === 'pending').length,
      supplemented: records.filter(r => r.status === 'supplemented').length
    };
  }, [getTodayRecords]);

  const getDayDetail = useCallback((date: string): DayDetail => {
    const records = state.checkInRecords
      .filter(r => r.date === date)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

    const stats: DailyStat = {
      total: records.length,
      taken: records.filter(r => r.status === 'taken').length,
      missed: records.filter(r => r.status === 'missed').length,
      pending: records.filter(r => r.status === 'pending').length,
      supplemented: records.filter(r => r.status === 'supplemented').length
    };

    const memberGroups: Record<string, CheckInRecord[]> = {};
    records.forEach(r => {
      const key = r.memberId || '__all__';
      if (!memberGroups[key]) memberGroups[key] = [];
      memberGroups[key].push(r);
    });

    return { date, records, stats, memberGroups };
  }, [state.checkInRecords]);

  const getCalendarStats = useCallback((startDate: string, days: number): Record<string, CalendarDayStat> => {
    const result: Record<string, CalendarDayStat> = {};
    const start = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = state.checkInRecords.filter(r => r.date === dateStr);
      result[dateStr] = {
        date: dateStr,
        total: dayRecords.length,
        taken: dayRecords.filter(r => r.status === 'taken').length,
        missed: dayRecords.filter(r => r.status === 'missed').length,
        pending: dayRecords.filter(r => r.status === 'pending').length,
        supplemented: dayRecords.filter(r => r.status === 'supplemented').length,
        hasAdverseReaction: dayRecords.some(r => r.adverseReaction),
      };
    }
    return result;
  }, [state.checkInRecords]);

  const getMemberMedicines = useCallback((memberId: string): Medicine[] => {
    return state.medicines.filter(m => m.memberIds.includes(memberId));
  }, [state.medicines]);

  const getMemberRecords = useCallback((memberId: string, days: number = 7): CheckInRecord[] => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return state.checkInRecords
      .filter(r => (r.memberId === memberId || r.memberId === '') && r.date >= cutoffStr)
      .sort((a, b) => b.date.localeCompare(a.date) || b.scheduledTime.localeCompare(a.scheduledTime));
  }, [state.checkInRecords]);

  const getPrescriptionSummary = useCallback((memberId: string, days: number = 30): PrescriptionMemberSummary => {
    const member = state.members.find(m => m.id === memberId);
    const records = getMemberRecords(memberId, days);
    const memberMeds = getMemberMedicines(memberId);

    const activeMedicines: PrescriptionMemberSummary['activeMedicines'] = [];
    const expiredMedicines: Medicine[] = [];
    const expiringMedicines: Medicine[] = [];
    const lowStockMedicines: Medicine[] = [];
    const risks: PrescriptionRisk[] = [];
    const missedDatesSet = new Set<string>();
    const adverseReactions: PrescriptionMemberSummary['adverseReactions'] = [];

    memberMeds.forEach(med => {
      const expireInfo = getExpireStatus(med.expireDate);
      if (expireInfo.status === 'expired') {
        expiredMedicines.push(med);
        risks.push({ type: 'expired', medicineName: med.name, description: `${med.name}已过期`, level: 'danger' });
      } else if (expireInfo.status === 'expiring') {
        expiringMedicines.push(med);
        risks.push({ type: 'expiring', medicineName: med.name, description: `${med.name}将于${expireInfo.days}天后到期`, level: 'warning' });
      }
      if (med.stock <= med.minStock) {
        lowStockMedicines.push(med);
        risks.push({ type: 'low_stock', medicineName: med.name, description: `${med.name}库存不足（剩${med.stock}）`, level: 'warning' });
      }

      const medRecords = records.filter(r => r.medicineId === med.id);
      const takenCount = medRecords.filter(r => r.status === 'taken').length;
      const missedCount = medRecords.filter(r => r.status === 'missed').length;
      const supplementedCount = medRecords.filter(r => r.status === 'supplemented').length;
      const total = takenCount + missedCount + supplementedCount;
      const adherenceRate = total > 0 ? Math.round(((takenCount + supplementedCount) / total) * 100) : 100;

      activeMedicines.push({
        medicine: med,
        takenCount,
        missedCount,
        supplementedCount,
        adherenceRate
      });

      medRecords.filter(r => r.status === 'missed').forEach(r => missedDatesSet.add(r.date));
      medRecords.filter(r => r.adverseReaction).forEach(r => {
        adverseReactions.push({ date: r.date, medicineName: med.name, reaction: r.adverseReaction! });
      });
    });

    const allTaken = records.filter(r => r.status === 'taken' || r.status === 'supplemented').length;
    const allTotal = records.filter(r => r.status !== 'pending').length;
    const overallAdherence = allTotal > 0 ? Math.round((allTaken / allTotal) * 100) : 100;

    return {
      memberId,
      memberName: member?.name || '未知',
      memberAge: member?.age || 0,
      memberRelation: member?.relation || '',
      periodDays: days,
      activeMedicines,
      expiredMedicines,
      expiringMedicines,
      lowStockMedicines,
      missedDates: Array.from(missedDatesSet).sort(),
      adverseReactions,
      overallAdherence,
      risks
    };
  }, [state.members, getMemberRecords, getMemberMedicines]);

  const getVisibleReminders = useCallback((): ReminderItem[] => {
    const today = getCurrentDate();
    const needsRefresh = state.reminders.some(r =>
      !r.handled && r.snoozedUntil && r.snoozedUntil <= today && r.read === true
    );
    if (needsRefresh) {
      console.info('[AppContext] 延后到期自动刷新提醒状态');
      void today;
    }
    return state.reminders
      .map(refreshSnoozedReminder)
      .filter(isReminderVisible);
  }, [state.reminders]);

  const getUnreadRemindersCount = useCallback((): number => {
    return state.reminders
      .map(refreshSnoozedReminder)
      .filter(isReminderUnread).length;
  }, [state.reminders]);

  const markReminderRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => {
        if (r.id !== id) return r;
        if (r.snoozedUntil && r.snoozedUntil > getCurrentDate()) return r;
        return { ...r, read: true };
      })
    }));
  }, []);

  const markAllRemindersRead = useCallback(() => {
    setState(prev => {
      const today = getCurrentDate();
      return {
        ...prev,
        reminders: prev.reminders.map(r => {
          if (r.handled) return r;
          if (r.snoozedUntil && r.snoozedUntil > today) return r;
          return { ...r, read: true };
        })
      };
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        addMedicine,
        updateMedicine,
        updateMedicineFull,
        deleteMedicine,
        addMember,
        setOperator,
        updateCheckIn,
        handleReminder,
        getTodayRecords,
        getTodayStats,
        getDayDetail,
        getCalendarStats,
        getMemberMedicines,
        getMemberRecords,
        getPrescriptionSummary,
        getVisibleReminders,
        markReminderRead,
        markAllRemindersRead,
        getUnreadRemindersCount
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
