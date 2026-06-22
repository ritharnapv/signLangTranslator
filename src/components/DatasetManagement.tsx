import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, Trash2, Download, Code2, Database, Plus, FileJson, 
  Search, Check, Copy, BarChart3, BrainCircuit, ListFilter, 
  RefreshCcw, AlertCircle, FileSpreadsheet, Share2, Clipboard, ChevronDown, ChevronUp,
  Edit2, Cloud, HardDrive, Save, Activity
} from 'lucide-react';
import { CollectedSample } from '../types';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

interface DatasetItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  samples: CollectedSample[];
  categories: string[];
  sampleStatistics: Record<string, number>;
  size: string;
  ownerId?: string;
  ownerEmail?: string;
}

interface DatasetManagementProps {
  currentUser: any;
  collectedSamples: CollectedSample[];
  onImportSamples: (samples: CollectedSample[]) => void;
  onClearLocalSamples: () => void;
}

export default function DatasetManagement({ 
  currentUser,
  collectedSamples, 
  onImportSamples,
  onClearLocalSamples 
}: DatasetManagementProps) {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [storageMode, setStorageMode] = useState<'cloud' | 'local'>('cloud');
  
  // Custom Edit Dataset metadata (CRUD "Update")
  const [editingDataset, setEditingDataset] = useState<DatasetItem | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  
  // Tab within Dataset Hub
  const [innerTab, setInnerTab] = useState<'datasets' | 'api' | 'package'>('datasets');
  
  // Custom Create Dataset Form (from camera buffers)
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  
  // Upload State
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPreview, setUploadedPreview] = useState<{
    name: string;
    description: string;
    samples: any[];
    categories: string[];
  } | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<'python' | 'javascript' | 'curl'>('python');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    fetchDatasets(storageMode);
  }, [storageMode, currentUser]);

  const fetchDatasets = async (modeOverride?: 'cloud' | 'local') => {
    const activeMode = modeOverride || storageMode;
    setIsLoading(true);
    setError(null);
    try {
      if (activeMode === 'cloud') {
        if (!currentUser) {
          setDatasets([]);
          return;
        }
        // Fetch from Firestore: users/{uid}/datasets
        const colRef = collection(db, "users", currentUser.uid, "datasets");
        const querySnap = await getDocs(colRef);
        const fetched: DatasetItem[] = [];
        querySnap.forEach((docSnap) => {
          fetched.push(docSnap.data() as DatasetItem);
        });
        // Sort by creation time descending
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDatasets(fetched);
      } else {
        const res = await fetch('/api/datasets');
        if (!res.ok) {
          throw new Error(`Failed to load datasets: ${res.statusText}`);
        }
        const data = await res.json();
        setDatasets(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Network error while downloading datasets.");
    } finally {
      setIsLoading(false);
    }
  };

  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4500);
  };

  // Compile local webcam session specimens to save as dataset
  const handleCompileSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (collectedSamples.length === 0) {
      setError("No specimens collected inside your browser session yet. Switch to Recording Dashboard to snap hand frames first!");
      return;
    }
    if (!newName.trim()) {
      setError("Please key in a valid name for your sign dataset.");
      return;
    }

    setIsCompiling(true);
    setError(null);
    try {
      const uniqueId = `dataset_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const categoriesSet = new Set<string>();
      const sampleStatistics: Record<string, number> = {};
      collectedSamples.forEach((sample) => {
        const label = (sample.label || "UNKNOWN").toUpperCase();
        categoriesSet.add(label);
        sampleStatistics[label] = (sampleStatistics[label] || 0) + 1;
      });
      const categories = Array.from(categoriesSet);
      const sizeStr = `${Math.round(JSON.stringify(collectedSamples).length / 1024)} KB`;

      const newDataset: DatasetItem = {
        id: uniqueId,
        name: newName,
        description: newDesc || "Custom compiled sign options recorded from interactive webcam sandbox sessions.",
        createdAt: new Date().toISOString(),
        samples: collectedSamples,
        categories: categories,
        sampleStatistics: sampleStatistics,
        size: sizeStr,
        ownerId: currentUser?.uid || "anonymous",
        ownerEmail: currentUser?.email || ""
      };

      if (storageMode === 'cloud') {
        if (!currentUser) {
          throw new Error("You must be logged in to save database gestures under your account profile.");
        }
        // Doc ref under authenticated cloud user
        const docRef = doc(db, "users", currentUser.uid, "datasets", uniqueId);
        await setDoc(docRef, newDataset);
        notifySuccess(`New custom dataset "${newName}" saved and hosted securely on Cloud Firestore under your profile!`);
      } else {
        const res = await fetch('/api/datasets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDataset)
        });

        if (!res.ok) {
          throw new Error("Backend was unable to compile the dataset file.");
        }
        notifySuccess(`New custom dataset "${newName}" saved and hosted successfully on local server!`);
      }

      setNewName('');
      setNewDesc('');
      onClearLocalSamples(); // Reset recording buffer
      await fetchDatasets(); // Refresh list
    } catch (err: any) {
      setError(err.message || "Unable to save custom dataset.");
    } finally {
      setIsCompiling(false);
    }
  };

  // Delete a dataset from workspace
  const handleDeleteDataset = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This operation is irreversible.`)) {
      return;
    }
    try {
      setIsLoading(true);
      if (storageMode === 'cloud') {
        if (!currentUser) throw new Error("Authentication session expired.");
        const docRef = doc(db, "users", currentUser.uid, "datasets", id);
        await deleteDoc(docRef);
        notifySuccess(`Dataset "${name}" deleted from Cloud Firestore.`);
      } else {
        const res = await fetch(`/api/datasets/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) {
          throw new Error("Unable to delete dataset target file.");
        }
        notifySuccess(`Dataset "${name}" successfully deleted from local filesystem.`);
      }
      if (selectedDatasetId === id) setSelectedDatasetId(null);
      await fetchDatasets();
    } catch (err: any) {
      setError(err.message || "Delete operation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update a dataset's metadata (CRUD Update)
  const handleUpdateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDataset) return;
    if (!editName.trim()) {
      setError("Dataset name cannot be empty.");
      return;
    }

    setIsSavingEdit(true);
    setError(null);
    try {
      if (storageMode === 'cloud') {
        if (!currentUser) throw new Error("Authentication session required.");
        const docRef = doc(db, "users", currentUser.uid, "datasets", editingDataset.id);
        await updateDoc(docRef, {
          name: editName,
          description: editDesc
        });
        notifySuccess(`Dataset "${editName}" metadata successfully updated in Cloud Firestore!`);
      } else {
        const updatedDataset = {
          ...editingDataset,
          name: editName,
          description: editDesc
        };
        const res = await fetch('/api/datasets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedDataset)
        });
        if (!res.ok) {
          throw new Error("Server rejected overwriting local dataset metadata.");
        }
        notifySuccess(`Dataset "${editName}" metadata updated on local server!`);
      }
      setEditingDataset(null);
      await fetchDatasets();
    } catch (err: any) {
      setError(err.message || "Failed to update dataset metadata.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Import a dataset's samples back into active client webcam viewer
  const handleImportToWebcam = (item: DatasetItem) => {
    onImportSamples(item.samples);
    notifySuccess(`Successfully imported ${item.samples.length} sample points from "${item.name}" into local workspace recording buffer!`);
  };

  // Download raw dataset as self-contained .json file client-side
  const handleDownloadDataset = (item: DatasetItem) => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${item.name.toLowerCase().replace(/\s+/g, '_')}_dataset.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notifySuccess(`Dataset "${item.name}" download launched successfully!`);
    } catch (err: any) {
      setError(`Download failed client-side: ${err.message}`);
    }
  };

  // Drag and Drop files handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setError(null);
    if (!file.name.endsWith(".json")) {
      setError("Invalid file format. Please upload a structured .json sign dataset file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const textStr = event.target?.result as string;
        const parsed = JSON.parse(textStr);

        // Check format: could be raw array of samples, or a complete Dataset object
        let finalSamples: any[] = [];
        let datasetName = file.name.replace(".json", "").replace(/_/g, " ");
        let datasetDesc = "Uploaded external dataset of Hand landmarks.";

        if (Array.isArray(parsed)) {
          finalSamples = parsed;
        } else if (parsed && Array.isArray(parsed.samples)) {
          finalSamples = parsed.samples;
          if (parsed.name) datasetName = parsed.name;
          if (parsed.description) datasetDesc = parsed.description;
        } else {
          throw new Error("Unrecognized JSON structure. File must be a JSON array of samples or represent a mapped dataset container.");
        }

        // Validate basic sample properties
        if (finalSamples.length > 0) {
          const firstSample = finalSamples[0];
          if (!firstSample.label || !firstSample.landmarks) {
            throw new Error("Validation mismatch: Samples must contain both a 'label' attribute and 'landmarks' coordinate arrays.");
          }
        }

        const uniqueCategories = Array.from(new Set(finalSamples.map(s => s.label || "UNKNOWN")));

        setUploadedPreview({
          name: datasetName,
          description: datasetDesc,
          samples: finalSamples,
          categories: uniqueCategories
        });
      } catch (err: any) {
        setError(`Failed parsing JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Confirm and upload the verified JSON dataset file to selected storage engine
  const submitUploadedDataset = async () => {
    if (!uploadedPreview) return;
    setIsLoading(true);
    setError(null);
    try {
      const uniqueId = `dataset_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const sizeStr = `${Math.round(JSON.stringify(uploadedPreview.samples).length / 1024)} KB`;
      
      const newDataset = {
        id: uniqueId,
        name: uploadedPreview.name,
        description: uploadedPreview.description,
        createdAt: new Date().toISOString(),
        samples: uploadedPreview.samples,
        categories: uploadedPreview.categories,
        sampleStatistics: uploadedPreview.samples.reduce((acc: Record<string, number>, curr: any) => {
          const l = (curr.label || "UNKNOWN").toUpperCase();
          acc[l] = (acc[l] || 0) + 1;
          return acc;
        }, {}),
        size: sizeStr,
        ownerId: currentUser?.uid || "anonymous",
        ownerEmail: currentUser?.email || ""
      };

      if (storageMode === 'cloud') {
        if (!currentUser) {
          throw new Error("You must be logged in to save database gestures under your account profile.");
        }
        const docRef = doc(db, "users", currentUser.uid, "datasets", uniqueId);
        await setDoc(docRef, newDataset);
        notifySuccess(`Dataset "${uploadedPreview.name}" successfully compiled and deposited to Cloud Firestore!`);
      } else {
        const res = await fetch('/api/datasets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDataset)
        });

        if (!res.ok) {
          throw new Error("Host rejected saving the uploaded dataset.");
        }
        notifySuccess(`Successfully uploaded and compiled external dataset to local server: "${uploadedPreview.name}"`);
      }

      setUploadedPreview(null);
      await fetchDatasets();
    } catch (err: any) {
      setError(err.message || "Failed to commit uploaded file.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, codeId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(codeId);
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2500);
  };

  // Search filter
  const filteredDatasets = datasets.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Compute total aggregate stats across all loaded hosted datasets
  const totalDatasetsCount = datasets.length;
  const totalSamplesCount = datasets.reduce((sum, d) => sum + d.samples.length, 0);
  const globalCategoriesSet = new Set<string>();
  datasets.forEach(d => d.categories.forEach(c => globalCategoriesSet.add(c)));
  const totalCategoriesCount = globalCategoriesSet.size;
  const averageSamplesPerDataset = totalDatasetsCount > 0 ? Math.round(totalSamplesCount / totalDatasetsCount) : 0;

  // Render appropriate live code configuration templates
  const getCodeSnippet = (dataset: DatasetItem | null) => {
    const dsId = dataset ? dataset.id : "dataset_asl_alphabet";
    const dsName = dataset ? dataset.name : "ASL Core Standard";
    
    if (selectedLang === 'python') {
      return `import requests
import json

# URL to fetch the full "${dsName}" dataset from host
API_URL = "http://localhost:3000/api/datasets/${dsId}/download"

print(f"Connecting to host and fetching dataset: {API_URL}...")
try:
    response = requests.get(API_URL)
    response.raise_for_status()
    
    # Parse structured JSON datasets
    dataset_payload = response.json()
    print("Dataset Connection: SECURE")
    print(f"Dataset Name: {dataset_payload['name']}")
    print(f"Total Capture Samples: {len(dataset_payload['samples'])}")
    print(f"Unique Gesture Categories: {dataset_payload['categories']}")
    
    # Access raw metrics
    sample_items = dataset_payload['samples']
    if len(sample_items) > 0:
        first_sample = sample_items[0]
        print(f"First Sample gesture label: {first_sample['label']}")
        # 3D points representing standard landmarks coordinates
        joints_arr = first_sample['landmarks']
        print(f"Raw Landmarks loaded: {len(joints_arr)} coordinates mapped")
except Exception as err:
    print(f"Connection failed: {err}")`;
    }

    if (selectedLang === 'javascript') {
      return `// Dynamic asynchronous loader for database frameworks
async function fetchAslDataset() {
  const url = \`/api/datasets/${dsId}/download\`;
  console.log("Downloading metadata samples: " + url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Dataset response returned status " + response.status);
    }
    
    const dataset = await response.json();
    console.log("🎉 Successfully Loaded '" + dataset.name + "'");
    console.log("🔥 Total Samples: " + dataset.samples.length);
    console.log("🏷️  Gestures: " + dataset.categories.join(", "));
    
    // Feed dataset arrays directly to TensorFlow.js or ML models
    return dataset.samples;
  } catch (error) {
    console.error("Failed to load ASL dataset:", error);
    return [];
  }
}

fetchAslDataset();`;
    }

    return `# 1. Query general listed datasets metadata
curl -X GET http://localhost:3000/api/datasets

# 2. Download raw content for dataset '${dsId}'
curl -O -J -L http://localhost:3000/api/datasets/${dsId}/download

# 3. Post a new dataset to server
curl -X POST -H "Content-Type: application/json" \\
     -d '{"name": "Temporary Test Dataset", "samples": []}' \\
     http://localhost:3000/api/datasets

# 4. Remove dataset from server database
curl -X DELETE http://localhost:3000/api/datasets/${dsId}`;
  };

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) || datasets[0] || null;

  return (
    <div className="space-y-8" id="dataset-manager-system">
      
      {/* Dynamic Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 bg-[#ebf5eb] border border-[#d2edd2] text-[#428042] px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg z-50 text-xs font-semibold"
            id="dataset-success-toast"
          >
            <Check className="w-5 h-5 bg-[#428042] text-white rounded-full p-1" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#ebdcd1] border border-[#ebd6c5] text-[#a36b5e] p-4 rounded-2xl flex items-start gap-3 text-xs"
            id="dataset-error-banner"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#a36b5e]" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider block">Error Message Outburst</span>
              <p className="mt-1 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-[#a36b5e] hover:underline font-bold self-start pl-4">DISMISS</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Dashboard Header Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dataset-metrix-cards">
        <div className="bg-white border border-[#ecece0] rounded-2xl p-5 shadow-sm" id="stat-card-total-sets">
          <p className="text-[10px] text-[#7a7a6a] uppercase font-bold tracking-widest font-mono">Hosted Datasets</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold text-[#2d2d28] font-sans">{totalDatasetsCount}</h3>
            <span className="text-[10px] text-emerald-600 font-bold font-mono bg-[#ebf5eb] px-1.5 py-0.5 rounded">Active Repos</span>
          </div>
          <p className="text-[11px] text-[#5a5a4a] mt-2">Skeletal repository JSON records</p>
        </div>

        <div className="bg-white border border-[#ecece0] rounded-2xl p-5 shadow-sm" id="stat-card-total-samples">
          <p className="text-[10px] text-[#7a7a6a] uppercase font-bold tracking-widest font-mono">Aggregate Samples</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold text-[#2d2d28] font-sans">{totalSamplesCount}</h3>
            <span className="text-[10px] text-blue-600 font-bold font-mono bg-blue-50 px-1.5 py-0.5 rounded">3D Skeletons</span>
          </div>
          <p className="text-[11px] text-[#5a5a4a] mt-2">Individual recorded samples</p>
        </div>

        <div className="bg-white border border-[#ecece0] rounded-2xl p-5 shadow-sm" id="stat-card-total-classes">
          <p className="text-[10px] text-[#7a7a6a] uppercase font-bold tracking-widest font-mono">Unique Gestures</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold text-[#2d2d28] font-sans">{totalCategoriesCount}</h3>
            <span className="text-[10px] text-purple-600 font-bold font-mono bg-purple-50 px-1.5 py-0.5 rounded">Categories</span>
          </div>
          <p className="text-[11px] text-[#5a5a4a] mt-2">Distinct ASL labels catalogued</p>
        </div>

        <div className="bg-white border border-[#ecece0] rounded-2xl p-5 shadow-sm" id="stat-card-average">
          <p className="text-[10px] text-[#7a7a6a] uppercase font-bold tracking-widest font-mono">Avg Size Per Repo</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-extrabold text-[#2d2d28] font-sans">{averageSamplesPerDataset}</h3>
            <span className="text-[10px] text-amber-600 font-bold font-mono bg-amber-50 px-1.5 py-0.5 rounded">Samples</span>
          </div>
          <p className="text-[11px] text-[#5a5a4a] mt-2">Balanced data density score</p>
        </div>
      </div>

      {/* Dataset Hub Workspace Inner Tabs */}
      <div className="flex items-center justify-between border-b border-[#ecece0] pb-2" id="datasets-inner-tabs-bar">
        <div className="flex items-center gap-1.5" id="inner-tab-container">
          <button 
            onClick={() => setInnerTab('datasets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg border ${
              innerTab === 'datasets' 
                ? "bg-[#7c8d7c] text-white border-[#7c8d7c]" 
                : "bg-transparent text-[#5a5a4a] border-transparent hover:bg-[#f0f2ee]"
            }`}
            id="datasets-tab-btn-explore"
          >
            <Database className="w-4 h-4" />
            Explore Hosted Datasets
          </button>
          
          <button 
            onClick={() => setInnerTab('package')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg border relative ${
              innerTab === 'package' 
                ? "bg-[#7c8d7c] text-white border-[#7c8d7c]" 
                : "bg-transparent text-[#5a5a4a] border-transparent hover:bg-[#f0f2ee]"
            }`}
            id="datasets-tab-btn-package"
          >
            <Plus className="w-4 h-4" />
            Compile Active Session
            {collectedSamples.length > 0 && (
              <span className="absolute -top-1.5 -right-1 bg-[#a36b5e] text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans font-extrabold animate-bounce">
                {collectedSamples.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => setInnerTab('api')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg border ${
              innerTab === 'api' 
                ? "bg-[#7c8d7c] text-white border-[#7c8d7c]" 
                : "bg-transparent text-[#5a5a4a] border-transparent hover:bg-[#f0f2ee]"
            }`}
            id="datasets-tab-btn-api"
          >
            <Code2 className="w-4 h-4" />
            REST Developer APIs
          </button>
        </div>

        <button 
          onClick={fetchDatasets} 
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-[#7c8d7c] hover:text-[#5c6d5c] disabled:opacity-50 transition-all font-mono"
          id="refresh-datasets-btn"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          RELOAD
        </button>
      </div>

      {/* CORE WORKSPACE CONTENT PANEL */}
      <div className="bg-white border border-[#ecece0] rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden" id="datasets-workspace-main-panel">
        
        {/* TAB 1: EXPLORE HOSTED DATASETS */}
        {innerTab === 'datasets' && (
          <div className="space-y-8" id="explore-tab-view">
            
            {/* Storage Selection Controls block */}
            <div className="bg-stone-50 dark:bg-[#1a1a1e] border border-[#ecece0] dark:border-[#2d2d32]/80 p-4.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4" id="storage-engine-selector">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xs font-extrabold text-[#2d2d28] dark:text-[#f4f4f5] flex items-center gap-1.5 justify-center sm:justify-start">
                  <Cloud className="w-4 h-4 text-[#7c8d7c]" />
                  Active Gesture Storage Database
                </h4>
                <p className="text-[11px] text-[#7a7a6a] dark:text-[#a1a1aa]">
                  Select the backing database for gestures collection and training calibrations.
                </p>
              </div>

              <div className="flex bg-stone-100 dark:bg-[#121214] p-1 rounded-xl border border-[#ecece0] dark:border-[#2b2b2e]" id="mode-selector-tabs">
                <button
                  type="button"
                  onClick={() => setStorageMode('cloud')}
                  className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    storageMode === 'cloud'
                      ? "bg-[#7c8d7c] text-white shadow-sm font-bold"
                      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100"
                  }`}
                  id="storage-to-cloud"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  Cloud Firestore
                </button>
                <button
                  type="button"
                  onClick={() => setStorageMode('local')}
                  className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    storageMode === 'local'
                      ? "bg-[#7c8d7c] text-white shadow-sm font-bold"
                      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100"
                  }`}
                  id="storage-to-local"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  Local Host Files
                </button>
              </div>
            </div>

            {storageMode === 'cloud' && !currentUser && (
              <div className="text-center py-16 bg-[#fcfcf9] rounded-2xl border border-dashed border-[#ecece0] space-y-4" id="cloud-unauthed-state">
                <Cloud className="w-12 h-12 mx-auto text-[#7a7a6a] opacity-60 animate-pulse" />
                <h4 className="text-sm font-bold text-[#2d2d28]">Secure Firestore Cloud Storage</h4>
                <p className="text-xs text-[#7a7a6a] max-w-sm mx-auto leading-relaxed">
                  Connect your customized datasets directly with your sign coordinator account to persist 3D skeletal vectors across sessions.
                </p>
                <div className="pt-2 text-xs font-mono font-bold text-[#7c8d7c] uppercase">
                  ◀ Check "Coordinator Auth" menu to sign up or log in
                </div>
              </div>
            )}
            
            {/* Conditional wrapper based on storage mode authorization */}
            {(storageMode !== 'cloud' || currentUser) && (
              <>
                {/* Search and Upload bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center" id="search-upload-header">
              <div className="md:col-span-12 lg:col-span-5 relative" id="search-input-field-wrap">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#7a7a6a]" />
                <input 
                  type="text"
                  placeholder="Filter datasets by name, signs, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-sans pl-10 pr-4 py-2.5 rounded-xl border border-[#ecece0] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none"
                  id="search-dataset-input"
                />
              </div>

              {/* Directly inline file upload for JSON */}
              <div className="md:col-span-12 lg:col-span-7 flex flex-col md:flex-row gap-4 justify-end" id="upload-methods">
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`flex-1 border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? "border-[#7c8d7c] bg-[#7c8d7c]/5" 
                      : "border-[#e0e4db] hover:border-[#7c8d7c] bg-[#fdfdfb]"
                  }`}
                  id="json-file-dropzone"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".json"
                    onChange={handleManualFileChange}
                    className="hidden" 
                    id="manual-file-selector"
                  />
                  <div className="flex items-center justify-center gap-2" id="drag-prompter">
                    <Upload className="w-4 h-4 text-[#7c8d7c]" />
                    <p className="text-[11px] font-sans font-semibold text-[#5a5a4a]">
                      Drag and drop dataset <span className="text-[#7c8d7c] underline">.json</span> or click to upload
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW CONTAINER FOR FILE UPLOADS */}
            {uploadedPreview && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#ebf5eb] border border-[#d2edd2] rounded-2xl p-5"
                id="uploaded-preview-banner"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <FileJson className="w-8 h-8 text-[#428042] bg-white p-1.5 rounded-xl" />
                    <div>
                      <h4 className="text-sm font-bold text-[#2d2d28]">Dataset Ready for Compilation</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#428042]">
                        <span className="font-mono bg-white px-2 py-0.5 rounded font-semibold">{uploadedPreview.samples.length} sample items</span>
                        <span className="w-1 h-1 rounded-full bg-[#428042]" />
                        <span className="font-sans">Categories: {uploadedPreview.categories.join(", ")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setUploadedPreview(null)}
                      className="text-xs font-semibold px-3 py-1.5 hover:bg-black/5 text-[#a36b5e] rounded-xl transition"
                      id="upload-dataset-cancel"
                    >
                      Delete File Buffer
                    </button>
                    <button 
                      onClick={submitUploadedDataset}
                      className="text-xs font-bold px-4 py-1.5 bg-[#428042] hover:bg-[#327032] text-white rounded-xl shadow-sm transition"
                      id="upload-dataset-confirm"
                    >
                      Process & Upload to Host
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-3 rounded-lg border border-[#e2efe2] text-xs">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#7a7a6a] font-bold">Configure Dataset Name</label>
                    <input 
                      type="text" 
                      value={uploadedPreview.name}
                      onChange={(e) => setUploadedPreview({ ...uploadedPreview, name: e.target.value })}
                      className="w-full mt-1 bg-white border border-[#d0edd0] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#428042]"
                      id="uploaded-dataset-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[#7a7a6a] font-bold">Configure Description</label>
                    <input 
                      type="text" 
                      value={uploadedPreview.description}
                      onChange={(e) => setUploadedPreview({ ...uploadedPreview, description: e.target.value })}
                      className="w-full mt-1 bg-white border border-[#d0edd0] rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-[#428042]"
                      id="uploaded-dataset-desc-input"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ERROR / EMPTY STATE */}
            {filteredDatasets.length === 0 && !isLoading && (
              <div className="text-center py-16 bg-[#fcfcf9] rounded-2xl border border-dashed border-[#ecece0] space-y-3" id="empty-datasets-state">
                <Database className="w-12 h-12 mx-auto text-[#7a7a6a]" />
                <h4 className="text-sm font-bold text-[#2d2d28]">No Matching Datasets Located</h4>
                <p className="text-xs text-[#7a7a6a] max-w-sm mx-auto">
                  We could not find any active datasets matching your search query. Try capturing samples and saving a new local dataset package!
                </p>
                <div className="pt-2">
                  <button 
                    onClick={() => { setSearchQuery(''); fetchDatasets(); }}
                    className="text-xs font-bold underline text-[#7c8d7c]"
                    id="clear-filter-btn"
                  >
                    Reset Filter Query
                  </button>
                </div>
              </div>
            )}

            {/* EXPANDABLE DATASETS VIEW LIST */}
            <div className="space-y-4" id="datasets-cards-list">
              {filteredDatasets.map((item) => {
                const isSelected = selectedDatasetId === item.id;
                
                // Stat calculations for chart metrics
                const totalSamples = item.samples.length;
                const sortedStatsKeys = Object.keys(item.sampleStatistics || {}).sort();

                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-2xl transition-all ${
                      isSelected 
                        ? "border-[#7c8d7c] bg-[#7c8d7c]/2" 
                        : "border-[#ecece0] hover:border-[#7c8d7c]/40 bg-white"
                    }`}
                    id={`dataset-item-wrapper-${item.id}`}
                  >
                    {/* Header Row */}
                    <div 
                      onClick={() => setSelectedDatasetId(isSelected ? null : item.id)}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                      id={`dataset-header-${item.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4.5 h-4.5 text-[#5a6b5a]" />
                          <h4 className="text-sm font-bold text-[#2d2d28]">{item.name}</h4>
                          <span className="text-[10px] font-mono shrink-0 bg-[#f0f2ee] text-[#5a6b5a] px-2 py-0.5 rounded font-bold">ID: {item.id}</span>
                        </div>
                        <p className="text-xs text-[#7a7a6a] max-w-2xl line-clamp-1">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-4.5 shrink-0" id={`dataset-stats-pills-${item.id}`}>
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Recorded</p>
                          <p className="text-xs font-bold text-[#2d2d28] mt-0.5">{totalSamples} samples</p>
                        </div>
                        
                        <div className="w-[1px] h-8 bg-[#ecece0] hidden sm:block"></div>
                        
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">disk size</p>
                          <p className="text-xs font-bold font-mono text-[#5a6b5a] mt-0.5">{item.size || "12 KB"}</p>
                        </div>

                        {isSelected ? <ChevronUp className="w-5 h-5 text-[#7a7a6a]" /> : <ChevronDown className="w-5 h-5 text-[#7a7a6a]" />}
                      </div>
                    </div>

                    {/* EXPANDED CONTENT DETAILS */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-[#f0f2ee] overflow-hidden"
                          id={`expanded-panel-${item.id}`}
                        >
                          <div className="p-6 bg-stone-50/50 space-y-6">
                            
                            {/* METRICS & GESTURE STATISTICS BAR GRAPHIC */}
                            <div className="space-y-3" id={`gesture-stats-section-${item.id}`}>
                              <h5 className="text-[11px] uppercase font-bold tracking-widest text-[#7a7a6a] flex items-center gap-1.5 font-mono">
                                <BarChart3 className="w-4 h-4" />
                                Sub-Category Sample Statistics
                              </h5>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id={`stat-indicators-grid-${item.id}`}>
                                {sortedStatsKeys.map((label) => {
                                  const count = item.sampleStatistics[label] || 0;
                                  const pct = totalSamples > 0 ? Math.round((count / totalSamples) * 100) : 0;
                                  return (
                                    <div key={label} className="bg-white p-3.5 rounded-xl border border-[#ecece0] space-y-2" id={`class-metric-${item.id}-${label}`}>
                                      <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span className="w-6 h-6 bg-[#7c8d7c] text-white flex items-center justify-center font-bold text-[10px] rounded-lg">{label}</span>
                                          <span className="font-sans font-bold text-[#2d2d28]">Gesture Group "{label}"</span>
                                        </div>
                                        <span className="font-mono text-[11px] text-[#7a7a6a]">{count} samples ({pct}%)</span>
                                      </div>
                                      
                                      {/* Visual density metric bar */}
                                      <div className="w-full h-2 bg-[#f0f2ee] rounded-full overflow-hidden" id={`meter-track-${label}`}>
                                        <div 
                                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* View Gesture Categories pills */}
                            <div className="space-y-1.5" id={`categories-list-${item.id}`}>
                              <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Included Gesture Classes</h5>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {item.categories.map((cat) => (
                                  <span key={cat} className="px-2.5 py-1 bg-white border border-[#ecece0] rounded-lg text-[10px] font-bold text-[#2d2d28] font-sans">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="w-full h-[1px] bg-[#f0f2ee]" />

                            {/* Control Actions Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id={`action-row-${item.id}`}>
                              <div className="text-xs text-[#7a7a6a] font-mono">
                                Compiled on {new Date(item.createdAt).toLocaleString()}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button 
                                  onClick={() => handleImportToWebcam(item)}
                                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 border border-[#7c8d7c] text-[#7c8d7c] bg-white hover:bg-[#7c8d7c]/5 rounded-xl transition"
                                  id={`action-import-${item.id}`}
                                >
                                  <BrainCircuit className="w-3.5 h-3.5" />
                                  Import to Recording Dashboard
                                </button>

                                <button 
                                  onClick={() => handleDownloadDataset(item)}
                                  className="flex items-center gap-1.5 text-[11px] text-white font-bold bg-[#7c8d7c] hover:bg-[#6c7d6c] px-3.5 py-2 rounded-xl border border-[#7c8d7c] transition shadow-sm cursor-pointer"
                                  id={`action-download-${item.id}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download raw JSON Dataset
                                </button>

                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingDataset(item);
                                    setEditName(item.name);
                                    setEditDesc(item.description);
                                  }}
                                  className="flex items-center justify-center text-[#7c8d7c] hover:bg-[#7c8d7c]/5 p-2 rounded-xl transition cursor-pointer"
                                  title="Update Dataset Info"
                                  id={`action-edit-${item.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button 
                                  onClick={() => handleDeleteDataset(item.id, item.name)}
                                  className="flex items-center justify-center text-[#a36b5e] hover:bg-[#a36b5e]/5 p-2 rounded-xl transition cursor-pointer"
                                  title="Delete Master Dataset File"
                                  id={`action-delete-${item.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* QUICK HELP TIP */}
            <div className="bg-[#f0f2ee]/50 border border-[#e0e4db] rounded-2xl p-4 text-xs font-sans text-[#5a5a4a] space-y-1" id="explore-info-tip">
              <strong>💡 Integration Tip</strong>: You can record raw 3D hand skeletal landmark points with twenty-one joint parameters (X, Y, Z vector offsets) in the <strong>Recording Dashboard</strong>, download them back as structured arrays, or host them as shared master datasets right here.
            </div>
          </>
        )}

      </div>
    )}

        {/* TAB 2: COMPILE CURRENT CAMERA SESSION BUFFERS */}
        {innerTab === 'package' && (
          <div className="space-y-6" id="package-tab-view">
            <div className="max-w-xl text-xs space-y-2">
              <h4 className="text-sm font-bold text-[#2d2d28]">Compile Webcam Live Recordings to Saved Dataset</h4>
              <p className="text-[#7a7a6a]">
                When practicing gestures in the <strong>Recording Dashboard</strong>, your custom samples are preserved in the local browser state. Here, you can compile those coordinate datasets, write a custom description, and save them permanently to the host workspace database to let external machine learning operations load them!
              </p>
            </div>

            {collectedSamples.length === 0 ? (
              <div className="py-12 bg-[#fcfcf9] rounded-2xl border border-dashed border-[#ecece0] text-center space-y-3" id="package-empty-state">
                <BrainCircuit className="w-12 h-12 text-[#7a7a6a] mx-auto opacity-50" />
                <h5 className="text-xs font-bold text-[#2d2d28] uppercase tracking-wide">Recording Buffer Empty</h5>
                <p className="text-[#7a7a6a] max-w-sm mx-auto text-xs">
                  Your active browser session does not contain any recorded hands landmarks. Switch over to the <strong>Recording Dashboard</strong> with your webcam active and snapshot a couple of hand layouts to begin!
                </p>
                <div className="pt-2">
                  <span className="text-xs text-stone-400 font-bold block">
                    Total recorded session count: {collectedSamples.length} samples
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="package-compiled-grid">
                
                {/* Form Input Section */}
                <form onSubmit={handleCompileSession} className="lg:col-span-5 bg-[#fdfdfb] p-6 rounded-2xl border border-[#ecece0] space-y-5" id="dataset-package-form">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
                    <Database className="w-4 h-4" />
                    Dataset Packaging Info
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">Dataset Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g.: Alphabet Segment Session A"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full text-xs font-sans px-3 py-2 rounded-lg border border-[#ecece0] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-white"
                      id="pkg-name-input"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">Dataset Description</label>
                    <textarea 
                      placeholder="Identify user conditions, light settings, camera device, or gesture subset descriptions..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      rows={4}
                      className="w-full text-xs font-sans px-3 py-2 rounded-lg border border-[#ecece0] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-white"
                      id="pkg-desc-input"
                    />
                  </div>

                  <div className="border-t border-[#f0f2ee] pt-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#7a7a6a] font-medium">Recorded Samples:</span>
                      <span className="font-extrabold text-[#2d2d28]">{collectedSamples.length} samples</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#7a7a6a] font-medium">Unique gestures catalogued:</span>
                      <span className="font-extrabold text-emerald-600 font-mono">
                        {Array.from(new Set(collectedSamples.map(s => s.label))).join(", ") || "None"}
                      </span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isCompiling}
                    className="w-full py-2.5 px-4 bg-[#7c8d7c] hover:bg-[#6c7d6c] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-sm"
                    id="submit-session-dataset-btn"
                  >
                    {isCompiling ? (
                      <>
                        <RefreshCcw className="w-4 h-4 animate-spin" />
                        Compiling and Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Compile and Save to Server ({collectedSamples.length} samples)
                      </>
                    )}
                  </button>
                </form>

                {/* Local Session Statistics Preview */}
                <div className="lg:col-span-7 space-y-4" id="package-local-stats-hub">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-bold text-[#2d2d28] uppercase tracking-wide">Webcam Recording Dashboard State</h5>
                    <button 
                      onClick={() => {
                        if (confirm("Reset active local webcam browser recordings? This clears your temporary storage.")) {
                          onClearLocalSamples();
                          notifySuccess("Active browser recording buffer successfully cleared.");
                        }
                      }}
                      className="text-[11px] font-bold text-[#a36b5e] hover:underline"
                      id="clear-recording-buffer-direct-btn"
                    >
                      Clear active buffer
                    </button>
                  </div>

                  <div className="bg-stone-50 rounded-2xl p-5 border border-[#ecece0] space-y-4" id="compact-stats-view">
                    <p className="text-[11px] text-[#5a5a4a]">
                      Below indicates how your active samples are divided before files are structured. Ensure standard class distribution prior to publishing:
                    </p>

                    <div className="divide-y divide-[#ecece0] max-h-64 overflow-y-auto pr-2" id="compact-list-class-metrics">
                      {(() => {
                        const counts: Record<string, number> = {};
                        collectedSamples.forEach(s => counts[s.label] = (counts[s.label] || 0) + 1);
                        const labels = Object.keys(counts).sort();
                        
                        return labels.map(label => {
                          const count = counts[label];
                          const pct = Math.round((count / collectedSamples.length) * 100);
                          return (
                            <div key={label} className="py-2.5 flex items-center justify-between text-xs font-sans">
                              <span className="font-bold text-[#2d2d28]">Label Group "{label}"</span>
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-[#5a5a4a]">{count} snaps ({pct}%)</span>
                                <div className="w-16 h-1.5 bg-[#e5e5d8] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#7c8d7c] rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* TAB 3: REST DEVELOPER APIS & DOCUMENTATION */}
        {innerTab === 'api' && (
          <div className="space-y-6" id="api-tab-view">
            <div className="max-w-xl text-xs space-y-2">
              <h4 className="text-sm font-bold text-[#2d2d28]">Full-Stack REST Dataset API Integrations</h4>
              <p className="text-[#7a7a6a]">
                We expose full-stack, secure file systems and REST endpoints directly from our sandboxed workspace. You can use standard python clients, node scripts, or plain cURL clients to load complete ASL joint coordinates dataset arrays to feed machine learning frameworks.
              </p>
            </div>

            {/* Language Selector */}
            <div className="flex gap-1 bg-[#f0f2ee] p-1 border border-[#e0e4db] rounded-xl w-fit" id="api-lang-bar">
              <button 
                onClick={() => setSelectedLang('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  selectedLang === 'python' ? 'bg-[#7c8d7c] text-white shadow-sm' : 'text-[#5a6b5a] hover:text-[#2d2d28]'
                }`}
                id="api-lang-python"
              >
                Python Code
              </button>
              <button 
                onClick={() => setSelectedLang('javascript')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  selectedLang === 'javascript' ? 'bg-[#7c8d7c] text-white shadow-sm' : 'text-[#5a6b5a] hover:text-[#2d2d28]'
                }`}
                id="api-lang-js"
              >
                NodeJS Fetch
              </button>
              <button 
                onClick={() => setSelectedLang('curl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  selectedLang === 'curl' ? 'bg-[#7c8d7c] text-white shadow-sm' : 'text-[#5a6b5a] hover:text-[#2d2d28]'
                }`}
                id="api-lang-curl"
              >
                cURL CLI
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="api-docs-layout">
              
              {/* Live Code Code block */}
              <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl relative overflow-hidden" id="api-codeblock-panel">
                <div className="h-10 border-b border-neutral-800 bg-neutral-950 px-4.5 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                  <span>
                    TEMPLATE INTEGRATION SCRIPT ({selectedLang === 'python' ? 'python3' : selectedLang === 'javascript' ? 'ES Module NodeJS' : 'SHELL bash'})
                  </span>
                  
                  <button 
                    onClick={() => copyToClipboard(getCodeSnippet(selectedDataset), 'snippet')}
                    className="flex items-center gap-1 hover:text-white transition"
                    id="copy-code-btn"
                  >
                    {copiedCodeId === 'snippet' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-5 overflow-auto text-stone-200 font-mono text-[11px] leading-relaxed max-h-96 select-text" id="raw-code-print border-0">
                  {getCodeSnippet(selectedDataset)}
                </pre>
              </div>

              {/* Endpoint Specification Cards list */}
              <div className="lg:col-span-4 space-y-4" id="api-specs-cards-wrap">
                <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Available API Endpoints map</h5>
                
                <div className="space-y-3" id="api-methods-catalog">
                  <div className="bg-stone-50 p-3.5 border border-[#ecece0] rounded-xl" id="api-catalog-get">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-700 font-bold font-mono rounded text-[10px]">GET</span>
                      <code className="font-mono text-[11px] bg-white px-1 border rounded text-[#2d2d28]">/api/datasets</code>
                    </div>
                    <p className="text-[10px] text-[#7a7a6a] mt-2 font-sans">
                      Fetches metadata summary of all structured JSON files hosted inside backend data vaults.
                    </p>
                  </div>

                  <div className="bg-stone-50 p-3.5 border border-[#ecece0] rounded-xl" id="api-catalog-download">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-[#428042] font-bold font-mono rounded text-[10px]">GET</span>
                      <code className="font-mono text-[11px] bg-white px-1 border rounded text-[#2d2d28]">/api/datasets/:id/download</code>
                    </div>
                    <p className="text-[10px] text-[#7a7a6a] mt-2 font-sans">
                      Downloads raw self-contained sign dataset file detailing twenty-one spatial nodes landmarks.
                    </p>
                  </div>

                  <div className="bg-stone-50 p-3.5 border border-[#ecece0] rounded-xl" id="api-catalog-post">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold font-mono rounded text-[10px]">POST</span>
                      <code className="font-mono text-[11px] bg-white px-1 border rounded text-[#2d2d28]">/api/datasets</code>
                    </div>
                    <p className="text-[10px] text-[#7a7a6a] mt-2 font-sans">
                      Creates a brand new file with specified name, descriptions, and structural matrix elements.
                    </p>
                  </div>

                  <div className="bg-stone-50 p-3.5 border border-[#ecece0] rounded-xl" id="api-catalog-delete">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-1.5 py-0.5 bg-rose-100 text-[#a36b5e] font-bold font-mono rounded text-[10px]">DELETE</span>
                      <code className="font-mono text-[11px] bg-white px-1 border rounded text-[#2d2d28]">/api/datasets/:id</code>
                    </div>
                    <p className="text-[10px] text-[#7a7a6a] mt-2 font-sans">
                      Instantly wipe corresponding dataset file completely off the backend dev container.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* 📝 EDIT METADATA MODAL (CRUD Update) */}
      <AnimatePresence>
        {editingDataset && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-metadata-modal-parent">
            <motion.div 
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#ecece0] p-6 max-w-md w-full shadow-2xl space-y-5"
              id="edit-metadata-modal-box"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Edit2 className="w-5 h-5 text-[#7c8d7c]" />
                <h3 className="text-sm font-extrabold text-[#2d2d28] uppercase tracking-wide">Update Dataset Information</h3>
              </div>

              <form onSubmit={handleUpdateDataset} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">Dataset Name</label>
                  <input 
                    type="text" 
                    required 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 border border-[#ecece0] rounded-xl focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-stone-50"
                    id="edit-dataset-name-field"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">Dataset Description</label>
                  <textarea 
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 border border-[#ecece0] rounded-xl focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-stone-50"
                    id="edit-dataset-desc-field"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingDataset(null)}
                    disabled={isSavingEdit}
                    className="px-4 py-2 text-xs font-bold font-mono text-neutral-500 hover:text-neutral-800 uppercase cursor-pointer"
                    id="cancel-edit-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSavingEdit}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#7c8d7c] hover:bg-[#6c7d6c] disabled:opacity-50 rounded-xl transition font-mono flex items-center gap-1.5 cursor-pointer"
                    id="submit-edit-btn"
                  >
                    {isSavingEdit ? (
                      <>
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                        Saving Updates...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
