import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { ReminderItem, ReminderHandleType } from '@/types';
import styles from './index.module.scss';

interface ReminderCardProps {
  reminder: ReminderItem;
  onClick?: () => void;
  onHandle?: (type: ReminderHandleType) => void;
}

const levelTextMap = {
  warning: '注意',
  danger: '紧急',
  info: '提示'
};

const handleTextMap: Record<ReminderHandleType, string> = {
  restocked: '已补货',
  discarded: '已丢弃',
  snooze: '延后提醒',
};

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onClick, onHandle }) => {
  const isSnoozed = !!reminder.snoozedUntil && !reminder.handled;
  const isHandled = !!reminder.handled;
  const showActions = !isHandled && !isSnoozed && onHandle;
  const isStock = reminder.type === 'stock';
  const isExpire = reminder.type === 'expire';

  const handleCardClick = () => {
    if (showActions) return;
    onClick?.();
  };

  const getStatusBadge = () => {
    if (isHandled && reminder.handleType) {
      return {
        text: handleTextMap[reminder.handleType] + '✓',
        class: styles.statusDone,
      };
    }
    if (isSnoozed) {
      return {
        text: `⏰ 延后中 (${reminder.snoozedUntil})`,
        class: styles.statusSnoozed,
      };
    }
    if (reminder.snoozeCount && reminder.snoozeCount > 0 && !isSnoozed) {
      return {
        text: `🔔 第${reminder.snoozeCount + 1}次提醒`,
        class: styles.statusRepeated,
      };
    }
    return null;
  };

  const statusBadge = getStatusBadge();

  return (
    <View
      className={classnames(
        styles.reminderCard,
        styles[reminder.level],
        {
          [styles.handled]: isHandled,
          [styles.snoozed]: isSnoozed,
        }
      )}
      onClick={handleCardClick}
    >
      <View className={styles.header}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text className={styles.title}>{reminder.title}</Text>
          {!reminder.read && !isHandled && !isSnoozed && <View className={styles.unreadDot} />}
        </View>
        <Text className={classnames(styles.levelTag, styles[`level${reminder.level.charAt(0).toUpperCase() + reminder.level.slice(1)}`])}>
          {levelTextMap[reminder.level]}
        </Text>
      </View>
      <Text className={styles.content}>{reminder.content}</Text>

      {statusBadge && (
        <View className={styles.statusRow}>
          <Text className={classnames(styles.statusBadge, statusBadge.class)}>
            {statusBadge.text}
          </Text>
        </View>
      )}

      <View className={styles.footer}>
        <Text className={styles.date}>
          {reminder.originalDate ? `首次：${reminder.originalDate}，当前：${reminder.date}` : reminder.date}
        </Text>
      </View>

      {(reminder.operatorName || isHandled) && (
        <View className={styles.operatorRow}>
          {reminder.operatorName && (
            <Text className={styles.operator}>
              👤 {reminder.operatorName} · {reminder.handledAt || reminder.date}
            </Text>
          )}
        </View>
      )}

      {showActions && (
        <View className={styles.actionRow}>
          {isStock && (
            <View
              className={classnames(styles.actionBtn, styles.actionSuccess)}
              onClick={() => onHandle?.('restocked')}
            >
              已补货
            </View>
          )}
          {isExpire && (
            <View
              className={classnames(styles.actionBtn, styles.actionDanger)}
              onClick={() => onHandle?.('discarded')}
            >
              丢弃处理
            </View>
          )}
          <View
            className={classnames(styles.actionBtn, styles.actionSecondary)}
            onClick={() => onHandle?.('snooze')}
          >
            3天后再提醒
          </View>
        </View>
      )}
    </View>
  );
};

export default ReminderCard;
