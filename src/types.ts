export interface Dependency {
  name: string
  version: string
  versionInstalled?: string
  status?: string
}

export type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies'
