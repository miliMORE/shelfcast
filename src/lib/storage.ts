/** Compatibility shim — prefer @/lib/storage (directory). */
export {
  getStorage,
  bookObjectKey,
  audioObjectKey,
  bookPrefix,
} from "./storage/index";
