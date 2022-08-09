import React, {FC} from 'react';
import {View, Text, StyleSheet, Modal} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {Colors} from '~/styles';

export interface Props {
  visible: boolean;
  title: string;
  closeModal: () => void;
  message: string;
  leftButtonText: string;
  leftButtonTextColor: string;
  onLeftButtonPress: () => void;
  rightButtonText: string;
  rightButtonTextColor: string;
  onRightButtonPress: () => void;
}

const AlertModal: FC<Props> = ({
  visible,
  closeModal,
  title,
  message,
  leftButtonText,
  leftButtonTextColor,
  onLeftButtonPress,
  rightButtonText,
  rightButtonTextColor,
  onRightButtonPress,
}) => {
  return (
    <Modal visible={visible} transparent>
      <View style={styles.container}>
        <View style={styles.dialog}>
          <Text style={styles.titleText}>Title</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  modal: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.modalBackdrop,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: Colors.white,
    minHeight: responsiveHeight(20),
    width: responsiveWidth(90),
    padding: responsiveFontSize(1),
  },
  titleText: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: responsiveFontSize(2.5),
  },
});

export default AlertModal;
