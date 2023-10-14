export interface LoginData {
  id?: string;
  accessToken?: string;
  refreshToken?: string;
  dormantUser?: number;
  isAdmin?: number;
  expiryDate?: number;
  name?: string;
  pinCode?: string;
  Merchant_ID?: string;
}

export interface GlobalState {
  splashLodaing: boolean;
  loggedIn: boolean;
  loginData?: LoginData;

  setSplashLoading: (loading: boolean) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  setLoginData: (loginData?: LoginData) => void;
}
