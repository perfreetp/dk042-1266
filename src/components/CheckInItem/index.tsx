import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import { CheckInRecord } from '@/types';
import { getStatusText } from '@/utils';
import styles from './index.module.scss';

interface CheckInItemProps {
  record: CheckInRecord;
  onTake?: () => void;
  onMiss?: () => void;
  onSupplement?: () => void;
}

const CheckInItem: React.FC<CheckInItemProps> = ({ record, onTake, onMiss, onSupplement }) => {
  const statusClassMap = {
    pending: styles.statusPending,
    taken: styles.statusTaken,
    missed: styles.statusMissed,
    supplemented: styles.statusSupplemented
  };

  return (
    <View className={styles.checkInItem}>
      <View className={styles.header}>
        <View className={styles.timeRow}>
          <Text className={styles.time}>{record.scheduledTime}</Text>
          <Text className={classnames(styles.statusTag, statusClassMap[record.status])}>
            {getStatusText(record.status)}
          </Text>
        </View>
      </View>
      <View className={styles.content}>
        <View className={styles.medicineInfo}>
          <Text className={styles.medicineName}>{record.medicineName}</Text>
          <Text className={styles.memberAndDosage}>
            {record.memberName} · {record.dosage}
          </Text>
          {record.actualTime && (
            <Text className={styles.actualTime}>实际服用: {record.actualTime}</Text>
          )}
          {record.note && (
            <Text className={styles.actualTime}>备注: {record.note}</Text>
          )}
          {record.adverseReaction && (
            <Text className={styles.actualTime}>不适反应: {record.adverseReaction}</Text>
          )}
        </View>
        {record.status === 'pending' && (
          <View className={styles.actions}>
            <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={onTake}>
              已服药
            </Button>
            <Button className={classnames(styles.btn, styles.btnDanger)} onClick={onMiss}>
              漏服
            </Button>
          </View>
        )}
        {record.status === 'missed' && (
          <View className={styles.actions}>
            <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={onSupplement}>
              补服
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

export default CheckInItem;
