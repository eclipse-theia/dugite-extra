import { Commit } from './commit'
import { removeRemotePrefix } from '../util/api'

/**
 * The branch type.
 *
 * NOTE: The values here matter as they are used to sort local and remote branches, Local should come before Remote.
 */
export enum BranchType {
    Local = 0,
    Remote = 1
}

/**
 * A branch as loaded from Git.
 */
export interface Branch {

    /**
     * The short name of the branch. E.g., `master`.
     */
    readonly name: string;

    /**
     * The remote-prefixed upstream name. E.g., `origin/master`.
     */
    readonly upstream?: string;

    /**
     * The type of branch, e.g., local or remote.
     */
    readonly type: BranchType

    /**
     * The commit associated with this branch.
     */
    readonly tip: Commit
}

export namespace Branch {

    /**
     * The name of the upstream's remote.
     */
    export function remote(branch: Branch): string | undefined {
        const upstream = branch.upstream
        if (!upstream) { return undefined }

        const pieces = upstream.match(/(.*?)\/.*/)
        if (!pieces || pieces.length < 2) { return undefined }

        return pieces[1]
    }

    /**
     * The name of the branch's upstream without the remote prefix.
     */
    export function upstreamWithoutRemote(branch: Branch): string | undefined {
        if (branch.upstream) {
            return removeRemotePrefix(branch.upstream);
        }
        return undefined;
    }

    /**
     * The name of the branch without the remote prefix. If the branch is a local
     * branch, this is the same as its `name`.
     */
    export function nameWithoutRemote(branch: Branch): string {
        if (branch.type === BranchType.Local) {
            return branch.name;
        } else {
            const withoutRemote = removeRemotePrefix(branch.name);
            return withoutRemote || branch.name;
        }
    }

}