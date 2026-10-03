import { Post, User, RecommendationExplanation } from './types';

/**
 * MediaGram ML Recommendation Engine
 * 
 * Based on Architecture Specification:
 * Score = relationship_score + engagement_score + recency_score + interest_score
 * 
 * Leverages Cloudinary AI Auto-Tags, media formats, and user interactions.
 */

export function calculatePostRecommendationScore(
  post: Post,
  currentUser: User,
  userInteractions?: {
    likedTags?: string[];
    videoWatchTimeRatio?: number; // 0 to 1
  }
): { score: number; explanation: RecommendationExplanation } {
  const userInterests = [
    ...(currentUser.interestTags || ['tokyo', 'cyberpunk', 'cinema', 'design', 'mountains', 'waves']),
    ...(userInteractions?.likedTags || []),
  ];

  // 1. Interest Score (Tag overlap with Cloudinary AI tags & hashtags)
  const postTags = post.tags.map(t => t.toLowerCase().replace('#', ''));
  const matchingTags = postTags.filter(t =>
    userInterests.some(ut => ut.toLowerCase() === t || ut.includes(t) || t.includes(ut))
  );
  const interestMatchPercent = Math.min(
    100,
    Math.round((matchingTags.length / Math.max(1, postTags.length)) * 100) +
      (matchingTags.length > 0 ? 30 : 10)
  );
  const interestScore = (interestMatchPercent / 100) * 40; // Max 40 pts

  // 2. Engagement Score (Likes, comments, shares normalized)
  const rawEngagement = post.likesCount * 1 + post.commentsCount * 3 + post.sharesCount * 5;
  const engagementScore = Math.min(30, Math.round(Math.log10(Math.max(1, rawEngagement)) * 8)); // Max 30 pts

  // 3. Recency Score (Exponential decay over time)
  const hoursSinceCreated = Math.max(
    0.1,
    (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 3600)
  );
  const recencyWeight = Math.max(0.2, Math.exp(-hoursSinceCreated / 48)); // Half-life ~48 hours
  const recencyScore = recencyWeight * 20; // Max 20 pts

  // 4. Media Affinity (Videos vs Images)
  const isVideo = post.isReel || post.media[0]?.resourceType === 'video';
  const videoAffinityBoost = isVideo ? 10 : 5; // Max 10 pts

  // Total Score (0 - 100)
  const totalScore = Math.min(99, Math.round(interestScore + engagementScore + recencyScore + videoAffinityBoost));

  const reasons: string[] = [];
  if (matchingTags.length > 0) {
    reasons.push(`Matched your interests: #${matchingTags.slice(0, 2).join(', #')}`);
  }
  if (isVideo) {
    reasons.push('High-affinity video format with Cloudinary adaptive streaming');
  }
  if (post.likesCount > 500) {
    reasons.push(`Trending with ${post.likesCount.toLocaleString()} likes`);
  }
  if (hoursSinceCreated < 24) {
    reasons.push('Fresh post uploaded in the last 24h');
  }
  if (reasons.length === 0) {
    reasons.push('Curated recommendation for you');
  }

  const explanation: RecommendationExplanation = {
    overallScore: totalScore,
    interestMatchPercent,
    engagementScore: Math.round((engagementScore / 30) * 100),
    recencyWeight: parseFloat(recencyWeight.toFixed(2)),
    mediaAffinity: isVideo ? 'video' : 'image',
    reasons,
  };

  return { score: totalScore, explanation };
}

/**
 * Rank Feed Posts via the ML Recommendation Model
 */
export function rankFeedPostsWithML(posts: Post[], currentUser: User): Post[] {
  return posts
    .map((post) => {
      const { score, explanation } = calculatePostRecommendationScore(post, currentUser);
      return {
        ...post,
        recommendationExplanation: explanation,
        _mlScore: score,
      };
    })
    .sort((a, b) => (b as any)._mlScore - (a as any)._mlScore);
}
