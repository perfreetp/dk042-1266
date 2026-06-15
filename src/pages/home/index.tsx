import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import StatCard from '@/components/StatCard';
import CheckInItem from '@/components/CheckInItem';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const {
    getTodayRecords,
    getTodayStats,
    getUnreadRemindersCount,
    medicines,
    updateCheckIn
  } = useApp();

  const todayRecords = useMemo(() => getTodayRecords(), [getTodayRecords]);
  const stats = useMemo(() => getTodayStats(), [getTodayStats]);
  const unreadCount = useMemo(() => getUnreadRemindersCount(), [getUnreadRemindersCount]);

  const pendingRecords = useMemo(
    () => todayRecords.filter(r => r.status === 'pending').sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)),
    [todayRecords]
  );

  const expiringCount = useMemo(() => {
    const today = new Date();
    return medicines.filter(m => {
      const expire = new Date(m.expireDate);
      const diffDays = (expire.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 30 && diffDays >= 0;
    }).length;
  }, [medicines]);

  const lowStockCount = useMemo(
    () => medicines.filter(m => m.stock <= m.minStock).length,
    [medicines]
  );

  const handleTake = (id: string) => {
    updateCheckIn(id, 'taken');
    Taro.showToast({ title: '打卡成功', icon: 'success' });
  };

  const handleMiss = (id: string) => {
    Taro.showModal({
      title: '确认漏服',
      content: '确认标记为漏服吗？',
      success: (res) => {
        if (res.confirm) {
          updateCheckIn(id, 'missed');
          Taro.showToast({ title: '已标记漏服', icon: 'none' });
        }
      }
    });
  };

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url });
  };

  const handleSwitchTab = (url: string) => {
    Taro.switchTab({ url });
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.greeting}>今天是个好日子 👋</Text>
        <Text className={styles.title}>家庭药箱</Text>
      </View>

      <View className={styles.statsRow}>
        <StatCard value={stats.taken} label="已服用" />
        <StatCard value={stats.pending} label="待服药" variant="warning" />
        <StatCard value={stats.missed} label="漏服" variant="danger" />
      </View>

      <View className={styles.sectionTitle}>
        <Text>快捷功能</Text>
      </View>
      <View className={styles.quickActions}>
        <View className={styles.actionCard} onClick={() => handleNavigate('/pages/medicine-add/index')}>
          <View className={styles.actionIcon}>💊</View>
          <Text className={styles.actionLabel}>添加药品</Text>
        </View>
        <View className={styles.actionCard} onClick={() => handleNavigate('/pages/member-add/index')}>
          <View className={classnames(styles.actionIcon, styles.actionIconInfo)}>👨‍👩‍👧</View>
          <Text className={styles.actionLabel}>添加成员</Text>
        </View>
        <View
          className={styles.actionCard}
          onClick={() => handleSwitchTab('/pages/checkin/index')}
        >
          <View className={classnames(styles.actionIcon, styles.actionIconWarn)}>✅</View>
          <Text className={styles.actionLabel}>服药打卡</Text>
        </View>
        <View
          className={styles.actionCard}
          onClick={() => handleSwitchTab('/pages/reminders/index')}
        >
          <View className={classnames(styles.actionIcon, styles.actionIconDanger)}>
            🔔{unreadCount > 0 && <Text style={{ color: '#EF4444', fontSize: '20rpx' }}> {unreadCount}</Text>}
          </View>
          <Text className={styles.actionLabel}>提醒中心</Text>
        </View>
      </View>

      <View className={styles.sectionTitle}>
        <Text>待服药提醒</Text>
        <Text className={styles.seeMore} onClick={() => handleSwitchTab('/pages/checkin/index')}>
          查看全部
        </Text>
      </View>
      <View className={styles.todayList}>
        {pendingRecords.length > 0 ? (
          pendingRecords.slice(0, 3).map(record => (
            <CheckInItem
              key={record.id}
              record={record}
              onTake={() => handleTake(record.id)}
              onMiss={() => handleMiss(record.id)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyText}>暂无待服药提醒 🎉</Text>
          </View>
        )}
      </View>

      <View className={styles.sectionTitle}>
        <Text>预警提示</Text>
        <Text className={styles.seeMore} onClick={() => handleSwitchTab('/pages/reminders/index')}>
          查看全部
        </Text>
      </View>
      <View className={styles.statsRow}>
        <StatCard value={expiringCount} label="即将过期" variant="warning" />
        <StatCard value={lowStockCount} label="库存不足" variant="danger" />
        <StatCard value={medicines.length} label="药箱总数" variant="info" />
      </View>
    </ScrollView>
  );
};

export default HomePage;
