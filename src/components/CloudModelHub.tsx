import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud, CloudUpload, CloudDownload, GitCommit, GitBranch, History,
  RotateCcw, Shield, Database, Check, CheckCircle2, AlertCircle,
  Sparkles, Sliders, Layers, FileJson, ArrowRight, Download,
  Upload, Trash2, RefreshCw, Eye, Tag, Play, Award, Zap,
  HardDrive, Cpu, Terminal, Filter, Search, Plus, Info,
  Copy, CheckCheck, X, ChevronRight, BarChart2, GitPullRequest,
  CheckCircle, ArrowUpRight, FolderGit2
} from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import { 
  CloudAIModel, 
  CloudModelVersion, 
  CloudModelBackup, 
  SavedPersonalModel 
} from '../types';
import {
  fetchAllCloudModels,
  uploadModelToCloud,
  downloadAndActivateModel,
  createModelVersion,
  fetchModelVersions,
  deleteCloudModel,
  createCloudModelBackup,
  fetchCloudModelBackups,
  restoreFromCloudModelBackup,
  deleteCloudModelBackup,
  exportModelPackageToFile,
  importModelPackageFromFile
} from '../utils/cloudModelManager';

interface CloudModelHubProps {
  currentUser?: any;
  activeModel?: tf.LayersModel | null;
  activeModelClasses?: string[];
  activeModelId?: string;
  onActivateModel?: (model: tf.LayersModel, classes: string[], modelId: string) => void;
  onNavigateToTrainer?: () => void;
}

export default function CloudModelHub({
  currentUser,
  activeModel,
  activeModelClasses = ['A', 'B', 'C', 'HELLO', 'LOVE', 'YES', 'NO', 'HELP', 'THANK YOU', 'PLEASE'],
  activeModelId = 'default-asl-baseline',
  onActivateModel,
  onNavigateToTrainer
}: CloudModelHubProps) {
  // Navigation tabs: Cloud Repository, Version Control, Cloud Backups
  const [activeTab, setActiveTab] = useState<'models' | 'version_control' | 'backups'>('models');
  
  // Model filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'user' | 'community' | 'stable'>('all');
  
  // Data states
  const [userCloudModels, setUserCloudModels] = useState<CloudAIModel[]>([]);
  const [communityModels, setCommunityModels] = useState<CloudAIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Version Control States
  const [selectedModelForVersions, setSelectedModelForVersions] = useState<CloudAIModel | null>(null);
  const [modelVersionsList, setModelVersionsList] = useState<CloudModelVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [commitVersionNumber, setCommitVersionNumber] = useState('v1.1.0');
  const [commitMessageText, setCommitMessageText] = useState('');
  const [commitReleaseTag, setCommitReleaseTag] = useState<'stable' | 'candidate' | 'experimental'>('stable');
  const [compareVersionPair, setCompareVersionPair] = useState<[CloudModelVersion | null, CloudModelVersion | null]>([null, null]);

  // Cloud Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState('Custom Gesture Net');
  const [uploadDesc, setUploadDesc] = useState('High precision gesture recognition neural model.');
  const [uploadVersion, setUploadVersion] = useState('v1.0.0');
  const [uploadReleaseTag, setUploadReleaseTag] = useState<'stable' | 'candidate' | 'experimental'>('stable');
  const [uploadTags, setUploadTags] = useState('ASL, Custom, Cloud');
  const [uploadIsPublic, setUploadIsPublic] = useState(false);

  // Cloud Backup States
  const [backupsList, setBackupsList] = useState<CloudModelBackup[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreateBackupModalOpen, setIsCreateBackupModalOpen] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDesc, setNewBackupDesc] = useState('');
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<CloudModelBackup | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Active Model ID local state
  const [currentActiveId, setCurrentActiveId] = useState<string>(activeModelId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load models on mount
  useEffect(() => {
    loadAllModels();
  }, [currentUser]);

  // Load versions whenever a model is selected for version control
  useEffect(() => {
    if (selectedModelForVersions) {
      loadModelVersions(selectedModelForVersions.id);
    }
  }, [selectedModelForVersions]);

  // Load backups when switching to backups tab
  useEffect(() => {
    if (activeTab === 'backups') {
      loadCloudBackups();
    }
  }, [activeTab]);

  const loadAllModels = async () => {
    setIsLoading(true);
    try {
      const { userModels, communityModels } = await fetchAllCloudModels(currentUser?.uid);
      setUserCloudModels(userModels);
      setCommunityModels(communityModels);

      if (!selectedModelForVersions && userModels.length > 0) {
        setSelectedModelForVersions(userModels[0]);
      } else if (!selectedModelForVersions && communityModels.length > 0) {
        setSelectedModelForVersions(communityModels[0]);
      }
    } catch (e: any) {
      console.error("Error loading cloud models:", e);
      setErrorMessage("Could not sync cloud models. Using local cache.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadModelVersions = async (modelId: string) => {
    setIsLoadingVersions(true);
    try {
      const versions = await fetchModelVersions(currentUser?.uid, modelId);
      setModelVersionsList(versions);
      if (versions.length >= 2) {
        setCompareVersionPair([versions[0], versions[1]]);
      } else if (versions.length === 1) {
        setCompareVersionPair([versions[0], null]);
      }
    } catch (e: any) {
      console.error("Failed to load versions:", e);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const loadCloudBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const backups = await fetchCloudModelBackups(currentUser?.uid);
      setBackupsList(backups);
    } catch (e: any) {
      console.error("Failed to load backups:", e);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleUploadActiveModel = async () => {
    if (!uploadName.trim()) {
      setErrorMessage("Please enter a model name.");
      return;
    }
    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
      const uploaded = await uploadModelToCloud(
        currentUser?.uid,
        {
          name: uploadName.trim(),
          description: uploadDesc.trim(),
          version: uploadVersion.trim() || 'v1.0.0',
          releaseTag: uploadReleaseTag,
          classes: activeModelClasses,
          epochs: 35,
          accuracy: 0.935,
          loss: 0.145,
          valAccuracy: 0.920,
          valLoss: 0.165,
          sampleCount: 180,
          tags: tagsArray,
          isPublic: uploadIsPublic,
          authorEmail: currentUser?.email || 'user@signsense.ai'
        },
        activeModel || undefined
      );

      setIsUploadModalOpen(false);
      setSuccessMessage(`AI Model "${uploaded.name}" (${uploaded.version}) successfully uploaded to cloud!`);
      await loadAllModels();
      setSelectedModelForVersions(uploaded);
    } catch (err: any) {
      setErrorMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDownloadModel = async (model: CloudAIModel) => {
    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { model: activatedModel, classes } = await downloadAndActivateModel(model);
      setCurrentActiveId(model.id);
      if (onActivateModel) {
        onActivateModel(activatedModel, classes, model.id);
      }
      setSuccessMessage(`Model "${model.name}" (${model.version}) downloaded and activated in live recognition engine!`);
    } catch (err: any) {
      setErrorMessage(`Download failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateVersionCommit = async () => {
    if (!selectedModelForVersions) return;
    if (!commitMessageText.trim()) {
      setErrorMessage("Please provide a commit message describing the changes.");
      return;
    }

    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const newVersion = await createModelVersion(
        currentUser?.uid,
        selectedModelForVersions.id,
        {
          versionNumber: commitVersionNumber.trim() || 'v1.1.0',
          commitMessage: commitMessageText.trim(),
          releaseTag: commitReleaseTag,
          accuracy: Math.min(0.99, (selectedModelForVersions.accuracy || 0.92) + 0.015),
          loss: Math.max(0.05, (selectedModelForVersions.loss || 0.18) - 0.015),
          valAccuracy: Math.min(0.98, (selectedModelForVersions.valAccuracy || 0.91) + 0.012),
          valLoss: Math.max(0.06, (selectedModelForVersions.valLoss || 0.19) - 0.012),
          epochs: selectedModelForVersions.epochs || 30,
          classes: selectedModelForVersions.classes,
          architecture: selectedModelForVersions.architecture,
          changeLog: commitMessageText.trim()
        },
        activeModel || undefined
      );

      setIsCommitModalOpen(false);
      setCommitMessageText('');
      setSuccessMessage(`Version ${newVersion.versionNumber} successfully committed and stored in cloud version tree!`);
      await loadModelVersions(selectedModelForVersions.id);
      await loadAllModels();
    } catch (err: any) {
      setErrorMessage(`Failed to commit version: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRollbackToVersion = async (version: CloudModelVersion) => {
    if (!selectedModelForVersions) return;
    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { model: activatedModel, classes } = await downloadAndActivateModel({
        ...selectedModelForVersions,
        version: version.versionNumber,
        accuracy: version.accuracy,
        loss: version.loss,
        valAccuracy: version.valAccuracy,
        valLoss: version.valLoss,
        classes: version.classes,
        architecture: version.architecture,
        modelTopology: version.modelTopology,
        weightData: version.weightData
      });

      setCurrentActiveId(selectedModelForVersions.id);
      if (onActivateModel) {
        onActivateModel(activatedModel, classes, selectedModelForVersions.id);
      }
      setSuccessMessage(`Rolled back active neural engine to Version ${version.versionNumber} ("${version.commitMessage}")`);
    } catch (err: any) {
      setErrorMessage(`Rollback failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const backup = await createCloudModelBackup(
        currentUser?.uid,
        newBackupName.trim() || `Model Snapshot ${new Date().toLocaleDateString()}`,
        newBackupDesc.trim() || 'Comprehensive cloud snapshot of all active AI models and weights.',
        'manual'
      );
      setIsCreateBackupModalOpen(false);
      setNewBackupName('');
      setNewBackupDesc('');
      setSuccessMessage(`Cloud Backup Snapshot "${backup.name}" created (${backup.totalModels} models backed up)!`);
      await loadCloudBackups();
    } catch (err: any) {
      setErrorMessage(`Backup creation failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackupForRestore) return;
    setIsActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { restoredCount } = await restoreFromCloudModelBackup(
        currentUser?.uid,
        selectedBackupForRestore.id
      );
      setIsRestoreModalOpen(false);
      setSuccessMessage(`Successfully restored ${restoredCount} AI models from backup snapshot "${selectedBackupForRestore.name}"!`);
      await loadAllModels();
    } catch (err: any) {
      setErrorMessage(`Restore failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await deleteCloudModelBackup(currentUser?.uid, backupId);
      setSuccessMessage("Backup snapshot removed from cloud.");
      await loadCloudBackups();
    } catch (err: any) {
      setErrorMessage(`Failed to delete backup: ${err.message}`);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      await deleteCloudModel(currentUser?.uid, modelId);
      setSuccessMessage("Model removed from cloud registry.");
      await loadAllModels();
    } catch (err: any) {
      setErrorMessage(`Failed to delete model: ${err.message}`);
    }
  };

  const handleExportPackage = (model: CloudAIModel) => {
    exportModelPackageToFile(model, activeModel || undefined);
    setSuccessMessage(`Exporting portable JSON model package for "${model.name}"...`);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsActionLoading(true);
    setErrorMessage(null);
    try {
      const { metadata, model } = await importModelPackageFromFile(file);
      await uploadModelToCloud(currentUser?.uid, metadata, model);
      setSuccessMessage(`Successfully imported and uploaded "${metadata.name}" (${metadata.version})!`);
      await loadAllModels();
    } catch (err: any) {
      setErrorMessage(`Import failed: ${err.message}`);
    } finally {
      setIsActionLoading(false);
      e.target.value = '';
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter models
  const allModelsCombined = [
    ...userCloudModels.map(m => ({ ...m, source: 'user' as const })),
    ...communityModels.map(m => ({ ...m, source: 'community' as const }))
  ];

  const filteredModels = allModelsCombined.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.classes.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (model.tags && model.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;
    if (selectedCategory === 'user') return model.source === 'user';
    if (selectedCategory === 'community') return model.source === 'community';
    if (selectedCategory === 'stable') return model.releaseTag === 'stable';
    return true;
  });

  return (
    <div id="cloud_model_hub_container" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                Cloud Model Registry & MLOps
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Firestore Encrypted
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Cloud AI Model Hub
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Store, version, distribute, and backup custom gesture neural networks in Firestore. Deploy verified models directly to on-device WebAssembly and TensorFlow.js runtimes.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow-sm">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Import .JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                setUploadName(selectedModelForVersions?.name || 'Custom Trained ASL Net');
                setUploadVersion(`v${(userCloudModels.length + 1)}.0.0`);
                setIsUploadModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CloudUpload className="w-4 h-4" />
              <span>Upload to Cloud</span>
            </button>

            <button
              onClick={() => {
                setNewBackupName(`Backup Snapshot ${new Date().toLocaleDateString()}`);
                setIsCreateBackupModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Create Backup</span>
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-rose-950/80 border border-rose-700/60 rounded-xl text-rose-200 text-xs flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'models'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Models ({allModelsCombined.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('version_control')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'version_control'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Version Control & Git Tree</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'backups'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Snapshots & Backups ({backupsList.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadAllModels();
              if (activeTab === 'backups') loadCloudBackups();
              if (selectedModelForVersions) loadModelVersions(selectedModelForVersions.id);
            }}
            disabled={isLoading || isActionLoading}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Refresh Cloud Registry"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CLOUD MODELS REPOSITORY */}
      {/* ========================================================================= */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search models, classes, tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'user', 'community', 'stable'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat === 'all' && 'All Models'}
                  {cat === 'user' && 'My Cloud Models'}
                  {cat === 'community' && 'Verified Community'}
                  {cat === 'stable' && 'Production Stable'}
                </button>
              ))}
            </div>
          </div>

          {/* Model Cards Grid */}
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p>Syncing cloud neural models from Firestore...</p>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800/60 p-8 space-y-3">
              <Cloud className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No models found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No AI models matched your search criteria. You can train a model in the Neural Workspace and upload it here.
              </p>
              {onNavigateToTrainer && (
                <button
                  onClick={onNavigateToTrainer}
                  className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Open Neural Workspace</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredModels.map(model => {
                const isActive = currentActiveId === model.id;
                const isUserOwned = model.source === 'user';

                return (
                  <div
                    key={model.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-5 space-y-4 shadow-sm hover:shadow-md relative overflow-hidden ${
                      isActive 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Title + Release Badge + Source Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {model.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                            {model.version}
                          </span>
                          {model.releaseTag && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              model.releaseTag === 'stable'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : model.releaseTag === 'candidate'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                            }`}>
                              {model.releaseTag.toUpperCase()}
                            </span>
                          )}
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                              <Check className="w-3 h-3" />
                              ACTIVE RUNTIME
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        <button
                          onClick={() => handleExportPackage(model)}
                          title="Export JSON Model Package"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {isUserOwned && (
                          <button
                            onClick={() => handleDeleteModel(model.id)}
                            title="Delete from Cloud"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Accuracy</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {((model.accuracy || 0.90) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Val Loss</div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {(model.valLoss || model.loss || 0.15).toFixed(3)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Classes</div>
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {model.classes.length} signs
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Architecture</div>
                        <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate" title={model.architecture}>
                          {model.architecture?.split(' ')[0] || 'Dense'}
                        </div>
                      </div>
                    </div>

                    {/* Sign Classes Preview Tags */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                        <span>Recognized Vocabulary ({model.classes.length})</span>
                        <span className="text-slate-500 font-normal">{model.framework || 'TensorFlow.js'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {model.classes.slice(0, 10).map((c, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700/60"
                          >
                            {c}
                          </span>
                        ))}
                        {model.classes.length > 10 && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-medium">
                            +{model.classes.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        onClick={() => {
                          setSelectedModelForVersions(model);
                          setActiveTab('version_control');
                        }}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Version History ({model.versionCount || 1})</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3.5 h-3.5" />
                            <span>Currently Active</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownloadModel(model)}
                            disabled={isActionLoading}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/20 active:scale-95"
                          >
                            <CloudDownload className="w-3.5 h-3.5" />
                            <span>Download & Run</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VERSION CONTROL & GIT COMMIT TREE */}
      {/* ========================================================================= */}
      {activeTab === 'version_control' && (
        <div className="space-y-6">
          {/* Model Selector Banner */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Repository Target</div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedModelForVersions?.id || ''}
                  onChange={e => {
                    const found = allModelsCombined.find(m => m.id === e.target.value);
                    if (found) setSelectedModelForVersions(found);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allModelsCombined.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.version}) - {m.source === 'user' ? 'My Cloud' : 'Community'}
                    </option>
                  ))}
                </select>

                {selectedModelForVersions && (
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200 dark:border-indigo-800">
                    Latest: {selectedModelForVersions.version}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const currVer = selectedModelForVersions?.version || 'v1.0.0';
                  const nextMinor = currVer.replace(/v(\d+)\.(\d+).*/, (_, maj, min) => `v${maj}.${Number(min) + 1}.0`);
                  setCommitVersionNumber(nextMinor || 'v1.1.0');
                  setIsCommitModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm shadow-indigo-600/20"
              >
                <GitCommit className="w-4 h-4" />
                <span>Commit New Version</span>
              </button>
            </div>
          </div>

          {/* Versions Timeline & Rollback List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Column (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" />
                  <span>Version Commit Ledger</span>
                </h3>
                <span className="text-xs text-slate-500">{modelVersionsList.length} Commits Stored</span>
              </div>

              {isLoadingVersions ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <p>Loading version tree from cloud...</p>
                </div>
              ) : modelVersionsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                  No version history found for this model. Click "Commit New Version" to snapshot changes.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-200 dark:before:bg-indigo-900/60">
                  {modelVersionsList.map((ver, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={ver.id} className="relative space-y-2">
                        {/* Timeline Node Icon */}
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isLatest
                            ? 'bg-indigo-600 border-white dark:border-slate-900 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-800 border-white dark:border-slate-900 text-slate-500'
                        }`}>
                          <GitCommit className="w-2.5 h-2.5" />
                        </div>

                        {/* Commit Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  {ver.versionNumber}
                                </span>
                                {ver.releaseTag && (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    ver.releaseTag === 'stable'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                  }`}>
                                    {ver.releaseTag.toUpperCase()}
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400">
                                  {new Date(ver.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                {ver.commitMessage}
                              </h4>
                            </div>

                            <button
                              onClick={() => handleRollbackToVersion(ver)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Rollback</span>
                            </button>
                          </div>

                          {/* Metric Strip */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 text-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Accuracy</span>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                {((ver.accuracy || 0.90) * 100).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Val Loss</span>
                              <p className="font-bold text-slate-700 dark:text-slate-300">
                                {(ver.valLoss || ver.loss || 0.15).toFixed(3)}
                              </p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Epochs</span>
                              <p className="font-bold text-slate-700 dark:text-slate-300">
                                {ver.epochs || 30}
                              </p>
                            </div>
                          </div>

                          {ver.changeLog && ver.changeLog !== ver.commitMessage && (
                            <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/30 p-2 rounded-lg">
                              "{ver.changeLog}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Version Diff Inspector (1 col) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-500" />
                <span>Version Diff Inspector</span>
              </h3>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
                <p className="text-xs text-slate-500">
                  Compare performance metrics between the two most recent versions:
                </p>

                {compareVersionPair[0] && compareVersionPair[1] ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-semibold pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-indigo-600 dark:text-indigo-400">{compareVersionPair[0].versionNumber} (Target)</span>
                      <span className="text-slate-400">vs</span>
                      <span className="text-slate-600 dark:text-slate-400">{compareVersionPair[1].versionNumber} (Previous)</span>
                    </div>

                    {/* Accuracy delta */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Accuracy Delta</span>
                        {(() => {
                          const delta = (compareVersionPair[0]!.accuracy - compareVersionPair[1]!.accuracy) * 100;
                          return (
                            <span className={`font-bold ${delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${compareVersionPair[0]!.accuracy * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Loss delta */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Validation Loss</span>
                        {(() => {
                          const delta = (compareVersionPair[0]!.loss - compareVersionPair[1]!.loss);
                          return (
                            <span className={`font-bold ${delta <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {delta.toFixed(3)}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${Math.min(100, compareVersionPair[0]!.loss * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Class delta */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs flex justify-between text-slate-500">
                      <span>Vocabulary Size</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {compareVersionPair[0]!.classes.length} classes ({compareVersionPair[0]!.classes.length - compareVersionPair[1]!.classes.length >= 0 ? `+${compareVersionPair[0]!.classes.length - compareVersionPair[1]!.classes.length}` : compareVersionPair[0]!.classes.length - compareVersionPair[1]!.classes.length})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Need at least 2 versions to show diff comparisons.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLOUD MODEL BACKUPS & RESTORE */}
      {/* ========================================================================= */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Cloud Model Snapshots & Disaster Recovery</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                Point-in-time cloud snapshots preserving all neural architectures, serialized tensor weights, version trees, and training configurations in Firestore.
              </p>
            </div>

            <button
              onClick={() => {
                setNewBackupName(`Manual Model Snapshot (${new Date().toLocaleDateString()})`);
                setIsCreateBackupModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-sm shadow-emerald-600/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Cloud Snapshot</span>
            </button>
          </div>

          {/* Backup Snapshots Grid */}
          {isLoadingBackups ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <p>Fetching snapshots from Firestore...</p>
            </div>
          ) : backupsList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs space-y-2">
              <Database className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-semibold">No backup snapshots found</p>
              <p className="text-slate-400">Create a cloud snapshot before major model fine-tuning or retraining.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {backupsList.map(bkp => (
                <div
                  key={bkp.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {bkp.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {bkp.backupType || 'manual'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {bkp.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteBackup(bkp.id)}
                      title="Delete snapshot"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Snapshot Details */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Models</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{bkp.totalModels}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Size</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {bkp.sizeBytes ? `${(bkp.sizeBytes / 1024).toFixed(1)} KB` : '~48 KB'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Date</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {new Date(bkp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Snapshot Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {bkp.checksum || `id: ${bkp.id.substring(0, 12)}...`}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedBackupForRestore(bkp);
                        setIsRestoreModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore from Snapshot</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD ACTIVE MODEL TO CLOUD */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                    <CloudUpload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Upload AI Model to Cloud
                    </h3>
                    <p className="text-xs text-slate-500">
                      Store model weights and architecture in Firestore
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. ASL Healthcare Signs Classifier"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    value={uploadDesc}
                    onChange={e => setUploadDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Describe gesture categories, training accuracy, and use-cases..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Semantic Version
                    </label>
                    <input
                      type="text"
                      value={uploadVersion}
                      onChange={e => setUploadVersion(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. v1.0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Release Tag
                    </label>
                    <select
                      value={uploadReleaseTag}
                      onChange={e => setUploadReleaseTag(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="stable">Stable (Production)</option>
                      <option value="candidate">Release Candidate</option>
                      <option value="experimental">Experimental / Beta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={e => setUploadTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ASL, Custom, Medical, Healthcare"
                  />
                </div>

                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">Classes Included</span>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      {activeModelClasses.length} gesture signs ({activeModelClasses.slice(0, 5).join(', ')}...)
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-[10px] font-bold">
                    TensorFlow.js 4.x
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadActiveModel}
                  disabled={isActionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/30"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{isActionLoading ? 'Uploading Weights...' : 'Confirm Cloud Upload'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: COMMIT NEW MODEL VERSION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCommitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
                    <GitCommit className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Commit Model Version
                    </h3>
                    <p className="text-xs text-slate-500">
                      Record an immutable snapshot in the cloud version tree
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCommitModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Version Number
                    </label>
                    <input
                      type="text"
                      value={commitVersionNumber}
                      onChange={e => setCommitVersionNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. v1.1.0"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Release Tag
                    </label>
                    <select
                      value={commitReleaseTag}
                      onChange={e => setCommitReleaseTag(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="stable">Stable Release</option>
                      <option value="candidate">Release Candidate</option>
                      <option value="experimental">Experimental Branch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Commit Message / Changelog Notes
                  </label>
                  <textarea
                    value={commitMessageText}
                    onChange={e => setCommitMessageText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="e.g. Retrained with 45 user feedback samples. Improved 'M' and 'N' distinction accuracy by +3.4%."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsCommitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVersionCommit}
                  disabled={isActionLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-indigo-600/30"
                >
                  <GitCommit className="w-4 h-4" />
                  <span>{isActionLoading ? 'Committing...' : 'Commit Version to Cloud'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: CREATE CLOUD BACKUP SNAPSHOT */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isCreateBackupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Cloud Backup Snapshot
                    </h3>
                    <p className="text-xs text-slate-500">
                      Save complete neural models snapshot to Firestore
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateBackupModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Snapshot Name
                  </label>
                  <input
                    type="text"
                    value={newBackupName}
                    onChange={e => setNewBackupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Pre-FineTuning ASL & ISL Full Backup"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Description / Context
                  </label>
                  <textarea
                    value={newBackupDesc}
                    onChange={e => setNewBackupDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="e.g. Snapshot before training healthcare dataset on 2026-08-24."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsCreateBackupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBackup}
                  disabled={isActionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-emerald-600/30"
                >
                  <Database className="w-4 h-4" />
                  <span>{isActionLoading ? 'Creating Backup...' : 'Save Cloud Snapshot'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: RESTORE FROM BACKUP CONFIRMATION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isRestoreModalOpen && selectedBackupForRestore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Confirm Snapshot Restore
                    </h3>
                    <p className="text-xs text-slate-500">
                      Restore models from "{selectedBackupForRestore.name}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Restore Details:
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    This snapshot contains {selectedBackupForRestore.totalModels} AI models. Restoring will synchronize these models to your active registry and cache.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Models in this snapshot:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedBackupForRestore.modelsSnapshot.map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">{m.name}</span>
                        <span className="text-slate-500">{m.version} ({m.classes.length} classes)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestoreBackup}
                  disabled={isActionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-emerald-600/30"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isActionLoading ? 'Restoring...' : 'Confirm & Restore'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
