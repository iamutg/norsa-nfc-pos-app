import React from 'react';
import {Text, StyleSheet, ColorValue} from 'react-native';
import Dialog from 'react-native-dialog';
import {Colors} from '~/styles';

export interface BalanceDialogProps {
  visible: boolean;
  description: React.ReactNode | string;
  negativeButtonText: string;
  negativeButtonColor?: ColorValue;
  posititveButtonText: string;
  onNegativeButtonPress?: () => void;
  onPositiveButtonPress: () => void;
  closeDialog: () => void;
}

export function BalanceDialog({
  visible,
  description,
  negativeButtonText,
  negativeButtonColor,
  posititveButtonText,
  onNegativeButtonPress,
  onPositiveButtonPress,
  closeDialog,
}: BalanceDialogProps) {
  const onNegativeButtonPressed = () => {
    closeDialog();
    onNegativeButtonPress?.();
  };

  return (
    <Dialog.Container visible={visible}>
      <Dialog.Title>
        <Text style={styles.titleText}>Balance</Text>
      </Dialog.Title>
      <Dialog.Description style={styles.descriptionText}>
        {description}
      </Dialog.Description>
      <Dialog.Button
        label={negativeButtonText}
        color={negativeButtonColor}
        onPress={onNegativeButtonPressed}
      />
      <Dialog.Button
        label={posititveButtonText}
        onPress={onPositiveButtonPress}
      />
    </Dialog.Container>
  );
}

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  titleText: {
    color: Colors.black,
  },
  descriptionText: {
    color: Colors.red,
  },
});
