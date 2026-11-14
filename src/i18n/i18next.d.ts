import 'i18next';
import type en from '../locales/en.json';

// English is the reference shape: keys are type-checked against it.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof en };
  }
}
