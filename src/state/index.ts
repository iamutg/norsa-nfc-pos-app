import {create} from 'zustand';
import {GlobalState} from './types';

export const useGlobalStore = create<GlobalState>(set => ({
  splashLodaing: true,
  loggedIn: false,

  setSplashLoading(loading) {
    set({splashLodaing: loading});
  },
  setLoggedIn(loggedIn) {
    set({loggedIn});
  },
  setLoginData(loginData) {
    set({loginData});
  },
}));

export * from './selectors';
export * from './types';
