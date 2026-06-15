import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getCurrentDate } from '@/utils';
import { CalendarDayStat } from '@/types';
import styles from './index.module.scss';

type ViewMode = 'week' | 'month';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const STATUS_COLOR_MAP: Record<string, string> = {
  taken: 'dotSuccess',
  supplemented: 'dotInfo',
  missed: 'dotDanger',
  pending: 'dotWarning',
};

const CalendarPage: React.FC = () => {
  const {
    members, checkInRecords, operator, setOperator,
    getDayDetail, getCalendarStats
  } = useApp();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [baseDate, setBaseDate] = useState(getCurrentDate());
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);

  const weekStart = useMemo(() => {
    const d = new Date(baseDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d.toISOString().split('T')[0];
  }, [baseDate]);

  const weekStats = useMemo(
    () => getCalendarStats(weekStart, 7),
    [getCalendarStats, weekStart]
  );

  const monthYear = useMemo(() => {
    const d = new Date(baseDate);
    return `${d.getFullYear()}年${d.getMonth() + 1}月`;
  }, [baseDate]);

  const monthDays = useMemo(() => {
    const d = new Date(baseDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const result: Array<{ date: string; display: number; inMonth: boolean }> = [];

    for (let i = firstWeekday - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const dt = new Date(year, month - 1, day);
      result.push({
        date: dt.toISOString().split('T')[0],
        display: day,
        inMonth: false
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dt = new Date(year, month, i);
      result.push({
        date: dt.toISOString().split('T')[0],
        display: i,
        inMonth: true
      });
    }

    while (result.length % 7 !== 0) {
      const nextIdx = result.length - (firstWeekday + daysInMonth) + 1;
      const dt = new Date(year, month + 1, nextIdx);
      result.push({
        date: dt.toISOString().split('T')[0],
        display: nextIdx,
        inMonth: false
      });
    }

    return result;
  }, [baseDate]);

  const allMonthStats = useMemo(() => {
    const allDates = monthDays.map(d => d.date).filter(Boolean);
    const uniqueDates = [...new Set(allDates)];
    const start = uniqueDates[0];
    const days = uniqueDates.length;
    return getCalendarStats(start, days);
  }, [getCalendarStats, monthDays]);

  const dayDetail = useMemo(
    () => getDayDetail(selectedDate),
    [getDayDetail, selectedDate]
  );

  const getStatusDots = (stat: CalendarDayStat | undefined, size: 'small' | 'normal' = 'normal') => {
    if (!stat || stat.total === 0) return null;
    const dots: React.ReactNode[] = [];
    if (stat.taken > 0) dots.push(<View key="t" className={classnames(size === 'small' ? styles.monthDot : styles.dot, styles.dotSuccess)} />);
    if (stat.supplemented > 0) dots.push(<View key="s" className={classnames(size === 'small' ? styles.monthDot : styles.dot, styles.dotInfo)} />);
    if (stat.missed > 0) dots.push(<View key="m" className={classnames(size === 'small' ? styles.monthDot : styles.dot, styles.dotDanger)} />);
    if (stat.pending > 0) dots.push(<View key="p" className={classnames(size === 'small' ? styles.monthDot : styles.dot, styles.dotWarning)} />);
    return dots.slice(0, 4);
  };

  const navigateWeek = useCallback((delta: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + delta * 7);
    setBaseDate(d.toISOString().split('T')[0]);
  }, [baseDate]);

  const navigateMonth = useCallback((delta: number) => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + delta);
    setBaseDate(d.toISOString().split('T')[0]);
  }, [baseDate]);

  const switchOperator = () => {
    const memberOptions = members.map(m => `${m.name}（${m.relation}）`);
    Taro.showActionSheet({
      itemList: memberOptions,
      success: (res) => {
        const member = members[res.tapIndex];
        setOperator(member);
        Taro.showToast({ title: `当前操作人：${member.name}`, icon: 'none' });
      }
    });
  };

  const today = getCurrentDate();
  const selectedDayName = WEEKDAY_NAMES[new Date(selectedDate).getDay()];
  const selectedIsToday = selectedDate === today;

  return (
    <ScrollView className={styles.container} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>家庭日历</Text>
        <View className={styles.operatorRow}>
          <Text className={styles.operatorName}>操作人：{operator.name}</Text>
          <Text className={styles.operatorSwitch} onClick={switchOperator}>切换</Text>
        </View>
      </View>

      <View className={styles.viewSwitch}>
        <View
          className={classnames(styles.viewTab, { [styles.viewTabActive]: viewMode === 'week' })}
          onClick={() => setViewMode('week')}
        >
          📅 周视图
        </View>
        <View
          className={classnames(styles.viewTab, { [styles.viewTabActive]: viewMode === 'month' })}
          onClick={() => setViewMode('month')}
        >
          📆 月视图
        </View>
      </View>

      {viewMode === 'week' && (
        <>
          <View className={styles.weekNav}>
            <View className={styles.weekNavBtn} onClick={() => navigateWeek(-1)}>‹</View>
            <Text className={styles.weekTitle}>
              {weekStart} ~ {(() => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + 6);
                return d.toISOString().split('T')[0];
              })()}
            </Text>
            <View className={styles.weekNavBtn} onClick={() => navigateWeek(1)}>›</View>
          </View>

          <View className={styles.weekDays}>
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + i);
              const dateStr = d.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === today;
              const stat = weekStats[dateStr];
              return (
                <View
                  key={i}
                  className={classnames(styles.weekDay, {
                    [styles.weekDayActive]: isSelected,
                    [styles.weekDayToday]: isToday
                  })}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <Text className={styles.weekDayName}>{WEEKDAY_NAMES[i]}</Text>
                  <Text className={styles.weekDayDate}>{d.getDate()}</Text>
                  <View className={styles.weekDayDots}>
                    {getStatusDots(stat)}
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {viewMode === 'month' && (
        <View className={styles.monthCalendar}>
          <View className={styles.monthHeader}>
            <View className={styles.weekNavBtn} onClick={() => navigateMonth(-1)}>‹</View>
            <Text className={styles.monthTitle}>{monthYear}</Text>
            <View className={styles.weekNavBtn} onClick={() => navigateMonth(1)}>›</View>
          </View>

          <View className={styles.monthWeekLabels}>
            {WEEKDAY_NAMES.map(name => (
              <Text key={name} className={styles.monthWeekLabel}>{name}</Text>
            ))}
          </View>

          <View className={styles.monthDays}>
            {monthDays.map((d, i) => {
              const stat = allMonthStats[d.date];
              const isSelected = d.date === selectedDate;
              const isToday = d.date === today;
              return (
                <View
                  key={i}
                  className={classnames(styles.monthDay, {
                    [styles.monthDayActive]: isSelected,
                    [styles.monthDayToday]: isToday,
                    [styles.monthDayOther]: !d.inMonth
                  })}
                  onClick={() => {
                    setSelectedDate(d.date);
                    if (!d.inMonth) setBaseDate(d.date);
                  }}
                >
                  <Text className={styles.monthDayDate}>{d.display}</Text>
                  <View className={styles.monthDayDots}>
                    {getStatusDots(stat, 'small')}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View className={styles.dayDetail}>
        <View className={styles.dayDetailHeader}>
          <Text className={styles.dayDetailTitle}>
            {selectedDate} 周{selectedDayName}
            {selectedIsToday && '（今天）'}
          </Text>
          <View className={styles.dayDetailStats}>
            <Text className={classnames(styles.statBadge, 'success')}>已服{dayDetail.stats.taken + dayDetail.stats.supplemented}</Text>
            {dayDetail.stats.missed > 0 && (
              <Text className={classnames(styles.statBadge, 'danger')}>漏服{dayDetail.stats.missed}</Text>
            )}
            {dayDetail.stats.pending > 0 && (
              <Text className={classnames(styles.statBadge, 'warning')}>待服{dayDetail.stats.pending}</Text>
            )}
          </View>
        </View>

        {dayDetail.records.length === 0 ? (
          <View className={styles.emptyDay}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text>这一天没有服药计划</Text>
          </View>
        ) : (
          Object.keys(dayDetail.memberGroups).map(memberKey => {
            const groupRecords = dayDetail.memberGroups[memberKey];
            const memberId = memberKey === '__all__' ? '' : memberKey;
            const member = memberId ? members.find(m => m.id === memberId) : null;
            const groupName = member ? `${member.name}（${member.relation}）` : '全家通用';
            const groupAvatar = member ? member.name.charAt(0) : '👨‍👩‍👧';
            return (
              <View key={memberKey} className={styles.memberGroup}>
                <View className={styles.memberGroupHeader}>
                  <Text className={styles.memberGroupAvatar}>{groupAvatar}</Text>
                  <Text className={styles.memberGroupName}>{groupName}</Text>
                  <Text className={styles.memberGroupCount}>
                    共 {groupRecords.length} 项
                  </Text>
                </View>
                {groupRecords.map(record => (
                  <View key={record.id} className={styles.recordRow}>
                    <Text className={styles.recordTime}>{record.scheduledTime}</Text>
                    <View className={styles.recordInfo}>
                      <Text className={styles.recordMedicine}>{record.medicineName}</Text>
                      <Text className={styles.recordDosage}>{record.dosage}</Text>
                      {record.operatorName && (
                        <Text className={styles.recordOperator}>
                          {record.operatedAt} · {record.operatorName}操作
                        </Text>
                      )}
                    </View>
                    <Text className={classnames(styles.recordStatus, styles[record.status])}>
                      {record.status === 'taken' && '✓ 已服'}
                      {record.status === 'missed' && '✗ 漏服'}
                      {record.status === 'supplemented' && '↺ 补服'}
                      {record.status === 'pending' && '○ 待服'}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

export default CalendarPage;
