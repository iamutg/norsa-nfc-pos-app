import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {responsiveWidth} from 'react-native-responsive-dimensions';
import {ScreenContainer} from '~/components';
import {Colors} from '~/styles';
import {logo} from '~/assets/images';
import {LoginData, useGlobalStore} from '~/state';
import {LocalStorageService} from '~/core/LocalStorageService';
import moment from 'moment';

export function Splash() {
  const {setSplashLoading, setLoggedIn, setLoginData} = useGlobalStore();

  React.useEffect(() => {
    setTimeout(checkUserSession, 500);
  }, []);

  const checkUserSession = async () => {
    const loginDataRes = await LocalStorageService.getObject<LoginData>(
      LocalStorageService.Keys.Login,
    );

    if (
      loginDataRes.success &&
      loginDataRes.data &&
      moment().isAfter(loginDataRes.data.expiryDate)
    ) {
      LocalStorageService.clearKey(LocalStorageService.Keys.Login);
    } else if (loginDataRes.success && loginDataRes.data) {
      setLoginData(loginDataRes.data);
      setLoggedIn(true);
    }

    setSplashLoading(false);
  };

  return (
    <ScreenContainer style={styles.container}>
      <Image source={logo} style={styles.logo} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  logo: {
    height: responsiveWidth(75),
    width: responsiveWidth(75),
  },
});
