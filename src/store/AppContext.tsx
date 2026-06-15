import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Member, Medicine, CheckInRecord, ReminderItem, DailyStat, ReminderHandleType } from '@/types';
import { mockMembers } from '@/data/members';
import { mockMedicines as medicinesData } from '@/data/medicines';
import { mockCheckInRecords, mockReminders } from '@/data/records';
import { getCurrentDate, generateId, getCurrentTime, getExpireStatus } from '@/utils';

const STORAGE_KEYS = {
  members: 'medicine_app_members',
  medicines: 'medicine_app_medicines',
  checkInRecords: 'medicine_app_checkin_records',
  reminders: 'medicine_app_reminders',
  initialized: 'medicine_app_initialized'
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
      r => r.medicineId === medicine.id && r.type === 'expire' && !r.handled
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
      r => r.medicineId === medicine.id && r.type === 'stock' && !r.handled
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

interface AppState {
  members: Member[];
  medicines: Medicine[];
  checkInRecords: CheckInRecord[];
  reminders: ReminderItem[];
}

interface AppContextType extends AppState {
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicine: (id: string, data: Partial<Medicine>) => void;
  updateMedicineFull: (id: string, data: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  addMember: (member: Omit<Member, 'id' | 'avatar'>) => void;
  updateCheckIn: (id: string, status: CheckInRecord['status'], note?: string, adverseReaction?: string) => void;
  handleReminder: (id: string, handleType: ReminderHandleType, snoozeDays?: number) => void;
  getTodayRecords: () => CheckInRecord[];
  getTodayStats: () => DailyStat;
  getMemberMedicines: (memberId: string) => Medicine[];
  getMemberRecords: (memberId: string, days?: number) => CheckInRecord[];
  markReminderRead: (id: string) => void;
  getUnreadRemindersCount: () => number;
  markAllRemindersRead: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(getInitialState);

  useEffect(() => {
    saveStorage(STORAGE_KEYS.members, state.members);
    saveStorage(STORAGE_KEYS.medicines, state.medicines);
    saveStorage(STORAGE_KEYS.checkInRecords, state.checkInRecords);
    saveStorage(STORAGE_KEYS.reminders, state.reminders);
  }, [state]);

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
        members: prev.members,
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
        const unhandledForMed = existingRemindersForMed.filter(r => !r.handled);
        const handledForMed = existingRemindersForMed.filter(r => r.handled);
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
      const otherRecords = prev.checkInRecords.filter(
        r => !(r.medicineId === id && r.date === today && r.status === 'pending')
      );

      let newCheckIns = otherRecords;
      if (updatedMed) {
        const generated = generateCheckInRecordsForMedicine(updatedMed, prev.members, otherRecords);
        const existingTodayNonPending = prev.checkInRecords.filter(
          r => r.medicineId === id && r.date === today && r.status !== 'pending'
        );
        newCheckIns = [...existingTodayNonPending, ...generated, ...otherRecords];
      }

      let newReminders = prev.reminders;
      if (updatedMed) {
        const unhandledForMed = prev.reminders.filter(r => r.medicineId === id && !r.handled);
        const handledForMed = prev.reminders.filter(r => r.medicineId === id && r.handled);
        const freshReminders = generateRemindersForMedicine(updatedMed, unhandledForMed);
        const otherReminders = prev.reminders.filter(r => r.medicineId !== id);
        newReminders = [...freshReminders, ...handledForMed, ...otherReminders];
      }

      console.info('[AppContext] 完整更新药品:', id,
        '| 今日打卡记录:', prev.checkInRecords.filter(r => r.medicineId === id && r.date === today).length,
        '->', newCheckIns.filter(r => r.medicineId === id && r.date === today).length);

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
              adverseReaction: adverseReaction !== undefined ? adverseReaction : r.adverseReaction
            }
          : r
      )
    }));
  }, []);

  const handleReminder = useCallback((id: string, handleType: ReminderHandleType, snoozeDays: number = 3) => {
    setState(prev => {
      const reminders = prev.reminders.map(r => {
        if (r.id !== id) return r;

        const handled: ReminderItem = {
          ...r,
          handled: true,
          handledAt: getCurrentDate(),
          handleType,
          read: true,
        };

        if (handleType === 'snooze') {
          const snoozeDate = new Date();
          snoozeDate.setDate(snoozeDate.getDate() + snoozeDays);
          handled.date = snoozeDate.toISOString().split('T')[0];
          handled.handled = false;
          handled.read = false;
          handled.content = `${r.content}（已延后${snoozeDays}天）`;
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

      console.info('[AppContext] 处理提醒:', id, '类型:', handleType);

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
      pending: records.filter(r => r.status === 'pending').length
    };
  }, [getTodayRecords]);

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

  const markReminderRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, read: true } : r)
    }));
  }, []);

  const markAllRemindersRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => ({ ...r, read: true }))
    }));
  }, []);

  const getUnreadRemindersCount = useCallback((): number => {
    return state.reminders.filter(r => !r.read && !r.handled).length;
  }, [state.reminders]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        addMedicine,
        updateMedicine,
        updateMedicineFull,
        deleteMedicine,
        addMember,
        updateCheckIn,
        handleReminder,
        getTodayRecords,
        getTodayStats,
        getMemberMedicines,
        getMemberRecords,
        markReminderRead,
        getUnreadRemindersCount,
        markAllRemindersRead
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
