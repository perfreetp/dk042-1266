import React, { useMemo, useState } from 'react';
import { View, Text, Image, Button, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getExpireStatus, getCurrentDate } from '@/utils';
import { DosageTime } from '@/types';
import styles from './index.module.scss';

const MedicineDetailPage: React.FC = () => {
  const router = useRouter();
  const { medicines, members, deleteMedicine, updateMedicineFull } = useApp();
  const medicineId = router.params.id;

  const medicine = useMemo(
    () => medicines.find(m => m.id === medicineId),
    [medicines, medicineId]
  );

  const [editing, setEditing] = useState(false);
  const [editStock, setEditStock] = useState('');
  const [editExpireDate, setEditExpireDate] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);
  const [editReminderTimes, setEditReminderTimes] = useState<DosageTime[]>([]);
  const [editStorageLocation, setEditStorageLocation] = useState('');
  const [editOpenDate, setEditOpenDate] = useState('');

  const enterEdit = () => {
    if (!medicine) return;
    setEditStock(String(medicine.stock));
    setEditExpireDate(medicine.expireDate);
    setEditMinStock(String(medicine.minStock));
    setEditMemberIds([...medicine.memberIds]);
    setEditReminderTimes(medicine.reminderTimes.map(r => ({ ...r })));
    setEditStorageLocation(medicine.storageLocation);
    setEditOpenDate(medicine.openDate);
    setEditing(true);
  };

  const exitEdit = () => setEditing(false);

  const saveEdit = () => {
    if (!medicine) return;
    if (!editExpireDate) {
      Taro.showToast({ title: '有效期必填', icon: 'none' });
      return;
    }
    updateMedicineFull(medicine.id, {
      stock: parseInt(editStock) || 0,
      minStock: parseInt(editMinStock) || 5,
      expireDate: editExpireDate,
      memberIds: editMemberIds,
      reminderTimes: editReminderTimes,
      storageLocation: editStorageLocation,
      openDate: editOpenDate || getCurrentDate(),
    });
    Taro.showToast({ title: '保存成功', icon: 'success' });
    setEditing(false);
  };

  const usedMembers = useMemo(() => {
    if (!medicine) return [];
    const ids = editing ? editMemberIds : medicine.memberIds;
    return members.filter(m => ids.includes(m.id));
  }, [medicine, members, editing, editMemberIds]);

  const expireInfo = useMemo(() => {
    if (!medicine) return { status: 'normal', days: 0 };
    const checkDate = editing ? editExpireDate || medicine.expireDate : medicine.expireDate;
    return getExpireStatus(checkDate);
  }, [medicine, editing, editExpireDate]);

  const displayReminderTimes = editing ? editReminderTimes : (medicine?.reminderTimes || []);

  const toggleMemberEdit = (mid: string) => {
    setEditMemberIds(prev =>
      prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid]
    );
  };

  const addReminderEdit = () => {
    setEditReminderTimes(prev => [...prev, { time: '12:00', dosage: '1片' }]);
  };

  const removeReminderEdit = (idx: number) => {
    if (editReminderTimes.length <= 1) return;
    setEditReminderTimes(prev => prev.filter((_, i) => i !== idx));
  };

  const updateReminderEdit = (idx: number, field: 'time' | 'dosage', value: string) => {
    setEditReminderTimes(prev =>
      prev.map((r, i) => i === idx ? { ...r, [field]: value } : r)
    );
  };

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

  const displayStock = editing ? parseInt(editStock) || 0 : medicine.stock;
  const displayMinStock = editing ? parseInt(editMinStock) || 5 : medicine.minStock;

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
            {displayStock <= displayMinStock && (
              <Text className={styles.tag}>库存不足</Text>
            )}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>基本信息</Text>
          {editing && <Text className={styles.editHint}>编辑模式</Text>}
        </View>
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
          {editing ? (
            <Input
              className={styles.editInput}
              value={editOpenDate}
              placeholder="YYYY-MM-DD"
              onInput={e => setEditOpenDate(e.detail.value)}
            />
          ) : (
            <Text className={styles.infoValue}>{medicine.openDate}</Text>
          )}
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>有效期至</Text>
          {editing ? (
            <Input
              className={styles.editInput}
              value={editExpireDate}
              placeholder="YYYY-MM-DD"
              onInput={e => setEditExpireDate(e.detail.value)}
            />
          ) : (
            <Text className={classnames(styles.infoValue, {
              [styles.infoValueWarning]: expireInfo.status === 'expiring',
              [styles.infoValueDanger]: expireInfo.status === 'expired'
            })}>
              {medicine.expireDate}
              {expireInfo.status === 'expiring' && `（${expireInfo.days}天后到期）`}
              {expireInfo.status === 'expired' && '（已过期）'}
            </Text>
          )}
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>存放位置</Text>
          {editing ? (
            <Input
              className={styles.editInput}
              value={editStorageLocation}
              placeholder="如：客厅药箱第一层"
              onInput={e => setEditStorageLocation(e.detail.value)}
            />
          ) : (
            <Text className={styles.infoValue}>{medicine.storageLocation}</Text>
          )}
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>库存</Text>
          {editing ? (
            <View className={styles.stockEditRow}>
              <Input
                className={styles.editInputSm}
                type="number"
                value={editStock}
                onInput={e => setEditStock(e.detail.value)}
              />
              <Text className={styles.stockUnit}>片，最低</Text>
              <Input
                className={styles.editInputSm}
                type="number"
                value={editMinStock}
                onInput={e => setEditMinStock(e.detail.value)}
              />
              <Text className={styles.stockUnit}>预警</Text>
            </View>
          ) : (
            <Text className={classnames(styles.infoValue, {
              [styles.infoValueWarning]: medicine.stock <= medicine.minStock
            })}>
              {medicine.stock}（最低预警：{medicine.minStock}）
            </Text>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>适用成员</Text>
        {editing ? (
          <View className={styles.memberEditList}>
            {members.map(m => (
              <View
                key={m.id}
                className={classnames(styles.memberEditItem, {
                  [styles.memberEditItemActive]: editMemberIds.includes(m.id)
                })}
                onClick={() => toggleMemberEdit(m.id)}
              >
                {m.name}（{m.relation}）
              </View>
            ))}
            {editMemberIds.length === 0 && (
              <Text className={styles.editHintSub}>不选成员则为全家通用常备药</Text>
            )}
          </View>
        ) : (
          usedMembers.length > 0 ? (
            <View className={styles.memberList}>
              {usedMembers.map(m => (
                <Text key={m.id} className={styles.memberTag}>
                  {m.name}（{m.relation}）
                </Text>
              ))}
            </View>
          ) : (
            <Text className={styles.noMembers}>未关联成员（通用常备药）</Text>
          )
        )}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>服药提醒</Text>
          {editing && (
            <Text className={styles.addBtn} onClick={addReminderEdit}>+ 添加</Text>
          )}
        </View>
        {displayReminderTimes.length > 0 ? (
          <View className={styles.timeList}>
            {displayReminderTimes.map((t, i) => (
              <View key={i} className={styles.timeItem}>
                {editing ? (
                  <>
                    <Input
                      className={styles.timeInput}
                      value={t.time}
                      placeholder="HH:MM"
                      onInput={e => updateReminderEdit(i, 'time', e.detail.value)}
                    />
                    <Input
                      className={styles.dosageInput}
                      value={t.dosage}
                      placeholder="剂量"
                      onInput={e => updateReminderEdit(i, 'dosage', e.detail.value)}
                    />
                    {displayReminderTimes.length > 1 && (
                      <Text
                        className={styles.removeBtn}
                        onClick={() => removeReminderEdit(i)}
                      >
                        删除
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text className={styles.time}>{t.time}</Text>
                    <Text className={styles.dosage}>{t.dosage}</Text>
                  </>
                )}
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
        {editing ? (
          <>
            <Button className={classnames(styles.actionBtn, styles.btnSecondary)} onClick={exitEdit}>
              取消
            </Button>
            <Button className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={saveEdit}>
              保存
            </Button>
          </>
        ) : (
          <>
            <Button className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={enterEdit}>
              编辑
            </Button>
            <Button className={classnames(styles.actionBtn, styles.btnDanger)} onClick={handleDelete}>
              删除
            </Button>
          </>
        )}
      </View>
    </View>
  );
};

export default MedicineDetailPage;
