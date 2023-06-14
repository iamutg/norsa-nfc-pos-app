import React, {FC, useEffect} from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {
  responsiveFontSize,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {Icons, ScreenContainer} from '~/components';
import {Colors} from '~/styles';
import {EmptyProps} from '~/types';
import {useAuthContext} from '~/context/AuthContext';
import {logo} from '~/assets/images';

const Splash: FC<EmptyProps> = () => {
  const {checkUserSession} = useAuthContext();

  useEffect(() => {
    const tId = setTimeout(() => {
      checkUserSession();
      clearTimeout(tId);
    }, 500);
  }, []);

  return (
    <ScreenContainer style={styles.container}>
      <Image source={logo} style={styles.logo} />
    </ScreenContainer>
  );
};

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

export default Splash;
