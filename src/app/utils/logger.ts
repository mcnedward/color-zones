import { environment } from '../../environments/environment';

/**
 * Logger that only logs to the console in the development environment.
 */
export default class Logger {

  static log(message?: any, ...optionalParams: any[]): void {
    if (!environment.production) {
      if (optionalParams && optionalParams.length > 0) {
        console.log(message, optionalParams);
      } else {
        console.log(message);
      }
    }
  }

  static warn(message?: any, ...optionalParams: any[]): void {
    if (!environment.production) {
      if (optionalParams && optionalParams.length > 0) {
        console.warn(message, optionalParams);
      } else {
        console.warn(message);
      }
    }
  }

  static error(message?: any, ...optionalParams: any[]): void {
    if (!environment.production) {
      if (optionalParams && optionalParams.length > 0) {
        console.error(message, optionalParams);
      } else {
        console.error(message);
      }
    }
  }

}
