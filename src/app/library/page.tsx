'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/navigation/AppShell';
import { MediaLibraryView } from '@/components/library/MediaLibraryView';
import { store } from '@/lib/store';
import { MediaAsset, User } from '@/lib/types';

export default function LibraryPage() {
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(store.getAllMediaAssets());
  const currentUser: User = store.getCurrentUser();

  const handleDeleteAsset = (id: string) => {
    store.deleteMediaAsset(id);
    setMediaAssets([...store.getAllMediaAssets()]);
  };

  return (
    <AppShell>
      <MediaLibraryView
        mediaAssets={mediaAssets}
        currentUser={currentUser}
        onDeleteAsset={handleDeleteAsset}
      />
    </AppShell>
  );
}
