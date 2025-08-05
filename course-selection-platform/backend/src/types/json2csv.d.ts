declare module 'json2csv' {
  export interface Options {
    fields?: any[];
    transforms?: any[];
    unwind?: string | string[];
    quote?: string;
    doubleQuote?: string;
    delimiter?: string;
    header?: boolean;
    defaultValue?: string;
    includeEmptyRows?: boolean;
    withBOM?: boolean;
  }

  export class Parser {
    constructor(options?: Options);
    parse(data: any): string;
  }

  export function parse(data: any, options?: Options): string;
}