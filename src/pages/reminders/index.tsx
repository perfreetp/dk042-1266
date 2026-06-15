import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import StatCard from '@/components/StatCard';
import ReminderCard from '@/components/ReminderCard';
import MedicineCard from '@/components/MedicineCard';
import { getExpireStatus } from '@/utils';
import styles from './index.module.scss';

type TabType = 'all' | 'expire' | 'stock';

const RemindersPage: React.FC = () => {
  const { reminders, medicines, markReminderRead, getUnreadRemindersCount } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const unreadCount = useMemo(() => getUnreadRemindersCount(), [getUnreadRemindersCount]);

  const expiringMedicines = useMemo(() => {
    return medicines
      .map(m => ({ medicine: m, expireInfo: getExpireStatus(m.expireDate) }))
      .filter(x => x.expireInfo.status !== 'normal')
      .sort((a, b) => a.expireInfo.days - b.expireInfo.days);
  }, [medicines]);

  const lowStockMedicines = useMemo(() => {
    return medicines.filter(m => m.stock <= m.minStock);
  }, [medicines]);

  const filteredReminders = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => b.date.localeCompare(a.date));
    if (activeTab === 'all') return sorted;
    return sorted.filter(r => r.type === activeTab);
  }, [reminders, activeTab]);

  const unreadExpire = useMemo(
    () => reminders.filter(r => !r.read && r.type === 'expire').length,
    [reminders]
  );

  const unreadStock = useMemo(
    () => reminders.filter(r => !r.read && r.type === 'stock').length,
    [reminders]
  );

  const handleReminderClick = (reminderId: string) => {
    markReminderRead(reminderId);
  };

  const handleMedicineClick = (medicineId: string) => {
    Taro.navigateTo({ url: `/pages/medicine-detail/index?id=${medicineId}` });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>到期提醒</Text>
        <Text className={styles.subtitle}>及时处理，守护家人健康</Text>
      </View>

      <View className={styles.statsRow}>
        <StatCard value={expiringMedicines.length} label="即将过期" variant="warning" />
        <StatCard value={lowStockMedicines.length} label="库存不足" variant="danger" />
        <StatCard value={unreadCount} label="未读提醒" variant="info" />
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'all' })}
          onClick={() => setActiveTab('all')}
        >
          全部
          {unreadCount > 0 && <View className={styles.badge}>{unreadCount}</View>}
        </View>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'expire' })}
          onClick={() => setActiveTab('expire')}
        >
          到期提醒
          {unreadExpire > 0 && <View className={styles.badge}>{unreadExpire}</View>}
        </View>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'stock' })}
          onClick={() => setActiveTab('stock')}
        >
          库存提醒
          {unreadStock > 0 && <View className={styles.badge}>{unreadStock}</View>}
        </View>
      </View>

      {(activeTab === 'all' || activeTab === 'expire') && (
        <>
          <View className={styles.sectionTitle}>即将过期药品（{expiringMedicines.length}）</View>
          {expiringMedicines.length > 0 ? (
            expiringMedicines.map(({ medicine }) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onClick={() => handleMedicineClick(medicine.id)}
              />
            ))
          ) : (
            <View className={styles.emptyState} style={{ marginBottom: 24 }}>
              <Text className={styles.emptyIcon}>✅</Text>
              <Text className={styles.emptyText}>暂无即将过期药品</Text>
            </View>
          )}
        </>
      )}

      {(activeTab === 'all' || activeTab === 'stock') && (
        <>
          <View className={styles.sectionTitle}>库存不足药品（{lowStockMedicines.length}）</View>
          {lowStockMedicines.length > 0 ? (
            lowStockMedicines.map(medicine => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onClick={() => handleMedicineClick(medicine.id)}
              />
            ))
          ) : (
            <View className={styles.emptyState} style={{ marginBottom: 24 }}>
              <Text className={styles.emptyIcon}>✅</Text>
              <Text className={styles.emptyText}>所有药品库存充足</Text>
            </View>
          )}
        </>
      )}

      <View className={styles.sectionTitle}>提醒历史</View>
      <View className={styles.reminderList}>
        {filteredReminders.length > 0 ? (
          filteredReminders.map(reminder => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onClick={() => handleReminderClick(reminder.id)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>暂无提醒记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default RemindersPage;
