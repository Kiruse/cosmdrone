import { fromBase64, fromUtf8, toBase64, toUtf8 } from "@cosmjs/encoding";

export function reviver(key: string, value: unknown) {
  if (typeof value === 'string') {
    // bigints
    if (value.match(/^[+-]?\d+$/)) {
      return BigInt(value);
    }
    // base64
    else if (['msg', 'data'].includes(key) && value.match(/^[a-zA-Z0-9+\/]+={0,2}$/)) {
      if (value.length % 4 !== 0)
        throw Error('Invalid base64 string length');
      return JSON.parse(fromUtf8(fromBase64(value)), reviver);
    }
  }
  return value;
}

export function replacer(key: string, value: unknown) {
  if (typeof value === 'bigint') {
    return value + '';
  } else if (value instanceof Uint8Array) {
    return toBase64(value);
  }
  // TODO: can we do something smart with binary fields here?
  return value;
}

export const toBinary = (value: any) => toBase64(toUtf8(JSON.stringify(value)));
