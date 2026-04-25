import React, { useState, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, FlatList, Dimensions,
  StyleSheet, Platform, StatusBar,
} from 'react-native';
import { RADIUS } from '../../lib/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { id: '1', image: require('../../../assets/intro-slide-1.png') },
  { id: '2', image: require('../../../assets/intro-slide-2.png') },
  { id: '3', image: require('../../../assets/intro-slide-3.png') },
  { id: '4', image: require('../../../assets/intro-slide-4.png') },
];

type Props = NativeStackScreenProps<AuthStackParamList, 'Intro'>;

/** Navigation-based intro slider — shown as first screen in AuthStack */
export function IntroSliderScreen({ navigation }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const goToLogin = () => {
    navigation.replace('Phone');
  };

  const handleNext = () => {
    if (activeIndex === SLIDES.length - 1) {
      goToLogin();
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={s.skipBtn} onPress={goToLogin} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={s.slide}>
            <Image source={item.image} style={s.slideImage} resizeMode="cover" />
          </View>
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom section */}
      <View style={s.bottomSection}>
        {/* Dot indicators */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === activeIndex ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.8}>
          <Text style={s.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    right: 20, zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 },

  slide: { width, height },
  slideImage: { width: '100%', height: '100%' },

  bottomSection: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: Platform.OS === 'ios' ? 50 : 36,
    paddingHorizontal: 24, paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { borderRadius: 4, height: 6 },
  dotActive: { width: 24, backgroundColor: '#FFFFFF' },
  dotInactive: { width: 6, backgroundColor: 'rgba(255,255,255,0.3)' },

  nextBtn: {
    height: 52, borderRadius: RADIUS.md,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  nextText: { fontSize: 16, fontWeight: '700', color: '#000000', letterSpacing: 0.2 },
});
