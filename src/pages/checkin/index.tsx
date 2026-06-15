import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import StatCard from '@/components/StatCard';
import CheckInItem from '@/components/CheckInItem';
import { getCurrentDate } from '@/utils';
import styles from './index.module.scss';

type TabType = 'pending' | 'all';

const CheckInPage: React.FC = () => {
  const { getTodayRecords, getTodayStats, updateCheckIn } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [note, setNote] = useState('');
  const [adverseReaction, setAdverseReaction] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const todayRecords = useMemo(() => getTodayRecords(), [getTodayRecords]);
  const stats = useMemo(() => getTodayStats(), [getTodayStats]);

  const displayRecords = useMemo(() => {
    const sorted = [...todayRecords].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    if (activeTab === 'pending') {
      return sorted.filter(r => r.status === 'pending' || r.status === 'missed');
    }
    return sorted;
  }, [todayRecords, activeTab]);

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

      <View className={styles.sectionTitle}>
        {activeTab === 'pending' ? '待处理服药' : '今日全部记录'}（{displayRecords.length}）
      </View>

      <View className={styles.checkInList}>
        {displayRecords.length > 0 ? (
          displayRecords.map(record => (
            <CheckInItem
              key={record.id}
              record={record}
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
