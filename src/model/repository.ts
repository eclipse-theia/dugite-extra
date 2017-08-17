/**
 * The repository path that is either the repository itself or its FS path.
 */
export type RepositoryPath = Repository | string;

export namespace RepositoryPath {

    /**
     * Sugar for getting the FS path of the repository.
     *
     * @param repositoryPath the repository itself or the FS path of the local clone.
     */
    export function getPath(repositoryPath: RepositoryPath) {
        return typeof repositoryPath === 'string' ? repositoryPath : repositoryPath.path;
    }
}

/**
 * Lightweight, portable representation of a local Git repository.
 */
export interface Repository {

    /**
     * The FS path to the repository.
     */
    readonly path: string;
}