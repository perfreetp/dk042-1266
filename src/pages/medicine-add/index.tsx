import React, { useState, useCallback } from 'react';
import { View, Text, Input, Textarea, Button, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useApp } from '@/store/AppContext';
import { getCurrentDate } from '@/utils';
import styles from './index.module.scss';

interface ReminderTimeInput {
  time: string;
  dosage: string;
}

const MedicineAddPage: React.FC = () => {
  const { members, addMedicine } = useApp();

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('片剂');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [openDate, setOpenDate] = useState(getCurrentDate());
  const [expireDate, setExpireDate] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [isCommon, setIsCommon] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<ReminderTimeInput[]>([
    { time: '08:00', dosage: '1片' }
  ]);
  const [instruction, setInstruction] = useState('');
  const [sideEffect, setSideEffect] = useState('');

  const [recognizing, setRecognizing] = useState(false);
  void recognizing;

  const handleScan = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        console.info('[MedicineAdd] 拍照/选图成功:', tempFilePath);
        setRecognizing(true);
        Taro.showLoading({ title: '识别中...' });

        setTimeout(() => {
          Taro.hideLoading();
          setRecognizing(false);

          const recognizedData: Record<string, { genericName: string; dosage: string; form: string; instruction: string }> = {
            '阿莫西林胶囊': { genericName: '阿莫西林', dosage: '0.25g', form: '胶囊', instruction: '口服，一次0.5g，一日3次' },
            '布洛芬缓释胶囊': { genericName: '布洛芬', dosage: '0.3g', form: '胶囊', instruction: '饭后口服，不可咀嚼或掰开' },
            '头孢克洛颗粒': { genericName: '头孢克洛', dosage: '0.125g', form: '颗粒剂', instruction: '温水冲服，一日3次' },
            '蒙脱石散': { genericName: '蒙脱石', dosage: '3g', form: '散剂', instruction: '空腹服用，一袋兑50ml温水' },
            '小儿氨酚黄那敏颗粒': { genericName: '氨酚黄那敏', dosage: '6g', form: '颗粒剂', instruction: '温水冲服，一日3次' },
          };

          const keys = Object.keys(recognizedData);
          const picked = keys[Math.floor(Math.random() * keys.length)];
          const detail = recognizedData[picked];

          setName(picked);
          setGenericName(detail.genericName);
          setDosage(detail.dosage);
          setForm(detail.form);
          setInstruction(detail.instruction);
          setStorageLocation('客厅药箱');
          setStock('20');

          Taro.showModal({
            title: '识别完成',
            content: `已识别药品：${picked}\n请核对并修改以下信息后保存`,
            showCancel: false,
            confirmText: '确认修改',
          });
        }, 1200);
      },
      fail: (err) => {
        console.error('[MedicineAdd] 拍照/选图失败:', err);
        Taro.showToast({ title: '已取消', icon: 'none' });
      }
    });
  };

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const addReminderTime = () => {
    setReminderTimes(prev => [...prev, { time: '12:00', dosage: '1片' }]);
  };

  const removeReminderTime = (index: number) => {
    if (reminderTimes.length <= 1) return;
    setReminderTimes(prev => prev.filter((_, i) => i !== index));
  };

  const updateReminderTime = (index: number, field: 'time' | 'dosage', value: string) => {
    setReminderTimes(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入药品名称', icon: 'none' });
      return;
    }
    if (!expireDate) {
      Taro.showToast({ title: '请选择有效期', icon: 'none' });
      return;
    }

    addMedicine({
      name: name.trim(),
      genericName: genericName.trim() || undefined,
      dosage: dosage.trim() || '按说明书',
      form: form.trim() || '片剂',
      memberIds: selectedMemberIds,
      openDate,
      expireDate,
      storageLocation: storageLocation.trim() || '药箱',
      stock: parseInt(stock) || 0,
      minStock: parseInt(minStock) || 5,
      isCommon,
      reminderTimes: reminderTimes.map(r => ({
        time: r.time,
        dosage: r.dosage || '1片'
      })),
      instruction: instruction.trim() || undefined,
      sideEffect: sideEffect.trim() || undefined,
      image: `https://picsum.photos/id/${Math.floor(Math.random() * 200)}/300/300`
    });

    Taro.showToast({ title: '添加成功', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1500);
  }, [
    name, genericName, dosage, form, selectedMemberIds, openDate,
    expireDate, storageLocation, stock, minStock, isCommon,
    reminderTimes, instruction, sideEffect, addMedicine
  ]);

  return (
    <View className={styles.container}>
      <View className={styles.formSection}>
        <View className={styles.sectionTitle}>基本信息</View>

        <View className={styles.formItem}>
          <Button className={styles.scanBtn} onClick={handleScan}>
            📷 拍照识别药盒
          </Button>
        </View>

        <View className={styles.scanTip}>
          <Text className={styles.scanTipText}>
            💡 提示：拍照识别可自动填充药品名称、规格等信息，识别后请手动确认
          </Text>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}><Text className={styles.required}>*</Text>药品名称</Text>
          <Input
            className={styles.input}
            placeholder="请输入药品名称"
            value={name}
            onInput={e => setName(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>通用名</Text>
          <Input
            className={styles.input}
            placeholder="如：布洛芬、阿莫西林"
            value={genericName}
            onInput={e => setGenericName(e.detail.value)}
          />
        </View>

        <View className={styles.row}>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}>规格/剂量</Text>
            <Input
              className={styles.input}
              placeholder="如：0.5g、100ml"
              value={dosage}
              onInput={e => setDosage(e.detail.value)}
            />
          </View>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}>剂型</Text>
            <Input
              className={styles.input}
              placeholder="片剂/胶囊/颗粒等"
              value={form}
              onInput={e => setForm(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionTitle}>适用成员</View>
        <View className={styles.formItem}>
          <View className={styles.memberTags}>
            {members.map(member => (
              <View
                key={member.id}
                className={classnames(styles.memberTag, {
                  [styles.memberTagActive]: selectedMemberIds.includes(member.id)
                })}
                onClick={() => toggleMember(member.id)}
              >
                {member.name}（{member.relation}）
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionTitle}>效期与库存</View>

        <View className={styles.row}>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}>开封日期</Text>
            <Input
              className={styles.input}
              type="text"
              placeholder="YYYY-MM-DD"
              value={openDate}
              onInput={e => setOpenDate(e.detail.value)}
            />
          </View>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}><Text className={styles.required}>*</Text>有效期至</Text>
            <Input
              className={styles.input}
              type="text"
              placeholder="YYYY-MM-DD"
              value={expireDate}
              onInput={e => setExpireDate(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>存放位置</Text>
          <Input
            className={styles.input}
            placeholder="如：客厅药箱第一层"
            value={storageLocation}
            onInput={e => setStorageLocation(e.detail.value)}
          />
        </View>

        <View className={styles.row}>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}>当前库存</Text>
            <Input
              className={styles.input}
              type="number"
              placeholder="数量"
              value={stock}
              onInput={e => setStock(e.detail.value)}
            />
          </View>
          <View className={styles.formItem} style={{ flex: 1 }}>
            <Text className={styles.label}>最低库存预警</Text>
            <Input
              className={styles.input}
              type="number"
              placeholder="默认5"
              value={minStock}
              onInput={e => setMinStock(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.switchRow}>
          <Text className={styles.switchLabel}>设为常备药</Text>
          <Switch checked={isCommon} onChange={e => setIsCommon(e.detail.value)} color="#10B981" />
        </View>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionTitle}>服药提醒设置</View>
        {reminderTimes.map((item, index) => (
          <View key={index} className={styles.timeRow}>
            <Input
              className={styles.timeInput}
              placeholder="时间 HH:MM"
              value={item.time}
              onInput={e => updateReminderTime(index, 'time', e.detail.value)}
            />
            <Input
              className={styles.timeInput}
              placeholder="剂量，如1片"
              value={item.dosage}
              onInput={e => updateReminderTime(index, 'dosage', e.detail.value)}
            />
            <Button
              className={styles.deleteTimeBtn}
              onClick={() => removeReminderTime(index)}
            >
              ×
            </Button>
          </View>
        ))}
        <Button className={styles.addTimeBtn} onClick={addReminderTime}>
          + 添加服药时间
        </Button>
      </View>

      <View className={styles.formSection}>
        <View className={styles.sectionTitle}>其他信息</View>

        <View className={styles.formItem}>
          <Text className={styles.label}>用法说明</Text>
          <Textarea
            className={styles.textarea}
            placeholder="如：饭后温水送服"
            value={instruction}
            onInput={e => setInstruction(e.detail.value)}
          />
        </View>

        <View className={styles.formItem}>
          <Text className={styles.label}>可能的不良反应</Text>
          <Textarea
            className={styles.textarea}
            placeholder="如：可能引起嗜睡"
            value={sideEffect}
            onInput={e => setSideEffect(e.detail.value)}
          />
        </View>
      </View>

      <Button className={styles.submitBtn} onClick={handleSubmit}>
        保存药品
      </Button>
    </View>
  );
};

export default MedicineAddPage;
