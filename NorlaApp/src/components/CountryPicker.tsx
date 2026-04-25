import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal,
  StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../lib/theme';
import { COUNTRY_CODES, type CountryCode } from '../lib/country-codes';

interface Props {
  visible: boolean;
  selected: CountryCode;
  onSelect: (country: CountryCode) => void;
  onClose: () => void;
}

export function CountryPicker({ visible, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.toLowerCase().trim();
    return COUNTRY_CODES.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.dial.includes(q) ||
           c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (country: CountryCode) => {
    onSelect(country);
    setSearch('');
    onClose();
  };

  const renderItem = ({ item }: { item: CountryCode }) => {
    const isSelected = item.code === selected.code && item.name === selected.name;
    return (
      <TouchableOpacity
        style={[s.row, isSelected && s.rowSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.6}
      >
        <Text style={[s.code, isSelected && s.codeSelected]}>{item.code}</Text>
        <Text style={[s.name, isSelected && s.nameSelected]} numberOfLines={1}>{item.name}</Text>
        <Text style={[s.dial, isSelected && s.dialSelected]}>{item.dial}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.safe} edges={['top']}>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Select Country</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={s.closeBtn}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchWrap}>
            <TextInput
              style={s.searchInput}
              placeholder="Search country or code..."
              placeholderTextColor={COLORS.textQuaternary}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={(item, index) => `${item.code}-${item.name}-${index}`}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>No countries found</Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={s.separator} />}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.xxl, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.hairline,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, letterSpacing: -0.3 },
  closeBtn: { fontSize: 16, fontWeight: '600', color: COLORS.text },

  searchWrap: { paddingHorizontal: SPACING.xxl, paddingVertical: 12 },
  searchInput: {
    height: 44, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 16, fontSize: 15, color: COLORS.text,
  },

  listContent: { paddingBottom: 40 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.xxl, paddingVertical: 14,
  },
  rowSelected: { backgroundColor: COLORS.bgSecondary },

  code: { fontSize: 13, fontWeight: '600', color: COLORS.textTertiary, width: 32 },
  codeSelected: { color: COLORS.text },
  name: { flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '400', marginLeft: 8 },
  nameSelected: { fontWeight: '600' },
  dial: { fontSize: 15, color: COLORS.textTertiary, fontWeight: '500', marginLeft: 8 },
  dialSelected: { color: COLORS.text },

  separator: { height: 1, backgroundColor: COLORS.hairline, marginLeft: SPACING.xxl },

  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.textTertiary },
});
