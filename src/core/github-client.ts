// ═══════════════════════════════════════════
// 🐙 GitHub Client - GitHub API 통합 클라이언트
// ═══════════════════════════════════════════

import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';

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
    const privacyFilter = this.includePrivate ? '' : 'privacy: PUBLIC';
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
          repositories(${privacyFilter}) { totalCount }
        }
      }
    `;

    const result: any = await this.graphqlClient(query, { username: this.username });

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
  async getRepositories(): Promise<any[]> {
    const privacyFilter = this.includePrivate ? '' : 'privacy: PUBLIC,';
    const query = `
      query($username: String!, $after: String) {
        user(login: $username) {
          repositories(
            first: 100,
            after: $after,
            ownerAffiliations: OWNER,
            orderBy: { field: PUSHED_AT, direction: DESC },
            ${privacyFilter}
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

    const allRepos: any[] = [];
    let after: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const result: any = await this.graphqlClient(query, {
        username: this.username,
        after,
      });

      const repos = result.user.repositories;
      allRepos.push(...repos.nodes);

      hasNextPage = repos.pageInfo.hasNextPage;
      after = repos.pageInfo.endCursor;
    }

    return allRepos.map((repo: any) => ({
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
      topics: repo.repositoryTopics.nodes.map((t: any) => t.topic.name),
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

    const result: any = await this.graphqlClient(query, { username: this.username });
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

    const result: any = await this.graphqlClient(query, { username: this.username });

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

    const result: any = await this.graphqlClient(query, { username: this.username });

    return {
      total: result.user.issues.totalCount,
      closed: result.user.closedIssues.totalCount,
      open: result.user.openIssues.totalCount,
    };
  }

  /**
   * 최근 커밋 히스토리를 가져옵니다 (시간대 분석용).
   */
  async getCommitHistory(timezone: string): Promise<any[]> {
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
                    history(first: 100, after: $after, author: { id: null }) {
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
      const result: any = await this.graphqlClient(query, {
        username: this.username,
        after: null,
      });

      const commits: any[] = [];
      for (const repo of result.user.repositories.nodes) {
        const history = repo.defaultBranchRef?.target?.history?.nodes || [];
        for (const commit of history) {
          const date = new Date(commit.committedDate);
          commits.push({
            date: commit.committedDate,
            hour: date.getHours(),
            dayOfWeek: date.getDay(),
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

    const result: any = await this.graphqlClient(query, { username: this.username });
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
