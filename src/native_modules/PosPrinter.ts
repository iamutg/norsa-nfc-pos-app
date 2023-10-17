import {NativeModules} from 'react-native';
import {FailureResult, PrinterConfig, SuccessResult} from '~/types';
import {LocalStorageService} from '~/core/LocalStorageService';

export interface PosPrinterModule {
  print: (
    textToBePrinted: string,
    printerDpi: number,
    printerWidthMM: number,
    printerNbrCharactersPerLine: number,
  ) => Promise<boolean>;
}

export type PosPrinterResult =
  | Omit<SuccessResult<undefined>, 'data'>
  | Omit<FailureResult<undefined, Error>, 'code'>;

const NativePosPrinter: PosPrinterModule = NativeModules.PosPrinterModule;

export const PosPrinter = {
  async print(text: string, config?: PrinterConfig): Promise<PosPrinterResult> {
    try {
      const printerConfig =
        config || (await LocalStorageService.getPrinterDefaultConfig());

      await NativePosPrinter.print(
        text,
        printerConfig.printerDpi,
        printerConfig.printerWidthMM,
        printerConfig.printerNbrCharactersPerLine,
      );

      return {success: true, failure: false};
    } catch (error) {
      const errorWithMessage = error as Error & {code: string};

      if (errorWithMessage.code === 'Exception') {
        return {
          success: false,
          failure: true,
          message: errorWithMessage.message,
          cause: error,
        };
      } else {
        return {
          success: false,
          failure: true,
          message: 'Sometginh went wrong while printing',
          cause: error,
        };
      }
    }
  },
};
