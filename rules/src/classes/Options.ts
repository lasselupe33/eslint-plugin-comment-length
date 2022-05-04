export class Options {
  maxLength = 80;
  ignoreUrls = true;

  constructor(specifiedOptions: Options) {
    if (typeof specifiedOptions.maxLength === "number") {
      this.maxLength = specifiedOptions.maxLength;
    }

    if (typeof specifiedOptions.ignoreUrls === "boolean") {
      this.ignoreUrls = specifiedOptions.ignoreUrls;
    }
  }
}
