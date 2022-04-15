export interface IOptions {
  [index: string]: any;
}

export type Callback = (err: Error, value?: any) => void;