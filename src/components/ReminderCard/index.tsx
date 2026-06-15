import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { ReminderItem } from '@/types';
import styles from './index.module.scss';

interface ReminderCardProps {
  reminder: ReminderItem;
  onClick?: () => void;
}

const levelTextMap = {
  warning: '注意',
  danger: '紧急',
  info: '提示'
};

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onClick }) => {
  return (
    <View
      className={classnames(styles.reminderCard, styles[reminder.level])}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Text className={styles.title}>{reminder.title}</Text>
          {!reminder.read && <View className={styles.unreadDot} />}
        </View>
        <Text className={classnames(styles.levelTag, styles[`level${reminder.level.charAt(0).toUpperCase() + reminder.level.slice(1)}`])}>
          {levelTextMap[reminder.level]}
        </Text>
      </View>
      <Text className={styles.content}>{reminder.content}</Text>
      <Text className={styles.date}>{reminder.date}</Text>
    </View>
  );
};

export default ReminderCard;
