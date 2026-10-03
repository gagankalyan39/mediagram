'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/navigation/AppShell';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassAvatar } from '@/components/glass/GlassAvatar';
import { GlassInput } from '@/components/glass/GlassInput';
import { GlassModal } from '@/components/glass/GlassModal';
import { store } from '@/lib/store';
import { User, DirectMessage } from '@/lib/types';
import { uploadMediaFileToCloudinary } from '@/lib/upload-helper';
import {
  Send,
  Image as ImageIcon,
  Heart,
  Info,
  Search,
  Plus,
  Smile,
  CheckCheck,
  Sparkles,
  Users,
  MessageSquare
} from 'lucide-react';

function MessagesContent() {
  const searchParams = useSearchParams();
  const chatWithParam = searchParams.get('chatWith');

  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [conversations, setConversations] = useState(store.getConversations());
  const [activePartner, setActivePartner] = useState<User | null>(null);

  // Search state for left conversation drawer
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeQuery, setComposeQuery] = useState('');
  const [composeResults, setComposeResults] = useState<User[]>([]);

  // Chat message state
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<DirectMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize active partner
  useEffect(() => {
    const cur = store.getCurrentUser();
    setCurrentUser(cur);
    const convs = store.getConversations();
    setConversations(convs);

    if (chatWithParam) {
      const targetUser = store.getPublicUsers().find(
        (u) => u.username.toLowerCase() === chatWithParam.toLowerCase()
      );
      if (targetUser) {
        setActivePartner(targetUser);
        setConversation(store.getDirectMessages(targetUser.id));
        return;
      }
    }

    if (!activePartner) {
      if (convs.length > 0) {
        setActivePartner(convs[0].partner);
        setConversation(store.getDirectMessages(convs[0].partner.id));
      } else {
        const firstOther = store.getPublicUsers().find((u) => u.id !== cur.id);
        if (firstOther) {
          setActivePartner(firstOther);
          setConversation(store.getDirectMessages(firstOther.id));
        }
      }
    }
  }, [chatWithParam]);

  // Sync active conversation
  const syncChat = () => {
    setConversations(store.getConversations());
    if (activePartner) {
      setConversation(store.getDirectMessages(activePartner.id));
    }
  };

  useEffect(() => {
    if (activePartner) {
      store.markConversationAsRead(activePartner.id);
      setConversations(store.getConversations());
      setConversation(store.getDirectMessages(activePartner.id));
    }
  }, [activePartner]);

  useEffect(() => {
    const handleUpdate = () => syncChat();
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, [activePartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, isTyping]);

  // Search accounts in left panel
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearchResults(store.searchUsers(searchQuery, 15));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Search accounts in compose modal
  useEffect(() => {
    setComposeResults(store.searchUsers(composeQuery, 20));
  }, [composeQuery, isComposeOpen]);

  // Send message handler with simulated live typing reply
  const handleSendMessage = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputText;
    if (!textToSend.trim() || !activePartner) return;

    store.sendDirectMessage({
      recipientId: activePartner.id,
      text: textToSend.trim(),
    });

    setInputText('');
    syncChat();

    // Simulate Instagram partner reply with typing indicator
    const partnerToReply = activePartner;
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);

        const creatorReplies: Record<string, string[]> = {
          usr_feat_1: [
            `Hey @${currentUser.username}! That Paris fashion reel concept sounds incredible. Let’s do 35mm lens at golden hour! ✨`,
            `Loved your latest post! The Cloudinary dynamic color enhancement really makes the skin tones look natural.`,
            `Are you free for a coffee shoot this Thursday afternoon? We could test the new anamorphic filter! ☕`,
          ],
          usr_feat_2: [
            `Yo Alex! The Singapore architecture shots turned out super sharp with the 16mm GM. Sony really nailed this glass. 🏙️`,
            `Did you notice how smooth the 4K playback is on MediaGram? That Cloudinary adaptive streaming is insane.`,
            `Let's hit the rooftop at sunset tomorrow, the symmetry with the skyline will look unreal! 📸`,
          ],
          usr_feat_3: [
            `Hey! The drone LUTs for Iceland are rendering right now 🚁 The cold glacier blues have just the right amount of grain.`,
            `Just watched your new reel, that pacing was so clean! What track did you use for the background? 🎵`,
            `Heading out to the Alps next week. Will definitely upload the vertical 4K reels directly!`,
          ],
          usr_feat_4: [
            `Late night rain in Shibuya tonight 🌧️ The neon reflections on the asphalt are pure cyberpunk vibes!`,
            `Thanks for the feedback Alex! Cloudinary f_auto compressed that 60fps clip without losing any highlight detail.`,
            `Catching the bullet train to Kyoto at dawn. Let me know if you want any temple footage for your edits! ⛩️`,
          ],
        };

        const defaultReplies = [
          `Hey @${currentUser.username}! Thanks for reaching out. Loved seeing your latest feed uploads! 📸`,
          `Totally agree! Have you checked out the high-quality 4K reels on MediaGram? The Cloudinary CDN streams them so quickly.`,
          `Great connecting with you! Let's definitely collaborate on some new photography concepts soon. ✨`,
          `Awesome! What camera setup or lens did you use for that shot? 📷`,
          `Just checked your profile, your aesthetic is super clean! 🌿`,
        ];

        const partnerReplies = (partnerToReply && creatorReplies[partnerToReply.id]) || defaultReplies;
        const randomReply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)];

        if (partnerToReply) {
          store.sendDirectMessage({
            senderId: partnerToReply.id,
            recipientId: currentUser.id,
            text: randomReply,
          });
          // If the user currently has this partner's chat actively open, mark as read immediately
          if (activePartner?.id === partnerToReply.id) {
            store.markConversationAsRead(partnerToReply.id);
          }
          syncChat();
        }
      }, 1400);
    }, 600);
  };

  // Upload photo/video to Cloudinary and send inside message
  const handleMediaAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePartner) return;

    setIsUploadingMedia(true);
    try {
      const media = await uploadMediaFileToCloudinary({
        file,
        folderType: file.type.startsWith('video/') ? 'post_video' : 'post_image',
        userId: currentUser.id,
      });

      const mediaUrl = media.optimizedUrl || media.originalUrl;
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';

      store.sendDirectMessage({
        recipientId: activePartner.id,
        text: '',
        mediaUrl,
        mediaType,
      });
      syncChat();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleToggleLike = (msgId: string) => {
    store.toggleLikeMessage(msgId);
    syncChat();
  };

  const quickPrompts = [
    '👋 Hey there!',
    'Loved your latest reel! 🎥',
    'What camera do you shoot on? 📸',
    'Are you in Tokyo or NYC right now?',
  ];

  const displayConversations = [...conversations];
  if (activePartner && !displayConversations.some((c) => c.partner.id === activePartner.id)) {
    displayConversations.unshift({
      partner: activePartner,
      lastMessage: {
        id: 'draft',
        conversationId: `conv_${activePartner.id}`,
        senderId: currentUser.id,
        recipientId: activePartner.id,
        text: 'Start a new conversation...',
        createdAt: new Date().toISOString(),
        isRead: true,
      },
      unreadCount: 0,
    });
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto h-[calc(100vh-130px)] min-h-[580px] glass-card border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        {/* Left Side: Conversations & Account Search */}
        <div className="w-full md:w-80 border-r border-white/10 flex flex-col h-full bg-black/30">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">@{currentUser.username}</span>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">
                1K+ Users
              </span>
            </div>
            <button
              onClick={() => setIsComposeOpen(true)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Compose New Message"
            >
              <Plus className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-3 border-b border-white/5">
            <GlassInput
              icon={<Search className="w-3.5 h-3.5 text-amber-400" />}
              placeholder="Search 1,000+ accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          {/* Conversations or Search Results List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {searchQuery.trim() !== '' ? (
              // Search Results
              <div>
                <p className="px-3.5 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  Search Results ({searchResults.length})
                </p>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setActivePartner(user);
                      store.markConversationAsRead(user.id);
                      setSearchQuery('');
                      setConversations(store.getConversations());
                    }}
                    className={`p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                      user.id === activePartner?.id ? 'bg-white/15' : 'hover:bg-white/[0.06]'
                    }`}
                  >
                    <GlassAvatar
                      src={user.avatarUrl}
                      name={user.name}
                      size="sm"
                      isVerified={user.isVerified}
                    />
                    <div className="overflow-hidden flex-1">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-white/50 truncate">@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Existing Conversations + Draft Conversation if partner is selected
              displayConversations.map(({ partner, lastMessage, unreadCount }) => {
                const isActive = partner.id === activePartner?.id;
                // If this is the currently open chat, it has just been read
                const isUnread = unreadCount > 0 && !isActive;

                return (
                  <div
                    key={partner.id}
                    onClick={() => {
                      setActivePartner(partner);
                      store.markConversationAsRead(partner.id);
                      setConversations(store.getConversations());
                    }}
                    className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      isActive ? 'bg-white/15' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="relative">
                      <GlassAvatar
                        src={partner.avatarUrl}
                        name={partner.name}
                        size="md"
                        isVerified={partner.isVerified}
                      />
                    </div>

                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs truncate ${
                            isUnread ? 'font-bold text-white' : 'font-semibold text-white/90'
                          }`}
                        >
                          {partner.name}
                        </p>
                        <span className="text-[9px] text-white/40">
                          {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] truncate flex items-center justify-between mt-0.5">
                        <span
                          className={`truncate ${
                            isUnread ? 'font-semibold text-white' : 'text-white/60 font-normal'
                          }`}
                        >
                          {lastMessage.text || '📷 Attachment'}
                        </span>
                        {/* Instagram-style Unread Notification Dot - REMOVED IMMEDIATELY ON VIEWING */}
                        {isUnread && (
                          <div className="flex items-center gap-1.5 ml-1.5 shrink-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50"
                              title="Unread message"
                            />
                            {unreadCount > 1 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat Window */}
        {activePartner ? (
          <div className="flex-1 flex flex-col h-full bg-black/40">
            {/* Top Partner Bar */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <GlassAvatar
                  src={activePartner.avatarUrl}
                  name={activePartner.name}
                  size="md"
                  isVerified={activePartner.isVerified}
                />
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    {activePartner.name}
                  </p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Active now · @{activePartner.username}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/40 font-mono hidden sm:inline">
                  {activePartner.followersCount.toLocaleString()} followers
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {conversation.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <GlassAvatar
                    src={activePartner.avatarUrl}
                    name={activePartner.name}
                    size="xl"
                    className="mx-auto"
                    isVerified={activePartner.isVerified}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{activePartner.name}</h3>
                    <p className="text-xs text-white/50">@{activePartner.username}</p>
                    {activePartner.bio && (
                      <p className="text-xs text-white/60 max-w-sm mx-auto mt-1 leading-relaxed">
                        {activePartner.bio}
                      </p>
                    )}
                  </div>

                  <p className="text-[11px] text-amber-400/80">
                    Send a message to start this conversation!
                  </p>

                  {/* Quick starter chips */}
                  <div className="flex flex-wrap gap-2 justify-center pt-2 max-w-md mx-auto">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendMessage(undefined, prompt)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors cursor-pointer border border-white/10"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                conversation.map((msg) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                    >
                      <div className="relative max-w-[75%]">
                        {/* Media Attachment */}
                        {msg.mediaUrl && (
                          <div className="rounded-2xl overflow-hidden mb-1.5 border border-white/15 max-w-[280px]">
                            {msg.mediaType === 'video' ? (
                              <video
                                src={msg.mediaUrl}
                                controls
                                className="w-full max-h-[260px] object-cover"
                              />
                            ) : (
                              <img
                                src={msg.mediaUrl}
                                alt="Attachment"
                                className="w-full max-h-[260px] object-cover"
                              />
                            )}
                          </div>
                        )}

                        {/* Text Bubble */}
                        {msg.text && (
                          <div
                            onDoubleClick={() => handleToggleLike(msg.id)}
                            className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed select-none cursor-pointer ${
                              isMine
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black font-medium rounded-br-none shadow-md'
                                : 'glass text-white/95 rounded-bl-none border border-white/15'
                            }`}
                          >
                            {msg.text}
                          </div>
                        )}

                        {/* Heart Reaction Badge */}
                        {msg.isLiked && (
                          <div className="absolute -bottom-2 -right-1 bg-black/80 rounded-full p-0.5 border border-white/20 shadow">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          </div>
                        )}

                        {/* Like button on hover */}
                        <button
                          onClick={() => handleToggleLike(msg.id)}
                          className="absolute top-1/2 -translate-y-1/2 -left-7 p-1 rounded-full text-white/30 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-[9px] text-white/40 mt-1 px-1">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isMine && <CheckCheck className="w-3 h-3 text-cyan-400 ml-0.5" />}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Live Partner Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-white/50 pl-2">
                  <div className="flex gap-1 items-center bg-white/10 px-3 py-2 rounded-2xl">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>{activePartner.name} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Media Uploading Indicator */}
            {isUploadingMedia && (
              <div className="px-4 py-2 bg-amber-950/40 border-t border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Uploading media to Cloudinary CDN for message...</span>
              </div>
            )}

            {/* Send Input Bar with Photo Attachment */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-white/10 flex items-center gap-2 bg-black/25"
            >
              {/* Cloudinary Image Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-amber-400 transition-colors cursor-pointer"
                title="Attach Photo via Cloudinary"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaAttach}
              />

              <input
                type="text"
                placeholder={`Message ${activePartner.name}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-white/[0.06] border border-white/15 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400/50"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div className="space-y-3">
              <MessageSquare className="w-12 h-12 text-amber-400/50 mx-auto" />
              <h3 className="text-base font-bold text-white">Your Direct Messages</h3>
              <p className="text-xs text-white/50 max-w-sm">
                Select a conversation or start a new message with any of the 1,000+ accounts.
              </p>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-bold shadow-lg cursor-pointer"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compose New Message Modal (Search across all 1,000+ Accounts) */}
      <GlassModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="New Message"
        maxWidth="md"
      >
        <div className="space-y-4">
          <GlassInput
            icon={<Search className="w-4 h-4 text-amber-400" />}
            placeholder="Search accounts to message (Alex, Sophia, Marcus)..."
            value={composeQuery}
            onChange={(e) => setComposeQuery(e.target.value)}
            autoFocus
          />

          <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-white/5">
            {composeResults.map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setActivePartner(user);
                  setIsComposeOpen(false);
                }}
                className="p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <GlassAvatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="sm"
                    isVerified={user.isVerified}
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[11px] text-white/50">@{user.username}</p>
                  </div>
                </div>
                <span className="text-xs text-amber-400 font-semibold px-3 py-1 rounded-lg bg-amber-400/10">
                  Chat
                </span>
              </div>
            ))}
          </div>
        </div>
      </GlassModal>
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50">Loading Messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
