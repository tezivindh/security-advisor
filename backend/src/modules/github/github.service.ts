import { Octokit } from '@octokit/rest';
import { decrypt } from '../../utils/encryption';
import { IUser } from '../../models';

export const getOctokitForUser = (user: IUser): Octokit => {
  const token = decrypt(user.encryptedAccessToken);
  return new Octokit({ auth: token });
};

export interface GithubRepo {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  private: boolean;
  defaultBranch: string;
  language: string | null;
  htmlUrl: string;
  description: string | null;
  stargazersCount: number;
  updatedAt: string | null;
}

export const listUserRepos = async (user: IUser): Promise<GithubRepo[]> => {
  const octokit = getOctokitForUser(user);
  const repos: GithubRepo[] = [];

  for await (const response of octokit.paginate.iterator(octokit.repos.listForAuthenticatedUser, {
    sort: 'updated',
    per_page: 100,
    affiliation: 'owner,collaborator,organization_member',
  })) {
    for (const repo of response.data) {
      repos.push({
        id: repo.id,
        fullName: repo.full_name,
        name: repo.name,
        owner: repo.owner?.login || '',
        private: repo.private,
        defaultBranch: repo.default_branch,
        language: repo.language,
        htmlUrl: repo.html_url,
        description: repo.description,
        stargazersCount: repo.stargazers_count || 0,
        updatedAt: repo.updated_at,
      });
    }
  }
  return repos;
};

export const getCloneUrl = (user: IUser, fullName: string): string => {
  const token = decrypt(user.encryptedAccessToken);
  return `https://x-access-token:${token}@github.com/${fullName}.git`;
};

export const getPRDiff = async (
  user: IUser,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> => {
  const octokit = getOctokitForUser(user);
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: 'diff' },
  });
  return data as unknown as string;
};

export const postPRComment = async (
  user: IUser,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<number> => {
  const octokit = getOctokitForUser(user);
  const { data } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });
  return data.id;
};
