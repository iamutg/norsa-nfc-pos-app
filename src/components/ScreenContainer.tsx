import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle, StatusBar} from 'react-native';
import {Colors} from '~/styles';

export interface ScreenContainerProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function ScreenContainer({style, children}: ScreenContainerProps) {
  return (
    <View style={[styles.f1, styles.container, style]}>
      <StatusBar backgroundColor={Colors.accent} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.white,
  },
});
