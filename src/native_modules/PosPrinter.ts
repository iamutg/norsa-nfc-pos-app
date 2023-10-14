import {NativeModules} from 'react-native';
import {
  FailureResult,
  PosPrinterModule,
  PrinterConfig,
  SuccessResult,
} from '~/types';
import {LocalStorageService} from '~/core/LocalStorageService';

export type PosPrinterResult =
  | Omit<SuccessResult<undefined>, 'data'>
  | Omit<FailureResult<undefined, Error>, 'code'>;

const NativePosPrinter: PosPrinterModule = NativeModules.PosPrinterModule;

export const PosPrinter = {
  async print(text: string, config?: PrinterConfig): Promise<PosPrinterResult> {
    try {
      const printerConfig =
        config || LocalStorageService.getPrinterDefaultConfig();

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
