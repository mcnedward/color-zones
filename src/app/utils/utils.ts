export default class Utils {
  /**
   * Returns a random number.
   * @param min 
   * @param max 
   */
  static random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
  /**
   * Returns a random integer.
   * @param min
   * @param max 
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  /**
   * Creates a random color.
   * @param alpha The amount of alpha to use in the random color. If not supplied, it will be 100.
   */
  static randomColor(alpha?): string {
    let r = parseInt(this.randomInt(0, 99).toString(), 16);
    let g = parseInt(this.randomInt(0, 99).toString(), 16);
    let b = parseInt(this.randomInt(0, 99).toString(), 16);
    let a = alpha ? parseInt(alpha, 16) / 255 : 100;
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  }
}
