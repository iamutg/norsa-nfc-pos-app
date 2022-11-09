import React, {FC} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
} from 'react-native-responsive-dimensions';
import {Picker} from '@react-native-picker/picker';
import {Button, Header, ScreenContainer} from '~/components';
import {useAuthContext} from '~/context/AuthContext';
import {Colors} from '~/styles';
import {showAlert} from '~/utils';
import {SelectMerchantIdScreenProp} from '~/types';

export interface Props extends SelectMerchantIdScreenProp {}

const SelectMerchantId: FC<Props> = ({route, navigation: {goBack}}) => {
  const {onSelectMerchantId, loginData} = useAuthContext();

  const [merchantIdSelected, setMerchantIdSelected] = React.useState('none');
  const [loading, setLoading] = React.useState(false);

  const showBackButton = route?.params?.fromHomeScreen;

  const onPickerValueChanged = React.useCallback((merchantName: string) => {
    setMerchantIdSelected(merchantName);
  }, []);
  const onSelectMerchantPressed = async () => {
    if (merchantIdSelected === 'none') {
      showAlert('Select merchant', 'Please select a merchant');
    } else {
      onSelectMerchantId(merchantIdSelected);

      if (showBackButton) {
        goBack();
      }
    }
  };

  return (
    <ScreenContainer>
      <Header hasBackButton={showBackButton} title="Select merchant" />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.selectMerchantText}>
            Please select a merchant
          </Text>
          <Picker
            style={styles.merchantPicker}
            selectedValue={merchantIdSelected}
            onValueChange={onPickerValueChanged}>
            <Picker.Item
              label="Select merchant id"
              value="none"
              color={Colors.gray}
            />

            {loginData?.Merchant_Group?.map(mer => (
              <Picker.Item key={mer.Id} label={mer.Name} value={mer.Id} />
            ))}
          </Picker>
          <Button
            loading={loading}
            style={styles.actionButtonContainer}
            title="Select merchant"
            onPress={onSelectMerchantPressed}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    paddingTop: responsiveHeight(20),
  },
  selectMerchantText: {
    fontSize: responsiveFontSize(2.5),
    fontWeight: 'bold',
  },
  merchantPicker: {
    width: '80%',
    marginVertical: responsiveHeight(2),
  },
  actionButtonContainer: {
    width: '60%',
  },
});

export default SelectMerchantId;
