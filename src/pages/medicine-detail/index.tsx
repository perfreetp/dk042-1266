import React, { useMemo } from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getExpireStatus } from '@/utils';
import styles from './index.module.scss';

const MedicineDetailPage: React.FC = () => {
  const router = useRouter();
  const { medicines, members, deleteMedicine } = useApp();
  const medicineId = router.params.id;

  const medicine = useMemo(
    () => medicines.find(m => m.id === medicineId),
    [medicines, medicineId]
  );

  const usedMembers = useMemo(() => {
    if (!medicine) return [];
    return members.filter(m => medicine.memberIds.includes(m.id));
  }, [medicine, members]);

  const expireInfo = useMemo(() => {
    if (!medicine) return { status: 'normal', days: 0 };
    return getExpireStatus(medicine.expireDate);
  }, [medicine]);

  const handleDelete = () => {
    if (!medicine) return;
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除「${medicine.name}」吗？`,
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          deleteMedicine(medicine.id);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 1000);
        }
      }
    });
  };

  if (!medicine) {
    return (
      <View className={styles.container}>
        <Text style={{ color: '#86909C' }}>药品不存在</Text>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      <View className={styles.headerCard}>
        <Image
          className={styles.image}
          src={medicine.image || 'https://picsum.photos/id/1/160/160'}
          mode="aspectFill"
        />
        <View className={styles.info}>
          <Text className={styles.name}>{medicine.name}</Text>
          <Text className={styles.meta}>
            {medicine.dosage} · {medicine.form}
            {medicine.genericName ? ` · ${medicine.genericName}` : ''}
          </Text>
          <View className={styles.tags}>
            {medicine.isCommon && <Text className={styles.tag}>常备药</Text>}
            {expireInfo.status === 'expiring' && (
              <Text className={styles.tag}>
                {expireInfo.days}天后到期
              </Text>
            )}
            {expireInfo.status === 'expired' && (
              <Text className={styles.tag}>已过期</Text>
            )}
            {medicine.stock <= medicine.minStock && (
              <Text className={styles.tag}>库存不足</Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>基本信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>规格/剂量</Text>
          <Text className={styles.infoValue}>{medicine.dosage}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>剂型</Text>
          <Text className={styles.infoValue}>{medicine.form}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>开封日期</Text>
          <Text className={styles.infoValue}>{medicine.openDate}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>有效期至</Text>
          <Text className={classnames(styles.infoValue, {
            [styles.infoValueWarning]: expireInfo.status === 'expiring',
            [styles.infoValueDanger]: expireInfo.status === 'expired'
          })}>
            {medicine.expireDate}
            {expireInfo.status === 'expiring' && `（${expireInfo.days}天后到期）`}
            {expireInfo.status === 'expired' && '（已过期）'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>存放位置</Text>
          <Text className={styles.infoValue}>{medicine.storageLocation}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>库存</Text>
          <Text className={classnames(styles.infoValue, {
            [styles.infoValueWarning]: medicine.stock <= medicine.minStock
          })}>
            {medicine.stock}（最低预警：{medicine.minStock}）
          </Text>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>适用成员</Text>
        {usedMembers.length > 0 ? (
          <View className={styles.memberList}>
            {usedMembers.map(m => (
              <Text key={m.id} className={styles.memberTag}>
                {m.name}（{m.relation}）
              </Text>
            ))}
          </View>
        ) : (
          <Text className={styles.noMembers}>未关联成员（通用常备药）</Text>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>服药提醒</Text>
        {medicine.reminderTimes.length > 0 ? (
          <View className={styles.timeList}>
            {medicine.reminderTimes.map((t, i) => (
              <View key={i} className={styles.timeItem}>
                <Text className={styles.time}>{t.time}</Text>
                <Text className={styles.dosage}>{t.dosage}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className={styles.noTimes}>未设置提醒（按需使用）</Text>
        )}
      </View>

      {(medicine.instruction || medicine.sideEffect) && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>用药说明</Text>
          {medicine.instruction && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>用法说明</Text>
              <Text className={styles.infoValue}>{medicine.instruction}</Text>
            </View>
          )}
          {medicine.sideEffect && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>不良反应</Text>
              <Text className={classnames(styles.infoValue, styles.infoValueWarning)}>
                {medicine.sideEffect}
              </Text>
            </View>
          )}
        </View>
      )}

      <View className={styles.actionRow}>
        <Button className={classnames(styles.actionBtn, styles.btnSecondary)}>
          编辑
        </Button>
        <Button className={classnames(styles.actionBtn, styles.btnDanger)} onClick={handleDelete}>
          删除
        </Button>
      </View>
    </View>
  );
};

export default MedicineDetailPage;
