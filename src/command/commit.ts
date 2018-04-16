import { git, GitError } from '../core/git'

export async function createCommit(repositoryPath: string, message: string, signOff: boolean = false, amend: boolean = false): Promise<void> {
    try {
        const args = ['commit', '-F', '-'];
        if (signOff) {
            args.push('-s');
        }
        if (amend) {
            args.push('--amend');
        }
        await git(args, repositoryPath, 'createCommit', { stdin: message });
    } catch (e) {
        // Commit failures could come from a pre-commit hook rejection. So display
        // a bit more context than we otherwise would.
        if (e instanceof GitError) {
            const output = e.result.stderr.trim();
            let standardError = '';
            if (output.length > 0) {
                standardError = `, with output: '${output}'`;
            }
            const exitCode = e.result.exitCode;
            const error = new Error(`Commit failed - exit code ${exitCode} received${standardError}`);
            error.name = 'commit-failed';
            throw error;
        } else {
            throw e;
        }
    }
}
