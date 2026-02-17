// ═══════════════════════════════════════════
// 📊 Data Collector - GitHub 데이터 통합 수집기
// ═══════════════════════════════════════════

import { GitHubClient } from './github-client';
import {
  GitHubData,
  GitHubUser,
  GitHubRepository,
  CommitRecord,
  PRStats,
  IssueStats,
  ContributionDay,
  MilestoneEvent,
} from '../types';

/**
 * GitHub API를 1회 호출하여 전 모듈이 공유할 데이터를 수집합니다.
 */
export async function collectGitHubData(
  client: GitHubClient,
  timezone: string
): Promise<GitHubData> {
  console.log('📊 GitHub 데이터 수집 시작...');

  // 병렬로 모든 데이터 수집
  const [
    userProfile,
    repositories,
    contributionCalendar,
    prStats,
    issueStats,
    commitHistory,
    languages,
  ] = await Promise.all([
    client.getUserProfile().then(data => {
      console.log('  ✅ 프로필 정보 수집 완료');
      return data;
    }),
    client.getRepositories().then(data => {
      console.log(`  ✅ 레포지토리 ${data.length}개 수집 완료`);
      return data;
    }),
    client.getContributionCalendar().then(data => {
      console.log(`  ✅ 기여 캘린더 ${data.length}일 수집 완료`);
      return data;
    }),
    client.getPRStats().then(data => {
      console.log(`  ✅ PR 통계 수집 완료 (총 ${data.total}개)`);
      return data;
    }),
    client.getIssueStats().then(data => {
      console.log(`  ✅ 이슈 통계 수집 완료 (총 ${data.total}개)`);
      return data;
    }),
    client.getCommitHistory(timezone).then(data => {
      console.log(`  ✅ 커밋 히스토리 ${data.length}개 수집 완료`);
      return data;
    }),
    client.getLanguageStats().then(data => {
      console.log(`  ✅ 언어 통계 ${Object.keys(data).length}개 언어 수집 완료`);
      return data;
    }),
  ]);

  // 마일스톤 이벤트 감지
  const milestones = detectMilestones(
    userProfile,
    repositories,
    commitHistory,
    contributionCalendar,
    prStats,
    languages
  );

  console.log(`  ✅ 마일스톤 ${milestones.length}개 감지 완료`);
  console.log('📊 GitHub 데이터 수집 완료!\n');

  return {
    user: userProfile,
    repositories,
    commitHistory,
    pullRequests: prStats,
    issues: issueStats,
    languages,
    contributionCalendar,
    milestones,
  };
}

/**
 * 데이터에서 마일스톤 이벤트를 자동 감지합니다.
 */
function detectMilestones(
  user: GitHubUser,
  repos: GitHubRepository[],
  commits: CommitRecord[],
  calendar: ContributionDay[],
  prStats: PRStats,
  languages: Record<string, number>
): MilestoneEvent[] {
  const milestones: MilestoneEvent[] = [];

  // 1. 첫 레포 생성
  const sortedRepos = [...repos].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  if (sortedRepos.length > 0) {
    milestones.push({
      type: 'first_repo',
      date: sortedRepos[0].createdAt,
      details: { repoName: sortedRepos[0].name },
    });
  }

  // 2. 각 레포 생성 이벤트
  for (const repo of sortedRepos) {
    milestones.push({
      type: 'repo_created',
      date: repo.createdAt,
      details: {
        repoName: repo.name,
        language: repo.primaryLanguage,
      },
    });
  }

  // 3. 첫 커밋
  const sortedCommits = [...commits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  if (sortedCommits.length > 0) {
    milestones.push({
      type: 'first_commit',
      date: sortedCommits[0].date,
      details: { repo: sortedCommits[0].repo, message: sortedCommits[0].message },
    });
  }

  // 4. 첫 PR 머지
  if (prStats.merged > 0) {
    milestones.push({
      type: 'first_pr_merged',
      date: user.createdAt, // 정확한 날짜 대신 근사값 사용
      details: { totalMerged: prStats.merged },
    });
  }

  // 5. 스타 100개 이상
  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
  if (totalStars >= 100) {
    milestones.push({
      type: 'stars_100',
      date: new Date().toISOString(),
      details: { totalStars },
    });
  }

  // 6. 새 언어 습득 (레포에 처음 등장하는 언어)
  const languageFirstSeen: Record<string, string> = {};
  for (const repo of sortedRepos) {
    if (repo.primaryLanguage && !languageFirstSeen[repo.primaryLanguage]) {
      languageFirstSeen[repo.primaryLanguage] = repo.createdAt;
      if (Object.keys(languageFirstSeen).length > 1) {
        milestones.push({
          type: 'new_language',
          date: repo.createdAt,
          details: { language: repo.primaryLanguage, repo: repo.name },
        });
      }
    }
  }

  // 7. 30일 연속 커밋 스트릭
  let currentStreak = 0;
  let maxStreak = 0;
  let streakDate = '';
  for (const day of calendar) {
    if (day.count > 0) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        streakDate = day.date;
      }
    } else {
      currentStreak = 0;
    }
  }
  if (maxStreak >= 30) {
    milestones.push({
      type: 'streak_30',
      date: streakDate,
      details: { days: maxStreak },
    });
  }

  // 날짜순 정렬
  milestones.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return milestones;
}
