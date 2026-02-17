// ═══════════════════════════════════════════
// 🐙 GitHub Client - GitHub API 통합 클라이언트
// ═══════════════════════════════════════════

import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import { GitHubRepository, CommitRecord } from '../types';

// ── GraphQL 응답 타입 정의 ──────────────────────────

interface GQLUserProfileResponse {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: { totalCount: number };
    following: { totalCount: number };
    createdAt: string;
    repositories: { totalCount: number };
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
   * 사용자 프로필 기본 정보를 가져옵니다.
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
    const privacyArgs = this.includePrivate ? '' : '(privacy: PUBLIC)';
    const query = `
      query($username: String!) {
        user(login: $username) {
          login
          name
          avatarUrl
          bio
          followers { totalCount }
          following { totalCount }
          createdAt
          repositories${privacyArgs} { totalCount }
        }
      }
    `;

    const result = await this.graphqlClient<GQLUserProfileResponse>(query, { username: this.username });

    return {
      login: result.user.login,
      name: result.user.name,
      avatarUrl: result.user.avatarUrl,
      bio: result.user.bio,
      followers: result.user.followers.totalCount,
      following: result.user.following.totalCount,
      createdAt: result.user.createdAt,
      publicRepos: result.user.repositories.totalCount,
    };
  }

  /**
   * 사용자의 레포지토리 목록을 가져옵니다.
   */
  async getRepositories(): Promise<GitHubRepository[]> {
    const privacyFilter = this.includePrivate ? '' : ', privacy: PUBLIC';
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

    return allRepos.map((repo) => ({
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
   * Contribution Calendar (잔디) 데이터를 가져옵니다.
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
   * PR 통계를 가져옵니다.
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
   * 이슈 통계를 가져옵니다.
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
   * 최근 커밋 히스토리를 가져옵니다 (시간대 분석용).
   */
  async getCommitHistory(timezone: string): Promise<CommitRecord[]> {
    const privacyFilter = this.includePrivate ? '' : ', privacy: PUBLIC';
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

    try {
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
    } catch (error) {
      console.warn('⚠️  커밋 히스토리 수집 중 일부 오류 발생, 부분 데이터 사용');
      return [];
    }
  }

  /**
   * 사용자의 전체 언어 통계를 가져옵니다.
   */
  async getLanguageStats(): Promise<Record<string, number>> {
    const privacyFilter = this.includePrivate ? '' : 'privacy: PUBLIC,';
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
