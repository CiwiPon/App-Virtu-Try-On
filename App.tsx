import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { generateTryOnImage } from './services/geminiService';

const Header = () => (
  <header className="w-full text-center py-8">
    <h1 className="text-2xl font-light text-gray-500 tracking-widest uppercase">
      Virtue Try On <span className="font-semibold text-[#E57373]">AIMEETSU</span>
    </h1>
  </header>
);

const SkeletonLoader = () => (
    <div className="w-full aspect-square bg-white/80 rounded-2xl animate-pulse"></div>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


const App: React.FC = () => {
  const [productImage, setProductImage] = useState<File | null>(null);
  const [modelImage, setModelImage] = useState<File | null>(null);

  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [modelPreview, setModelPreview] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileUpload = (file: File, type: 'product' | 'model') => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (type === 'product') {
            setProductImage(file);
            setProductPreview(reader.result as string);
        } else {
            setModelImage(file);
            setModelPreview(reader.result as string);
        }
    };
    reader.readAsDataURL(file);
  };
  
  const fileToBase64 = (file: File): Promise<{ base64: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!productImage || !modelImage) {
      setError('Please upload both a product and a model image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
        const [productData, modelData] = await Promise.all([
            fileToBase64(productImage),
            fileToBase64(modelImage)
        ]);

        const resultBase64Array = await generateTryOnImage(modelData, productData, prompt);
        setGeneratedImages(resultBase64Array.map(base64 => `data:image/jpeg;base64,${base64}`));

    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [productImage, modelImage, prompt]);

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `virtue-try-on-result-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const isGenerateDisabled = !productImage || !modelImage || isLoading;

  return (
    <div className="min-h-screen text-gray-800 flex flex-col items-center p-4 sm:p-8">
      <Header />
      <main className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ImageUploader 
            id="product-upload"
            title="1. Upload Product Photo"
            onFileUpload={(file) => handleFileUpload(file, 'product')}
            previewUrl={productPreview}
          />
          <ImageUploader 
            id="model-upload"
            title="2. Upload Model Photo"
            onFileUpload={(file) => handleFileUpload(file, 'model')}
            previewUrl={modelPreview}
          />
        </div>

        <div className="w-full max-w-4xl p-8 bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-pink-500/10 flex flex-col gap-6">
            <label htmlFor="prompt-input" className="block text-lg font-semibold text-gray-700 text-center">
                2. Describe The Scene (Optional)
            </label>
            <textarea
                id="prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., golden hour lighting, cinematic, professional studio photoshoot..."
                className="w-full p-4 bg-white/50 border border-white/30 rounded-2xl shadow-inner focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-all duration-300"
                rows={2}
            />
             <div className="w-full flex justify-center">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="bg-gradient-to-br from-pink-300 to-pink-400 text-white font-bold py-4 px-10 rounded-full shadow-lg shadow-pink-400/30 hover:shadow-xl hover:shadow-pink-400/50 transform hover:scale-105 transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none disabled:cursor-not-allowed disabled:scale-100"
                >
                    {isLoading ? 'Generating...' : 'Generate Try-On'}
                </button>
            </div>
        </div>

        <div className="w-full max-w-6xl bg-white/70 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl shadow-pink-500/10 flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-6">3. AI Generated Result</h2>
             {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {[...Array(4)].map((_, i) => <SkeletonLoader key={i} />)}
                </div>
            ) : error ? (
                <div className="w-full h-96 flex justify-center items-center"><p className="text-red-500 text-center px-4">{error}</p></div>
            ) : generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {generatedImages.map((image, index) => (
                        <div key={index} className="flex flex-col items-center group relative">
                            <img src={image} alt={`AI Generated Result ${index + 1}`} className="w-full h-auto object-contain rounded-2xl border border-gray-200/50 shadow-lg" />
                            <button
                                onClick={() => handleDownload(image, index)}
                                className="absolute top-4 right-4 bg-black/40 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm"
                                aria-label="Download Image"
                            >
                                <DownloadIcon />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full h-96 bg-gray-400/10 rounded-2xl flex justify-center items-center">
                    <p className="text-gray-500">Your generated images will appear here.</p>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;