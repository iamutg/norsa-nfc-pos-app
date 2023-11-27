import {Nullable} from '~/types';
import {LoginData} from '~/core/models';

export interface GlobalState {
  splashLodaing: boolean;
  loggedIn: boolean;
  loginData?: Nullable<LoginData>;

  setSplashLoading: (loading: boolean) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  setLoginData: (loginData?: Nullable<LoginData>) => void;
}
