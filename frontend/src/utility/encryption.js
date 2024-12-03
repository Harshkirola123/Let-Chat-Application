import CryptoJS from "crypto-js";

export const encryptMessage = (message, aesKey) => {
  return CryptoJS.AES.encrypt(message, aesKey).toString();
};

export const decryptMessage = (encryptedMessage, aesKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, aesKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
