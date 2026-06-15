import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  value: number | string;
  label: string;
  variant?: 'default' | 'warning' | 'danger' | 'info';
}

const StatCard: React.FC<StatCardProps> = ({ value, label, variant = 'default' }) => {
  return (
    <View className={classnames(styles.statCard, {
      [styles.warning]: variant === 'warning',
      [styles.danger]: variant === 'danger',
      [styles.info]: variant === 'info'
    })}>
      <Text className={styles.value}>{value}</Text>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default StatCard;
