import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import classnames from 'classnames';
import { Medicine } from '@/types';
import { getExpireStatus } from '@/utils';
import styles from './index.module.scss';

interface MedicineCardProps {
  medicine: Medicine;
  onClick?: () => void;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onClick }) => {
  const expireInfo = getExpireStatus(medicine.expireDate);
  const isLowStock = medicine.stock <= medicine.minStock;

  return (
    <View className={styles.medicineCard} onClick={onClick}>
      <Image
        className={styles.image}
        src={medicine.image || 'https://picsum.photos/id/1/120/120'}
        mode="aspectFill"
      />
      <View className={styles.info}>
        <Text className={styles.name}>{medicine.name}</Text>
        <View className={styles.meta}>
          <Text className={styles.metaItem}>{medicine.dosage} · {medicine.form}</Text>
        </View>
        <View className={styles.meta}>
          <Text className={styles.metaItem}>库存: {medicine.stock}</Text>
          <Text className={styles.metaItem}>存放: {medicine.storageLocation}</Text>
        </View>
        <View className={styles.tags}>
          {medicine.isCommon && <Text className={styles.tag}>常备药</Text>}
          {isLowStock && <Text className={classnames(styles.tag, styles.tagWarning)}>库存不足</Text>}
          {expireInfo.status === 'expiring' && (
            <Text className={classnames(styles.tag, styles.tagWarning)}>
              {expireInfo.days}天后到期
            </Text>
          )}
          {expireInfo.status === 'expired' && (
            <Text className={classnames(styles.tag, styles.tagDanger)}>已过期</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default MedicineCard;
