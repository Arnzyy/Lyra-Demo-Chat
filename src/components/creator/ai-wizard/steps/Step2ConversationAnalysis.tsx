'use client';

import { useState, useRef, useEffect } from 'react';
import type { AIPersonalityFull } from '@/lib/ai/personality/types';

interface Step2ConversationAnalysisProps {
  personality: AIPersonalityFull;
  onChange: (updates: Partial<AIPersonalityFull>) => void;
}

interface UploadedFile {
  name: string;
  content: string;
  type: string;
}

export function Step2ConversationAnalysis({
  personality,
  onChange,
}: Step2ConversationAnalysisProps) {
  const [conversations, setConversations] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if analysis was already done (reconstruct from personality data)
  const hasExistingAnalysis = personality.personality_traits.length > 0;

  const [analysis, setAnalysis] = useState<any>(
    hasExistingAnalysis ? {
      personality_traits: personality.personality_traits,
      common_phrases: [], // Will be populated from actual AI analysis
      humor_style: personality.humor_style,
      energy_level: personality.energy_level,
      topics_loves: personality.topics_loves,
      topics_avoids: personality.topics_avoids,
      confidence_score: 5 // Default high confidence if data exists
    } : null
  );

  // Update analysis if personality changes externally
  useEffect(() => {
    if (hasExistingAnalysis && !analysis) {
      setAnalysis({
        personality_traits: personality.personality_traits,
        common_phrases: [], // Will be populated from actual AI analysis
        humor_style: personality.humor_style,
        energy_level: personality.energy_level,
        topics_loves: personality.topics_loves,
        topics_avoids: personality.topics_avoids,
        confidence_score: 5
      });
    }
  }, [personality, hasExistingAnalysis, analysis]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Read text files
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.log')) {
          const text = await file.text();
          newFiles.push({
            name: file.name,
            content: text,
            type: 'text'
          });
        }
        // Read images (will send to vision API)
        else if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file);
          newFiles.push({
            name: file.name,
            content: base64,
            type: 'image'
          });
        }
      } catch (error) {
        console.error('Error reading file:', file.name, error);
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      // Combine textarea content with uploaded files
      let combinedConversations = conversations;

      uploadedFiles.forEach(file => {
        if (file.type === 'text') {
          combinedConversations += '\n\n' + file.content;
        }
      });

      // Extract images for vision analysis
      const images = uploadedFiles
        .filter(f => f.type === 'image')
        .map(f => f.content);

      const response = await fetch('/api/analyze-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversations: combinedConversations,
          images: images.length > 0 ? images : undefined
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const { analysis: result } = await response.json();
      setAnalysis(result);

      // Auto-populate personality fields
      // Note: speech_patterns are NOT populated from AI analysis because
      // common_phrases are actual phrases, not pattern IDs
      onChange({
        personality_traits: result.personality_traits || [],
        energy_level: result.energy_level || 5,
        humor_style: result.humor_style || 'witty',
        topics_loves: result.topics_loves || [],
        topics_avoids: result.topics_avoids || [],
      });
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">Paste Past Conversations</h3>
        <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">
          Paste 3-5 real chat conversations. We'll analyze them to learn exactly how you communicate.
        </p>

        <textarea
          value={conversations}
          onChange={(e) => setConversations(e.target.value)}
          placeholder="Paste conversations here..."
          className="w-full h-48 sm:h-64 bg-zinc-800 border border-white/10 rounded-lg p-3 sm:p-4 text-white placeholder-gray-500 font-mono text-xs sm:text-sm resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
        />
      </div>

      {/* File Upload Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base sm:text-lg font-semibold">Or Upload Files</h3>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 rounded-lg text-xs sm:text-sm transition-colors touch-manipulation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="text/*,.txt,.log,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <p className="text-gray-400 text-xs sm:text-sm mb-3 leading-relaxed">
          Upload chat logs, screenshots, or text files (supports .txt, .log, images)
        </p>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2 mb-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-zinc-800 border border-white/10 rounded-lg p-2 sm:p-3"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {file.type === 'image' ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className="text-xs sm:text-sm truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="ml-2 p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!analysis ? (
        <button
          onClick={handleAnalyze}
          disabled={(!conversations.trim() && uploadedFiles.length === 0) || isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3.5 sm:py-4 rounded-full font-medium disabled:opacity-50 transition-opacity touch-manipulation min-h-[48px] text-sm sm:text-base"
        >
          {isAnalyzing ? 'Analyzing...' : `Analyze ${uploadedFiles.length > 0 ? `(${uploadedFiles.length} ${uploadedFiles.length === 1 ? 'file' : 'files'})` : 'Conversations'}`}
        </button>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-zinc-800 border border-white/10 rounded-lg p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium">Analysis Confidence</span>
              <span className="text-xl sm:text-2xl font-bold text-green-400">
                {analysis.confidence_score}/5
              </span>
            </div>
          </div>

          <div className="bg-zinc-800 border border-white/10 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Common Phrases</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {analysis.common_phrases?.slice(0, 5).map((phrase: string) => (
                <span
                  key={phrase}
                  className="bg-purple-500/20 border border-purple-500/30 rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm"
                >
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>

          <div className="bg-zinc-800 border border-white/10 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">Humor Style</h4>
            <p className="text-sm sm:text-base text-gray-300 capitalize">{analysis.humor_style}</p>
          </div>

          <div className="bg-zinc-800 border border-white/10 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm sm:text-base font-semibold mb-1.5 sm:mb-2">Energy Level</h4>
            <p className="text-sm sm:text-base text-gray-300">{analysis.energy_level}/10</p>
          </div>

          <button
            onClick={() => {
              setAnalysis(null);
              setConversations('');
              setUploadedFiles([]);
            }}
            className="w-full bg-white/5 active:bg-white/10 py-3 sm:py-3.5 rounded-lg text-xs sm:text-sm transition-colors touch-manipulation min-h-[44px]"
          >
            Analyze Different Conversations
          </button>
        </div>
      )}
    </div>
  );
}
