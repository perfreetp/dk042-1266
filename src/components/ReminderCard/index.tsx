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
  discarded: '已处理',
  snooze: '稍后提醒',
};

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onClick, onHandle }) => {
  const showActions = !reminder.handled && onHandle;
  const isStock = reminder.type === 'stock';
  const isExpire = reminder.type === 'expire';

  const handleCardClick = () => {
    if (showActions) return;
    onClick?.();
  };

  return (
    <View
      className={classnames(
        styles.reminderCard,
        styles[reminder.level],
        { [styles.handled]: reminder.handled }
      )}
      onClick={handleCardClick}
    >
      <View className={styles.header}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text className={styles.title}>{reminder.title}</Text>
          {!reminder.read && !reminder.handled && <View className={styles.unreadDot} />}
        </View>
        <Text className={classnames(styles.levelTag, styles[`level${reminder.level.charAt(0).toUpperCase() + reminder.level.slice(1)}`])}>
          {levelTextMap[reminder.level]}
        </Text>
      </View>
      <Text className={styles.content}>{reminder.content}</Text>
      <View className={styles.footer}>
        <Text className={styles.date}>
          {reminder.date}
          {reminder.handled && reminder.handleType && (
            <Text className={styles.handleBadge}> · {handleTextMap[reminder.handleType]}✓</Text>
          )}
        </Text>
      </View>

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
