import React from 'react';
import {Image, Keyboard, StyleSheet, View, TextInput} from 'react-native';
import {
  responsiveFontSize,
  responsiveHeight,
  responsiveWidth,
} from 'react-native-responsive-dimensions';
import {logo} from '~/assets/images';
import {Button, ScreenContainer} from '~/components';
import {ApiService} from '~/core/api';
import {useGlobalStore} from '~/state';
import {Colors} from '~/styles';
import {isEmailValid, showAlert} from '~/utils';

export function Login() {
  const {setLoggedIn, setLoginData} = useGlobalStore();

  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const passwordTextInpurRef = React.useRef<TextInput>(null);

  const onUsernameEndEditing = () => {
    passwordTextInpurRef.current?.focus();
  };
  const onLoginPressed = async () => {
    Keyboard.dismiss();

    const _email = email.trim();
    const _password = password.trim();

    if (_email === '') {
      showAlert('Email Empty', 'Please enter an email.');
      return;
    }

    if (!isEmailValid(_email)) {
      showAlert('Invalid Email', 'The email entered is invalid.');
      return;
    }

    if (_password === '') {
      showAlert('Password Empty', 'Please enter a password.');
      return;
    }

    if (_password.length < 8) {
      showAlert('Invalid Password', 'The password must be 8 characters long.');
      return;
    }

    setLoading(true);
    const loginRes = await ApiService.doLogin(email, password);
    setLoading(false);

    if (loginRes.success) {
      setLoginData(loginRes.data?.data);
      setLoggedIn(true);
    } else {
      showAlert('Error', loginRes.message);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.contentContainer}>
        <Image source={logo} style={styles.logo} />
        <TextInput
          style={styles.input}
          value={email}
          placeholder="Email"
          onEndEditing={onUsernameEndEditing}
          onChangeText={setEmail}
          keyboardType="email-address"
          returnKeyType="next"
        />
        <View style={styles.inputsSeprator} />
        <TextInput
          ref={passwordTextInpurRef}
          style={styles.input}
          value={password}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          returnKeyType="done"
        />
        <Button
          style={styles.loginBtn}
          title="Login"
          loading={loading}
          onPress={onLoginPressed}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  f1: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
  },
  contentContainer: {
    marginTop: responsiveHeight(4),
    width: '80%',
    alignItems: 'center',
  },
  logo: {
    height: responsiveWidth(60),
    width: responsiveWidth(60),
    marginBottom: responsiveHeight(2),
  },
  input: {
    borderWidth: responsiveWidth(0.3),
    borderColor: Colors.border,
    borderRadius: responsiveWidth(50) / 8,
    width: '100%',
    padding: responsiveFontSize(1.5),
  },
  inputsSeprator: {
    marginVertical: responsiveHeight(1.5),
  },
  loginBtn: {
    marginTop: responsiveHeight(4),
  },
});
