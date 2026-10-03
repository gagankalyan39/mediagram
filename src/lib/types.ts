export type Role = 'USER' | 'CREATOR' | 'ADMIN';

export type MediaType = 'image' | 'video' | 'carousel';

export type PostVisibility = 'public' | 'followers' | 'private';

export interface UserSettings {
  isPrivateAccount: boolean;
  showActivityStatus: boolean;
  allowTaggingFrom: 'everyone' | 'following' | 'no_one';
  pauseNotifications: boolean;
  likesNotifications: boolean;
  commentsNotifications: boolean;
  messagesNotifications: boolean;
  cloudinaryAutoCompress: boolean;
  highQualityUploads: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  bio?: string;
  website?: string;
  avatarUrl?: string;
  coverUrl?: string;
  role: Role;
  isVerified?: boolean;
  status: 'active' | 'suspended';
  followersCount: number;
  followingCount: number;
  postsCount: number;
  settings?: UserSettings;
  interestTags?: string[];
  createdAt: string;
}

export interface CloudinaryAssetMeta {
  assetId: string;
  publicId: string;
  resourceType: 'image' | 'video';
  format: string;
  width: number;
  height: number;
  duration?: number;
  bytes: number;
  originalUrl: string;
  thumbnailUrl: string;
  optimizedUrl: string;
  blurHash?: string;
  tags?: string[];
  moderationStatus?: 'approved' | 'pending' | 'flagged';
  folder?: string;
}

export interface MediaAsset extends CloudinaryAssetMeta {
  id: string;
  userId: string;
  postId?: string;
  createdAt: string;
  aspectRatio?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl' | 'isVerified'>;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  replies?: Comment[];
}

export interface RecommendationExplanation {
  overallScore: number;
  interestMatchPercent: number;
  engagementScore: number;
  recencyWeight: number;
  mediaAffinity: 'video' | 'image' | 'balanced';
  reasons: string[];
}

export interface Post {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl' | 'isVerified'>;
  caption: string;
  location?: string;
  visibility: PostVisibility;
  media: MediaAsset[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  comments: Comment[];
  tags: string[];
  isReel?: boolean;
  recommendationExplanation?: RecommendationExplanation;
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl' | 'isVerified'>;
  mediaUrl: string;
  resourceType: 'image' | 'video';
  durationSeconds: number;
  expiresAt: string;
  createdAt: string;
  isSeen?: boolean;
}

export interface Reel {
  id: string;
  postId: string;
  userId: string;
  user: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl' | 'isVerified'>;
  videoUrl: string;
  posterUrl: string;
  audioTrackTitle: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  viewsCount: number;
  duration: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  fromUser: Pick<User, 'id' | 'username' | 'name' | 'avatarUrl'>;
  postPreviewUrl?: string;
  postId?: string;
  reelId?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isLiked?: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface TopicAnalytics {
  tag: string;
  category: string;
  postsCount: number;
  reelsCount: number;
  viewsTotal: number;
  engagementRate: number;
  bandwidthMb: number;
  mlAffinityScore: number;
  growthVelocity: number; // e.g. +24.5%
  trend: 'up' | 'down' | 'stable';
  topPublicId?: string;
}

export interface AdminAnalytics {
  activeUsers24h: number;
  suspendedAccountsCount: number;
  totalPageViews: number;
  avgEngagementRate: number;
  bandwidthSavedGb: number;
  compressionRatio: number;
  cacheHitRatePercent: number;
  cloudinaryApiRequestsToday: number;
  topics: TopicAnalytics[];
}

export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalReels: number;
  totalMediaAssets: number;
  totalStorageBytes: number;
  bandwidthUsageGb: number;
  flaggedMediaCount: number;
  todayUploadsCount: number;
  analytics: AdminAnalytics;
}
