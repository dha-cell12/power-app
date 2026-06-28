import {ipcMain} from 'electron';
import type {DB} from '../../../shared/types/db';
import {ExtensionDB} from '../db/extension';
import {copyFileSync, mkdirSync, existsSync, readFileSync, unlinkSync, rmdirSync} from 'fs';
import extract from 'extract-zip';
import {join} from 'path';
import {getSettings} from '../utils/get-settings';
import {db} from '../db';
import {readdir, rename} from 'fs/promises';

export const initExtensionService = () => {
  ipcMain.handle('extension-create', async (_, extension: DB.Extension) => {
    return await ExtensionDB.createExtension({
      ...extension,
      updated_at: db.fn.now() as unknown as string,
    });
  });

  ipcMain.handle('extension-get-all', async () => {
    return await ExtensionDB.getAllExtensions();
  });

  ipcMain.handle(
    'extension-apply-to-windows',
    async (_, extensionId: number, windowIds: number[]) => {
      return await ExtensionDB.insertExtensionWindows(extensionId, windowIds);
    },
  );

  ipcMain.handle('extension-get-windows', async (_, extensionId: number) => {
    return await ExtensionDB.getExtensionWindows(extensionId);
  });

  ipcMain.handle(
    'delete-extension-windows',
    async (_, extensionId: number, windowIds: number[]) => {
      return await ExtensionDB.deleteExtensionWindows(extensionId, windowIds);
    },
  );

  ipcMain.handle('extension-delete', async (_, extensionId: number) => {
    return await ExtensionDB.deleteExtension(extensionId);
  });

  ipcMain.handle(
    'extension-update',
    async (_, extensionId: number, extension: Partial<DB.Extension>) => {
      return await ExtensionDB.updateExtension(extensionId, extension);
    },
  );

  // Add method for handling uploaded files
  ipcMain.handle(
    'extension-upload-package',
    async (_, filePath: string, existingExtensionId?: number) => {
      try {
        const settings = getSettings();
        // Get application data directory
        const extensionsPath = join(settings.profileCachePath, 'extensions');

        // Ensure extension directory exists
        if (!existsSync(extensionsPath)) {
          mkdirSync(extensionsPath);
        }

        // Create a unique directory for each extension
        const extensionId = existingExtensionId || Date.now();
        const extensionDir = join(extensionsPath, extensionId.toString());
        if (!existsSync(extensionDir)) {
          mkdirSync(extensionDir);
        }

        // Create temporary extraction directory
        const tempExtractDir = join(extensionDir, 'temp');
        if (existsSync(tempExtractDir)) {
          const {rm} = require('fs/promises');
          await rm(tempExtractDir, {recursive: true, force: true});
        }
        mkdirSync(tempExtractDir);

        // Copy zip file to extension directory
        const destZipPath = join(extensionDir, 'extension.zip');
        copyFileSync(filePath, destZipPath);

        // Decompress to temporary directory first
        await extract(destZipPath, {dir: tempExtractDir});

        // Now manifest.json can be safely read
        const manifestPath = join(tempExtractDir, 'manifest.json');
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

        // Use the read version number to create the final directory
        const versionDir = join(extensionDir, manifest.version);

        // If version directory already exists, delete it first
        if (existsSync(versionDir)) {
          const {rm} = require('fs/promises');
          await rm(versionDir, {recursive: true, force: true});
        }

        // Create new version directory
        mkdirSync(versionDir);

        // Move files from temporary directory to version directory
        const files = await readdir(tempExtractDir);
        for (const file of files) {
          await rename(join(tempExtractDir, file), join(versionDir, file));
        }

        // Clean up temporary files
        unlinkSync(destZipPath);
        rmdirSync(tempExtractDir);

        return {
          success: true,
          path: versionDir,
          version: manifest.version,
          name: manifest.name,
          extensionId,
        };
      } catch (error) {
        console.error('Failed to process extension package:', error);
        return {
          success: false,
          error: (error as Error).message,
        };
      }
    },
  );

  ipcMain.handle('extension-sync-windows', async (_, extensionId: number, windowIds: number[]) => {
    try {
      // Get all windows currently associated with this extension
      const currentWindows = await ExtensionDB.getExtensionWindows(extensionId);
      const currentWindowIds = currentWindows.map(w => w.window_id);

      // Window associations that need to be deleted
      const toDelete = currentWindowIds.filter(id => !windowIds.includes(id));
      if (toDelete.length > 0) {
        await ExtensionDB.deleteExtensionWindows(extensionId, toDelete);
      }

      // Window associations that need to be added
      const toAdd = windowIds.filter(id => !currentWindowIds.includes(id));
      if (toAdd.length > 0) {
        await ExtensionDB.insertExtensionWindows(extensionId, toAdd);
      }

      return {
        success: true,
        message: 'Sync successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sync failed',
      };
    }
  });
};
