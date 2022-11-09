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
  const [merchantIdSelected, setMerchantIdSelected] = React.useState(false);
  const [loginData, setLoginData] = useState<LoginData | null>(null);

  const login: (
    emial: string,
    password: string,
  ) => Promise<LoginResponse> = async (email, password) =>
    await doLogin(email, password);

  const logout: () => Promise<void> = async () => {
    setMerchantIdSelected(false);
    setIsLoggedIn(false);
    setLoginData(null);
    await clearLoginData();
  };

  const onLoginSuccess: (
    loginData: LoginData,
  ) => Promise<void> = async loginData => {
    await setLoginDataInLocalStorage(loginData);
    setLoginData(loginData);

    if (loginData.Merchant_Group?.length > 0) {
      setIsLoggedIn(true);
    } else {
      setMerchantIdSelected(!!loginData.Merchant_ID);
      setIsLoggedIn(true);
    }
  };

  const onSelectMerchantId = async (merchantId: string) => {
    const newLoginData: LoginData = {...loginData};
    newLoginData.Merchant_ID = merchantId;
    newLoginData.name = newLoginData.Merchant_Group?.find(
      mer => mer.Id === merchantId,
    )?.Name;

    setLoginData(newLoginData);
    setMerchantIdSelected(true);
    await setLoginDataInLocalStorage(newLoginData);
  };

  const checkUserSession: () => Promise<void> = async () => {
    const loginData = await getLoginData();

    if (loginData) {
      const hasTokenExpired = moment().isAfter(loginData.expiryDate);

      if (!hasTokenExpired) {
        setLoginData(loginData);
        setMerchantIdSelected(!!loginData.Merchant_ID);
        setIsLoading(false);
        setIsLoggedIn(true);
      } else {
        setIsLoading(false);
        await logout();
      }
    } else {
      setLoginData(null);
      setMerchantIdSelected(false);
      setIsLoading(false);
      setIsLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isLoggedIn,
        merchantIdSelected,
        loginData,
        login,
        logout,
        onLoginSuccess,
        onSelectMerchantId,
        checkUserSession,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export {Provider as AuthContextProvider, useAuthContext};
