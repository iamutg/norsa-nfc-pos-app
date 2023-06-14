import moment from 'moment';
import React, {useState, createContext, FC, useContext} from 'react';
import {doLogin} from '~/core/ApiService';
import {
  clearLoginData,
  getLoginData,
  setLoginData as setLoginDataInLocalStorage,
} from '~/core/LocalStorageService';
import {AuthContextValue, EmptyProps, LoginData, LoginResponse} from '~/types';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const useAuthContext: () => AuthContextValue = () => {
  const ctx = useContext<AuthContextValue>(AuthContext);

  if (ctx === undefined) {
    throw new Error('useAuthContext must be within AuthContextProvider');
  }

  return ctx;
};

const Provider: FC<EmptyProps> = ({children}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginData, setLoginData] = useState<LoginData | null>(null);

  const login: (
    emial: string,
    password: string,
  ) => Promise<LoginResponse> = async (email, password) =>
    await doLogin(email, password);

  const logout: () => Promise<void> = async () => {
    setIsLoggedIn(false);
    setLoginData(null);
    await clearLoginData();
  };

  const onLoginSuccess: (
    loginData: LoginData,
  ) => Promise<void> = async loginData => {
    await setLoginDataInLocalStorage(loginData);
    setLoginData(loginData);
    setIsLoggedIn(true);
  };

  const checkUserSession: () => Promise<void> = async () => {
    const loginData = await getLoginData();

    if (loginData) {
      const hasTokenExpired = moment().isAfter(loginData.expiryDate);

      if (!hasTokenExpired) {
        setLoginData(loginData);
        setIsLoading(false);
        setIsLoggedIn(true);
      } else {
        setIsLoading(false);
        await logout();
      }
    } else {
      setLoginData(null);
      setIsLoading(false);
      setIsLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        loginData,
        login,
        logout,
        onLoginSuccess,
        checkUserSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export {Provider as AuthContextProvider, useAuthContext};
