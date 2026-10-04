import { User, Post, Reel, Story, MediaAsset, AdminStats, Comment, UserSettings, DirectMessage, Role, NotificationItem } from './types';
import { SEED_POSTS, SEED_REELS, SEED_STORIES, SEED_USERS } from './seed-data';
import { generateUsers, UNIVERSAL_PASSWORD } from './user-generator';
import { rankFeedPostsWithML } from './recommendation';
import { getVideoPosterUrl } from './cloudinary';

// Singleton persistent store with localStorage hydration and instant reactivity
class MediaGramStore {
  private users: User[] = SEED_USERS; // 1,050+ Realistic unique accounts (singleton)
  private cachedPublicUsers: User[] | null = null;
  private posts: Post[] = [...SEED_POSTS];
  private reels: Reel[] = [...SEED_REELS];
  private stories: Story[] = [...SEED_STORIES];
  private currentUserId: string = 'usr_customer'; // Default logged in user: Normal Customer
  private authenticated: boolean = true; // Customer auth state
  private adminAuthenticated: boolean = false; // Separate Master Admin session state
  private followingUserIds: Set<string> = new Set(['usr_feat_1', 'usr_feat_2', 'usr_feat_3']); // Follow graph
  private messages: DirectMessage[] = [
    {
      id: 'dm_1',
      conversationId: 'conv_sophia',
      senderId: 'usr_feat_1', // Sophia Vance
      recipientId: 'usr_customer',
      text: 'Hey Alex! Loved your latest Shibuya reel. The color grading on Cloudinary looks super crisp! 📸',
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    },
    {
      id: 'dm_2',
      conversationId: 'conv_sophia',
      senderId: 'usr_customer',
      recipientId: 'usr_feat_1',
      text: 'Thanks Sophia! The dynamic adaptive bitrate makes a huge difference on mobile.',
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
    {
      id: 'dm_3',
      conversationId: 'conv_sophia',
      senderId: 'usr_feat_1',
      recipientId: 'usr_customer',
      text: 'Are you attending Paris fashion week next month? We should collaborate on some editorial reels! ✨',
      isRead: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
    },
    {
      id: 'dm_4',
      conversationId: 'conv_marcus',
      senderId: 'usr_feat_2', // Marcus Chen
      recipientId: 'usr_customer',
      text: 'Yo Alex, did you check the architecture shots from Singapore? Shot on Sony Alpha with the 16mm GM lens.',
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
    },
    {
      id: 'dm_5',
      conversationId: 'conv_marcus',
      senderId: 'usr_customer',
      recipientId: 'usr_feat_2',
      text: 'Yes! The symmetry in the Marina Bay photos was incredible. Uploaded master 4K directly to MediaGram!',
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
    {
      id: 'dm_6',
      conversationId: 'conv_elena',
      senderId: 'usr_feat_3', // Elena Rostova
      recipientId: 'usr_customer',
      text: 'Sending you the drone LUTs for the Iceland glacier project 🚁 Let me know what you think of the grain!',
      isRead: false,
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
    {
      id: 'dm_7',
      conversationId: 'conv_kai',
      senderId: 'usr_feat_4', // Kai Tanaka
      recipientId: 'usr_customer',
      text: 'Late night in Tokyo again! Shooting cyber neon streets 🌧️ Can’t wait to drop the new 4K reel.',
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
    },
    {
      id: 'dm_8',
      conversationId: 'conv_chloe',
      senderId: 'usr_feat_6', // Chloe Dupont
      recipientId: 'usr_customer',
      text: 'Hey Alex! Just saw the botanical illustration reel you bookmarked. The studio exhibition opens this Friday! 🎨',
      isRead: true,
      createdAt: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
    },
  ];

  private notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      userId: 'usr_customer',
      type: 'like',
      fromUser: {
        id: 'usr_feat_3',
        username: 'elena_captures',
        name: 'Elena Rostova',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
      },
      message: 'liked your post: "Neon reflections in Shinjuku..."',
      postPreviewUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&h=200&fit=crop',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: 'notif_2',
      userId: 'usr_customer',
      type: 'comment',
      fromUser: {
        id: 'usr_feat_2',
        username: 'marcus_lens',
        name: 'Marcus Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
      },
      message: 'commented: "Insane colors! That dynamic color enhancement is unreal."',
      postPreviewUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&h=200&fit=crop',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      isRead: false,
    },
    {
      id: 'notif_3',
      userId: 'usr_customer',
      type: 'like',
      fromUser: {
        id: 'usr_feat_1',
        username: 'sophia_visuals',
        name: 'Sophia Vance',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop',
      },
      message: 'liked your Reel: "Coconut Tropical Summer Mood"',
      postPreviewUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=200&h=200&fit=crop',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      isRead: true,
    },
  ];

  // Persistence / sync bookkeeping
  private hydrated = false;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private deletedPostIds: Set<string> = new Set();
  private recentlyEdited: Map<string, number> = new Map();
  private lastRemoteSync = 0;
  private remoteSyncPromise: Promise<void> | null = null;

  constructor() {
    // Hydration Safety: do NOT call loadFromStorage() in constructor during module load.
    // Client components call store.loadFromStorage() within useEffect() to ensure
    // initial SSR and client renders match 100% identically without hydration mismatch.
  }

  /** Debounced: coalesces bursts of likes/comments into a single localStorage write */
  public saveToStorage() {
    if (typeof window === 'undefined') return;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.persistNow();
    }, 500);
  }

  public persistNow() {
    if (typeof window === 'undefined') return;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    try {
      localStorage.setItem('mediagram:posts', JSON.stringify(this.posts));
      localStorage.setItem('mediagram:reels', JSON.stringify(this.reels));
      localStorage.setItem('mediagram:stories', JSON.stringify(this.stories));
      localStorage.setItem('mediagram:messages', JSON.stringify(this.messages));
      localStorage.setItem('mediagram:notifications', JSON.stringify(this.notifications));
      localStorage.setItem('mediagram:currentUserId', this.currentUserId);
      localStorage.setItem('mediagram:authenticated', JSON.stringify(this.authenticated));
      localStorage.setItem('mediagram:following', JSON.stringify(Array.from(this.followingUserIds)));
      localStorage.setItem('mediagram:deleted_posts', JSON.stringify(Array.from(this.deletedPostIds)));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  /** True when a media URL can't survive a page reload (temporary browser-only URL) */
  private isEphemeralUrl(url?: string): boolean {
    return !!url && (url.startsWith('blob:') || url.startsWith('data:video'));
  }

  /** Hydrates once per page session; the in-memory singleton is the source of truth afterwards */
  public loadFromStorage() {
    if (typeof window === 'undefined') return;
    if (this.hydrated) return;
    this.hydrated = true;

    // Make sure pending changes are flushed when the tab is hidden/closed
    window.addEventListener('beforeunload', () => this.persistNow());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.persistNow();
    });

    try {
      const storedDeleted = localStorage.getItem('mediagram:deleted_posts');
      if (storedDeleted) {
        try {
          const parsed = JSON.parse(storedDeleted);
          if (Array.isArray(parsed)) this.deletedPostIds = new Set(parsed);
        } catch {}
      }

      const storedPosts = localStorage.getItem('mediagram:posts');
      if (storedPosts) {
        try {
          const parsed = JSON.parse(storedPosts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Drop posts whose media only existed as a temporary blob: URL (they can never play again)
            this.posts = parsed.filter(
              (p: Post) =>
                !this.deletedPostIds.has(p.id) &&
                !(p.media || []).some((m) => this.isEphemeralUrl(m.originalUrl) || this.isEphemeralUrl(m.optimizedUrl))
            );
          }
        } catch {}
      }

      const storedReels = localStorage.getItem('mediagram:reels');
      if (storedReels) {
        try {
          const parsed = JSON.parse(storedReels);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const livePostIds = new Set(this.posts.map((p) => p.id));
            this.reels = parsed.filter(
              (r: Reel) =>
                !this.isEphemeralUrl(r.videoUrl) &&
                !this.deletedPostIds.has(r.postId) &&
                // reels created from uploaded posts must still have their post
                (!r.postId || !r.postId.startsWith('post_') || livePostIds.has(r.postId) || !r.id.startsWith('reel_'))
            );
          }
        } catch {}
      }

      const storedStories = localStorage.getItem('mediagram:stories');
      if (storedStories) {
        try {
          const parsed = JSON.parse(storedStories);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.stories = parsed.filter((s: Story) => !this.isEphemeralUrl(s.mediaUrl));
          }
        } catch {}
      }

      const msgs = localStorage.getItem('mediagram:messages');
      if (msgs) this.messages = JSON.parse(msgs);
      const notifs = localStorage.getItem('mediagram:notifications');
      if (notifs) this.notifications = JSON.parse(notifs);
      const cur = localStorage.getItem('mediagram:currentUserId');
      if (cur) this.currentUserId = cur;
      const auth = localStorage.getItem('mediagram:authenticated');
      if (auth) this.authenticated = JSON.parse(auth);
      const storedFollowing = localStorage.getItem('mediagram:following');
      if (storedFollowing) {
        try {
          const parsed = JSON.parse(storedFollowing);
          if (Array.isArray(parsed)) {
            this.followingUserIds = new Set(parsed);
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Storage load failed:', e);
    }
  }

  private emitUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
  }

  // --- Public shared posts (stored on Cloudinary, visible to every visitor) ---
  private isRemotePost(post: Post): boolean {
    const m = post.media?.[0];
    return !!m && !!m.publicId && m.publicId.startsWith('mediagram/users/') && !String(m.assetId).startsWith('local_');
  }

  private reelFromPost(post: Post): Reel | null {
    const vid = post.media?.[0];
    if (!vid || vid.resourceType !== 'video') return null;
    return {
      id: `reel_${post.id}`,
      postId: post.id,
      userId: post.userId,
      user: post.user,
      videoUrl: vid.optimizedUrl || vid.originalUrl,
      posterUrl: vid.thumbnailUrl || getVideoPosterUrl(vid.originalUrl),
      audioTrackTitle: `${post.user.name} · Original Audio`,
      caption: post.caption,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      viewsCount: 1,
      duration: vid.duration || 15,
      isLiked: false,
      isBookmarked: false,
      createdAt: post.createdAt,
    };
  }

  private async publishPostRemote(post: Post, audioTrackTitle?: string, attempt = 0): Promise<void> {
    if (typeof window === 'undefined' || !this.isRemotePost(post)) return;
    const m = post.media[0];
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: m.publicId,
          resourceType: m.resourceType,
          postId: post.id,
          caption: post.caption,
          location: post.location,
          tags: post.tags,
          audioTrackTitle,
          user: post.user,
        }),
      });
      if (!res.ok) throw new Error(`Publish failed (${res.status})`);
      this.lastRemoteSync = 0; // next sync picks up the freshly published post
    } catch (e) {
      if (attempt < 3) {
        setTimeout(() => this.publishPostRemote(post, audioTrackTitle, attempt + 1), 1500 * (attempt + 1));
      } else {
        console.warn('Could not publish post to the public feed:', e);
      }
    }
  }

  /**
   * Pulls every public post from the shared backend and merges it into the local store.
   * Safe to call often: single-flight + 15s throttle.
   */
  public syncRemotePosts(force = false): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (this.remoteSyncPromise) return this.remoteSyncPromise;
    if (!force && Date.now() - this.lastRemoteSync < 15000) return Promise.resolve();

    this.remoteSyncPromise = (async () => {
      try {
        const res = await fetch('/api/posts', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.success || !Array.isArray(data.posts)) return;
        this.lastRemoteSync = Date.now();

        const remote: Post[] = data.posts;
        const remoteIds = new Set(remote.map((p) => p.id));
        const now = Date.now();
        let changed = false;

        const localIndex = new Map<string, number>();
        this.posts.forEach((p, i) => localIndex.set(p.id, i));

        const toAdd: Post[] = [];
        for (const rp of remote) {
          if (this.deletedPostIds.has(rp.id)) continue;
          const idx = localIndex.get(rp.id);
          if (idx === undefined) {
            toAdd.push(rp);
            continue;
          }
          const lp = this.posts[idx];
          const editedAt = this.recentlyEdited.get(rp.id) || 0;
          if (now - editedAt < 2 * 60 * 1000) continue; // don't overwrite a just-saved local edit with a cached copy
          if (
            lp.caption !== rp.caption ||
            (lp.location || '') !== (rp.location || '') ||
            (lp.tags || []).join(',') !== (rp.tags || []).join(',') ||
            lp.media[0]?.optimizedUrl !== rp.media[0]?.optimizedUrl
          ) {
            this.posts[idx] = { ...lp, caption: rp.caption, location: rp.location, tags: rp.tags, media: rp.media };
            const reel = this.reels.find((r) => r.postId === rp.id);
            if (reel) reel.caption = rp.caption;
            changed = true;
          }
        }

        if (toAdd.length > 0) {
          this.posts.unshift(...toAdd);
          for (const p of toAdd) {
            const reel = this.reelFromPost(p);
            if (reel && !this.reels.some((r) => r.postId === p.id)) this.reels.unshift(reel);
          }
          changed = true;
        }

        // Posts deleted from another device disappear here too (only when the list isn't truncated)
        if (!data.truncated) {
          const gone = new Set<string>();
          for (const p of this.posts) {
            if (
              this.isRemotePost(p) &&
              !remoteIds.has(p.id) &&
              now - new Date(p.createdAt).getTime() > 3 * 60 * 1000
            ) {
              gone.add(p.id);
            }
          }
          if (gone.size > 0) {
            this.posts = this.posts.filter((p) => !gone.has(p.id));
            this.reels = this.reels.filter((r) => !gone.has(r.postId));
            changed = true;
          }
        }

        if (changed) {
          this.saveToStorage();
          this.emitUpdate();
        }
      } catch (e) {
        console.warn('Public post sync skipped:', e);
      } finally {
        this.remoteSyncPromise = null;
      }
    })();

    return this.remoteSyncPromise;
  }

  // --- Normal Customer Auth ---
  isLoggedIn(): boolean {
    return this.authenticated;
  }

  login(identifier: string, password?: string): { success: boolean; user?: User; error?: string } {
    const cleanId = identifier.trim().toLowerCase().replace('@', '');
    if (!cleanId) {
      return { success: false, error: 'Please enter your username or email.' };
    }

    // Normal consumer login matches any of the 1,000+ non-admin user accounts
    const user = this.users.find(
      u => (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) && u.role !== 'ADMIN'
    );

    if (!user) {
      return {
        success: false,
        error: `Account "@${cleanId}" not found. Please check your username.`
      };
    }

    if (user.status === 'suspended') {
      return { success: false, error: 'This account has been suspended by the platform administrator.' };
    }

    // Password verification: checks against universal password 'password123'
    if (password && password.trim() !== '') {
      const cleanPw = password.trim();
      const expectedPw = user.password || UNIVERSAL_PASSWORD;
      if (cleanPw !== expectedPw && cleanPw !== UNIVERSAL_PASSWORD) {
        return {
          success: false,
          error: 'Incorrect password. Please try again.'
        };
      }
    }

    this.currentUserId = user.id;
    this.authenticated = true;
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return { success: true, user };
  }

  getUniversalPassword(): string {
    return UNIVERSAL_PASSWORD;
  }

  logout() {
    this.authenticated = false;
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
  }

  // --- Master Admin Auth (Completely Separate URL & Session) ---
  isAdminLoggedIn(): boolean {
    return this.adminAuthenticated;
  }

  loginAdmin(key?: string): { success: boolean; error?: string } {
    this.adminAuthenticated = true;
    return { success: true };
  }

  logoutAdmin() {
    this.adminAuthenticated = false;
  }

  getPublicUsers(): User[] {
    if (!this.cachedPublicUsers) {
      this.cachedPublicUsers = this.users.filter(u => u.role !== 'ADMIN');
    }
    return this.cachedPublicUsers;
  }

  getSuggestedUsers(count = 3): User[] {
    const curId = this.currentUserId;
    const result: User[] = [];
    for (let i = 0; i < this.users.length; i++) {
      const u = this.users[i];
      if (u.id !== curId && u.role !== 'ADMIN') {
        result.push(u);
        if (result.length >= count) break;
      }
    }
    return result;
  }

  // --- Current User & Account Switcher ---
  getCurrentUser(): User {
    return this.users.find(u => u.id === this.currentUserId) || this.users[0];
  }

  setCurrentUser(userId: string): User | null {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      if (user.status === 'suspended') {
        throw new Error('This account is suspended and cannot be accessed.');
      }
      this.currentUserId = userId;
      this.authenticated = true;
      this.saveToStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
      }
      return user;
    }
    return null;
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  // --- Follow Graph Management ---
  isFollowing(userId: string): boolean {
    return this.followingUserIds.has(userId);
  }

  toggleFollow(targetUserId: string): boolean {
    if (targetUserId === this.currentUserId) return false;
    const currentUser = this.getCurrentUser();
    const targetUser = this.users.find(u => u.id === targetUserId);

    let isNowFollowing: boolean;
    if (this.followingUserIds.has(targetUserId)) {
      this.followingUserIds.delete(targetUserId);
      isNowFollowing = false;
      currentUser.followingCount = Math.max(0, (currentUser.followingCount || 0) - 1);
      if (targetUser) {
        targetUser.followersCount = Math.max(0, (targetUser.followersCount || 0) - 1);
      }
    } else {
      this.followingUserIds.add(targetUserId);
      isNowFollowing = true;
      currentUser.followingCount = (currentUser.followingCount || 0) + 1;
      if (targetUser) {
        targetUser.followersCount = (targetUser.followersCount || 0) + 1;
        // Dispatch instant notification
        this.notifications.unshift({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: targetUserId,
          type: 'follow',
          fromUser: {
            id: currentUser.id,
            username: currentUser.username,
            name: currentUser.name,
            avatarUrl: currentUser.avatarUrl,
          },
          message: 'started following you.',
          createdAt: new Date().toISOString(),
          isRead: false,
        });
      }
    }

    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return isNowFollowing;
  }

  createUser(userData: { username: string; name: string; email: string; role: Role }): User {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      username: userData.username.replace('@', '').toLowerCase(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&h=300&fit=crop',
      coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&h=400&fit=crop',
      isVerified: false,
      status: 'active',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date().toISOString(),
      settings: {
        isPrivateAccount: false,
        showActivityStatus: true,
        allowTaggingFrom: 'everyone',
        pauseNotifications: false,
        likesNotifications: true,
        commentsNotifications: true,
        messagesNotifications: true,
        cloudinaryAutoCompress: true,
        highQualityUploads: true,
      },
    };
    this.users.push(newUser);
    return newUser;
  }

  // --- Admin User Governance (Suspend / Ban / Unsuspend) ---
  suspendUser(userId: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (user && user.role !== 'ADMIN') {
      user.status = 'suspended';
      return true;
    }
    return false;
  }

  unsuspendUser(userId: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.status = 'active';
      return true;
    }
    return false;
  }

  updateUserProfile(data: Partial<User>): User {
    const user = this.getCurrentUser();
    if (data.name) user.name = data.name;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.website !== undefined) user.website = data.website;
    if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
    if (data.coverUrl) user.coverUrl = data.coverUrl;
    return user;
  }

  updateUserSettings(settings: Partial<UserSettings>): UserSettings {
    const user = this.getCurrentUser();
    if (!user.settings) {
      user.settings = {
        isPrivateAccount: false,
        showActivityStatus: true,
        allowTaggingFrom: 'everyone',
        pauseNotifications: false,
        likesNotifications: true,
        commentsNotifications: true,
        messagesNotifications: true,
        cloudinaryAutoCompress: true,
        highQualityUploads: true,
      };
    }
    user.settings = { ...user.settings, ...settings };
    return user.settings;
  }

  // --- Search Users, Posts, & Hashtags ---
  search(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { users: [], posts: [], tags: [] };

    const curId = this.currentUserId;
    const matchedUsers: User[] = [];
    for (let i = 0; i < this.users.length; i++) {
      const u = this.users[i];
      if (u.role === 'ADMIN' || u.id === curId) continue;
      if (
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q)) ||
        (u.interestTags && u.interestTags.some(t => t.toLowerCase().includes(q)))
      ) {
        matchedUsers.push(u);
        if (matchedUsers.length >= 24) break;
      }
    }

    const matchedPosts: Post[] = [];
    for (let i = 0; i < this.posts.length; i++) {
      const p = this.posts[i];
      if (p.caption.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q))) {
        matchedPosts.push(p);
        if (matchedPosts.length >= 24) break;
      }
    }

    const matchedTags = Array.from(
      new Set(this.posts.flatMap(p => p.tags).filter(t => t.toLowerCase().includes(q)))
    ).slice(0, 10);

    return { users: matchedUsers, posts: matchedPosts, tags: matchedTags };
  }

  searchUsers(query: string, limit = 50): User[] {
    const q = query.toLowerCase().trim();
    const curId = this.currentUserId;
    const results: User[] = [];

    for (let i = 0; i < this.users.length; i++) {
      const u = this.users[i];
      if (u.role === 'ADMIN' || u.id === curId) continue;
      if (!q) {
        results.push(u);
        if (results.length >= limit) break;
        continue;
      }
      if (
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q)) ||
        (u.interestTags && u.interestTags.some(t => t.toLowerCase().includes(q)))
      ) {
        results.push(u);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  // --- Direct Messages & Conversations List ---
  getConversations(): { partner: User; lastMessage: DirectMessage; unreadCount: number }[] {
    const currentId = this.currentUserId;
    const conversationMap = new Map<string, { partnerId: string; lastMessage: DirectMessage; unreadCount: number }>();

    for (const msg of this.messages) {
      if (msg.senderId !== currentId && msg.recipientId !== currentId) continue;
      const partnerId = msg.senderId === currentId ? msg.recipientId : msg.senderId;

      const existing = conversationMap.get(partnerId);
      const isUnread = !msg.isRead && msg.recipientId === currentId;

      if (!existing || new Date(msg.createdAt).getTime() > new Date(existing.lastMessage.createdAt).getTime()) {
        conversationMap.set(partnerId, {
          partnerId,
          lastMessage: msg,
          unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
        });
      } else if (isUnread) {
        existing.unreadCount++;
      }
    }

    const results: { partner: User; lastMessage: DirectMessage; unreadCount: number }[] = [];
    conversationMap.forEach(({ partnerId, lastMessage, unreadCount }) => {
      const partner = this.users.find(u => u.id === partnerId && u.role !== 'ADMIN');
      if (partner) {
        results.push({ partner, lastMessage, unreadCount });
      }
    });

    return results.sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }

  getDirectMessages(partnerId: string): DirectMessage[] {
    const currentId = this.currentUserId;
    return this.messages
      .filter(
        m =>
          (m.senderId === currentId && m.recipientId === partnerId) ||
          (m.senderId === partnerId && m.recipientId === currentId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  sendDirectMessage(params: {
    senderId?: string;
    recipientId: string;
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
  }): DirectMessage {
    const senderId = params.senderId || this.currentUserId;
    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: `conv_${[senderId, params.recipientId].sort().join('_')}`,
      senderId,
      recipientId: params.recipientId,
      text: params.text,
      mediaUrl: params.mediaUrl,
      mediaType: params.mediaType,
      isLiked: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return newMsg;
  }

  toggleLikeMessage(messageId: string): boolean {
    const msg = this.messages.find(m => m.id === messageId);
    if (msg) {
      msg.isLiked = !msg.isLiked;
      this.saveToStorage();
      return msg.isLiked;
    }
    return false;
  }

  markConversationAsRead(partnerId: string): void {
    let updated = false;
    for (const msg of this.messages) {
      if (msg.senderId === partnerId && msg.recipientId === this.currentUserId && !msg.isRead) {
        msg.isRead = true;
        updated = true;
      }
    }
    if (updated) {
      this.saveToStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
      }
    }
  }

  getTotalUnreadMessagesCount(): number {
    return this.messages.filter(
      m => m.recipientId === this.currentUserId && !m.isRead
    ).length;
  }

  // --- Posts & Feed (Dynamic Instagram-Style Discovery & ML Ranking) ---
  getRandomizedPosts(userId?: string): Post[] {
    const user = userId ? this.users.find(u => u.id === userId) || this.getCurrentUser() : this.getCurrentUser();
    // Compute ML scores for personalized insight explanations
    const mlRanked = rankFeedPostsWithML(this.posts, user);

    // Dynamic Fisher-Yates shuffle: every refresh and shuffle yields a fresh, randomized mix of posts & reels
    const shuffled = [...mlRanked];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    return shuffled;
  }

  getPosts(randomize: boolean = false): Post[] {
    if (randomize) {
      return this.getRandomizedPosts();
    }
    const currentUser = this.getCurrentUser();
    return rankFeedPostsWithML(this.posts, currentUser);
  }

  getRawPosts(): Post[] {
    return this.posts;
  }

  getPostById(id: string): Post | undefined {
    return this.posts.find(p => p.id === id);
  }

  createPost(data: {
    caption: string;
    location?: string;
    media: MediaAsset[];
    tags?: string[];
    isReel?: boolean;
    audioTrackTitle?: string;
  }): Post {
    const currentUser = this.getCurrentUser();
    if (currentUser.status === 'suspended') {
      throw new Error('Your account is suspended. You cannot post media.');
    }

    const newPostId = `post_${Date.now()}`;
    const isVideo =
      Boolean(data.isReel) ||
      data.media.some(
        (m) =>
          m.resourceType === 'video' ||
          (m.originalUrl && m.originalUrl.toLowerCase().includes('.mp4'))
      );

    const newPost: Post = {
      id: newPostId,
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      caption: data.caption,
      location: data.location,
      visibility: currentUser.settings?.isPrivateAccount ? 'followers' : 'public',
      media: data.media,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      isLiked: false,
      isBookmarked: false,
      tags: data.tags || [],
      isReel: isVideo,
      comments: [],
      createdAt: new Date().toISOString(),
    };

    this.posts.unshift(newPost);
    currentUser.postsCount = (currentUser.postsCount || 0) + 1;
    const authorInList = this.users.find((u) => u.id === currentUser.id);
    if (authorInList) {
      authorInList.postsCount = (authorInList.postsCount || 0) + 1;
    }

    // If it's a Reel, also add to reels feed
    if (isVideo && data.media[0]) {
      const vidAsset = data.media[0];
      const poster =
        vidAsset.thumbnailUrl && !vidAsset.thumbnailUrl.toLowerCase().includes('.mp4')
          ? vidAsset.thumbnailUrl
          : getVideoPosterUrl(vidAsset.originalUrl || vidAsset.optimizedUrl);

      const newReel: Reel = {
        id: `reel_${Date.now()}`,
        postId: newPostId,
        userId: currentUser.id,
        user: {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
          isVerified: currentUser.isVerified,
        },
        videoUrl: vidAsset.optimizedUrl || vidAsset.originalUrl,
        posterUrl: poster,
        audioTrackTitle: data.audioTrackTitle || `${currentUser.name} · Original Audio`,
        caption: data.caption,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 1,
        duration: vidAsset.duration || 15,
        isLiked: false,
        isBookmarked: false,
        createdAt: new Date().toISOString(),
      };
      this.reels.unshift(newReel);
    }

    this.saveToStorage();
    this.emitUpdate();

    // Publish to the shared public feed in the background (retries automatically)
    void this.publishPostRemote(newPost, data.audioTrackTitle);

    return newPost;
  }

  /** Owner-only: edit caption / location / tags of a post */
  updatePost(postId: string, changes: { caption?: string; location?: string; tags?: string[] }): Post {
    const idx = this.posts.findIndex((p) => p.id === postId);
    if (idx === -1) throw new Error('Post not found');
    const existing = this.posts[idx];
    if (existing.userId !== this.currentUserId) {
      throw new Error('You can only edit your own posts.');
    }

    const updated: Post = {
      ...existing,
      caption: changes.caption !== undefined ? changes.caption : existing.caption,
      location: changes.location !== undefined ? changes.location || undefined : existing.location,
      tags: changes.tags !== undefined ? changes.tags : existing.tags,
    };
    // New object identity so memoized views re-render
    this.posts[idx] = updated;

    const reel = this.reels.find((r) => r.postId === postId);
    if (reel) reel.caption = updated.caption;

    this.recentlyEdited.set(postId, Date.now());
    this.saveToStorage();
    this.emitUpdate();

    if (this.isRemotePost(updated)) {
      const m = updated.media[0];
      fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: m.publicId,
          resourceType: m.resourceType,
          userId: updated.userId,
          caption: updated.caption,
          location: updated.location || '',
          tags: updated.tags,
        }),
      }).catch((e) => console.warn('Could not sync edit to the public feed:', e));
    }

    return updated;
  }

  /** Removes a post locally and (for public posts) deletes the stored media from the cloud */
  private removePost(postId: string): boolean {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return false;

    this.posts = this.posts.filter((p) => p.id !== postId);
    this.reels = this.reels.filter((r) => r.postId !== postId);
    this.deletedPostIds.add(postId);

    const author = this.users.find((u) => u.id === post.userId);
    if (author && author.postsCount > 0) author.postsCount -= 1;

    this.saveToStorage();
    this.emitUpdate();

    if (this.isRemotePost(post)) {
      const m = post.media[0];
      fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: m.publicId, resourceType: m.resourceType, userId: post.userId }),
      }).catch((e) => console.warn('Could not delete cloud media:', e));
    }
    return true;
  }

  /** Owner-only: permanently delete a post */
  deletePost(postId: string): boolean {
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return false;
    if (post.userId !== this.currentUserId) {
      throw new Error('You can only delete your own posts.');
    }
    return this.removePost(postId);
  }


  toggleLikePost(postId: string): { isLiked: boolean; likesCount: number } {
    const canonicalId = postId.split('_rpt_')[0];
    const post = this.posts.find(p => p.id === canonicalId || p.id === postId);
    if (!post) throw new Error('Post not found');

    post.isLiked = !post.isLiked;
    post.likesCount += post.isLiked ? 1 : -1;

    const currentUser = this.getCurrentUser();
    // If post is liked, create notification for author
    if (post.isLiked && post.userId !== currentUser.id) {
      this.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: post.userId,
        type: 'like',
        fromUser: {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
        postId: post.id,
        postPreviewUrl: post.media[0]?.thumbnailUrl || post.media[0]?.optimizedUrl,
        message: `liked your post: "${(post.caption || 'Photo').substring(0, 32)}..."`,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    }

    const reel = this.reels.find(r => r.postId === canonicalId || r.postId === postId);
    if (reel) {
      reel.isLiked = post.isLiked;
      reel.likesCount = post.likesCount;
    }

    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return { isLiked: post.isLiked, likesCount: post.likesCount };
  }

  toggleBookmarkPost(postId: string): boolean {
    const canonicalId = postId.split('_rpt_')[0];
    const post = this.posts.find(p => p.id === canonicalId || p.id === postId);
    if (!post) throw new Error('Post not found');
    post.isBookmarked = !post.isBookmarked;

    const reel = this.reels.find(r => r.postId === canonicalId || r.postId === postId);
    if (reel) reel.isBookmarked = post.isBookmarked;

    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return post.isBookmarked;
  }

  addComment(postId: string, content: string): Comment {
    const canonicalId = postId.split('_rpt_')[0];
    const post = this.posts.find(p => p.id === canonicalId || p.id === postId);
    if (!post) throw new Error('Post not found');

    const currentUser = this.getCurrentUser();
    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      postId,
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      content,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    post.comments.push(newComment);
    post.commentsCount += 1;

    const reel = this.reels.find(r => r.postId === postId);
    if (reel) reel.commentsCount += 1;

    // Create notification for post author
    if (post.userId !== currentUser.id) {
      this.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: post.userId,
        type: 'comment',
        fromUser: {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
        postId: post.id,
        postPreviewUrl: post.media[0]?.thumbnailUrl,
        message: `commented: "${content.substring(0, 32)}..."`,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    }

    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return newComment;
  }

  // --- Reels ---
  getReels(): Reel[] {
    return this.reels;
  }

  /**
   * DSA Algorithm: Modern Fisher-Yates (Knuth) in-place shuffle (O(N) time, O(1) auxiliary space)
   * with Derangement Guarantee: Ensures the first video at the top of the feed is guaranteed to be
   * fresh and different from the currently active reel.
   */
  getRandomizedReels(currentReelId?: string): Reel[] {
    if (this.reels.length <= 1) return [...this.reels];

    const shuffled = [...this.reels];
    const n = shuffled.length;

    // Fisher-Yates linear O(N) shuffle across ALL reels
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    // Derangement Guarantee: Swap element at 0 if it matches the current active reel
    if (currentReelId && shuffled[0]?.id === currentReelId && n > 1) {
      const swapIndex = 1 + Math.floor(Math.random() * (n - 1));
      const temp = shuffled[0];
      shuffled[0] = shuffled[swapIndex];
      shuffled[swapIndex] = temp;
    }

    return shuffled;
  }

  /**
   * Endless Infinite Reels Algorithm:
   * 1. Unwatched reels are served in randomized order.
   * 2. Watched reels repeat occasionally while browsing (~18% chance).
   * 3. Once all catalog reels are watched, the cycle resets and repeats all reels.
   * Ensures an infinite stream with zero dead ends.
   */
  getNextInfiniteReelsBatch(
    watchedReelIds: Set<string>,
    batchSize: number = 8
  ): { nextBatch: Reel[]; updatedWatched: Set<string> } {
    const allReels = this.reels;
    if (allReels.length === 0) return { nextBatch: [], updatedWatched: watchedReelIds };

    const updatedWatched = new Set(watchedReelIds);
    let unwatched = allReels.filter((r) => !updatedWatched.has(r.id));

    // If all catalog reels have been watched, reset the cycle to repeat all reels
    if (unwatched.length === 0) {
      updatedWatched.clear();
      unwatched = [...allReels];
    }

    // Shuffle unwatched candidates (Fisher-Yates)
    for (let i = unwatched.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = unwatched[i];
      unwatched[i] = unwatched[j];
      unwatched[j] = t;
    }

    const nextBatch: Reel[] = [];
    const watchedArray = Array.from(watchedReelIds);

    for (let i = 0; i < batchSize; i++) {
      // 18% chance to occasionally repeat a watched reel while watching (if at least 3 have been watched)
      const shouldRepeatWatched = watchedArray.length >= 3 && Math.random() < 0.18;

      if (shouldRepeatWatched) {
        const repeatCandidateId = watchedArray[Math.floor(Math.random() * watchedArray.length)];
        const baseReel = allReels.find((r) => r.id === repeatCandidateId);
        if (baseReel) {
          nextBatch.push({
            ...baseReel,
            id: `${baseReel.id}_rpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          });
          continue;
        }
      }

      if (unwatched.length === 0) {
        // All reels watched in this run! Reset cycle so reels repeat endlessly
        updatedWatched.clear();
        unwatched = [...allReels].sort(() => Math.random() - 0.5);
      }

      const nextReel = unwatched.pop();
      if (nextReel) {
        updatedWatched.add(nextReel.id);
        nextBatch.push({
          ...nextReel,
          id: `${nextReel.id}_rpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        });
      }
    }

    return { nextBatch, updatedWatched };
  }

  /**
   * Endless Infinite Posts Feed Algorithm:
   * Unlimited scrolling for home feed (matching Reels stream behavior):
   * 1. Unseen posts are served in randomized order.
   * 2. Seen posts repeat occasionally while browsing (~15% chance).
   * 3. Once all catalog posts have been served, the cycle resets and repeats with fresh repeat keys.
   * Ensures an infinite stream with zero dead ends.
   */
  getNextInfinitePostsBatch(
    seenPostIds: Set<string>,
    batchSize: number = 6
  ): { nextBatch: Post[]; updatedSeen: Set<string> } {
    const allPosts = this.posts;
    if (allPosts.length === 0) return { nextBatch: [], updatedSeen: seenPostIds };

    const updatedSeen = new Set(seenPostIds);
    let unseen = allPosts.filter((p) => !updatedSeen.has(p.id));

    // If all catalog posts have been seen, reset the cycle to repeat all posts
    if (unseen.length === 0) {
      updatedSeen.clear();
      unseen = [...allPosts];
    }

    // Shuffle unseen candidates (Fisher-Yates)
    for (let i = unseen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = unseen[i];
      unseen[i] = unseen[j];
      unseen[j] = t;
    }

    const nextBatch: Post[] = [];
    const seenArray = Array.from(seenPostIds);

    for (let i = 0; i < batchSize; i++) {
      // 15% chance to occasionally repeat a seen post while browsing (if at least 4 have been seen)
      const shouldRepeatSeen = seenArray.length >= 4 && Math.random() < 0.15;

      if (shouldRepeatSeen) {
        const repeatCandidateId = seenArray[Math.floor(Math.random() * seenArray.length)].split('_rpt_')[0];
        const basePost = allPosts.find((p) => p.id === repeatCandidateId);
        if (basePost) {
          nextBatch.push({
            ...basePost,
            id: `${basePost.id}_rpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          });
          continue;
        }
      }

      if (unseen.length === 0) {
        updatedSeen.clear();
        unseen = [...allPosts].sort(() => Math.random() - 0.5);
      }

      const nextPost = unseen.pop();
      if (nextPost) {
        updatedSeen.add(nextPost.id);
        nextBatch.push({
          ...nextPost,
          id: `${nextPost.id}_rpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        });
      }
    }

    return { nextBatch, updatedSeen };
  }

  toggleLikeReel(reelId: string): { isLiked: boolean; likesCount: number } {
    const canonicalId = reelId.split('_rpt_')[0];
    const reel = this.reels.find((r) => r.id === canonicalId || r.id === reelId);
    if (!reel) throw new Error('Reel not found');

    reel.isLiked = !reel.isLiked;
    reel.likesCount += reel.isLiked ? 1 : -1;

    const currentUser = this.getCurrentUser();
    // If reel is liked, create notification for reel author
    if (reel.isLiked && reel.userId !== currentUser.id) {
      this.notifications.unshift({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: reel.userId,
        type: 'like',
        fromUser: {
          id: currentUser.id,
          username: currentUser.username,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
        reelId: reel.id,
        postPreviewUrl: reel.posterUrl,
        message: `liked your Reel: "${(reel.caption || 'Video Reel').substring(0, 32)}..."`,
        createdAt: new Date().toISOString(),
        isRead: false,
      });
    }

    const post = this.posts.find(p => p.id === reel.postId);
    if (post) {
      post.isLiked = reel.isLiked;
      post.likesCount = reel.likesCount;
    }

    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return { isLiked: reel.isLiked, likesCount: reel.likesCount };
  }

  // --- Notifications ---
  getNotifications(userId?: string): NotificationItem[] {
    const targetUserId = userId || this.currentUserId;
    return this.notifications.filter(n => n.userId === targetUserId);
  }

  getUnreadNotificationsCount(userId?: string): number {
    const targetUserId = userId || this.currentUserId;
    return this.notifications.filter(n => n.userId === targetUserId && !n.isRead).length;
  }

  markNotificationsAsRead(userId?: string): void {
    const targetUserId = userId || this.currentUserId;
    let updated = false;
    for (const notif of this.notifications) {
      if (notif.userId === targetUserId && !notif.isRead) {
        notif.isRead = true;
        updated = true;
      }
    }
    if (updated) {
      this.saveToStorage();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
      }
    }
  }

  // --- Stories ---
  getStories(): Story[] {
    return this.stories;
  }

  markStorySeen(storyId: string) {
    const story = this.stories.find(s => s.id === storyId);
    if (story) story.isSeen = true;
  }

  createStory(mediaUrl: string, resourceType: 'image' | 'video' = 'image'): Story {
    const currentUser = this.getCurrentUser();
    const newStory: Story = {
      id: `story_${Date.now()}`,
      userId: currentUser.id,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        isVerified: currentUser.isVerified,
      },
      mediaUrl,
      resourceType,
      durationSeconds: resourceType === 'video' ? 15 : 6,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isSeen: false,
    };
    this.stories.unshift(newStory);
    this.saveToStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    }
    return newStory;
  }

  // --- Media Library ---
  getAllMediaAssets(): MediaAsset[] {
    const assets: MediaAsset[] = [];
    for (const post of this.posts) {
      if (post.media) {
        assets.push(...post.media);
      }
    }
    return assets;
  }

  getUserMediaAssets(userId: string): MediaAsset[] {
    return this.getAllMediaAssets().filter(m => m.userId === userId);
  }

  deleteMediaAsset(assetId: string): boolean {
    for (const post of this.posts) {
      const idx = post.media.findIndex(m => m.id === assetId || m.assetId === assetId);
      if (idx !== -1) {
        post.media.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  // --- Admin Command Center & Deep Analytics ---
  getAdminStats(): AdminStats {
    const allMedia = this.getAllMediaAssets();
    const totalBytes = allMedia.reduce((acc, m) => acc + (m.bytes || 450000), 0) + 24500000;
    const suspendedCount = this.users.filter(u => u.status === 'suspended').length;

    return {
      totalUsers: this.users.length,
      totalPosts: this.posts.length,
      totalReels: this.reels.length,
      totalMediaAssets: allMedia.length + 18,
      totalStorageBytes: totalBytes,
      bandwidthUsageGb: 9.4,
      flaggedMediaCount: 1,
      todayUploadsCount: 14,
      analytics: {
        activeUsers24h: 2,
        suspendedAccountsCount: suspendedCount,
        totalPageViews: 14280,
        avgEngagementRate: 6.8,
        bandwidthSavedGb: 14.2, // saved via Cloudinary q_auto & f_auto
        compressionRatio: 64.5, // 64.5% payload reduction
        cacheHitRatePercent: 98.4, // CDN edge cache hit
        cloudinaryApiRequestsToday: 184,
        topics: [
          {
            tag: 'technology',
            category: 'Tech & AI',
            postsCount: 16,
            reelsCount: 8,
            viewsTotal: 64200,
            engagementRate: 9.4,
            bandwidthMb: 4820,
            mlAffinityScore: 0.98,
            growthVelocity: 38.4,
            trend: 'up',
            topPublicId: 'beesocial/posts/cyberpunk_desk',
          },
          {
            tag: 'tokyo',
            category: 'Cityscapes & Neon',
            postsCount: 14,
            reelsCount: 6,
            viewsTotal: 52900,
            engagementRate: 8.6,
            bandwidthMb: 3640,
            mlAffinityScore: 0.94,
            growthVelocity: 28.1,
            trend: 'up',
            topPublicId: 'beesocial/posts/tokyo_shibuya',
          },
          {
            tag: 'cinema',
            category: 'Cinematography & 4K',
            postsCount: 11,
            reelsCount: 7,
            viewsTotal: 41800,
            engagementRate: 8.9,
            bandwidthMb: 3950,
            mlAffinityScore: 0.91,
            growthVelocity: 22.5,
            trend: 'up',
            topPublicId: 'beesocial/posts/cinema_rig',
          },
          {
            tag: 'cyberpunk',
            category: 'Sci-Fi Aesthetics',
            postsCount: 10,
            reelsCount: 5,
            viewsTotal: 36700,
            engagementRate: 7.9,
            bandwidthMb: 2420,
            mlAffinityScore: 0.88,
            growthVelocity: 19.3,
            trend: 'up',
            topPublicId: 'beesocial/posts/cyberpunk_neon',
          },
          {
            tag: 'travel',
            category: 'Adventure & Nature',
            postsCount: 12,
            reelsCount: 4,
            viewsTotal: 34500,
            engagementRate: 7.2,
            bandwidthMb: 2180,
            mlAffinityScore: 0.82,
            growthVelocity: 15.6,
            trend: 'up',
            topPublicId: 'beesocial/posts/alps_lake',
          },
          {
            tag: 'fitness',
            category: 'Health & Movement',
            postsCount: 8,
            reelsCount: 4,
            viewsTotal: 29400,
            engagementRate: 8.4,
            bandwidthMb: 1980,
            mlAffinityScore: 0.84,
            growthVelocity: 24.2,
            trend: 'up',
            topPublicId: 'beesocial/posts/fitness_workout',
          },
          {
            tag: 'fashion',
            category: 'Streetwear & Design',
            postsCount: 9,
            reelsCount: 3,
            viewsTotal: 31200,
            engagementRate: 7.5,
            bandwidthMb: 2040,
            mlAffinityScore: 0.79,
            growthVelocity: 16.8,
            trend: 'stable',
            topPublicId: 'beesocial/posts/fashion_street',
          },
          {
            tag: 'surfing',
            category: 'Ocean & Extreme',
            postsCount: 7,
            reelsCount: 3,
            viewsTotal: 26800,
            engagementRate: 6.8,
            bandwidthMb: 1720,
            mlAffinityScore: 0.74,
            growthVelocity: 11.4,
            trend: 'stable',
            topPublicId: 'beesocial/posts/surfing_wave',
          },
          {
            tag: 'food',
            category: 'Culinary & Coffee',
            postsCount: 8,
            reelsCount: 2,
            viewsTotal: 24900,
            engagementRate: 7.1,
            bandwidthMb: 1480,
            mlAffinityScore: 0.72,
            growthVelocity: 13.9,
            trend: 'stable',
            topPublicId: 'beesocial/posts/matcha_art',
          },
          {
            tag: 'mountains',
            category: 'Alpine Landscapes',
            postsCount: 6,
            reelsCount: 2,
            viewsTotal: 22100,
            engagementRate: 6.1,
            bandwidthMb: 1310,
            mlAffinityScore: 0.69,
            growthVelocity: 8.2,
            trend: 'stable',
            topPublicId: 'beesocial/posts/mountains_peak',
          },
        ],
      },
    };
  }

  deletePostAdmin(postId: string): boolean {
    return this.removePost(postId);
  }

  updateUserRole(userId: string, role: 'USER' | 'CREATOR' | 'ADMIN'): boolean {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.role = role;
      return true;
    }
    return false;
  }
}

// Global singleton instance
const globalStore = (global as unknown as { __mediaGramStore?: MediaGramStore; __beeSocialStore?: MediaGramStore });
if (!globalStore.__mediaGramStore || typeof globalStore.__mediaGramStore.getRandomizedPosts !== 'function') {
  globalStore.__mediaGramStore = new MediaGramStore();
  globalStore.__beeSocialStore = globalStore.__mediaGramStore;
}
export const store = globalStore.__mediaGramStore;
