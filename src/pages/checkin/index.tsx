import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import StatCard from '@/components/StatCard';
import CheckInItem from '@/components/CheckInItem';
import { getCurrentDate } from '@/utils';
import styles from './index.module.scss';

type TabType = 'pending' | 'all';
type TimeSlot = 'all' | 'morning' | 'noon' | 'evening' | 'night';

const TIME_SLOT_RANGES: Record<TimeSlot, [number, number]> = {
  all: [0, 24],
  morning: [5, 11],
  noon: [11, 14],
  evening: [17, 20],
  night: [20, 28],
};

const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  all: '全部',
  morning: '早晨',
  noon: '中午',
  evening: '晚上',
  night: '睡前',
};

const CheckInPage: React.FC = () => {
  const { members, getTodayRecords, getTodayStats, updateCheckIn } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('all');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const todayRecords = useMemo(() => getTodayRecords(), [getTodayRecords]);
  const stats = useMemo(() => getTodayStats(), [getTodayStats]);

  const memberStats = useMemo(() => {
    const result: Record<string, { total: number; pending: number; missed: number; taken: number }> = {};
    todayRecords.forEach(r => {
      const key = r.memberId || '__all__';
      if (!result[key]) result[key] = { total: 0, pending: 0, missed: 0, taken: 0 };
      result[key].total++;
      if (r.status === 'pending') result[key].pending++;
      if (r.status === 'missed') result[key].missed++;
      if (r.status === 'taken' || r.status === 'supplemented') result[key].taken++;
    });
    return result;
  }, [todayRecords]);

  const displayRecords = useMemo(() => {
    let records = [...todayRecords];

    if (selectedMemberId !== null) {
      records = records.filter(r => r.memberId === selectedMemberId || r.memberId === '');
    }

    if (selectedTimeSlot !== 'all') {
      const [start, end] = TIME_SLOT_RANGES[selectedTimeSlot];
      records = records.filter(r => {
        const hour = parseInt(r.scheduledTime.split(':')[0], 10);
        return hour >= start && hour < end;
      });
    }

    const sorted = records.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    if (activeTab === 'pending') {
      return sorted.filter(r => r.status === 'pending' || r.status === 'missed');
    }
    return sorted;
  }, [todayRecords, activeTab, selectedMemberId, selectedTimeSlot]);

  const filteredStats = useMemo(() => {
    const total = displayRecords.length;
    const taken = displayRecords.filter(r => r.status === 'taken' || r.status === 'supplemented').length;
    const missed = displayRecords.filter(r => r.status === 'missed').length;
    const pending = displayRecords.filter(r => r.status === 'pending').length;
    return { total, taken, missed, pending };
  }, [displayRecords]);

  const handleTake = (id: string) => {
    setSelectedRecordId(id);
    Taro.showModal({
      title: '记录服药',
      content: '是否有不适反应？',
      confirmText: '有不适',
      cancelText: '无不适',
      success: (res) => {
        if (res.confirm) {
          Taro.showModal({
            title: '描述不适反应',
            editable: true,
            placeholderText: '请描述不适症状...',
            success: (inputRes) => {
              if (inputRes.confirm && inputRes.content) {
                updateCheckIn(id, 'taken', undefined, inputRes.content);
                Taro.showToast({ title: '已记录', icon: 'success' });
              }
            }
          });
        } else {
          updateCheckIn(id, 'taken');
          Taro.showToast({ title: '打卡成功', icon: 'success' });
        }
        setSelectedRecordId(null);
      },
      fail: () => setSelectedRecordId(null)
    });
  };

  const handleMiss = (id: string) => {
    Taro.showModal({
      title: '标记漏服',
      editable: true,
      placeholderText: '请输入漏服原因（选填）',
      success: (res) => {
        if (res.confirm) {
          updateCheckIn(id, 'missed', res.content || '');
          Taro.showToast({ title: '已标记', icon: 'none' });
        }
      }
    });
  };

  const handleSupplement = (id: string) => {
    Taro.showModal({
      title: '补服确认',
      editable: true,
      placeholderText: '备注（选填）',
      success: (res) => {
        if (res.confirm) {
          updateCheckIn(id, 'supplemented', res.content || '');
          Taro.showToast({ title: '补服已记录', icon: 'success' });
        }
      }
    });
  };

  const renderMemberChip = (id: string | null, label: string, statKey?: string) => {
    const isActive = selectedMemberId === id;
    const stat = statKey ? memberStats[statKey] : undefined;
    const pendingCount = stat?.pending ?? 0;
    return (
      <View
        key={id || '__all__'}
        className={classnames(styles.memberChip, { [styles.memberChipActive]: isActive })}
        onClick={() => setSelectedMemberId(id)}
      >
        <Text className={styles.memberChipLabel}>{label}</Text>
        {pendingCount > 0 && (
          <Text className={styles.memberChipBadge}>{pendingCount}</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>服药打卡</Text>
        <Text className={styles.date}>今天是 {getCurrentDate()}</Text>
      </View>

      <View className={styles.statsRow}>
        <StatCard value={stats.total} label="今日计划" />
        <StatCard value={stats.taken} label="已完成" />
        <StatCard value={stats.pending} label="待服药" variant="warning" />
        <StatCard value={stats.missed} label="漏服" variant="danger" />
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterLabel}>👨‍👩‍👧 按成员筛选</View>
        <ScrollView className={styles.memberChipRow} scrollX enhanced showScrollbar={false}>
          {renderMemberChip(null, '全部', '__all__')}
          {members.map(m => renderMemberChip(m.id, m.name, m.id))}
          {renderMemberChip('', '全家', '__all__')}
        </ScrollView>
      </View>

      <View className={styles.filterSection}>
        <View className={styles.filterLabel}>⏰ 按时段筛选</View>
        <View className={styles.timeSlotRow}>
          {(Object.keys(TIME_SLOT_LABELS) as TimeSlot[]).map(slot => (
            <View
              key={slot}
              className={classnames(styles.timeSlot, {
                [styles.timeSlotActive]: selectedTimeSlot === slot
              })}
              onClick={() => setSelectedTimeSlot(slot)}
            >
              {TIME_SLOT_LABELS[slot]}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'pending' })}
          onClick={() => setActiveTab('pending')}
        >
          待处理
        </View>
        <View
          className={classnames(styles.tab, { [styles.tabActive]: activeTab === 'all' })}
          onClick={() => setActiveTab('all')}
        >
          全部记录
        </View>
      </View>

      {(selectedMemberId !== null || selectedTimeSlot !== 'all') && (
        <View className={styles.filterSummary}>
          <Text className={styles.filterSummaryText}>
            筛选结果：共 {filteredStats.total} 条，
            已服{filteredStats.taken} · 待服{filteredStats.pending} · 漏服{filteredStats.missed}
          </Text>
        </View>
      )}

      <View className={styles.sectionTitle}>
        {activeTab === 'pending' ? '待处理服药' : '今日全部记录'}（{displayRecords.length}）
      </View>

      <View className={styles.checkInList}>
        {displayRecords.length > 0 ? (
          displayRecords.map(record => (
            <CheckInItem
              key={record.id}
              record={record}
              selected={selectedRecordId === record.id}
              onTake={() => handleTake(record.id)}
              onMiss={() => handleMiss(record.id)}
              onSupplement={() => handleSupplement(record.id)}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>🎉</Text>
            <Text className={styles.emptyText}>
              {activeTab === 'pending' ? '暂无待处理事项，全部完成啦！' : '暂无记录'}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default CheckInPage;
