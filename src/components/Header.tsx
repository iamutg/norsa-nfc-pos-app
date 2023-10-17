import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {useNavigation} from '@react-navigation/native';
import {HomeScreenNavProp, RouteName} from '~/navigation';
import {Colors} from '~/styles';
import {showAlertWithTwoButtons, noop} from '~/utils';
import {Icons} from './index';
import {useGlobalStore} from '~/state';
import {LocalStorageService} from '~/core/LocalStorageService';

export interface HeaderProps {
  style?: StyleProp<ViewStyle>;
  hasBackButton?: boolean;
  hasLogoutButton?: boolean;
  hasSettingsButton?: boolean;
  title: string;
}

export function Header({
  style,
  hasBackButton,
  title,
  hasLogoutButton,
  hasSettingsButton,
}: HeaderProps) {
  const {setLoggedIn, setLoginData} = useGlobalStore();

  const navigation = useNavigation<HomeScreenNavProp>();

  const onLogoutPressed = () =>
    showAlertWithTwoButtons(
      'Logout',
      'Are you sure you want to logout?',
      'No',
      'Yes',
      noop,
      () => {
        LocalStorageService.clearKey(LocalStorageService.Keys.Login);
        setLoginData(null);
        setLoggedIn(false);
      },
    );

  const gotoPrinterConfigScreen = () =>
    navigation.navigate(RouteName.PrinterConfig);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        {hasBackButton ? (
          <TouchableOpacity style={styles.backBtn} onPress={navigation.goBack}>
            <Icons.MaterialIcons
              name="arrow-back"
              color={Colors.white}
              size={responsiveFontSize(4)}
            />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.titleText}>{title}</Text>
      </View>
      <View style={styles.fRow}>
        {hasSettingsButton ? (
          <TouchableOpacity onPress={gotoPrinterConfigScreen}>
            <Icons.FontAwsome
              name="gear"
              size={responsiveFontSize(4)}
              color={Colors.white}
            />
          </TouchableOpacity>
        ) : null}
        {hasLogoutButton ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogoutPressed}>
            <Icons.MaterialIcons
              name="logout"
              size={responsiveFontSize(4)}
              color={Colors.white}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  fRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    width: '100%',
    minHeight: responsiveHeight(8),
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: responsiveWidth(4),
  },
  titleContainer: {
    flexDirection: 'row',
  },
  backBtn: {
    marginRight: responsiveWidth(5),
  },
  titleText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: responsiveFontSize(3),
  },
  logoutBtn: {
    marginLeft: responsiveWidth(4),
  },
});
