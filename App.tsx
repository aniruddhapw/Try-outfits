import React, { useState, useCallback } from 'react';
import { Wand2, AlertCircle, Info, Shirt, Scissors, Layers, Sparkles, ImagePlus, ArrowRight } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Button } from './components/Button';
import { editImageWithGemini } from './services/geminiService';
import { ProcessingState } from './types';

const App: React.FC = () => {
  // State for Main Image (The one being edited)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // State for Reference Image (Optional, e.g. the outfit to try on)
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);

  // State for Result
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // State for prompt and processing
  const [prompt, setPrompt] = useState('');
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isLoading: false,
    error: null,
    statusMessage: ''
  });

  // Handle Main Image Selection
  const handleImageSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setGeneratedImage(null); // Reset result on new upload
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle Reference Image Selection
  const handleReferenceSelect = useCallback((file: File) => {
    setReferenceFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Clear Functions
  const handleClearMain = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setGeneratedImage(null);
  }, []);

  const handleClearReference = useCallback(() => {
    setReferenceFile(null);
    setReferenceUrl(null);
  }, []);

  // Helper to read file as base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle Generation
  const handleGenerate = async () => {
    if (!selectedFile || !prompt.trim()) return;

    setProcessingState({
      isLoading: true,
      error: null,
      statusMessage: 'Processing your request...'
    });

    try {
      // 1. Prepare Main Image
      const mainBase64 = await fileToBase64(selectedFile);

      // 2. Prepare Reference Image (if exists)
      let refBase64 = null;
      if (referenceFile) {
        refBase64 = await fileToBase64(referenceFile);
      }

      // 3. Call Service
      const generatedImageUrl = await editImageWithGemini(
        mainBase64,
        selectedFile.type,
        prompt,
        refBase64,
        referenceFile?.type
      );

      setGeneratedImage(generatedImageUrl);
      setProcessingState({ isLoading: false, error: null, statusMessage: '' });

    } catch (err: any) {
      setProcessingState({
        isLoading: false,
        error: err.message || "Something went wrong. Please try a different prompt or image.",
        statusMessage: ''
      });
    }
  };

  const downloadImage = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `banana-edit-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const suggestionChips = [
    { icon: <Shirt size={14} />, text: "Change outfit to a business suit" },
    { icon: <Shirt size={14} />, text: "Try on the outfit from the reference image" },
    { icon: <Scissors size={14} />, text: "Remove the background" },
    { icon: <Layers size={14} />, text: "Make it look like a sketch" },
    { icon: <Sparkles size={14} />, text: "Add fireworks in the sky" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
               <Wand2 className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Banana<span className="text-indigo-600">Edit</span></h1>
          </div>
          <div className="hidden sm:block text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
             Powered by Gemini 2.5 Flash Image
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Error Banner */}
        {processingState.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{processingState.error}</p>
          </div>
        )}

        {/* SECTION 1: PROMPT (Top Priority) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-xs">1</span>
            Describe your edit
          </h2>
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What would you like to change? (e.g., 'Swap the shirt for a red hoodie' or 'Use the style from the reference image')"
              className="w-full px-4 py-3 pr-32 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-24 text-slate-700 placeholder-slate-400 resize-none text-lg"
            />
            <div className="absolute bottom-3 right-3">
              <Button 
                onClick={handleGenerate}
                disabled={!selectedFile || !prompt.trim()}
                isLoading={processingState.isLoading}
                className="shadow-lg"
              >
                Generate <Wand2 className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 mt-3">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(chip.text)}
                  className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 px-3 py-1.5 rounded-full transition-all border border-slate-200"
                >
                  {chip.icon}
                  <span>{chip.text}</span>
                </button>
              ))}
          </div>
        </div>

        {/* SECTION 2: ASSETS (Side by Side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Main Image */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 text-xs">2</span>
                Source Image <span className="ml-2 text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">*Required</span>
              </div>
            </h3>
            <div className="flex-grow">
              <ImageUploader 
                onImageSelect={handleImageSelect} 
                selectedImage={previewUrl}
                onClear={handleClearMain}
                heightClass="h-64" // Fixed height to prevent jumping
              />
            </div>
          </div>

          {/* Reference Image (Optional) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center">
              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mr-2 text-xs">3</span>
              Reference Image <span className="ml-2 text-xs text-slate-400 font-normal">(Optional)</span>
            </h3>
            <div className="flex-grow">
              <ImageUploader 
                onImageSelect={handleReferenceSelect} 
                selectedImage={referenceUrl}
                onClear={handleClearReference}
                heightClass="h-64"
                placeholderIcon={<ImagePlus className="w-8 h-8 text-indigo-300" />}
                placeholderText="Add an outfit or style reference"
              />
            </div>
          </div>

        </div>

        {/* SECTION 3: RESULT */}
        <div className="bg-slate-900 rounded-3xl p-1 shadow-xl overflow-hidden">
          <div className="bg-slate-800/50 backdrop-blur px-6 py-3 flex items-center justify-between">
            <h3 className="text-slate-200 font-medium flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-indigo-400" /> Result
            </h3>
            {generatedImage && (
              <button onClick={downloadImage} className="text-xs text-indigo-300 hover:text-white transition-colors">
                Download High Res
              </button>
            )}
          </div>
          <div className="p-4 md:p-8 flex justify-center min-h-[400px] bg-slate-900/50">
             <ResultDisplay 
                imageSrc={generatedImage} 
                isLoading={processingState.isLoading}
                onDownload={downloadImage}
                onRetry={() => setGeneratedImage(null)}
             />
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;
