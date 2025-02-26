import * as exec from '@actions/exec';
export declare const execOrThrow: (...args: Parameters<typeof exec.exec>) => Promise<void>;
export declare const setToken: (token: string) => Promise<() => Promise<void>>;
export declare const checkoutBranch: (branch: string) => Promise<void>;
export declare const stagedChangesExist: () => Promise<boolean>;
export declare const commitAndPush: (targetBranch: string, force: boolean) => Promise<void>;
export declare const clone: (token: string, owner: string, repo: string, branch?: string) => Promise<void>;
