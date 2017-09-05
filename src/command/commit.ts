import { git, GitError } from '../core/git'
import { RepositoryPath } from '../model/repository'

export async function createCommit(
  repository: RepositoryPath,
  message: string
): Promise<boolean> {

  try {
    const repositoryPath = RepositoryPath.getPath(repository);
    await git(['commit', '-F', '-'], repositoryPath, 'createCommit', {
      stdin: message,
    })
    return true
  } catch (e) {
    // Commit failures could come from a pre-commit hook rejection. So display
    // a bit more context than we otherwise would.
    if (e instanceof GitError) {
      const output = e.result.stderr.trim()

      let standardError = ''
      if (output.length > 0) {
        standardError = `, with output: '${output}'`
      }
      const exitCode = e.result.exitCode
      const error = new Error(
        `Commit failed - exit code ${exitCode} received${standardError}`
      )
      error.name = 'commit-failed'
      throw error
    } else {
      throw e
    }
  }
}
