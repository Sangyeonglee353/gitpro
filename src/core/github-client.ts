// ?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê??
// ?êô GitHub Client - GitHub API ?µÌï© ?¥Îùº?¥Ïñ∏??
// ?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê?ê‚ïê??

import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import { GitHubRepository, CommitRecord } from '../types';

// ?Ä?Ä GraphQL ?ëÎãµ ?Ä???ïÏùò ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

interface GQLUserProfileResponse {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: { totalCount: number };
    following: { totalCount: number };
    createdAt: string;
    publicRepos: { totalCount: number };
    privateRepos?: { totalCount: number };
  };
}

interface GQLRepositoryNode {
  name: string;
  description: string | null;
  primaryLanguage: { name: string } | null;
  stargazerCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isArchived: boolean;
  isFork: boolean;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
  defaultBranchRef: {
    target: {
      history: { totalCount: number };
    };
  } | null;
}

interface GQLRepositoriesResponse {
  user: {
    repositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: GQLRepositoryNode[];
    };
  };
}

interface GQLContributionCalendarResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{
            date: string;
            contributionCount: number;
          }>;
        }>;
      };
    };
  };
}

interface GQLPRStatsResponse {
  user: {
    pullRequests: { totalCount: number };
    mergedPRs: { totalCount: number };
    openPRs: { totalCount: number };
  };
}

interface GQLIssueStatsResponse {
  user: {
    issues: { totalCount: number };
    closedIssues: { totalCount: number };
    openIssues: { totalCount: number };
  };
}

interface GQLCommitNode {
  committedDate: string;
  additions: number;
  deletions: number;
  message: string;
}

interface GQLCommitHistoryResponse {
  user: {
    repositories: {
      nodes: Array<{
        name: string;
        defaultBranchRef: {
          target: {
            history: {
              nodes: GQLCommitNode[];
            };
          };
        } | null;
      }>;
    };
  };
}

interface GQLLanguageStatsResponse {
  user: {
    repositories: {
      nodes: Array<{
        languages: {
          edges: Array<{
            size: number;
            node: { name: string };
          }>;
        };
      }>;
    };
  };
}

export class GitHubClient {
  private graphqlClient: typeof graphql;
  private restClient: Octokit;
  private username: string;
  private includePrivate: boolean;

  constructor(token: string, username: string, includePrivate: boolean = false) {
    this.username = username;
    this.includePrivate = includePrivate;

    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`,
      },
    });

    this.restClient = new Octokit({
      auth: token,
    });
  }

  /**
   * ?¨Ïö©???ÑÎ°ú??Í∏∞Î≥∏ ?ïÎ≥¥Î•?Í∞Ä?∏Ïòµ?àÎã§.
   */
  async getUserProfile(): Promise<{
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: number;
    following: number;
    createdAt: string;
    publicRepos: number;
  }> {
    const query = this.includePrivate
      ? `
        query($username: String!) {
          user(login: $username) {
            login
            name
            avatarUrl
            bio
            followers { totalCount }
            following { totalCount }
            createdAt
            publicRepos: repositories(privacy: PUBLIC) { totalCount }
            privateRepos: repositories(privacy: PRIVATE) { totalCount }
          }
        }
      `
      : `
        query($username: String!) {
          user(login: $username) {
            login
            name
            avatarUrl
            bio
            followers { totalCount }
            following { totalCount }
            createdAt
            publicRepos: repositories(privacy: PUBLIC) { totalCount }
          }
        }
      `;

    const result = await this.graphqlClient<GQLUserProfileResponse>(query, { username: this.username });
    const privateCount = result.user.privateRepos?.totalCount ?? 0;

    return {
      login: result.user.login,
      name: result.user.name,
      avatarUrl: result.user.avatarUrl,
      bio: result.user.bio,
      followers: result.user.followers.totalCount,
      following: result.user.following.totalCount,
      createdAt: result.user.createdAt,
      publicRepos: result.user.publicRepos.totalCount + privateCount,
    };
  }

  /**
   * ?¨Ïö©?êÏùò ?àÌè¨ÏßÄ?†Î¶¨ Î™©Î°ù??Í∞Ä?∏Ïòµ?àÎã§.
   */
  async getRepositories(): Promise<GitHubRepository[]> {
    if (!this.includePrivate) {
      const publicRepos = await this.fetchRepositories('PUBLIC');
      return this.mapRepositories(publicRepos);
    }

    const [publicRepos, privateRepos] = await Promise.all([
      this.fetchRepositories('PUBLIC'),
      this.fetchRepositories('PRIVATE'),
    ]);

    const merged = new Map<string, GQLRepositoryNode>();
    for (const repo of [...publicRepos, ...privateRepos]) {
      merged.set(repo.name, repo);
    }

    return this.mapRepositories([...merged.values()]);
  }

  private async fetchRepositories(privacy: 'PUBLIC' | 'PRIVATE'): Promise<GQLRepositoryNode[]> {
    const privacyFilter = `, privacy: ${privacy}`;
    const query = `
      query($username: String!, $after: String) {
        user(login: $username) {
          repositories(
            first: 100,
            after: $after,
            ownerAffiliations: OWNER,
            orderBy: { field: PUSHED_AT, direction: DESC }${privacyFilter}
          ) {
            pageInfo { hasNextPage, endCursor }
            nodes {
              name
              description
              primaryLanguage { name }
              stargazerCount
              forkCount
              createdAt
              updatedAt
              pushedAt
              isArchived
              isFork
              repositoryTopics(first: 10) {
                nodes { topic { name } }
              }
              defaultBranchRef {
                target {
                  ... on Commit {
                    history { totalCount }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const allRepos: GQLRepositoryNode[] = [];
    let after: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const result: GQLRepositoriesResponse = await this.graphqlClient(query, {
        username: this.username,
        after,
      });

      const repos = result.user.repositories;
      allRepos.push(...repos.nodes);

      hasNextPage = repos.pageInfo.hasNextPage;
      after = repos.pageInfo.endCursor;
    }

    return allRepos;
  }

  private mapRepositories(repos: GQLRepositoryNode[]): GitHubRepository[] {
    return repos.map((repo) => ({
      name: repo.name,
      description: repo.description,
      primaryLanguage: repo.primaryLanguage?.name || null,
      stars: repo.stargazerCount,
      forks: repo.forkCount,
      totalCommits: repo.defaultBranchRef?.target?.history?.totalCount || 0,
      createdAt: repo.createdAt,
      updatedAt: repo.updatedAt,
      pushedAt: repo.pushedAt,
      isArchived: repo.isArchived,
      isFork: repo.isFork,
      topics: repo.repositoryTopics.nodes.map((t) => t.topic.name),
    }));
  }

  /**
   * Contribution Calendar (?îÎîî) ?∞Ïù¥?∞Î? Í∞Ä?∏Ïòµ?àÎã§.
   */
  async getContributionCalendar(): Promise<{ date: string; count: number }[]> {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.graphqlClient<GQLContributionCalendarResponse>(query, { username: this.username });
    const weeks = result.user.contributionsCollection.contributionCalendar.weeks;

    const days: { date: string; count: number }[] = [];
    for (const week of weeks) {
      for (const day of week.contributionDays) {
        days.push({
          date: day.date,
          count: day.contributionCount,
        });
      }
    }

    return days;
  }

  /**
   * PR ?µÍ≥ÑÎ•?Í∞Ä?∏Ïòµ?àÎã§.
   */
  async getPRStats(): Promise<{ total: number; merged: number; open: number }> {
    const query = `
      query($username: String!) {
        user(login: $username) {
          pullRequests(first: 1) { totalCount }
          mergedPRs: pullRequests(first: 1, states: MERGED) { totalCount }
          openPRs: pullRequests(first: 1, states: OPEN) { totalCount }
        }
      }
    `;

    const result = await this.graphqlClient<GQLPRStatsResponse>(query, { username: this.username });

    return {
      total: result.user.pullRequests.totalCount,
      merged: result.user.mergedPRs.totalCount,
      open: result.user.openPRs.totalCount,
    };
  }

  /**
   * ?¥Ïäà ?µÍ≥ÑÎ•?Í∞Ä?∏Ïòµ?àÎã§.
   */
  async getIssueStats(): Promise<{ total: number; closed: number; open: number }> {
    const query = `
      query($username: String!) {
        user(login: $username) {
          issues(first: 1) { totalCount }
          closedIssues: issues(first: 1, states: CLOSED) { totalCount }
          openIssues: issues(first: 1, states: OPEN) { totalCount }
        }
      }
    `;

    const result = await this.graphqlClient<GQLIssueStatsResponse>(query, { username: this.username });

    return {
      total: result.user.issues.totalCount,
      closed: result.user.closedIssues.totalCount,
      open: result.user.openIssues.totalCount,
    };
  }

  /**
   * ÏµúÍ∑º Ïª§Î∞ã ?àÏä§?†Î¶¨Î•?Í∞Ä?∏Ïòµ?àÎã§ (?úÍ∞Ñ?Ä Î∂ÑÏÑù??.
   */
  async getCommitHistory(timezone: string): Promise<CommitRecord[]> {
    try {
      const commits = this.includePrivate
        ? [
            ...(await this.fetchCommitHistory(timezone, 'PUBLIC')),
            ...(await this.fetchCommitHistory(timezone, 'PRIVATE')),
          ]
        : await this.fetchCommitHistory(timezone, 'PUBLIC');

      return commits;
    } catch (error) {
      console.warn('?†Ô∏è  Ïª§Î∞ã ?àÏä§?†Î¶¨ ?òÏßë Ï§??ºÎ? ?§Î•ò Î∞úÏÉù, Î∂ÄÎ∂??∞Ïù¥???¨Ïö©');
      return [];
    }
  }

  /**
   * ?¨Ïö©?êÏùò ?ÑÏ≤¥ ?∏Ïñ¥ ?µÍ≥ÑÎ•?Í∞Ä?∏Ïòµ?àÎã§.
   */
  async getLanguageStats(): Promise<Record<string, number>> {
    if (!this.includePrivate) {
      return this.fetchLanguageStats('PUBLIC');
    }

    const [publicStats, privateStats] = await Promise.all([
      this.fetchLanguageStats('PUBLIC'),
      this.fetchLanguageStats('PRIVATE'),
    ]);

    const merged: Record<string, number> = { ...publicStats };
    for (const [lang, size] of Object.entries(privateStats)) {
      merged[lang] = (merged[lang] || 0) + size;
    }

    return merged;
  }

  private async fetchCommitHistory(
    timezone: string,
    privacy: 'PUBLIC' | 'PRIVATE'
  ): Promise<CommitRecord[]> {
    const privacyFilter = `, privacy: ${privacy}`;
    const query = `
      query($username: String!, $after: String) {
        user(login: $username) {
          repositories(first: 20, ownerAffiliations: OWNER, orderBy: { field: PUSHED_AT, direction: DESC }${privacyFilter}) {
            nodes {
              name
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 100, after: $after) {
                      nodes {
                        committedDate
                        additions
                        deletions
                        message
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.graphqlClient<GQLCommitHistoryResponse>(query, {
      username: this.username,
      after: null,
    });

    const commits: CommitRecord[] = [];
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
    const dayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };

    for (const repo of result.user.repositories.nodes) {
      const history = repo.defaultBranchRef?.target?.history?.nodes || [];
      for (const commit of history) {
        const date = new Date(commit.committedDate);
        const hour = parseInt(hourFormatter.format(date), 10);
        const dayStr = dayFormatter.format(date);
        commits.push({
          date: commit.committedDate,
          hour,
          dayOfWeek: dayMap[dayStr] ?? date.getDay(),
          repo: repo.name,
          additions: commit.additions,
          deletions: commit.deletions,
          message: commit.message,
        });
      }
    }

    return commits;
  }

  private async fetchLanguageStats(privacy: 'PUBLIC' | 'PRIVATE'): Promise<Record<string, number>> {
    const privacyFilter = `privacy: ${privacy},`;
    const query = `
      query($username: String!) {
        user(login: $username) {
          repositories(first: 100, ownerAffiliations: OWNER, ${privacyFilter} isFork: false) {
            nodes {
              languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
                edges {
                  size
                  node { name }
                }
              }
            }
          }
        }
      }
    `;

    const result = await this.graphqlClient<GQLLanguageStatsResponse>(query, { username: this.username });
    const langMap: Record<string, number> = {};

    for (const repo of result.user.repositories.nodes) {
      for (const edge of repo.languages.edges) {
        const lang = edge.node.name;
        langMap[lang] = (langMap[lang] || 0) + edge.size;
      }
    }

    return langMap;
  }
}




