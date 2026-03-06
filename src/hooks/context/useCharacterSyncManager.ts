import { useState, useCallback, useMemo } from 'react';
import { CharacterSheetData, LogEntry, XPTransaction } from '../../types';
import { logger } from '../../utils/logger';
import { CharacterSyncService } from '../../services/CharacterSyncService';
import { BookSyncService } from '../../services/BookSyncService';

interface UseCharacterSyncManagerResult {
  isSyncing: boolean;
  addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both', deduplicationId?: string) => void;
  recordXPTransaction: (transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => void;
  sync: (mode?: 'manual' | 'auto') => Promise<void>;
}

export const useCharacterSyncManager = (
  data: CharacterSheetData,
  updateData: (newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData), isSyncAction?: boolean) => void
): UseCharacterSyncManagerResult => {
  const [isSyncing, setIsSyncing] = useState(false);

  // Add log function
  const addLog = useCallback((message: string, type: 'success' | 'danger' | 'info' = 'info', category: 'sheet' | 'settings' | 'both' = 'sheet', deduplicationId?: string) => {
    updateData(prev => {
      const logs = prev.appLogs || [];
      const lastLog = logs[0];

      if (deduplicationId && lastLog && lastLog.deduplicationId === deduplicationId) {
        const updatedLog = {
          ...lastLog,
          message,
          timestamp: new Date().toLocaleTimeString()
        };
        return { ...prev, appLogs: [updatedLog, ...logs.slice(1)].slice(0, 50) };
      }

      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
        category,
        deduplicationId
      };

      return { ...prev, appLogs: [newLog, ...logs].slice(0, 50) };
    }, true); // Adding a log shouldn't mark the whole data as "dirty" for sync
  }, [updateData]);

  // Record XP transaction function
  const recordXPTransaction = useCallback((transaction: Omit<XPTransaction, 'id' | 'timestamp'>) => {
    updateData(prev => {
      const newTransaction: XPTransaction = {
        ...transaction,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: new Date().toISOString()
      };
      return {
        ...prev,
        xpTransactions: [newTransaction, ...(prev.xpTransactions || [])]
      };
    });
  }, [updateData]);

  // Sync function
  const sync = useCallback(async (mode: 'manual' | 'auto' = 'manual') => {
    const syncInfo = data.syncInfo;
    // If auto mode but auto-sync is disabled, do nothing
    if (mode === 'auto' && !syncInfo?.isAutoSyncEnabled) return;

    if (!syncInfo?.syncId || !syncInfo?.settingId) {
      if (mode === 'manual') addLog("Pas de synchronisation configurée", 'danger', 'settings');
      return;
    }

    const playerName = data.header?.player;
    const characterName = data.header?.name;
    if (!playerName || !characterName) {
      if (mode === 'manual') addLog("Nom du joueur ou du personnage manquant", 'danger', 'settings');
      return;
    }

    setIsSyncing(true);
    if (mode === 'manual') addLog("Synchronisation en cours...", 'info', 'settings', 'sync-start');

    try {
      const result = await CharacterSyncService.syncCharacter(
        syncInfo.settingId,
        playerName,
        characterName,
        data,
        mode
      );

      if (result.success && result.syncId) {
        const newHash = result.hash;

        // Fetch the book from character_books to stay in sync with server
        const remoteBook = await BookSyncService.getBook(result.syncId);
        
        let injectedBookContent = remoteBook?.content;
        if (injectedBookContent) {
            // Server book has compressed images, we must decompress them for local display
            const { ImageSyncResolver } = await import('../../services/ImageSyncResolver');
            injectedBookContent = await ImageSyncResolver.injectImagesAfterSync(injectedBookContent) as typeof injectedBookContent;
        }

        updateData(prev => {
          if (prev.syncInfo?.syncId === syncInfo.syncId) {
            return {
              ...prev,
              syncInfo: {
                ...prev.syncInfo,
                lastSynced: Date.now(),
                lastSyncedHash: newHash,
                syncMode: mode,
                isDirty: false // Reset dirty flag after successful sync
              },
              // Inject remote book if available (keeps local in sync with server)
              ...(remoteBook ? {
                bookDocument: {
                  id: remoteBook.id,
                  content: injectedBookContent!,
                  formatVersion: remoteBook.format_version,
                  createdAt: remoteBook.created_at,
                  updatedAt: remoteBook.updated_at
                }
              } : {})
            };
          }
          return prev;
        }, true); // Mark as sync action to avoid re-triggering dirty flag

        if (mode === 'manual') {
          addLog("Synchronisation réussie", 'success', 'settings', 'sync-success');
        } else {
          logger.log(`[CharacterContext] Auto-sync success (Hash: ${newHash})`);
        }
      } else if (result.error) {
        if (mode === 'manual') {
          logger.warn("[CharacterContext] Sync failed:", result.error);
          addLog(`Échec de la synchronisation : ${result.error}`, 'danger', 'settings', 'sync-failure');
        }
      }
    } catch (e) {
      if (mode === 'manual') {
        logger.error("[CharacterContext] Sync exception:", e);
        addLog("Erreur critique lors de la synchronisation", 'danger', 'settings');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [data, addLog, updateData]);

  return useMemo(() => ({
    isSyncing,
    addLog,
    recordXPTransaction,
    sync
  }), [isSyncing, addLog, recordXPTransaction, sync]);
};