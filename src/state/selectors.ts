import {GlobalState} from './types';

export const selectSplashLodaing = (state: GlobalState) => state.splashLodaing;
export const selectLoggedIn = (state: GlobalState) => state.loggedIn;
export const selectLoginData = (state: GlobalState) => state.loginData;
