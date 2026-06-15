import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Member, Medicine, CheckInRecord, ReminderItem, DailyStat } from '@/types';
import { mockMembers } from '@/data/members';
import { mockMedicines as medicinesData } from '@/data/medicines';
import { mockCheckInRecords, mockReminders } from '@/data/records';
import { getCurrentDate, generateId, getCurrentTime } from '@/utils';

interface AppState {
  members: Member[];
  medicines: Medicine[];
  checkInRecords: CheckInRecord[];
  reminders: ReminderItem[];
}

interface AppContextType extends AppState {
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  updateMedicine: (id: string, data: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  addMember: (member: Omit<Member, 'id' | 'avatar'>) => void;
  updateCheckIn: (id: string, status: CheckInRecord['status'], note?: string, adverseReaction?: string) => void;
  getTodayRecords: () => CheckInRecord[];
  getTodayStats: () => DailyStat;
  getMemberMedicines: (memberId: string) => Medicine[];
  getMemberRecords: (memberId: string, days?: number) => CheckInRecord[];
  markReminderRead: (id: string) => void;
  getUnreadRemindersCount: () => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    members: mockMembers,
    medicines: medicinesData,
    checkInRecords: mockCheckInRecords,
    reminders: mockReminders
  });

  const addMedicine = useCallback((medicine: Omit<Medicine, 'id'>) => {
    const newMedicine: Medicine = { ...medicine, id: generateId() };
    setState(prev => ({ ...prev, medicines: [newMedicine, ...prev.medicines] }));
  }, []);

  const updateMedicine = useCallback((id: string, data: Partial<Medicine>) => {
    setState(prev => ({
      ...prev,
      medicines: prev.medicines.map(m => m.id === id ? { ...m, ...data } : m)
    }));
  }, []);

  const deleteMedicine = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      medicines: prev.medicines.filter(m => m.id !== id)
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
              note,
              adverseReaction
            }
          : r
      )
    }));
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
      .filter(r => r.memberId === memberId && r.date >= cutoffStr)
      .sort((a, b) => b.date.localeCompare(a.date) || b.scheduledTime.localeCompare(a.scheduledTime));
  }, [state.checkInRecords]);

  const markReminderRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, read: true } : r)
    }));
  }, []);

  const getUnreadRemindersCount = useCallback((): number => {
    return state.reminders.filter(r => !r.read).length;
  }, [state.reminders]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        addMember,
        updateCheckIn,
        getTodayRecords,
        getTodayStats,
        getMemberMedicines,
        getMemberRecords,
        markReminderRead,
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
