
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Check, ExternalLink, Lightbulb, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface TutorPanelProps {
  onClose: () => void;
  apiKey?: string;
}

const TutorPanel: React.FC<TutorPanelProps> = ({ onClose, apiKey = "YOUR_API_KEY_HERE" }) => {
  const steps = [
    {
      title: "Fixing 'REQUEST_DENIED'",
      content: `If you see a "Directions request failed: REQUEST_DENIED" error, it means the **Directions API** is not enabled in your Google Cloud Console. 

Even if the Map is visible, Routing requires its own service enablement. 

**How to Fix:**
1. Visit [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/library).
2. Ensure you have selected the correct project associated with your API key.
3. Search for **"Directions API"** and click **Enable**.
4. (Optional) Repeat for **"Places API"** for the address lookup.`,
      code: `// Ensure these services are enabled:\n// - Maps JavaScript API\n// - Directions API (Required for Routing)\n// - Places API (Required for Autocomplete)\n// - Maps SDK for iOS (Required for Native iPad App)`
    },
    {
      title: "Step 2: Credential Guarding",
      content: "Security is paramount. In the GCP Console, edit your API key. Set 'Application Restrictions' to 'iOS Apps' and add your unique Bundle Identifier. This prevents unauthorized usage of your premium Navigation quotas.",
      code: `// Target Info.plist\n<key>GMSApiKey</key>\n<string>${apiKey}</string>\n<key>GMSBundleID</key>\n<string>com.yourcompany.pronav</string>`
    },
    {
      title: "Step 3: Permission Manifest",
      content: "iOS requires explicit disclosure for location access. For a professional navigation app, you should request 'Always' access to ensure the app can continue guidance if the user switches to another app or the screen locks.",
      code: "<key>NSLocationWhenInUseUsageDescription</key>\n<string>Precise location is required for real-time guidance.</string>\n<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>\n<string>Navigation requires background location to keep you on track.</string>"
    },
    {
      title: "Step 4: Swift Service Setup",
      content: "Initialize the Google Maps and Navigation services early in your app lifecycle. On iPad, ensure you handle window orientation changes by observing UIDevice orientation notifications to update your map's safe areas.",
      code: `import GoogleMaps\nimport GoogleNavigation\n\n@main\nclass AppDelegate: UIResponder, UIApplicationDelegate {\n    func application(_ app: UIApplication, didFinishLaunching...) -> Bool {\n        GMSMapsServices.provideAPIKey("${apiKey}")\n        return true\n    }\n}`
    },
    {
      title: "Step 5: iPad Navigation HUD",
      content: "Maximize the iPad's screen real estate. Use GMSMapView's padding property to shift the 'Google' logo and legal attribution away from your custom HUD elements, ensuring a clean, integrated user interface.",
      code: `// Customizing the iPad HUD\nfunc setupMapView() {\n    let edgeInsets = UIEdgeInsets(top: 100, left: 20, bottom: 40, right: 20)\n    mapView.padding = edgeInsets\n    mapView.isMyLocationEnabled = true\n    mapView.settings.myLocationButton = false\n}`
    }
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const step = steps[currentStepIndex];

  const handleCopy = () => {
    if (step.code) {
      navigator.clipboard.writeText(step.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const askGemini = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Provide an advanced implementation tip for ${step.title} specifically for an iPad Pro user interface using Swift and Google Navigation SDK. Content context: ${step.content}`,
        config: { temperature: 0.8 }
      });
      setAiResponse(response.text);
    } catch (err) {
      setAiResponse("Tip: For iPad Pro, use a custom DirectionsRenderer styling to match a high-end luxury vehicle HUD. Deep blues and translucent blur backgrounds are standard for premium iPadOS experiences.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    setAiResponse(null);
  }, [currentStepIndex]);

  return (
    <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-zinc-950/98 backdrop-blur-3xl z-[150] border-l border-white/5 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right duration-500">
      <div className="p-10 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
            <Lightbulb size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Expert Guide</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Guide {currentStepIndex + 1} / {steps.length}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all active:scale-90 text-zinc-400 hover:text-white">
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-12">
        <div className="space-y-6">
          <h3 className="text-4xl font-black text-white leading-tight italic flex items-center gap-4">
            {currentStepIndex === 0 && <AlertCircle className="text-blue-500" size={32} />}
            {step.title}
          </h3>
          <div className="text-xl text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
            {step.content}
          </div>
          
          <button 
            onClick={askGemini}
            disabled={isAiLoading}
            className="flex items-center gap-3 px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-sm font-black text-blue-400 hover:bg-blue-600/20 transition-all disabled:opacity-50"
          >
            {isAiLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                CONSULTING GEMINI...
              </>
            ) : (
              'ASK AI FOR ARCHITECTURE TIPS'
            )}
          </button>

          {aiResponse && (
            <div className="p-8 bg-zinc-900/50 border border-blue-500/10 rounded-[32px] text-zinc-300 italic text-lg leading-relaxed shadow-xl animate-in slide-in-from-top-2">
              {aiResponse}
            </div>
          )}
        </div>

        {step.code && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Code Manifest</span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-black text-blue-500 hover:text-blue-400 transition-colors uppercase"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Snippet'}
              </button>
            </div>
            <pre className="p-8 bg-black rounded-[28px] border border-white/5 overflow-x-auto text-base font-mono leading-relaxed text-blue-300 shadow-2xl">
              <code>{step.code}</code>
            </pre>
          </div>
        )}
      </div>

      <div className="p-10 border-t border-white/5 flex items-center justify-between bg-zinc-900/40">
        <button 
          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-10 rounded-2xl font-black text-white transition-all active:scale-95"
        >
          <ChevronLeft size={24} />
          PREV
        </button>

        <div className="flex gap-3">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStepIndex ? 'bg-blue-500 w-12' : 'bg-white/10 w-3'}`} />
          ))}
        </div>

        <button 
          onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex === steps.length - 1}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-10 rounded-2xl font-black text-white transition-all active:scale-95 shadow-lg shadow-blue-600/20"
        >
          NEXT
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="px-10 py-6 bg-zinc-950 text-center">
        <a 
          href="https://console.cloud.google.com/" 
          target="_blank" 
          className="text-[10px] text-zinc-600 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 font-black tracking-widest uppercase"
        >
          Open Cloud Console <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};

export default TutorPanel;
