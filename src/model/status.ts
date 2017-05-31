import { DiffSelection } from './diff';

/**
 * The encapsulation of the result from `git status`.
 */
export interface IStatusResult {

    readonly currentBranch?: string
    readonly currentUpstreamBranch?: string
    readonly currentTip?: string
    readonly branchAheadBehind?: IAheadBehind

    /**
     * `true` if the repository exists at the given location.
     */
    readonly exists: boolean

    /**
     * The absolute path to the repository's working directory.
     */
    readonly workingDirectory: WorkingDirectoryStatus
}

/**
 * The number of commits a revision range is ahead/behind.
 */
export interface IAheadBehind {
    readonly ahead: number
    readonly behind: number
}

/**
 * The state of the changed file in the working directory.
 */
export enum FileStatus {
    'New',
    'Modified',
    'Deleted',
    'Renamed',
    'Conflicted',
    'Copied'
}

/**
 * Represents a file change in the working directory.
 */
export class FileChange {

    /**
     * Creates a new file change instance.
     * 
     * @param path The relative path to the file in the repository.
     * @param status The original path in the case of a renamed file.
     * @param oldPath The status of the change to the file.
     */
    public constructor(public readonly path: string, public readonly status: FileStatus, public readonly oldPath?: string) {
    }

    /** An ID for the file change. */
    public get id(): string {
        return `${this.status}+${this.path}`;
    }

}

/** encapsulate the changes to a file in the working directory  */
export class WorkingDirectoryFileChange extends FileChange {

    /**
     * Creates a new working directory file change instance.
     * @param path The relative path to the file in the repository.
     * @param status The original path in the case of a renamed file.
     * @param selection contains the selection details for this file - all, nothing or partial.
     * @param oldPath The status of the change to the file.
     */
    public constructor(path: string, status: FileStatus, public readonly selection: DiffSelection, oldPath?: string) {
        super(path, status, oldPath);
    }

    /**
     * Create a new WorkingDirectoryFileChange with the given includedness.
     * @param include 
     */
    public withIncludeAll(include: boolean): WorkingDirectoryFileChange {
        const newSelection = include
            ? this.selection.withSelectAll()
            : this.selection.withSelectNone();

        return this.withSelection(newSelection);
    }

    /**
     * Create a new `WorkingDirectoryFileChange` instance with the given diff selection.
     * @param selection the diff selection.
     */
    public withSelection(selection: DiffSelection): WorkingDirectoryFileChange {
        return new WorkingDirectoryFileChange(this.path, this.status, selection, this.oldPath);
    }
}

/**
 * The state of the working directory for a repository.
 */
export class WorkingDirectoryStatus {

    /**
     * Creates a new instance that represents the working directory status.
     *
     * @param files The list of changes in the repository's working directory.
     * @param includeAll Update the include checkbox state of the form.
     */
    public constructor(public readonly files: ReadonlyArray<WorkingDirectoryFileChange>, public readonly includeAll: boolean = true) {
    }

    /**
     * Update the include state of all files in the working directory
     */
    public withIncludeAllFiles(includeAll: boolean): WorkingDirectoryStatus {
        const newFiles = this.files.map(f => f.withIncludeAll(includeAll));
        return new WorkingDirectoryStatus(newFiles, includeAll);
    }

    /**
     * Update by replacing the file with the same ID with a new file.
     * 
     * @param file updates the argument after replacing all files then returns with a new instance.
     */
    public byReplacingFile(file: WorkingDirectoryFileChange): WorkingDirectoryStatus {
        const newFiles = this.files.map(f => f.id === file.id ? file : f);
        return new WorkingDirectoryStatus(newFiles, this.includeAll);
    }

    /**
     * Find the file with the given ID.
     *
     * @param id the internal unique ID of the file.
     */
    public findFileWithID(id: string): WorkingDirectoryFileChange | undefined {
        return this.files.find(f => f.id === id);
    }
}