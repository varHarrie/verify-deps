export interface Dependency {
  name: string
  version: string
  versionInstalled?: string
  type?: string
}

export type DependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies'
