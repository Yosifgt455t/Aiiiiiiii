
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PDFData } from '../types';
import { encode, decode, decodeAudioData } from '../services/audioUtils';
import { motion } from 'motion/react';
import { Mic } from 'lucide-react';

interface LiveModeOverlayProps {
  currentPdf: PDFData | null;
  onClose: () => void;
  onTranscription: (text: string, role: 'user' | 'model') => void;
}

const LiveModeOverlay: React.FC<LiveModeOverlayProps> = ({ currentPdf, onClose, onTranscription }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext; outputGain: GainNode } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const transcriptionRef = useRef<{ user: string; model: string }>({ user: '', model: '' });
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setIsConnecting(true);
    setPermissionError(null);
    
    try {
      // Create contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputGain = outputCtx.createGain();
      outputGain.connect(outputCtx.destination);
      
      audioContextRef.current = { input: inputCtx, output: outputCtx, outputGain };

      // Resume context on user action
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = mediaStream;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
          },
          systemInstruction: `أنت نبراس، مدرس خصوصي عراقي ذكي. جاوب بصوتك حصراً بلهجة عراقية محببة وقريبة للقلب. الملف المرفق هو مادة الطالب الدراسية. كن مرحاً وداعماً.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsListening(true);
            setHasStarted(true);
            
            const source = inputCtx.createMediaStreamSource(mediaStream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.user += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.model += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
              if (transcriptionRef.current.user) onTranscription(transcriptionRef.current.user, 'user');
              if (transcriptionRef.current.model) onTranscription(transcriptionRef.current.model, 'model');
              transcriptionRef.current = { user: '', model: '' };
            }

            // Handle Audio Output
            const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64) {
              setIsSpeakerActive(true);
              const buffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputGain);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsSpeakerActive(false);
                }
              };
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeakerActive(false);
            }
          },
          onclose: () => onClose(),
          onerror: (e) => {
            console.error("Live API Error:", e);
            setIsConnecting(false);
          },
        },
      });

      sessionRef.current = await sessionPromise;
      
      // Send initial context if PDF exists
      if (currentPdf) {
          sessionRef.current.sendRealtimeInput({
              media: { data: currentPdf.base64, mimeType: currentPdf.mimeType }
          });
      }

    } catch (err: any) {
      console.error("Failed to start live session:", err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setPermissionError('عذراً، نحتاج موافقتك على استخدام المايكروفون حتى تكدر تحجي وية نبراس.');
      } else {
        setPermissionError('صار خلل بالاتصال، حاول مرة ثانية.');
      }
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      sessionRef.current?.close();
      audioContextRef.current?.input.close();
      audioContextRef.current?.output.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white text-center">
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all z-[110]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="relative mb-12">
        {/* Animated Rings */}
        <div className={`absolute inset-0 rounded-full bg-blue-500/20 blur-2xl transition-all duration-700 ${isSpeakerActive ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
        
        <div className={`w-40 h-40 rounded-full flex items-center justify-center text-6xl shadow-2xl relative z-10 transition-all duration-300 border-4 ${isSpeakerActive ? 'border-blue-400 bg-blue-600 scale-110' : 'border-white/20 bg-white/10'}`}>
          {isSpeakerActive ? '🗣️' : isListening ? '👂' : '⏳'}
        </div>

        {isListening && !isSpeakerActive && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            <div className="w-1.5 h-6 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-1.5 h-8 bg-blue-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-1.5 h-6 bg-blue-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
          </div>
        )}
      </div>

      <div className="max-w-md">
        <h2 className="text-3xl font-bold mb-4">
          {!hasStarted ? 'جاهز تبدي؟' : isConnecting ? 'جاري الاتصال...' : isSpeakerActive ? 'نبراس كاعد يشرح...' : 'اسمعك، تفضل بسؤالك'}
        </h2>
        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
          {!hasStarted 
            ? 'اضغط الزر حتى تبدي تسولف وية نبراس بالصوت'
            : isConnecting 
            ? 'لحظات بس نربطك بالمدرس الخصوصي' 
            : isSpeakerActive 
            ? 'ركز وية نبراس هسة، جاي يجاوبك' 
            : 'تكدر تحجي هسة عن المادة ونبراس راح يجاوبك فوراً'}
        </p>

        {permissionError && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-200 text-sm">
            {permissionError}
          </div>
        )}

        {!hasStarted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startSession}
            disabled={isConnecting}
            className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-500/20 transition-all flex items-center gap-3 mx-auto"
          >
            {isConnecting ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Mic size={24} />
                <span>ابدأ المحادثة</span>
              </>
            )}
          </motion.button>
        )}

        {isSpeakerActive && (
            <div className="flex items-center justify-center gap-2 text-blue-400 font-bold animate-pulse">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                مخرج الصوت نشط
            </div>
        )}
      </div>

      <div className="mt-12 flex gap-2">
        {[1,2,3,4,5].map(i => (
            <div key={i} className={`w-1 h-8 bg-blue-500/40 rounded-full ${isSpeakerActive ? 'animate-[pulse_1s_infinite]' : ''}`} style={{ animationDelay: `${i*100}ms` }}></div>
        ))}
      </div>
    </div>
  );
};

export default LiveModeOverlay;
