import NfcManager, {
  Ndef,
  NfcEvents,
  NfcTech,
  TagEvent,
} from 'react-native-nfc-manager';
import {FailureResult, SuccessResult} from '~/types';
import {isError} from '~/utils';

export type NfcTagReadErrorCode =
  | 'invalid-nfc-tag'
  | 'no-nearby-nfc-tag'
  | 'general-error';
export type NfcTagWriteErrorCode = 'unable-to-write' | 'general-error';

export type NfcTagReadResult =
  | (SuccessResult<string> & {data: string})
  | FailureResult<NfcTagReadErrorCode, Error>;
export type NfcTagWriteResult =
  | (SuccessResult<string> & {data: string})
  | FailureResult<NfcTagWriteErrorCode, Error>;

function cleanUpReadingListners() {
  console.log('Cleaning Nfc Reading Listeners');
  NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
  NfcManager.setEventListener(NfcEvents.SessionClosed, null);
}

function cleanUpWriteRequest() {
  console.log('Cleaning Nfc Write Request');
  NfcManager.cancelTechnologyRequest().catch(error =>
    console.log('Error cleaning up write request', error),
  );
}

const readNfcTag = () =>
  new Promise<NfcTagReadResult>(resolve => {
    let tagFound = false;

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (evt: TagEvent) => {
      try {
        tagFound = true;

        if (
          Ndef.isType(evt.ndefMessage[0], Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)
        ) {
          const text = Ndef.text.decodePayload(
            evt.ndefMessage[0].payload as unknown as Uint8Array,
          );

          if (text.trim() === '') {
            return resolve({
              success: false,
              failure: true,
              code: 'invalid-nfc-tag',
              message: 'Invalid Nfc Tag. Please try again with another tag',
            });
          }

          resolve({
            success: true,
            failure: false,
            data: text,
          });
        } else {
          resolve({
            success: false,
            failure: true,
            code: 'invalid-nfc-tag',
            message:
              'Invalid Nfc Tag Protocol. Please try again with another tag',
          });
        }
      } catch (error) {
        const errorMessage = 'Something went wrong on reading Nfc Tag';

        resolve({
          success: false,
          failure: true,
          code: 'general-error',
          message: isError(error)
            ? error.message ?? errorMessage
            : errorMessage,
        });
      }
    });

    NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
      cleanUpReadingListners();

      if (!tagFound) {
        resolve({
          success: false,
          failure: true,
          code: 'no-nearby-nfc-tag',
          message: 'Unable to find any Nfc Tag nearby. Please try again',
        });
      }
    });

    NfcManager.registerTagEvent();
  });

const writeNfcTag = (value: string): Promise<NfcTagWriteResult> =>
  new Promise(async resolve => {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Ready to write some Nfc tag',
      });

      const bytes = Ndef.encodeMessage([Ndef.textRecord(value)]);

      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        resolve({success: true, failure: false, data: value});
      } else {
        resolve({
          success: false,
          failure: true,
          code: 'unable-to-write',
          message: 'Unable to write data on Nfc Tag. Please try again',
        });
      }
    } catch (error) {
      const errorMessage =
        'Something went wrong writing Nfc Tag. Please try again';

      resolve({
        success: false,
        failure: true,
        code: 'general-error',
        message: isError(error) ? error.message ?? errorMessage : errorMessage,
        cause: error,
      });
    } finally {
      cleanUpWriteRequest();
    }
  });

export const NfcReaderWriter = {
  async initNfcManager() {
    try {
      await NfcManager.start();
      return true;
    } catch (error) {
      console.log('Error init Nfc Manager', error);
      return false;
    }
  },
  readNfcTag,
  writeNfcTag,
  cleanUpReadingListners,
  cleanUpWriteRequest,
  checkIfNfcEnabled: () => NfcManager.isEnabled(),
};
