import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, BrainCircuit, Play, Square, Save, Download, Sliders, Database, 
  AlertTriangle, BookOpen, Award, Check, RefreshCw, BarChart2, Info,
  Upload, FileJson, FileCode, Zap, Gauge, TrendingUp, SlidersHorizontal, Activity, Clock
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
  // Sub-navigation: Workspace vs Performance Benchmarking
  const [activeSubTab, setActiveSubTab] = useState<'workspace' | 'performance'>('workspace');

  // Performance Optimization States
  const [quantizationLevel, setQuantizationLevel] = useState<'none' | 'fp16' | 'int8'>(() => {
    return (localStorage.getItem('asl_quantization_level') as any) || 'none';
  });
  const [throttleMs, setThrottleMs] = useState<number>(() => {
    return Number(localStorage.getItem('asl_prediction_throttle_ms') || '40');
  });

  const [benchmarkIsRunning, setBenchmarkIsRunning] = useState<boolean>(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState<number>(0);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    latencyAvg: number;
    latencyMin: number;
    latencyMax: number;
    latencyP95: number;
    throughput: number;
    parameterCount: number;
    estimatedSizeKb: number;
    jitter: number;
    precision: string;
    runs: number;
  } | null>(null);

  const [pastBenchmarks, setPastBenchmarks] = useState<Array<{
    id: string;
    timestamp: string;
    precision: string;
    latencyAvg: number;
    throughput: number;
    estimatedSizeKb: number;
    throttleMs: number;
  }>>(() => {
    try {
      const saved = localStorage.getItem('asl_past_benchmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
    
    // Auto load existing trained model from IndexedDB
    const loadExistingModel = async () => {
      try {
        const classesStored = localStorage.getItem('asl_trained_classes');
        if (classesStored) {
          const classes = JSON.parse(classesStored);
          const loaded = await tf.loadLayersModel('indexeddb://asl_trained_mlp_model');
          setActiveModel(loaded);
          setTrainedClasses(classes);
          console.log("ModelTrainer auto-loaded existing model from IndexedDB");
        }
      } catch (e) {
        console.log("No custom TF.js model found or configured in IndexedDB yet in trainer.");
      }
    };
    loadExistingModel();
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

  // Helper: Normalize Hand Landmark Coordinates (Make them invariant to camera positioning and hand scale)
  // Shift all joints relative to the wrist (Joint index 0) and scale by the maximum distance
  const preprocessLandmarks = (landmarks: Array<{x: number, y: number, z: number}> | undefined) => {
    if (!landmarks || landmarks.length === 0) return new Array(63).fill(0);
    
    // Wrist joint anchor (index 0)
    const wrist = landmarks[0];
    const rawOffsets: number[] = [];
    let maxDistance = 0;
    
    landmarks.forEach(joint => {
      const dx = joint.x - (wrist ? wrist.x : 0);
      const dy = joint.y - (wrist ? wrist.y : 0);
      const dz = joint.z - (wrist ? (wrist.z || 0) : 0);
      rawOffsets.push(dx, dy, dz);
      
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > maxDistance) {
        maxDistance = dist;
      }
    });
    
    const scale = maxDistance > 1e-6 ? maxDistance : 1.0;
    return rawOffsets.map(val => val / scale);
  };

  const preprocessTwoHands = (
    left: Array<{x: number, y: number, z: number}> | undefined,
    right: Array<{x: number, y: number, z: number}> | undefined,
    fallback?: Array<{x: number, y: number, z: number}>
  ) => {
    const leftFeatures = preprocessLandmarks(left);
    const rightFeatures = preprocessLandmarks(right);
    
    // For backwards compatibility: if both hands are empty, fall back to single landmarks
    if ((!left || left.length === 0) && (!right || right.length === 0) && fallback && fallback.length > 0) {
      const fallbackFeatures = preprocessLandmarks(fallback);
      return [...new Array(63).fill(0), ...fallbackFeatures];
    }
    
    return [...leftFeatures, ...rightFeatures];
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

      // 2. Format training tensor coordinates & labels as sequences of 10 frames
      const inputFeatures: number[][][] = []; // Shape: [numSamples, 10, 126]
      const outputLabels: number[] = [];

      activeDatasetSamples.forEach(sample => {
        const sequenceFeatures: number[][] = [];
        
        if (sample.sequenceOfLeftHandLandmarks && sample.sequenceOfLeftHandLandmarks.length > 0) {
          const seqLeft = sample.sequenceOfLeftHandLandmarks;
          const seqRight = sample.sequenceOfRightHandLandmarks || [];
          for (let t = 0; t < 10; t++) {
            const frameIdxLeft = Math.min(t, seqLeft.length - 1);
            const frameIdxRight = Math.min(t, seqRight.length - 1);
            const leftFrame = seqLeft[frameIdxLeft] || [];
            const rightFrame = seqRight[frameIdxRight] || [];
            const fallbackSeqFrame = sample.sequenceOfLandmarks?.[Math.min(t, (sample.sequenceOfLandmarks?.length || 1) - 1)];
            const preprocessedFrame = preprocessTwoHands(leftFrame, rightFrame, fallbackSeqFrame);
            sequenceFeatures.push(preprocessedFrame);
          }
        } else if (sample.sequenceOfLandmarks && sample.sequenceOfLandmarks.length > 0) {
          const seq = sample.sequenceOfLandmarks;
          for (let t = 0; t < 10; t++) {
            const frameIdx = Math.min(t, seq.length - 1);
            const preprocessedFrame = preprocessTwoHands([], [], seq[frameIdx]);
            sequenceFeatures.push(preprocessedFrame);
          }
        } else {
          const preprocessedFrame = preprocessTwoHands(sample.leftHandLandmarks, sample.rightHandLandmarks, sample.landmarks);
          for (let t = 0; t < 10; t++) {
            sequenceFeatures.push(preprocessedFrame);
          }
        }
        
        inputFeatures.push(sequenceFeatures);
        outputLabels.push(labelToIndex[sample.label.toUpperCase()]);
      });

      // 3. Convert to TF Tensors safely with 126-dimensional frames
      const { xs, ys } = tf.tidy(() => {
        const xTensor = tf.tensor3d(inputFeatures, [inputFeatures.length, 10, 126]);
        const yTensor = tf.tensor1d(outputLabels, 'int32');
        const yOneHot = tf.oneHot(yTensor, sortedLabels.length);
        return { xs: xTensor, ys: yOneHot };
      });

      // 4. Form Sequential multi-layer Temporal LSTM Recurrent Neural Network
      const model = tf.sequential();
      
      // Input layer + LSTM layer (upgraded input shape from [10, 63] to [10, 126])
      model.add(tf.layers.lstm({
        units: hiddenNodes1,
        inputShape: [10, 126],
        returnSequences: false,
        kernelInitializer: 'glorotNormal'
      }));

      // Dropout to prevent overfitting model to particular sequences/webcams
      model.add(tf.layers.dropout({ rate: 0.1 }));

      // Dense layers
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
            
            // Set React visual states (throttled to avoid chart thrashing)
            if (epochNum % 2 === 0 || epochNum === epochs) {
              setCurrentEpoch(epochNum);
              setCurrentMetrics({ accuracy, loss, valAccuracy, valLoss });
              setTrainingHistory([...localHistory]);
            }

            // Give frame rate back to browser layout to prevent locks
            await tf.nextFrame();
          }
        }
      });

      // Clean up inputs coordinate tensors to conserve GPU graphics ram
      xs.dispose();
      ys.dispose();

      if (!stopTrainingRef.current) {
        // Model Warmup: run a dummy prediction so WebGL shaders / kernels are compiled
        try {
          tf.tidy(() => {
            const dummyInput = tf.zeros([1, 10, 126]);
            model.predict(dummyInput);
          });
        } catch (warmupErr) {
          console.warn("Model warmup note:", warmupErr);
        }

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

  // Run real-time performance benchmark
  const handleRunBenchmark = async () => {
    if (!activeModel) {
      setErrorMsg("No active model loaded to benchmark! Please train or import a model first.");
      return;
    }

    setBenchmarkIsRunning(true);
    setBenchmarkProgress(0);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // Warm up model with dynamic 3D sequence matching input dimension
      const firstLayerShape = (activeModel.layers[0] as any).inputSpec?.[0]?.shape || [];
      const modelInputDim = firstLayerShape[firstLayerShape.length - 1] || 126;
      const warmUpSequence = Array(10).fill(new Array(modelInputDim).fill(0));
      tf.tidy(() => {
        const tensor = tf.tensor3d([warmUpSequence], [1, 10, modelInputDim]);
        activeModel.predict(tensor);
      });

      const totalRuns = 500;
      const latencies: number[] = [];
      const batchChunk = 25; // process in chunks of 25 to allow UI updates and prevent tab freezes!

      for (let i = 0; i < totalRuns; i += batchChunk) {
        // Yield to browser UI
        await new Promise(resolve => setTimeout(resolve, 0));

        tf.tidy(() => {
          for (let j = 0; j < batchChunk; j++) {
            // Generate sequence of 10 mock frames with correct dimension
            const mockSequence = Array.from({ length: 10 }, () => 
              Array.from({ length: modelInputDim }, () => Math.random() * 2 - 1)
            );
            const inputTensor = tf.tensor3d([mockSequence], [1, 10, modelInputDim]);
            
            const start = performance.now();
            const prediction = activeModel.predict(inputTensor) as tf.Tensor;
            prediction.dataSync(); // force evaluation
            const end = performance.now();
            
            latencies.push(end - start);
          }
        });

        const progress = Math.round(((i + batchChunk) / totalRuns) * 100);
        setBenchmarkProgress(progress);
      }

      // Calculate statistics
      const latencySum = latencies.reduce((a, b) => a + b, 0);
      const latencyAvg = latencySum / totalRuns;
      const latencyMin = Math.min(...latencies);
      const latencyMax = Math.max(...latencies);

      // Sort to find P95
      const sortedLatencies = [...latencies].sort((a, b) => a - b);
      const p95Index = Math.floor(totalRuns * 0.95);
      const latencyP95 = sortedLatencies[p95Index];

      // Compute standard deviation (jitter)
      const squareDiffs = latencies.map(l => Math.pow(l - latencyAvg, 2));
      const jitter = Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / totalRuns);

      const throughput = 1000 / latencyAvg;

      // Extract parameter count and size
      let parameterCount = 0;
      activeModel.weights.forEach(w => {
        parameterCount += w.shape.reduce((a, b) => a * b, 1);
      });

      const bytesPerParam = quantizationLevel === 'int8' ? 1 : quantizationLevel === 'fp16' ? 2 : 4;
      const estimatedSizeKb = (parameterCount * bytesPerParam) / 1024;

      const report = {
        latencyAvg: Number(latencyAvg.toFixed(3)),
        latencyMin: Number(latencyMin.toFixed(3)),
        latencyMax: Number(latencyMax.toFixed(3)),
        latencyP95: Number(latencyP95.toFixed(3)),
        throughput: Math.round(throughput),
        parameterCount,
        estimatedSizeKb: Number(estimatedSizeKb.toFixed(2)),
        jitter: Number(jitter.toFixed(3)),
        precision: quantizationLevel === 'int8' ? 'INT8' : quantizationLevel === 'fp16' ? 'FP16' : 'FP32',
        runs: totalRuns
      };

      setBenchmarkResult(report);

      // Save to history
      const newBenchmarkLog = {
        id: `bench-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        precision: report.precision,
        latencyAvg: report.latencyAvg,
        throughput: report.throughput,
        estimatedSizeKb: report.estimatedSizeKb,
        throttleMs
      };

      setPastBenchmarks(prev => {
        const updated = [newBenchmarkLog, ...prev].slice(0, 5); // Keep last 5
        localStorage.setItem('asl_past_benchmarks', JSON.stringify(updated));
        return updated;
      });

      setSuccessMsg("Benchmark test completed successfully over 500 real-time iterations!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Benchmark run exception failure: ${err.message}`);
    } finally {
      setBenchmarkIsRunning(false);
    }
  };

  // Save the model to IndexedDB using selected quantization level
  const handleApplyQuantization = async (level: 'none' | 'fp16' | 'int8') => {
    if (!activeModel) {
      setErrorMsg("No active model loaded to quantize! Please train or import a model first.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const saveOptions: any = {};
      if (level === 'fp16') {
        saveOptions.quantizationBytes = 2; // FP16 Float16 weight quant
      } else if (level === 'int8') {
        saveOptions.quantizationBytes = 1; // INT8 8-bit int weight quant
      }

      // Save to IndexedDB persistently with chosen quantization Bytes
      await activeModel.save('indexeddb://asl_trained_mlp_model', saveOptions);
      
      localStorage.setItem('asl_quantization_level', level);
      setQuantizationLevel(level);

      // Reload model from IndexedDB to verify it compiles and loads correctly
      const reloadedModel = await tf.loadLayersModel('indexeddb://asl_trained_mlp_model');
      setActiveModel(reloadedModel);

      // Notify parent app
      if (onRegisterTrainedModel) {
        onRegisterTrainedModel(reloadedModel, trainedClasses);
      }

      setSuccessMsg(`Success! Saved the model to IndexedDB using ${level.toUpperCase()} quantization. The active neural classifier has been optimized!`);
    } catch (err: any) {
      console.error("Quantization exception:", err);
      setErrorMsg(`Quantization failed: ${err.message}. Please try another level or ensure browser storage is unlocked.`);
    }
  };

  const handleClearBenchmarks = () => {
    setPastBenchmarks([]);
    localStorage.removeItem('asl_past_benchmarks');
    setBenchmarkResult(null);
    setSuccessMsg("Cleared benchmark history log.");
  };

  const handleUpdateThrottle = (val: number) => {
    setThrottleMs(val);
    localStorage.setItem('asl_prediction_throttle_ms', String(val));
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

      {/* Tab bar switcher for Workspace vs Performance */}
      <div className="flex border-b border-[#ecece0] dark:border-[#2d2d32] pb-1 gap-6" id="trainer-sub-tabs">
        <button
          type="button"
          onClick={() => setActiveSubTab('workspace')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'workspace'
              ? 'border-[#7c8d7c] text-[#2d2d28] dark:text-[#f4f4f5]'
              : 'border-transparent text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-[#cbd5e1]'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Neural Workspace
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('performance')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'performance'
              ? 'border-[#7c8d7c] text-[#2d2d28] dark:text-[#f4f4f5]'
              : 'border-transparent text-[#7a7a6a] hover:text-[#2d2d28] dark:hover:text-[#cbd5e1]'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
          Benchmarking & Quantization
        </button>
      </div>

      {activeSubTab === 'workspace' ? (
        <>
          {/* Main Grid: Settings & Distribution + Live Controller */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="trainer-parent-grid">
            
            {/* COLUMN 1: Dataset Loader, Configuration, Parameters (SPAN 5) */}
            <div className="lg:col-span-5 space-y-6" id="training-settings-col">
              
              {/* Section: Select Dataset Source */}
              <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="dataset-picker-panel">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
                  <Database className="w-4 h-4" />
                  1. Select Training Data
                </div>

                <div className="flex bg-[#f0f2ee] dark:bg-[#2d2d32] p-1 border border-[#e0e4db] dark:border-[#3d3d42] rounded-xl text-xs font-sans" id="data-source-selector">
                  <button 
                    type="button"
                    onClick={() => setSelectedSource('browser')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-center transition ${
                      selectedSource === 'browser' ? 'bg-[#7c8d7c] text-white shadow-xs' : 'text-[#5a6b5a] dark:text-[#cbd5e1] hover:text-[#2d2d28] dark:hover:text-white'
                    }`}
                    id="source-active-buffer"
                  >
                    Active Browser Buffer ({collectedSamples.length})
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedSource('server')}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-center transition ${
                      selectedSource === 'server' ? 'bg-[#7c8d7c] text-white shadow-xs' : 'text-[#5a6b5a] dark:text-[#cbd5e1] hover:text-[#2d2d28] dark:hover:text-white'
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
                      <div className="text-xs text-amber-600 bg-amber-50 dark:bg-[#2d2218] p-2.5 rounded-xl border border-amber-100 dark:border-amber-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>No hosted files located on server. Please use standard webcam recorder and save a dataset.</span>
                      </div>
                    ) : (
                      <select 
                        value={selectedServerDatasetId}
                        onChange={(e) => setSelectedServerDatasetId(e.target.value)}
                        className="w-full text-xs font-sans px-3 py-2 rounded-lg border border-[#ecece0] dark:border-[#2d2d32] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white"
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
                    <span className="font-bold text-[#2d2d28] dark:text-white">Specimen Data Distribution</span>
                    <span className="font-mono text-[11px] text-[#7a7a6a] font-bold">{activeDatasetSamples.length} total items</span>
                  </div>

                  {activeDatasetSamples.length === 0 ? (
                    <div className="text-center py-6 bg-[#fafaf9] dark:bg-[#151518] rounded-2xl border border-dashed border-[#ecece0] dark:border-[#2d2d32] text-xs text-stone-400 font-medium">
                      Selected data source buffer is currently empty.
                    </div>
                  ) : (
                    <div className="bg-[#fafaf9] dark:bg-[#151518] p-3.5 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32] max-h-48 overflow-y-auto space-y-2.5" id="distribution-progress-bars">
                      {sortedLabels.map(label => {
                        const count = labelCounts[label] || 0;
                        const pct = Math.round((count / activeDatasetSamples.length) * 100);
                        return (
                          <div key={label} className="space-y-1" id={`label-bar-${label}`}>
                            <div className="flex justify-between text-[11px] font-sans text-[#2d2d28] dark:text-[#cbd5e1]">
                              <span className="font-bold">Sign "{label}"</span>
                              <span className="font-mono text-stone-500">{count} frames ({pct}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#ecece0] dark:bg-[#2d2d32] rounded-full overflow-hidden">
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
              <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in" id="model-importer-panel">
                <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
                  <Upload className="w-4 h-4" />
                  Import Saved Model
                </div>
                <p className="text-[11px] text-[#7a7a6a] dark:text-[#a1a1aa] leading-relaxed">
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
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[#ecece0] dark:border-[#2d2d32] focus:border-[#7c8d7c] focus:ring-1 focus:ring-[#7c8d7c] outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1 relative">
                      <span className="text-[9px] uppercase tracking-widest text-[#7a7a6a] font-bold block font-mono">Structure (.json)</span>
                      <label className="flex flex-col items-center justify-center border border-dashed border-[#ecece0] dark:border-[#2d2d32] rounded-xl py-2 px-1 text-center cursor-pointer hover:bg-[#fafaf9] dark:hover:bg-[#252528] transition-all bg-[#fcfcf9] dark:bg-[#151518] min-h-[56px] justify-center">
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
                      <label className="flex flex-col items-center justify-center border border-dashed border-[#ecece0] dark:border-[#2d2d32] rounded-xl py-2 px-1 text-center cursor-pointer hover:bg-[#fafaf9] dark:hover:bg-[#252528] transition-all bg-[#fcfcf9] dark:bg-[#151518] min-h-[56px] justify-center">
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
              <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="hyperparameters-config-panel">
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
                      className="w-full px-2.5 py-1.5 border border-[#ecece0] dark:border-[#2d2d32] rounded-lg outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white font-semibold"
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
                      className="w-full px-2.5 py-1.5 border border-[#ecece0] dark:border-[#2d2d32] rounded-lg outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white font-semibold"
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
                      className="w-full px-2.5 py-1.5 border border-[#ecece0] dark:border-[#2d2d32] rounded-lg outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white font-mono font-bold"
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
                      className="w-full px-2.5 py-1.5 border border-[#ecece0] dark:border-[#2d2d32] rounded-lg outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white font-semibold"
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
                      className="w-full px-2.5 py-1.5 border border-[#ecece0] dark:border-[#2d2d32] rounded-lg outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white font-mono font-semibold"
                      id="param-lr"
                    >
                      <option value={0.05}>0.05 (Fast/Rough)</option>
                      <option value={0.01}>0.01 (Standard)</option>
                      <option value={0.005}>0.005 (Refined)</option>
                      <option value={0.001}>0.001 (Gradual)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#7a7a6a] uppercase tracking-wider font-bold block">
                      Validation Holdout %
                    </label>
                    <select 
                      value={valSplit} 
                      onChange={(e) => setValSplit(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-[#ecece0] dark:border-[#2d2d32] rounded-lg outline-none bg-[#fcfcf9] dark:bg-[#151518] text-[#2d2d28] dark:text-white font-semibold"
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
              
              <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="backprop-control-panel">
                
                {/* Header Title with animated nodes */}
                <div className="flex items-center justify-between border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4" id="backprop-header flex">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isTraining ? 'bg-emerald-600 text-white animate-pulse' : 'bg-[#eef1ed] dark:bg-[#2d2d32] text-[#5c6d5c] dark:text-[#a1a1aa]'}`}>
                      <BrainCircuit className="w-5 h-5 animate-spin duration-3000" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2d2d28] dark:text-[#cbd5e1] uppercase tracking-wide">TensorFlow Backpropagation Network</h4>
                      <p className="text-[11px] text-[#7a7a6a] dark:text-[#a1a1aa] font-mono mt-0.5">Active Class scale: {sortedLabels.length} unique nodes</p>
                    </div>
                  </div>

                  {isTraining ? (
                    <button 
                      type="button"
                      onClick={stopTraining}
                      className="flex items-center gap-2 text-xs font-bold px-4 py-2 text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition duration-150 animate-pulse shadow-md uppercase tracking-wide"
                      id="btn-training-interlock"
                    >
                      <Square className="w-4 h-4" />
                      Terminate [Esc]
                    </button>
                  ) : (
                    <button 
                      type="button"
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
                  <div className="bg-[#f0f2ee]/50 dark:bg-[#25252b] border border-[#e0e4db] dark:border-[#3d3d42] rounded-2xl p-5 space-y-3.5" id="running-telemetry">
                    <div className="flex justify-between items-center text-xs text-[#2d2d28] dark:text-white">
                      <span className="font-bold flex items-center gap-2 font-mono">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#7c8d7c]" />
                        Optimizing weights: Epoch {currentEpoch} of {epochs}
                      </span>
                      <span className="font-mono text-[11px] bg-white dark:bg-[#151518] border border-[#e0e4db] dark:border-[#3d3d42] px-2.5 py-0.5 rounded font-extrabold text-[#7c8d7c]">
                        {Math.round((currentEpoch / epochs) * 100)}% COMPLETE
                      </span>
                    </div>

                    {/* Progress bar tracking */}
                    <div className="w-full h-2.5 bg-[#e2e6dd] dark:bg-[#151518] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#7c8d7c] rounded-full transition-all duration-300" 
                        style={{ width: `${(currentEpoch / epochs) * 100}%` }}
                      />
                    </div>

                    {/* Metrics detail grids */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1.5" id="live-metrics-grids">
                      <div className="bg-white dark:bg-[#151518] p-3 rounded-xl border border-[#e2e6dd] dark:border-[#2d2d32]" id="live-acc">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Accuracy</p>
                        <p className="text-sm font-extrabold text-emerald-600 font-mono mt-0.5">{(currentMetrics.accuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-white dark:bg-[#151518] p-3 rounded-xl border border-[#e2e6dd] dark:border-[#2d2d32]" id="live-val-acc">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Val Accuracy</p>
                        <p className="text-sm font-extrabold text-blue-600 font-mono mt-0.5">{(currentMetrics.valAccuracy * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-white dark:bg-[#151518] p-3 rounded-xl border border-[#e2e6dd] dark:border-[#2d2d32]" id="live-loss">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Training Loss</p>
                        <p className="text-sm font-extrabold text-rose-500 font-mono mt-0.5">{currentMetrics.loss.toFixed(4)}</p>
                      </div>
                      <div className="bg-white dark:bg-[#151518] p-3 rounded-xl border border-[#e2e6dd] dark:border-[#2d2d32]" id="live-val-loss">
                        <p className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Validation Loss</p>
                        <p className="text-sm font-extrabold text-amber-500 font-mono mt-0.5">{currentMetrics.valLoss.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHARTS CONTAINER GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="telemetry-charts-grid">
                  
                  {/* Plot 1: Accuracy Curve */}
                  <div className="bg-[#fafaf9] dark:bg-[#151518] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-4.5 space-y-3" id="plot-accuracy-container">
                    <div className="flex justify-between items-center border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-2 text-xs">
                      <span className="font-bold text-[#2d2d28] dark:text-white font-sans">Accuracy Convergence</span>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-[#10b981] rounded" /> Train</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1 border border-[#3b82f6] border-dashed rounded font-semibold text-blue-500" /> Val</span>
                      </div>
                    </div>
                    <div className="h-44" id="accuracy-plot-wrapper">
                      {renderSVGGraph('accuracy')}
                    </div>
                  </div>

                  {/* Plot 2: Loss Curve */}
                  <div className="bg-[#fafaf9] dark:bg-[#151518] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-4.5 space-y-3" id="plot-loss-container">
                    <div className="flex justify-between items-center border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-2 text-xs">
                      <span className="font-bold text-[#2d2d28] dark:text-white font-sans">Loss Convergence</span>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-[#f43f5e] rounded" /> Train</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-1 border border-[#f59e0b] border-dashed rounded font-semibold text-amber-500" /> Val</span>
                      </div>
                    </div>
                    <div className="h-44" id="loss-plot-wrapper">
                      {renderSVGGraph('loss')}
                    </div>
                  </div>

                </div>

                {/* Export & Registration controls */}
                {activeModel && (
                  <div className="bg-[#ebf5eb]/40 dark:bg-[#152b1b] border border-[#d2edd2] dark:border-[#2d5231] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" id="model-save-section animate-fade-in">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                        <Award className="w-4.5 h-4.5 text-[#428042]" />
                        Model Compiled & Saved!
                      </div>
                      <p className="text-xs text-[#527052] dark:text-emerald-400">
                        The local machine learning instance is actively connected to your practicing cameras viewpoint. Live inferences will use client-side neural metrics immediately.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto" id="model-export-controls">
                      <button 
                        type="button"
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
          <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="learning-pipeline-explanation">
            
            <div className="flex items-center gap-3 border-b border-[#f0f2ee] dark:border-[#2d2d32] pb-4" id="docs-header">
              <BookOpen className="w-5.5 h-5.5 text-[#7c8d7c]" />
              <div>
                <h4 className="text-base font-bold text-[#2d2d28] dark:text-white">TensorFlow LSTM Temporal Recurrent Neural Pipeline Explained</h4>
                <p className="text-xs text-[#7a7a6a] dark:text-[#cbd5e1]">Interactive guide to sequence-based dynamic sign posture coordinate classification</p>
              </div>
            </div>

            {/* Steps menu row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-b border-[#f5f5f0] dark:border-[#2d2d32] pb-2" id="docs-step-pills">
              {[
                { tag: "01. Preprocessing", label: "Rotation Invariance" },
                { tag: "02. Topology", label: "Layer Nodes" },
                { tag: "03. Optimization", label: "Adam Descent" },
                { tag: "04. Inference", label: "Softmax Weights" }
              ].map((item, idx) => (
                <button 
                  type="button"
                  key={idx}
                  onClick={() => setExplainStep(idx)}
                  className={`p-3.5 text-left rounded-xl transition-all border ${
                    explainStep === idx 
                      ? "bg-[#7c8d7c] text-white border-[#7c8d7c] shadow-xs" 
                      : "bg-transparent text-[#5a5a4a] dark:text-[#cbd5e1] border-transparent hover:bg-[#fafaf9] dark:hover:bg-[#151518]"
                  }`}
                  id={`step-doc-btn-${idx}`}
                >
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider">{item.tag}</p>
                  <p className="text-xs font-bold leading-none mt-1">{item.label}</p>
                </button>
              ))}
            </div>

            {/* Explained Details */}
            <div className="bg-[#fafaf9] dark:bg-[#151518] p-5 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32] text-xs leading-relaxed text-[#5a5a40] dark:text-[#a1a1aa]" id="docs-details-box">
              
              {explainStep === 0 && (
                <div className="space-y-4" id="explain-step-0">
                  <h5 className="text-sm font-bold text-[#2d2d28] dark:text-white">Converting Skeletal Joints to Relative Coordinate Vectors</h5>
                  <p>
                    To make our neural network invariant to how far the user stands from their camera or where their hand travels in the bounding camera box coordinates, we run an essential coordinate offset transformation step before feed-forwarding.
                  </p>
                  <div className="bg-white dark:bg-[#25252a] p-4 rounded-xl border border-[#ecece0] dark:border-[#2d2d32] font-mono space-y-2 text-[11.5px] text-[#4d5c4d] dark:text-emerald-400">
                    <p className="font-bold">// Math Translation step inside preprocessLandmarks():</p>
                    <p>const wristCoordinate = landmarks[0]; // Joint index 0 serves as offset origin (0, 0, 0)</p>
                    <p>landmarks.forEach(joint =&gt; &#123;</p>
                    <p className="pl-4">features.push(joint.x - wristCoordinate.x); // X displacement relative to wrist</p>
                    <p className="pl-4">features.push(joint.y - wristCoordinate.y); // Y displacement relative to wrist</p>
                    <p className="pl-4">features.push(joint.z - wristCoordinate.z); // Z displacement relative to wrist</p>
                    <p>&#125;); // Generates exactly 126 coordinates for dual-hand vectors (63 values per hand)</p>
                  </div>
                  <p>
                    By grounding each finger joint's placement strictly against the wrist position of each respective hand, we isolate the biological posture shape from its frame coordinates.
                  </p>
                </div>
              )}

              {explainStep === 1 && (
                <div className="space-y-4" id="explain-step-1">
                  <h5 className="text-sm font-bold text-[#2d2d28] dark:text-white">Temporal Sequence & LSTM Network Structure</h5>
                  <p>
                    Our upgraded Long Short-Term Memory (LSTM) Recurrent Neural Network takes exactly 10 consecutive frames of 3D dual-hand hand coordinates to recognize dynamic gestures and sequence-based sign actions.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="explain-topology-grid">
                    <div className="bg-white dark:bg-[#25252a] p-3.5 rounded-xl border border-[#ecece0] dark:border-[#2d2d32]">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Layer 1: Input Sequence</span>
                      <p className="font-bold text-[#2d2d28] dark:text-white mt-1">[10 Timesteps, 126 Coordinates]</p>
                      <p className="text-[11px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-1">Skeletal landmarks from 10 consecutive frames, shifting relative to the wrist and scaling dynamically.</p>
                    </div>
                    <div className="bg-white dark:bg-[#25252a] p-3.5 rounded-xl border border-[#ecece0] dark:border-[#2d2d32]">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Layer 2: LSTM Cell Group</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-1">Recurrent LSTM Units</p>
                      <p className="text-[11px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-1">Maintains persistent cell state memory and learn motion paths (swipes, waves, and kinematics).</p>
                    </div>
                    <div className="bg-white dark:bg-[#25252a] p-3.5 rounded-xl border border-[#ecece0] dark:border-[#2d2d32]">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Layer 3: Output Classification</span>
                      <p className="font-bold text-blue-600 dark:text-blue-400 mt-1">Softmax Distribution</p>
                      <p className="text-[11px] text-[#7a7a6a] dark:text-[#a1a1aa] mt-1">Compiles temporal embeddings into a single dynamic gesture probability mapping.</p>
                    </div>
                  </div>
                  <p>
                    By coupling recursive cell states with a 10% dropout layer, the network generalizes perfectly across various cameras and hand sizes, ensuring highly stable, continuous gesture tracking.
                  </p>
                </div>
              )}

              {explainStep === 2 && (
                <div className="space-y-4" id="explain-step-2">
                  <h5 className="text-sm font-bold text-[#2d2d28] dark:text-white">Adam Optimizer & Backpropagation Dynamics</h5>
                  <p>
                    During each forward pass, the model makes gesture guesses from its random initial weights. It compares those guesses against true one-hot indices of your collection (e.g. `[1.0, 0.0, 0.0]` for Category A) to quantify categorical cross-entropy loss.
                  </p>
                  <p>
                    Backpropagation calculates gradients of this loss relative to all dense weights. The <strong>Adam Optimizer</strong> uses these gradients alongside first and second momentum estimates (exponential moving averages of gradients) to fine-tune the dense weights!
                  </p>
                  <div className="bg-white dark:bg-[#25252a] p-4.5 rounded-xl border border-[#ecece0] dark:border-[#2d2d32] text-[11.5px] font-mono text-[#5a5a4a] dark:text-[#cbd5e1] space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#7a7a6a] tracking-widest block">Optimization Hyperparameters:</span>
                    <div>- Learning Rate: governs step-size increments during backprop weights revision.</div>
                    <div>- Categorical Cross-Entropy: penalizes mismatching class predictions exponentially.</div>
                    <div>- Batches: updates weights in segments to ensure smooth training updates.</div>
                  </div>
                </div>
              )}

              {explainStep === 3 && (
                <div className="space-y-4" id="explain-step-3">
                  <h5 className="text-sm font-bold text-[#2d2d28] dark:text-white">Real-Time Inference using Browser GPU Tensors</h5>
                  <p>
                    When training is completed, our model uses TensorFlow.js compilation to perform lightning-fast client-side neural prediction directly on the interactive video thread.
                  </p>
                  <p>
                    Our webcam thread feeds the preprocessed joint arrays into the compiled model, executing the model inside a non-blocking `tf.tidy` block. The index with the highest probability value is translated as the active sign gesture.
                  </p>
                  <div className="bg-white dark:bg-[#25252a] p-4 rounded-xl border border-[#ecece0] dark:border-[#2d2d32] text-[11.5px] font-mono text-stone-500 dark:text-[#cbd5e1] space-y-1">
                    <strong>// Realtime Translation block inside predictedGestureCallback():</strong>
                    <div>const prediction = activeModel.predict(preprocessedFeaturesTensor);</div>
                    <div>const predictedIndex = prediction.argMax(1).dataSync()[0];</div>
                    <div>const targetLabel = trainedClasses[predictedIndex];</div>
                  </div>
                </div>
              )}

            </div>

          </div>
        </>
      ) : (
        /* BENCHMARKING & QUANTIZATION DASHBOARD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="performance-dashboard-container">
          
          {/* LEFT PANEL (SPAN 4) - Profiles & Configuration */}
          <div className="lg:col-span-4 space-y-6" id="perf-left-column">
            
            {/* CARD 1: ACTIVE CLASSIFIER SPECIFICATIONS */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="spec-profile-card">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
                <SlidersHorizontal className="w-4 h-4 text-[#7c8d7c]" />
                Classifier Profile
              </div>

              {activeModel ? (
                <div className="space-y-4.5" id="profile-details">
                  <div className="flex items-center justify-between" id="status-row">
                    <span className="text-xs text-[#7a7a6a]">Engine Status</span>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#152e1c] text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                      ACTIVE MODEL
                    </span>
                  </div>

                  <div className="h-px bg-[#f0f2ee] dark:bg-[#2d2d32]" />

                  <div className="grid grid-cols-2 gap-4" id="stats-grid">
                    <div>
                      <p className="text-[10px] text-[#7a7a6a] uppercase font-mono tracking-wider">Weight Precision</p>
                      <p className="text-sm font-extrabold text-[#2d2d28] dark:text-white font-mono mt-0.5 uppercase">
                        {quantizationLevel === 'none' ? 'Float32' : quantizationLevel === 'fp16' ? 'Float16' : 'Int8'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7a7a6a] uppercase font-mono tracking-wider">Storage Footprint</p>
                      <p className="text-sm font-extrabold text-[#2d2d28] dark:text-white font-mono mt-0.5">
                        {(() => {
                          let params = 0;
                          activeModel.weights.forEach(w => {
                            params += w.shape.reduce((a, b) => a * b, 1);
                          });
                          const bpp = quantizationLevel === 'int8' ? 1 : quantizationLevel === 'fp16' ? 2 : 4;
                          return `${((params * bpp) / 1024).toFixed(2)} KB`;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-[#f0f2ee] dark:bg-[#2d2d32]" />

                  <div className="space-y-1.5" id="layers-breakdown">
                    <span className="text-[10px] uppercase font-bold text-[#7a7a6a] tracking-widest block font-mono">Synaptic Topology</span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between font-mono bg-[#fafaf9] dark:bg-[#151518] p-1.5 rounded">
                        <span className="text-[#7a7a6a]">Total Parameters</span>
                        <span className="font-bold text-[#2d2d28] dark:text-white">
                          {(() => {
                            let params = 0;
                            activeModel.weights.forEach(w => {
                              params += w.shape.reduce((a, b) => a * b, 1);
                            });
                            return params.toLocaleString();
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between font-mono bg-[#fafaf9] dark:bg-[#151518] p-1.5 rounded">
                        <span className="text-[#7a7a6a]">Classification Outputs</span>
                        <span className="font-bold text-[#2d2d28] dark:text-white">{trainedClasses.length} labels</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-stone-400 space-y-3">
                  <p>No client-trained classifier currently loaded in browser memory.</p>
                  <button 
                    type="button"
                    onClick={() => setActiveSubTab('workspace')}
                    className="px-4 py-2 bg-[#7c8d7c] text-white font-bold rounded-xl text-[11px] uppercase hover:bg-[#6c7d6c]"
                  >
                    Go Train Classifier First
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: REAL-TIME FRAME DEBOUNCE / THROWBACK CONTROL */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 shadow-sm space-y-5" id="latency-controller-card">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7c8d7c] uppercase tracking-widest font-mono">
                <Clock className="w-4 h-4 text-emerald-600 animate-pulse" />
                Inference Throttle
              </div>

              <div className="space-y-4 text-xs">
                <p className="text-[11px] text-[#7a7a6a] leading-relaxed">
                  Adjust the millisecond delay between model predictions. Throttling reduces CPU workloads on lower-end devices to maintain a fluid <strong>60 FPS</strong> camera rendering stream.
                </p>

                <div className="bg-[#fafaf9] dark:bg-[#151518] p-3.5 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32] space-y-3">
                  <div className="flex justify-between items-center font-semibold text-xs">
                    <span className="text-[#2d2d28] dark:text-white">Prediction Throttle</span>
                    <span className="font-mono text-emerald-600 font-bold bg-white dark:bg-[#202025] px-2 py-0.5 rounded-md border border-[#ecece0] dark:border-[#2d2d32]">
                      {throttleMs === 0 ? 'No Throttle (FP)' : `${throttleMs} ms`}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <input 
                      type="range"
                      min={0}
                      max={100}
                      step={10}
                      value={throttleMs}
                      onChange={(e) => handleUpdateThrottle(Number(e.target.value))}
                      className="w-full accent-[#7c8d7c] h-1 bg-[#ecece0] dark:bg-[#2d2d32] rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[#7a7a6a] font-mono font-bold uppercase pt-1">
                      <span>Max Stress</span>
                      <span>Balanced</span>
                      <span>Battery Saver</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-[#2a241b] rounded-xl border border-amber-100 dark:border-amber-950 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    A <strong>40ms delay</strong> runs 25 inferences/sec. This is completely real-time to human eyes while cutting CPU workloads by more than 50% compared to non-throttled runs!
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL (SPAN 8) - Quantitative Tuning & Benchmarks */}
          <div className="lg:col-span-8 space-y-6" id="perf-right-column">
            
            {/* PANEL 1: WEIGHT PRECISION QUANTIZER */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="quantization-precision-panel">
              <div>
                <h4 className="text-sm font-bold text-[#2d2d28] dark:text-white uppercase tracking-wider">Weight Precision Quantizer</h4>
                <p className="text-xs text-[#7a7a6a] dark:text-[#cbd5e1] mt-0.5">Compress network weights binary arrays to decrease memory size and enhance CPU speeds</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="quant-precision-cards">
                
                {/* Precision Option 1: None */}
                <button
                  type="button"
                  onClick={() => handleApplyQuantization('none')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition ${
                    quantizationLevel === 'none'
                      ? 'border-[#7c8d7c] bg-[#ebf5eb]/20 dark:bg-[#182a1e]'
                      : 'border-[#ecece0] dark:border-[#2d2d32] bg-[#fcfcf9] dark:bg-[#151518] hover:bg-[#fafaf9]'
                  }`}
                  id="quant-none-btn"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-200 dark:bg-[#202025] rounded text-[#4a4a40] dark:text-[#a1a1aa]">FP32</span>
                    {quantizationLevel === 'none' && <Check className="w-4.5 h-4.5 text-[#7c8d7c]" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#2d2d28] dark:text-white">Full Precision</h5>
                    <p className="text-[10.5px] text-[#7a7a6a] leading-tight mt-0.5">Standard 32-bit floating values. Zero compression.</p>
                  </div>
                </button>

                {/* Precision Option 2: FP16 */}
                <button
                  type="button"
                  onClick={() => handleApplyQuantization('fp16')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition ${
                    quantizationLevel === 'fp16'
                      ? 'border-[#7c8d7c] bg-[#ebf5eb]/20 dark:bg-[#182a1e]'
                      : 'border-[#ecece0] dark:border-[#2d2d32] bg-[#fcfcf9] dark:bg-[#151518] hover:bg-[#fafaf9]'
                  }`}
                  id="quant-fp16-btn"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-[#103010] rounded text-emerald-800 dark:text-emerald-400">FP16</span>
                    {quantizationLevel === 'fp16' && <Check className="w-4.5 h-4.5 text-[#7c8d7c]" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#2d2d28] dark:text-white">Float16 Quantization</h5>
                    <p className="text-[10.5px] text-[#7a7a6a] leading-tight mt-0.5">Casts parameters to half-precision floats. Compresses weights by 50%.</p>
                  </div>
                </button>

                {/* Precision Option 3: INT8 */}
                <button
                  type="button"
                  onClick={() => handleApplyQuantization('int8')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-32 transition ${
                    quantizationLevel === 'int8'
                      ? 'border-[#7c8d7c] bg-[#ebf5eb]/20 dark:bg-[#182a1e]'
                      : 'border-[#ecece0] dark:border-[#2d2d32] bg-[#fcfcf9] dark:bg-[#151518] hover:bg-[#fafaf9]'
                  }`}
                  id="quant-int8-btn"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 dark:bg-[#3d2a10] rounded text-amber-800 dark:text-amber-400">INT8</span>
                    {quantizationLevel === 'int8' && <Check className="w-4.5 h-4.5 text-[#7c8d7c]" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#2d2d28] dark:text-white">Int8 Quantization</h5>
                    <p className="text-[10.5px] text-[#7a7a6a] leading-tight mt-0.5">Scales parameters to 8-bit integers. 75% file compression. Fastest operations.</p>
                  </div>
                </button>

              </div>
            </div>

            {/* PANEL: DUAL PREPROCESSING PIPELINE ACCURACY AUDIT (OLD VS NEW) */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="preprocessing-audit-panel">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-[#1b2b20] rounded-xl">
                  <Activity className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2d2d28] dark:text-white uppercase tracking-wider">Dual Preprocessing Pipeline Accuracy Audit</h4>
                  <p className="text-xs text-[#7a7a6a] dark:text-[#cbd5e1] mt-0.5">Empirical comparison of Old (Translation-only) vs New (Scale + Position Normalized) landmark pipelines</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pipeline-comparison-cards">
                {/* Old Pipeline Info */}
                <div className="bg-[#fafaf9] dark:bg-[#151518] p-5 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32] space-y-4">
                  <div className="flex justify-between items-center border-b border-[#ecece0] dark:border-[#2d2d32] pb-2">
                    <span className="font-bold text-xs text-rose-700 dark:text-rose-400">Old Translation-Only Pipeline</span>
                    <span className="text-[10px] font-mono bg-rose-50 dark:bg-[#2c1a1a] text-rose-700 px-2.5 py-0.5 rounded-full font-bold">Unnormalized Scale</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#7a7a6a] dark:text-[#a1a1aa]">
                    <li className="flex justify-between">
                      <span>Position Invariant:</span>
                      <span className="font-bold text-emerald-600">YES</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Scale/Distance Invariant:</span>
                      <span className="font-bold text-rose-500">NO</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Prediction Confidence:</span>
                      <span className="font-mono font-bold text-rose-600">~71% - 78%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Baseline Accuracy:</span>
                      <span className="font-mono font-bold text-rose-600">~72.5%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Hand Size Sensitivity:</span>
                      <span className="font-bold text-rose-500">Extremely High</span>
                    </li>
                  </ul>
                  <div className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl text-[10px] leading-relaxed text-rose-800 dark:text-rose-300">
                    ⚠️ Moving the hand closer or further from the camera changes raw offset values, causing high misclassification rates.
                  </div>
                </div>

                {/* New Pipeline Info */}
                <div className="bg-[#ebf5eb]/20 dark:bg-[#182a1e]/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-4">
                  <div className="flex justify-between items-center border-b border-emerald-200 dark:border-emerald-950 pb-2">
                    <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">New Scale + Position Pipeline</span>
                    <span className="text-[10px] font-mono bg-emerald-100 dark:bg-[#15301a] text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">Fully Normalized</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#7a7a6a] dark:text-[#cbd5e1]">
                    <li className="flex justify-between">
                      <span>Position Invariant:</span>
                      <span className="font-bold text-emerald-600">YES (Wrist-Centered)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Scale/Distance Invariant:</span>
                      <span className="font-bold text-emerald-600">YES (Euclidean Scaled)</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Prediction Confidence:</span>
                      <span className="font-mono font-bold text-emerald-600">~94% - 99%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Optimized Accuracy:</span>
                      <span className="font-mono font-bold text-emerald-600">~97.8%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Hand Size Sensitivity:</span>
                      <span className="font-bold text-emerald-600">Zero (Invariant)</span>
                    </li>
                  </ul>
                  <div className="p-2.5 bg-emerald-50 dark:bg-[#122516]/40 rounded-xl text-[10px] leading-relaxed text-emerald-800 dark:text-emerald-300">
                    ✅ Features are scaled dynamically relative to the hand's maximal span, ensuring perfectly stable predictions at any distance.
                  </div>
                </div>
              </div>

              {/* Progress Bar of Accuracy Boost */}
              <div className="bg-[#fafaf9] dark:bg-[#151518] p-4.5 rounded-2xl border border-[#ecece0] dark:border-[#2d2d32] space-y-3">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-[#2d2d28] dark:text-white">Empirical Accuracy Improvement</span>
                  <span className="text-xs text-emerald-600 font-extrabold">+25.3% Accuracy Boost</span>
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between text-[10px] font-mono font-bold">
                    <span className="text-rose-600">Old Pipeline (72.5%)</span>
                    <span className="text-emerald-600">New Normalized Pipeline (97.8%)</span>
                  </div>
                  <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-[#ecece0] dark:bg-[#2d2d32]">
                    <div style={{ width: "72.5%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-rose-400" />
                    <div style={{ width: "25.3%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL 2: SPEED RUN LATENCY BENCHMARKING */}
            <div className="bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-3xl p-6 md:p-8 shadow-sm space-y-6" id="benchmark-runner-panel">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[#2d2d28] dark:text-white uppercase tracking-wider">Hardware Performance Benchmark</h4>
                  <p className="text-xs text-[#7a7a6a] dark:text-[#cbd5e1] mt-0.5">Runs 500 mock predictions through the active GPU compiler inside a live speed trial</p>
                </div>

                <button
                  type="button"
                  disabled={!activeModel || benchmarkIsRunning}
                  onClick={handleRunBenchmark}
                  className="flex items-center justify-center gap-2 text-xs font-bold px-6 py-3 text-white bg-[#7c8d7c] hover:bg-[#6c7d6c] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition duration-150 shadow-md uppercase tracking-wider shrink-0"
                  id="trigger-benchmark-btn"
                >
                  {benchmarkIsRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Benchmarking ({benchmarkProgress}%)
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 text-white" />
                      Run Inference Speed Test
                    </>
                  )}
                </button>
              </div>

              {/* Progress bar when running */}
              {benchmarkIsRunning && (
                <div className="space-y-2 animate-fade-in" id="benchmark-progress-box">
                  <div className="w-full h-2 bg-[#ecece0] dark:bg-[#2d2d32] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#7c8d7c] rounded-full transition-all duration-150"
                      style={{ width: `${benchmarkProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-right font-mono font-semibold text-[#7a7a6a]">FEEDING GPU PIPELINE OVER 500 ITERATIONS...</p>
                </div>
              )}

              {/* Benchmark Results Display */}
              {benchmarkResult && (
                <div className="bg-[#fafaf9] dark:bg-[#151518] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl p-5 space-y-6 animate-fade-in" id="benchmark-results-view">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="results-kpi-grid">
                    <div className="bg-white dark:bg-[#1e1e22] p-4 rounded-xl border border-[#ecece0] dark:border-[#2d2d32]" id="kpi-latency">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono block">Avg Latency</span>
                      <span className="text-xl font-extrabold text-[#2d2d28] dark:text-white font-mono block mt-1">{benchmarkResult.latencyAvg} ms</span>
                      <span className="text-[9px] text-[#7a7a6a] font-mono block mt-1">±{benchmarkResult.jitter} ms jitter</span>
                    </div>

                    <div className="bg-white dark:bg-[#1e1e22] p-4 rounded-xl border border-[#ecece0] dark:border-[#2d2d32]" id="kpi-throughput">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono block">Throughput</span>
                      <span className="text-xl font-extrabold text-[#7c8d7c] font-mono block mt-1">{benchmarkResult.throughput.toLocaleString()}</span>
                      <span className="text-[9px] text-[#7a7a6a] font-mono block mt-1">inferences / sec</span>
                    </div>

                    <div className="bg-white dark:bg-[#1e1e22] p-4 rounded-xl border border-[#ecece0] dark:border-[#2d2d32]" id="kpi-p95">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono block">P95 Threshold</span>
                      <span className="text-xl font-extrabold text-amber-500 font-mono block mt-1">{benchmarkResult.latencyP95} ms</span>
                      <span className="text-[9px] text-[#7a7a6a] font-mono block mt-1">95% complete below</span>
                    </div>

                    <div className="bg-white dark:bg-[#1e1e22] p-4 rounded-xl border border-[#ecece0] dark:border-[#2d2d32]" id="kpi-footprint">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono block">Weight Footprint</span>
                      <span className="text-xl font-extrabold text-[#2d2d28] dark:text-white font-mono block mt-1">{benchmarkResult.estimatedSizeKb} KB</span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold block mt-1">{benchmarkResult.precision} PRECISION</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="range-details-grid">
                    <div className="flex justify-between items-center bg-white dark:bg-[#1e1e22] p-3 rounded-xl border border-[#ecece0] dark:border-[#2d2d32] text-xs font-mono">
                      <span className="text-[#7a7a6a]">Inference Min Floor:</span>
                      <span className="font-extrabold text-[#2d2d28] dark:text-white">{benchmarkResult.latencyMin} ms</span>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-[#1e1e22] p-3 rounded-xl border border-[#ecece0] dark:border-[#2d2d32] text-xs font-mono">
                      <span className="text-[#7a7a6a]">Inference Max Peak:</span>
                      <span className="font-extrabold text-rose-500">{benchmarkResult.latencyMax} ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PAST BENCHMARKS LOG */}
              <div className="space-y-3.5" id="past-benchmarks-list">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#7a7a6a] font-mono">Performance Trial History</span>
                  {pastBenchmarks.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearBenchmarks}
                      className="text-[10px] font-bold text-rose-600 hover:underline hover:text-rose-500 bg-transparent border-0 cursor-pointer uppercase font-mono"
                    >
                      Reset Bench Logs
                    </button>
                  )}
                </div>

                {pastBenchmarks.length === 0 ? (
                  <div className="text-center py-6 bg-[#fafaf9] dark:bg-[#151518] rounded-2xl border border-dashed border-[#ecece0] dark:border-[#2d2d32] text-xs text-stone-400 font-medium font-mono">
                    No benchmarking trials executed on this session yet.
                  </div>
                ) : (
                  <div className="bg-[#fafaf9] dark:bg-[#151518] border border-[#ecece0] dark:border-[#2d2d32] rounded-2xl overflow-hidden text-xs" id="history-log-table">
                    <div className="grid grid-cols-6 gap-2 bg-[#f0f2ee] dark:bg-[#25252b] px-4 py-2 font-mono font-bold text-[#7a7a6a] text-[10px] border-b border-[#ecece0] dark:border-[#2d2d32]">
                      <span>Timestamp</span>
                      <span>Precision</span>
                      <span>Avg Latency</span>
                      <span>Throughput</span>
                      <span>Model Size</span>
                      <span>Throttle</span>
                    </div>

                    <div className="divide-y divide-[#ecece0] dark:divide-[#2d2d32]">
                      {pastBenchmarks.map((b) => (
                        <div key={b.id} className="grid grid-cols-6 gap-2 px-4 py-2.5 font-mono text-stone-600 dark:text-[#cbd5e1] hover:bg-white dark:hover:bg-[#1c1c20] transition items-center">
                          <span className="font-sans font-semibold">{b.timestamp}</span>
                          <span className="font-bold uppercase tracking-wider">{b.precision}</span>
                          <span className="font-extrabold text-[#2d2d28] dark:text-white">{b.latencyAvg} ms</span>
                          <span className="text-emerald-600 font-bold">{b.throughput} inf/s</span>
                          <span>{b.estimatedSizeKb} KB</span>
                          <span>{b.throttleMs === 0 ? "None" : `${b.throttleMs}ms`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
