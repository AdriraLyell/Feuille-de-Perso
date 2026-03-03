import { useEffect } from 'react';
import { CharacterSheetData } from '../../types';
import { migrateBookImages } from '../../utils/migrations/migrateBookImages';
import { logger } from '../../utils/logger';

export const useCharacterImageMigration = (
  data: CharacterSheetData,
  setData: React.Dispatch<React.SetStateAction<CharacterSheetData>>
) => {
  // Image Migration Effect (Base64 -> IndexedDB)
  // Runs when bookDocument changes (e.g. after load or import)
  useEffect(() => {
    if (!data.bookDocument?.content) return;

    const processImages = async () => {
      try {
        const currentContent = data.bookDocument!.content;
        const migratedContent = await migrateBookImages(currentContent);

        // Compare to skip update if nothing changed
        if (JSON.stringify(migratedContent) !== JSON.stringify(currentContent)) {
          logger.log("[CharacterContext] Book images migrated to IndexedDB.");
          setData(prev => ({
            ...prev,
            bookDocument: {
              ...prev.bookDocument!,
              content: migratedContent,
              updatedAt: new Date().toISOString()
            }
          }));
        }
      } catch (err) {
        logger.error("[CharacterContext] Image migration failed:", err);
      }
    };

    processImages();
  }, [data.bookDocument?.id, setData]);
};