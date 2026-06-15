import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, BrainCircuit, Play, Square, Save, Download, Sliders, Database, 
  AlertTriangle, BookOpen, Award, Check, RefreshCw, BarChart2, Info,
  Upload, FileJson, FileCode
} from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import { CollectedSample } from '../types';

interface DatasetItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  samples: CollectedSample[];
  categories: string[];
  sampleStatistics: Record<string, number>;
  size: string;
}

interface ModelTrainerProps {
  collectedSamples: CollectedSample[];
  onRegisterTrainedModel?: (model: tf.LayersModel, classes: string[]) => void;
}

interface EpochHistory {
  epoch: number;
  accuracy: number;
  loss: number;
  valAccuracy?: number;
  valLoss?: number;
}

export default function ModelTrainer({ 
  collectedSamples, 
  onRegisterTrainedModel 
}: ModelTrainerProps) {
  // Hosted datasets list from API
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<'server' | 'browser'>('browser');
  const [selectedServerDatasetId, setSelectedServerDatasetId] = useState<string>('');
  const [isLoadingDatasets, setIsLoadingDatasets] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Hyperparameters
  const [epochs, setEpochs] = useState<number>(30);
  const [batchSize, setBatchSize] = useState<number>(8);
  const [learningRate, setLearningRate] = useState<number>(0.01);
  const [valSplit, setValSplit] = useState<number>(0.2);
  const [hiddenNodes1, setHiddenNodes1] = useState<number>(64);
  const [hiddenNodes2, setHiddenNodes2] = useState<number>(32);

  // Training state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [trainingHistory, setTrainingHistory] = useState<EpochHistory[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<{
    accuracy: number;
    loss: number;
    valAccuracy: number;
    valLoss: number;
  }>({ accuracy: 0, loss: 0, valAccuracy: 0, valLoss: 0 });

  // Trained Model Reference
  const [activeModel, setActiveModel] = useState<tf.LayersModel | null>(null);
  const [trainedClasses, setTrainedClasses] = useState<string[]>([]);
  const [activeDatasetSamples, setActiveDatasetSamples] = useState<CollectedSample[]>([]);

  // Explain tabs
  const [explainStep, setExplainStep] = useState<number>(0);

  // Stop token for training
  const stopTrainingRef = React.useRef<boolean>(false);

  // Model Importer State Managers
  const [imJsonFile, setImJsonFile] = useState<File | null>(null);
  const [imBinFile, setImBinFile] = useState<File | null>(null);
  const [importedClassesText, setImportedClassesText] = useState<string>("A, B, C");

  const handleImportModelFromFiles = async () => {
    if (!imJsonFile || !imBinFile) {
      setErrorMsg("Please select both 'model.json' structural file and binary weights file first.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      // 1. Process target classes list
      const labels = importedClassesText
        .split(',')
        .map(l => l.trim().toUpperCase())
        .filter(l => l.length > 0);
        
      if (labels.length < 2) {
        setErrorMsg("Model classes parsing failed. Must describe at least 2 distinct classification categories.");
        return;
      }
      
      // 2. Feed files into TF.js browserFiles deserializer
      const loaded = await tf.loadLayersModel(tf.io.browserFiles([imJsonFile, imBinFile]));
      
      setActiveModel(loaded);
      setTrainedClasses(labels);
      
      // 3. Persist imported model into IndexedDB so it survives page reloads
      try {
        await loaded.save('indexeddb://asl_trained_mlp_model');
        localStorage.setItem('asl_trained_classes', JSON.stringify(labels));
      } catch (dbErr) {
        console.warn("Could not save imported model to IndexedDB:", dbErr);
      }

      // 4. Notify parent state
      if (onRegisterTrainedModel) {
        onRegisterTrainedModel(loaded, labels);
      }
      
      setSuccessMsg(`Successfully deserialized and registered custom TensorFlow model from disk files. ${labels.length} classes active!`);
    } catch (err: any) {
      setErrorMsg(`Model Import failure: ${err.message || err}`);
    }
  };

  useEffect(() => {
    fetchDatasetsList();
  }, []);

  // Update chosen specimens when selected source or server ID updates
  useEffect(() => {
    if (selectedSource === 'browser') {
      setActiveDatasetSamples(collectedSamples);
    } else {
      const found = datasets.find(d => d.id === selectedServerDatasetId);
      if (found) {
        setActiveDatasetSamples(found.samples);
      } else {
        setActiveDatasetSamples([]);
      }
    }
  }, [selectedSource, selectedServerDatasetId, datasets, collectedSamples]);

  const fetchDatasetsList = async () => {
    setIsLoadingDatasets(true);
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        const data = await res.json();
        setDatasets(data);
        if (data.length > 0) {
          setSelectedServerDatasetId(data[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load global datasets list for training:", err);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const getLabelDistribution = () => {
    const counts: Record<string, number> = {};
    activeDatasetSamples.forEach(s => {
      const label = s.label.toUpperCase();
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  };

  const labelCounts = getLabelDistribution();
  const sortedLabels = Object.keys(labelCounts).sort();

  // Helper: Normalize Hand Landmark Coordinates (Make them invariant to camera positioning)
  // Shift all joints relative to the wrist (Joint index 0)
  const preprocessLandmarks = (landmarks: Array<{x: number, y: number, z: number}>) => {
    if (landmarks.length === 0) return new Array(63).fill(0);
    
    // Wrist joint anchor (index 0)
    const wrist = landmarks[0];
    const features: number[] = [];
    
    landmarks.forEach(joint => {
      // Offset translation: relative joint displacement
      features.push(joint.x - wrist.x);
      features.push(joint.y - wrist.y);
      features.push(joint.z - wrist.z);
    });
    
    return features;
  };

  const stopTraining = () => {
    stopTrainingRef.current = true;
    setIsTraining(false);
    setErrorMsg("Training canceled by user interlock request.");
  };

  // Main TensorFlow.js Async Training Flow
  const startTensorflowTraining = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    stopTrainingRef.current = false;

    if (activeDatasetSamples.length < 5) {
      setErrorMsg(`Insufficient specimens. You have under 5 landmark frames loaded. Please record more datasets or select a longer hosted dataset repository first.`);
      return;
    }

    if (sortedLabels.length < 2) {
      setErrorMsg(`Model requires at least 2 distinct sign categories to train a classifier. Current unique groups found: ${sortedLabels.join(', ') || 'None'}`);
      return;
    }

    setIsTraining(true);
    setTrainingHistory([]);
    setCurrentEpoch(0);

    try {
      // 1. Prepare target mapping index labels
      const labelToIndex: Record<string, number> = {};
      sortedLabels.forEach((label, idx) => {
        labelToIndex[label] = idx;
      });

      // 2. Format training tensor coordinates & labels
      const inputFeatures: number[][] = [];
      const outputLabels: number[] = [];

      activeDatasetSamples.forEach(sample => {
        const preprocessed = preprocessLandmarks(sample.landmarks);
        inputFeatures.push(preprocessed);
        outputLabels.push(labelToIndex[sample.label.toUpperCase()]);
      });

      // 3. Convert to TF tensors safely inside tf.tidy scope to prevent memory leaks
      const { xs, ys } = tf.tidy(() => {
        const xTensor = tf.tensor2d(inputFeatures, [inputFeatures.length, 63]);
        const yTensor = tf.tensor1d(outputLabels, 'int32');
        const yOneHot = tf.oneHot(yTensor, sortedLabels.length);
        return { xs: xTensor, ys: yOneHot };
      });

      // 4. Form Sequential multi-layer Feed-Forward MLP Neural Block
      const model = tf.sequential();
      
      // Input layer + First Dense layer
      model.add(tf.layers.dense({
        units: hiddenNodes1,
        activation: 'relu',
        inputShape: [63],
        kernelInitializer: 'glorotNormal'
      }));

      // Dropout to prevent overfitting model to particular webcams
      model.add(tf.layers.dropout({ rate: 0.1 }));

      // Second Dense layers
      model.add(tf.layers.dense({
        units: hiddenNodes2,
        activation: 'relu',
        kernelInitializer: 'glorotNormal'
      }));

      // Softmax Output layout layer matching our label scale
      model.add(tf.layers.dense({
        units: sortedLabels.length,
        activation: 'softmax'
      }));

      // 5. Compile with standard Adam Optimizer and categorical crossentropy loss parameters
      const optimizer = tf.train.adam(learningRate);
      model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      // 6. Asynchronous Backpropagation fit callbacks
      const localHistory: EpochHistory[] = [];

      await model.fit(xs, ys, {
        epochs: epochs,
        batchSize: batchSize,
        validationSplit: valSplit,
        shuffle: true,
        callbacks: {
          onEpochEnd: async (epoch, logs) => {
            if (stopTrainingRef.current) {
              model.stopTraining = true;
              return;
            }

            const epochNum = epoch + 1;
            const accuracy = logs?.acc ?? 0;
            const loss = logs?.loss ?? 0;
            const valAccuracy = logs?.val_acc ?? 0;
            const valLoss = logs?.val_loss ?? 0;

            const newMetricsObj = { epoch: epochNum, accuracy, loss, valAccuracy, valLoss };
            localHistory.push(newMetricsObj);
            
            // Set React visual states
            setCurrentEpoch(epochNum);
            setCurrentMetrics({ accuracy, loss, valAccuracy, valLoss });
            setTrainingHistory([...localHistory]);

            // Give frame rate back to browser layout to prevent locks
            await tf.nextFrame();
          }
        }
      });

      // Clean up inputs coordinate tensors to conserve GPU graphics ram
      xs.dispose();
      ys.dispose();

      if (!stopTrainingRef.current) {
        setActiveModel(model);
        setTrainedClasses(sortedLabels);
        
        // Save to IndexedDB persistently so it survives page reloads
        try {
          await model.save('indexeddb://asl_trained_mlp_model');
          localStorage.setItem('asl_trained_classes', JSON.stringify(sortedLabels));
          console.log("Successfully stored the trained TF.js model persistently into IndexedDB.");
        } catch (dbErr) {
          console.warn("Could not save to IndexedDB, falling back to session-only memory:", dbErr);
        }

        // Notify Parent App is ready to receive dynamic prediction logic
        if (onRegisterTrainedModel) {
          onRegisterTrainedModel(model, sortedLabels);
        }

        setSuccessMsg(`Model trained to completion successfully over ${epochs} epochs. Saved to local IndexedDB and now active on client viewport!`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Training exception failure: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  // Local model downloads to drive as standalone artifacts
  const handleModelArtifactDownload = async () => {
    if (!activeModel) return;
    try {
      await activeModel.save('downloads://trained_asl_recognizer_model');
      setSuccessMsg("Success! Triggered browser download of 'trained_asl_recognizer_model.json' and binary weights segment buffers.");
    } catch (err: any) {
      setErrorMsg(`Download error interface: ${err.message}`);
    }
  };

  // Render SVG Charts manually for Accuracy and Loss graphs to handle responsive canvas beautifully
  const renderSVGGraph = (type: 'accuracy' | 'loss') => {
    if (trainingHistory.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-44 text-[#7a7a6a] font-mono text-xs">
          <BarChart2 className="w-8 h-8 opacity-30 mb-2 animate-pulse" />
          <span>No backpropagation telemetry recorded.</span>
        </div>
      );
    }

    const width = 500;
    const height = 180;
    const padding = 35;

    // Grid coordinates calculations
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const maxEpoch = epochs;
    
    // Bounds check
    let maxValue = 1.0;
    if (type === 'loss') {
      const allLosses = trainingHistory.flatMap(h => [h.loss, h.valLoss || 0]);
      maxValue = Math.max(...allLosses, 0.5) * 1.1;
    }

    // Convert epoch indices to coordinates
    const getX = (epoch: number) => {
      if (maxEpoch <= 1) return padding;
      return padding + ((epoch - 1) / (maxEpoch - 1)) * graphWidth;
    };

    const getY = (val: number) => {
      const ratio = val / maxValue;
      // SVG goes from top to bottom
      return height - padding - ratio * graphHeight;
    };

    // Construct path strings
    let trainPath = "";
    let valPath = "";

    trainingHistory.forEach((h, index) => {
      const tx = getX(h.epoch);
      const ty = getY(type === 'accuracy' ? h.accuracy : h.loss);
      
      if (index === 0) {
        trainPath += `M ${tx} ${ty}`;
      } else {
        trainPath += ` L ${tx} ${ty}`;
      }

      if (h.valAccuracy !== undefined && h.valLoss !== undefined) {
        const vex = getX(h.epoch);
        const vey = getY(type === 'accuracy' ? h.valAccuracy : h.valLoss);
        if (index === 0) {
          valPath += `M ${vex} ${vey}`;
        } else {
          valPath += ` L ${vex} ${vey}`;
        }
      }
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-[#4a4a40]" id={`chart-${type}`}>
        {/* Graph background lines */}
        <rect x={padding} y={padding} width={graphWidth} height={graphHeight} fill="#fafaf9" rx="4" />
        
        {/* Horizonal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((tick, i) => {
          const val = tick * maxValue;
          const y = getY(val);
          return (
            <g key={i} className="opacity-40">
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#ecece0" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding - 6} y={y + 3} textAnchor="end" className="text-[9px] font-mono font-bold fill-[#7a7a6a]">
                {type === 'accuracy' ? `${Math.round(tick * 100)}%` : val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Vertical Epoch ticks */}
        {Array.from({ length: 5 }).map((_, i) => {
          const tickEpoch = Math.round(1 + (maxEpoch - 1) * (i / 4));
          const x = getX(tickEpoch);
          return (
            <g key={i} className="opacity-40">
              <line x1={x} y1={height - padding} x2={x} y2={padding} stroke="#ecece0" strokeWidth="1" strokeDasharray="3,3" />
              <text x={x} y={height - padding + 12} textAnchor="middle" className="text-[9px] font-mono font-bold fill-[#7a7a6a]">
                Ep {tickEpoch}
              </text>
            </g>
          );
        })}

        {/* Curves Paths */}
        {trainPath && (
          <path 
            d={trainPath} 
            fill="none" 
            stroke={type === 'accuracy' ? '#10b981' : '#f43f5e'} 
            strokeWidth="2.5" 
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        )}
        {valPath && (
          <path 
            d={valPath} 
            fill="none" 
            stroke={type === 'accuracy' ? '#3b82f6' : '#f59e0b'} 
            strokeWidth="1.5" 
            strokeLinecap="round"
            strokeDasharray="4,2"
            className="transition-all duration-300 animate-pulse"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in" id="tensorflow-neural-workspace">
      
      {/* Banner Toast Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -25 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -25 }}
            className="fixed top-24 right-6 bg-[#ebf5eb] border border-[#d2edd2] text-[#428042] px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-xl z-50 text-xs font-semibold"
            id="ml-success-toast"
          >
            <Check className="w-5 h-5 bg-[#428042] text-white rounded-full p-1" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#ebdcd1] border border-[#ebd6c5] text-[#a36b5e] p-4 rounded-2xl flex items-start gap-3"
            id="ml-error-panel"
          >
            <AlertTriangle className="w-5 h-5 text-[#a36b5e] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block">Training Exception Triggered</span>
              <p className="mt-1 font-medium">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-[#a36b5e] font-bold text-xs ml-auto hover:underline self-start pl-4">DISMISS</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Settings & Distribution + Live Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="trainer-parent-grid">
        
        {/* COLUMN 1: Dataset Loader, Configuration, Parameters (SPAN 5) */}
        <div className="lg:col-span-5 space-y-6" id="training-settings-col">
          
          {/* Section: Select Dataset Source */}
          <div className="bg-white border border-[#ecece0] rounded-3xl p-6 shadow-sm space-y-5" id="dataset-picker-panel">
            <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
              <Database className="w-4 h-4" />
              1. Select Training Data
            </div>

            <div className="flex bg-[#f0f2ee] p-1 border border-[#e0e4db] rounded-xl text-xs font-sans" id="data-source-selector">
              <button 
                type="button"
                onClick={() => setSelectedSource('browser')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center transition ${
                  selectedSource === 'browser' ? 'bg-[#7c8d7c] text-white shadow-xs' : 'text-[#5a6b5a] hover:text-[#2d2d28]'
                }`}
                id="source-active-buffer"
              >
                Active Browser Buffer ({collectedSamples.length})
              </button>
              <button 
                type="button"
                onClick={() => setSelectedSource('server')}
                className={`flex-1 py-1.5 rounded-lg font-bold text-center transition ${
                  selectedSource === 'server' ? 'bg-[#7c8d7c] text-white shadow-xs' : 'text-[#5a6b5a] hover:text-[#2d2d28]'
                }`}
                id="source-host-datasets"
              >
                Hosted Repos ({datasets.length})
              </button>
            </div>

            {selectedSource === 'server' && (
              <div className="space-y-1.5" id="server-dataset-select-container">
                <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block font-mono">Choose Master JSON File</label>
                {isLoadingDatasets ? (
                  <div className="text-xs text-stone-400 py-2">Syncing hosted repository registries...</div>
                ) : datasets.length === 0 ? (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-100 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>No hosted files located on server. Please use standard webcam recorder and save a dataset.</span>
                  </div>
                ) : (
                  <select 
                    value={selectedServerDatasetId}
                    onChange={(e) => setSelectedServerDatasetId(e.target.value)}
                    className="w-full text-xs font-sans px-3 py-2 rounded-lg border border-[#ecece0] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-[#fcfcf9]"
                    id="dataset-server-dropdown"
                  >
                    {datasets.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.samples.length} items)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Display Target Sample Data Distribution Statistics */}
            <div className="space-y-3" id="sample-distribution-analysis">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#2d2d28]">Specimen Data Distribution</span>
                <span className="font-mono text-[11px] text-[#7a7a6a] font-bold">{activeDatasetSamples.length} total items</span>
              </div>

              {activeDatasetSamples.length === 0 ? (
                <div className="text-center py-6 bg-[#fafaf9] rounded-2xl border border-dashed border-[#ecece0] text-xs text-stone-400 font-medium">
                  Selected data source buffer is currently empty.
                </div>
              ) : (
                <div className="bg-[#fafaf9] p-3.5 rounded-2xl border border-[#ecece0] max-h-48 overflow-y-auto space-y-2.5" id="distribution-progress-bars">
                  {sortedLabels.map(label => {
                    const count = labelCounts[label] || 0;
                    const pct = Math.round((count / activeDatasetSamples.length) * 100);
                    return (
                      <div key={label} className="space-y-1" id={`label-bar-${label}`}>
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="font-bold text-[#3d3d38]">Sign "{label}"</span>
                          <span className="font-mono text-stone-500">{count} frames ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#ecece0] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-600 rounded-full" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section: Import/Load Saved Model */}
          <div className="bg-white border border-[#ecece0] rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in" id="model-importer-panel">
            <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
              <Upload className="w-4 h-4" />
              Import Saved Model
            </div>
            <p className="text-[11px] text-[#7a7a6a] leading-relaxed">
              Upload your previously downloaded model JSON structure and binary weights file to restore your classifier directly.
            </p>
            <div className="space-y-3" id="import-controls">
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest text-[#7a7a6a] font-bold block font-mono">Model Classes (comma-separated labels)</span>
                <input
                  type="text"
                  placeholder="e.g. A, B, C, HI, LOVE, SOS"
                  value={importedClassesText}
                  onChange={(e) => setImportedClassesText(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[#ecece0] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-[#fcfcf9]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 relative">
                  <span className="text-[9px] uppercase tracking-widest text-[#7a7a6a] font-bold block font-mono">Structure (.json)</span>
                  <label className="flex flex-col items-center justify-center border border-dashed border-[#ecece0] rounded-xl py-2 px-1 text-center cursor-pointer hover:bg-[#fafaf9] transition-all bg-[#fcfcf9] min-h-[56px] justify-center">
                    <FileJson className="w-4 h-4 text-[#7c8d7c]" />
                    <span className="text-[8px] truncate font-sans font-semibold max-w-full block px-1 text-[#7a7a6a] mt-1">
                      {imJsonFile ? imJsonFile.name : "Select JSON"}
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImJsonFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="space-y-1 relative">
                  <span className="text-[9px] uppercase tracking-widest text-[#7a7a6a] font-bold block font-mono">Weights (.bin)</span>
                  <label className="flex flex-col items-center justify-center border border-dashed border-[#ecece0] rounded-xl py-2 px-1 text-center cursor-pointer hover:bg-[#fafaf9] transition-all bg-[#fcfcf9] min-h-[56px] justify-center">
                    <FileCode className="w-4 h-4 text-[#a36b5e]" />
                    <span className="text-[8px] truncate font-sans font-semibold max-w-full block px-1 text-[#7a7a6a] mt-1">
                      {imBinFile ? imBinFile.name : "Select Bin"}
                    </span>
                    <input
                      type="file"
                      accept=".bin"
                      onChange={(e) => setImBinFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <button
                type="button"
                disabled={!imJsonFile || !imBinFile || !importedClassesText.trim()}
                onClick={handleImportModelFromFiles}
                className="w-full py-2 bg-[#7c8d7c] hover:bg-[#6c7d6c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 shadow-xs"
              >
                Restore Uploaded Model
              </button>
            </div>
          </div>

          {/* Section: Neural Network Parameters */}
          <div className="bg-white border border-[#ecece0] rounded-3xl p-6 shadow-sm space-y-5" id="hyperparameters-config-panel">
            <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
              <Sliders className="w-4 h-4" />
              2. Hyperparameters configuration
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans" id="params-form-grid">
              
              <div className="space-y-1">
                <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block" title="Hidden layers compute density">
                  Dense Hidden Nodes #1
                </label>
                <select 
                  value={hiddenNodes1} 
                  onChange={(e) => setHiddenNodes1(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#ecece0] rounded-lg outline-none bg-[#fcfcf9]"
                  id="param-nodes1"
                >
                  <option value={32}>32 units</option>
                  <option value={64}>64 units (Standard)</option>
                  <option value={128}>128 units (Dense)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">
                  Dense Hidden Nodes #2
                </label>
                <select 
                  value={hiddenNodes2} 
                  onChange={(e) => setHiddenNodes2(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#ecece0] rounded-lg outline-none bg-[#fcfcf9]"
                  id="param-nodes2"
                >
                  <option value={16}>16 units</option>
                  <option value={32}>32 units (Standard)</option>
                  <option value={64}>64 units (Dense)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">
                  Epoch Iterations
                </label>
                <input 
                  type="number" 
                  min={5} 
                  max={500}
                  value={epochs} 
                  onChange={(e) => setEpochs(Math.max(5, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-[#ecece0] rounded-lg outline-none bg-[#fcfcf9] font-mono"
                  id="param-epochs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">
                  Batch Train Size
                </label>
                <select 
                  value={batchSize} 
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#ecece0] rounded-lg outline-none bg-[#fcfcf9]"
                  id="param-batch"
                >
                  <option value={4}>4 (High loss variance)</option>
                  <option value={8}>8 (Standard)</option>
                  <option value={16}>16 (Stable gradients)</option>
                  <option value={32}>32 (Coarse steps)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">
                  Adam Learning Rate
                </label>
                <select 
                  value={learningRate} 
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#ecece0] rounded-lg outline-none bg-[#fcfcf9] font-mono"
                  id="param-lr"
                >
                  <option value={0.05}>0.05 (Fast/Rough)</option>
                  <option value={0.01}>0.01 (Standard)</option>
                  <option value={0.005}>0.005 (Refined)</option>
                  <option value={0.001}>0.001 (Gradual convergence)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">
                  Validation Holdout %
                </label>
                <select 
                  value={valSplit} 
                  onChange={(e) => setValSplit(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-[#ecece0] rounded-lg outline-none bg-[#fcfcf9]"
                  id="param-valsplit"
                >
                  <option value={0.1}>10% validation split</option>
                  <option value={0.2}>20% validation split</option>
                  <option value={0.3}>30% validation split</option>
                </select>
              </div>

            </div>
          </div>

        </div>

        {/* COLUMN 2: Neural Training, SVG Graphs, and Saving Model (SPAN 7) */}
        <div className="lg:col-span-7 space-y-6" id="training-telemetry-col">
          
          <div className="bg-white border border-[#ecece0] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="backprop-control-panel">
            
            {/* Header Title with animated nodes */}
            <div className="flex items-center justify-between border-b border-[#f0f2ee] pb-4" id="backprop-header flex">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isTraining ? 'bg-emerald-600 text-white animate-pulse' : 'bg-[#eef1ed] text-[#5c6d5c]'}`}>
                  <BrainCircuit className="w-5 h-5 animate-spin duration-3000" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2d2d28] uppercase tracking-wide">TensorFlow Backpropagation Network</h4>
                  <p className="text-[11px] text-[#7a7a6a] font-mono mt-0.5">Active Class scale: {sortedLabels.length} unique nodes</p>
                </div>
              </div>

              {isTraining ? (
                <button 
                  onClick={stopTraining}
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2 text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition duration-150 animate-pulse shadow-md uppercase tracking-wide"
                  id="btn-training-interlock"
                >
                  <Square className="w-4 h-4" />
                  Terminate [Esc]
                </button>
              ) : (
                <button 
                  onClick={startTensorflowTraining}
                  className="flex items-center gap-2 text-xs font-bold px-5 py-2 text-white bg-[#7c8d7c] hover:bg-[#6c7d6c] rounded-xl transition duration-150 shadow-md uppercase tracking-wide"
                  id="btn-training-initialize"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Initialize neural net
                </button>
              )}
            </div>

            {/* Run Progress Telemetry Panel */}
            {isTraining && (
              <div className="bg-[#f0f2ee]/50 border border-[#e0e4db] rounded-2xl p-5 space-y-3.5" id="running-telemetry">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#3d3d38] flex items-center gap-2 font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#7c8d7c]" />
                    Optimizing weights: Epoch {currentEpoch} of {epochs}
                  </span>
                  <span className="font-mono text-[11px] bg-white border border-[#e0e4db] px-2.5 py-0.5 rounded font-extrabold text-[#7c8d7c]">
                    {Math.round((currentEpoch / epochs) * 100)}% COMPLETE
                  </span>
                </div>

                {/* Progress bar tracking */}
                <div className="w-full h-2.5 bg-[#e2e6dd] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#7c8d7c] rounded-full transition-all duration-300" 
                    style={{ width: `${(currentEpoch / epochs) * 100}%` }}
                  />
                </div>

                {/* Metrics detail grids */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1.5" id="live-metrics-grids">
                  <div className="bg-white p-3 rounded-xl border border-[#e2e6dd]" id="live-acc">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Accuracy</p>
                    <p className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5">{(currentMetrics.accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#e2e6dd]" id="live-val-acc">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Val Accuracy</p>
                    <p className="text-sm font-extrabold text-blue-600 font-mono mt-0.5">{(currentMetrics.valAccuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#e2e6dd]" id="live-loss">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Training Loss</p>
                    <p className="text-sm font-extrabold text-rose-500 font-mono mt-0.5">{currentMetrics.loss.toFixed(4)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#e2e6dd]" id="live-val-loss">
                    <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Validation Loss</p>
                    <p className="text-sm font-extrabold text-amber-500 font-mono mt-0.5">{currentMetrics.valLoss.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* CHARTS CONTAINER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="telemetry-charts-grid">
              
              {/* Plot 1: Accuracy Curve */}
              <div className="bg-[#fafaf9] border border-[#ecece0] rounded-2xl p-4.5 space-y-3" id="plot-accuracy-container">
                <div className="flex justify-between items-center border-b border-[#f0f2ee] pb-2 text-xs">
                  <span className="font-bold text-[#2d2d28] font-sans">Accuracy Convergence Curve</span>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-[#10b981] rounded" /> Train</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 border border-[#3b82f6] border-dashed rounded" /> Val</span>
                  </div>
                </div>
                <div className="h-44" id="accuracy-plot-wrapper">
                  {renderSVGGraph('accuracy')}
                </div>
              </div>

              {/* Plot 2: Loss Curve */}
              <div className="bg-[#fafaf9] border border-[#ecece0] rounded-2xl p-4.5 space-y-3" id="plot-loss-container">
                <div className="flex justify-between items-center border-b border-[#f0f2ee] pb-2 text-xs">
                  <span className="font-bold text-[#2d2d28] font-sans">Loss Convergence Curve</span>
                  <div className="flex items-center gap-3 text-[10px] font-mono">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-[#f43f5e] rounded" /> Train</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-1 border border-[#f59e0b] border-dashed rounded" /> Val</span>
                  </div>
                </div>
                <div className="h-44" id="loss-plot-wrapper">
                  {renderSVGGraph('loss')}
                </div>
              </div>

            </div>

            {/* Export & Registration controls */}
            {activeModel && (
              <div className="bg-[#ebf5eb]/40 border border-[#d2edd2] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" id="model-save-section animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Award className="w-4.5 h-4.5 text-[#428042]" />
                    Model Compiled & Registered!
                  </div>
                  <p className="text-xs text-[#527052]">
                    The local machine learning instance is actively connected to your practicing cameras viewpoint. Live inferences will use client-side neural metrics immediately.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto" id="model-export-controls">
                  <button 
                    onClick={handleModelArtifactDownload}
                    className="flex items-center gap-1.5 text-xs text-white font-bold bg-[#7c8d7c] hover:bg-[#6c7d6c] px-4.5 py-2.5 rounded-xl border border-[#7c8d7c] transition shadow-xs uppercase tracking-wide"
                    id="btn-model-artifact-download"
                  >
                    <Download className="w-4 h-4" />
                    Download JSON artifacts
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* CORE PIPELINE EXPLANATORY DOCUMENTATION SECTION */}
      <div className="bg-white border border-[#ecece0] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="learning-pipeline-explanation">
        
        <div className="flex items-center gap-3 border-b border-[#f0f2ee] pb-4" id="docs-header">
          <BookOpen className="w-5.5 h-5.5 text-[#7c8d7c]" />
          <div>
            <h4 className="text-base font-bold text-[#2d2d28]">TensorFlow Multi-Layer Perceptron (MLP) Pipeline Explained</h4>
            <p className="text-xs text-[#7a7a6a]">Interactive guide to dynamic sign posture coordinate classification</p>
          </div>
        </div>

        {/* Steps menu row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-[#f5f5f0] pb-2" id="docs-step-pills">
          {[
            { tag: "01. Preprocessing", label: "Rotation Invariance" },
            { tag: "02. Topology", label: "Layer Nodes" },
            { tag: "03. Optimization", label: "Adam Descent" },
            { tag: "04. Inference", label: "Softmax Weights" }
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => setExplainStep(idx)}
              className={`p-3.5 text-left rounded-xl transition-all border ${
                explainStep === idx 
                  ? "bg-[#7c8d7c] text-white border-[#7c8d7c] shadow-xs" 
                  : "bg-transparent text-[#5a5a4a] border-transparent hover:bg-[#fafaf9]"
              }`}
              id={`step-doc-btn-${idx}`}
            >
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider">{item.tag}</p>
              <p className="text-xs font-bold leading-none mt-1">{item.label}</p>
            </button>
          ))}
        </div>

        {/* Explained Details */}
        <div className="bg-[#fafaf9] p-5 rounded-2xl border border-[#ecece0] text-xs leading-relaxed text-[#5a5a40]" id="docs-details-box">
          
          {explainStep === 0 && (
            <div className="space-y-4" id="explain-step-0">
              <h5 className="text-sm font-bold text-[#2d2d28]">Converting Skeletal Joints to Relative Coordinate Vectors</h5>
              <p>
                To make our neural network invariant to how far the user stands from their camera or where their hand travels in the bounding camera box coordinates, we run an essential coordinate offset transformation step before feed-forwarding.
              </p>
              <div className="bg-white p-4 rounded-xl border border-[#ecece0] font-mono space-y-2 text-[11.5px] text-[#4d5c4d]">
                <p className="font-bold">// Math Translation step inside preprocessLandmarks():</p>
                <p>const wristCoordinate = landmarks[0]; // Joint index 0 serves as offset origin (0, 0, 0)</p>
                <p>landmarks.forEach(joint =&gt; &#123;</p>
                <p className="pl-4">features.push(joint.x - wristCoordinate.x); // X displacement relative to wrist</p>
                <p className="pl-4">features.push(joint.y - wristCoordinate.y); // Y displacement relative to wrist</p>
                <p className="pl-4">features.push(joint.z - wristCoordinate.z); // Z displacement relative to wrist</p>
                <p>&#125;); // Generates exactly 63 independent relative normalized coordinate vectors</p>
              </div>
              <p>
                By grounding each finger joint's placement strictly against the wrist position, we isolate the biological posture shape from its frame coordinates.
              </p>
            </div>
          )}

          {explainStep === 1 && (
            <div className="space-y-4" id="explain-step-1">
              <h5 className="text-sm font-bold text-[#2d2d28]">Linear Layer Configuration & Network Structure</h5>
              <p>
                The Multi-Layer Perceptron (MLP) contains exactly 63 input feature nodes mapping into sequential fully-connected (dense) layers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="explain-topology-grid">
                <div className="bg-white p-3.5 rounded-xl border border-[#ecece0]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Layer 1: Input</span>
                  <p className="font-bold text-[#2d2d28] mt-1">63 Floating Point values</p>
                  <p className="text-[11px] text-[#7a7a6a] mt-1">Standard 21 landmarks hand joints times 3 coordinate vectors (X, Y, Z).</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#ecece0]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Layer 2: Dense Hidden</span>
                  <p className="font-bold text-emerald-600 mt-1">Dense Rectified Linear (ReLU)</p>
                  <p className="text-[11px] text-[#7a7a6a] mt-1">Deep weights learn complex spatial patterns like curls, knuckle angles, indices crossing, or fist cohesion.</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#ecece0]">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Layer 3: Output Classification</span>
                  <p className="font-bold text-blue-600 mt-1">Softmax Distribution</p>
                  <p className="text-[11px] text-[#7a7a6a] mt-1">Compiles the multi-class parameters into a probability sum matching exactly 100%.</p>
                </div>
              </div>
              <p>
                We inject an optional 10% dropout buffer block between hidden groups. This periodically restricts neurons from adapting to single camera ratios, promoting generalizable pattern recognition.
              </p>
            </div>
          )}

          {explainStep === 2 && (
            <div className="space-y-4" id="explain-step-2">
              <h5 className="text-sm font-bold text-[#2d2d28]">Adam Optimizer & Backpropagation Dynamics</h5>
              <p>
                During each forward pass, the model makes gesture guesses from its random initial weights. It compares those guesses against true one-hot indices of your collection (e.g. `[1.0, 0.0, 0.0]` for Category A) to quantify categorical cross-entropy loss.
              </p>
              <p>
                Backpropagation calculates gradients of this loss relative to all dense weights. The <strong>Adam Optimizer</strong> uses these gradients alongside first and second momentum estimates (exponential moving averages of gradients) to fine-tune the dense weights!
              </p>
              <div className="bg-white p-4.5 rounded-xl border border-[#ecece0] text-[11.5px] font-mono text-[#5a5a4a] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7a7a6a] tracking-widest block">Optimization Hyperparameters:</span>
                <div>- Learning Rate: governs step-size increments during backprop weights revision.</div>
                <div>- Categorical Cross-Entropy: penalizes mismatching class predictions exponentially.</div>
                <div>- Batches: updates weights in segments to ensure smooth training updates.</div>
              </div>
            </div>
          )}

          {explainStep === 3 && (
            <div className="space-y-4" id="explain-step-3">
              <h5 className="text-sm font-bold text-[#2d2d28]">Real-Time Inference using Browser GPU Tensors</h5>
              <p>
                When training is completed, our model uses TensorFlow.js compilation to perform lightning-fast client-side neural prediction directly on the interactive video thread.
              </p>
              <p>
                Our webcam thread feeds the preprocessed joint arrays into the compiled model, executing the model inside a non-blocking `tf.tidy` block. The index with the highest probability value is translated as the active sign gesture.
              </p>
              <div className="bg-white p-4 rounded-xl border border-[#ecece0] text-[11.5px] font-mono text-stone-500 space-y-1">
                <strong>// Realtime Translation block inside predictedGestureCallback():</strong>
                <div>const prediction = activeModel.predict(preprocessedFeaturesTensor);</div>
                <div>const predictedIndex = prediction.argMax(1).dataSync()[0];</div>
                <div>const targetLabel = trainedClasses[predictedIndex];</div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
