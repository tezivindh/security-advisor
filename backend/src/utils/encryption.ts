import CryptoJS from 'crypto-js';
import { config } from '../config';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, config.tokenEncryptionKey).toString();
};

export const decrypt = (cipherText: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipherText, config.tokenEncryptionKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
