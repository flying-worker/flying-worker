declare const passwordHash: (password: string) => Promise<string>;
declare const passwordVerify: (password: string, userPassword: string) => Promise<boolean>;
declare const encrypt: (data: unknown) => Promise<string>;
declare const decrypt: (token: string) => Promise<any>;

export { decrypt, encrypt, passwordHash, passwordVerify };
