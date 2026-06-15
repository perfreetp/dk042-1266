import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import CheckInItem from '@/components/CheckInItem';
import { CheckInRecord } from '@/types';
import styles from './index.module.scss';

const RecordsPage: React.FC = () => {
  const { members, checkInRecords, updateCheckIn } = useApp();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    let records = [...checkInRecords];
    if (selectedMemberId) {
      records = records.filter(r => r.memberId === selectedMemberId);
    }
    return records.sort((a, b) =>
      b.date.localeCompare(a.date) || b.scheduledTime.localeCompare(a.scheduledTime)
    );
  }, [checkInRecords, selectedMemberId]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, CheckInRecord[]> = {};
    filteredRecords.forEach(r => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    return groups;
  }, [filteredRecords]);

  const handleTake = (id: string) => {
    updateCheckIn(id, 'taken');
    Taro.showToast({ title: '已标记', icon: 'success' });
  };

  const handleMiss = (id: string) => {
    updateCheckIn(id, 'missed');
    Taro.showToast({ title: '已标记', icon: 'none' });
  };

  const handleSupplement = (id: string) => {
    updateCheckIn(id, 'supplemented');
    Taro.showToast({ title: '补服已记录', icon: 'success' });
  };

  const handleGeneratePrescription = () => {
    Taro.navigateTo({ url: '/pages/prescription/index' });
  };

  const handleAddMedicine = () => {
    Taro.navigateTo({ url: '/pages/medicine-add/index' });
  };

  const getDayStats = (records: CheckInRecord[]) => {
    const taken = records.filter(r => r.status === 'taken' || r.status === 'supplemented').length;
    const missed = records.filter(r => r.status === 'missed').length;
    return `${taken}完成 · ${missed}漏服`;
  };

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>记录查询</Text>
        <Text className={styles.subtitle}>查看历史用药记录</Text>
      </View>

      <View className={styles.actionRow}>
        <Button
          className={classnames(styles.actionBtn, styles.actionBtnPrimary)}
          onClick={handleGeneratePrescription}
        >
          📋 生成用药清单
        </Button>
        <Button className={styles.actionBtn} onClick={handleAddMedicine}>
          💊 添加药品
        </Button>
      </View>

      <View className={styles.filterRow}>
        <View
          className={classnames(styles.filterItem, {
            [styles.filterItemActive]: selectedMemberId === null
          })}
          onClick={() => setSelectedMemberId(null)}
        >
          全部成员
        </View>
        {members.map(m => (
          <View
            key={m.id}
            className={classnames(styles.filterItem, {
              [styles.filterItemActive]: selectedMemberId === m.id
            })}
            onClick={() => setSelectedMemberId(m.id)}
          >
            {m.name}
          </View>
        ))}
      </View>

      {Object.keys(groupedByDate).length > 0 ? (
        Object.entries(groupedByDate).map(([date, records]) => (
          <View key={date} className={styles.dayGroup}>
            <View className={styles.dayHeader}>
              <Text className={styles.dayTitle}>{date}</Text>
              <Text className={styles.dayStats}>{getDayStats(records)}</Text>
            </View>
            <View className={styles.recordList}>
              {records.map(record => (
                <CheckInItem
                  key={record.id}
                  record={record}
                  onTake={() => handleTake(record.id)}
                  onMiss={() => handleMiss(record.id)}
                  onSupplement={() => handleSupplement(record.id)}
                />
              ))}
            </View>
          </View>
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📝</Text>
          <Text className={styles.emptyText}>暂无用药记录</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default RecordsPage;
