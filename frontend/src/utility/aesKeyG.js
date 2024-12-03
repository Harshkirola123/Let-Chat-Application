import CryptoJS from "crypto-js";

export const generateRandomAesKey = () => {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64); // 256-bit AES key
};
