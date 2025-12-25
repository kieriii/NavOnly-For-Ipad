import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Copy, Check, ExternalLink, Lightbulb, ShieldCheck, Loader2, AlertCircle, Terminal, Key } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface TutorPanelProps {
  onClose: () => void;
  apiKey?: string;
}

const TutorPanel: React.FC<TutorPanelProps> = ({ onClose, apiKey = "YOUR_API_KEY_HERE" }) => {
  const steps = [
    {
      title: "Fixing InvalidKeyMapError",
      content: `The 'InvalidKeyMapError' is the most common roadblock. It means Google is refusing your key.

**How to Fix in 60 Seconds:**
1. Open [GCP Library Console](https://console.cloud.google.com/apis/library).
2. Search for **"Maps JavaScript API"** and click **ENABLE**.
3. Search for **"Directions API"** and click **ENABLE** (essential for routing).
4. Go to **Billing** and ensure your project has an active credit card or trial linked.
5. If you restricted your key, ensure the current domain is whitelisted.`,
      code: "// GCP Console Diagnostic Checklist:\n// 1. Project Selection: Correct?\n// 2. Billing Status: Active?\n// 3. API Enablement: Maps JS + Directions enabled?\n// 4. Restrictions: Domain allowed?"
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
        contents: `I am an iOS engineer debugging 'InvalidKeyMapError'. Why might an API key work for basic Maps but fail for Directions or Advanced Markers? Content context: ${step.content}`,
        config: { temperature: 0.8 }
      });
      setAiResponse(response.text);
    } catch (err) {
      setAiResponse("Tip: Check 'API Restrictions' in GCP Console. Often, developers restrict a key to only one API (like Maps JS) but forget to add 'Directions API', causing routing to fail silently or with an auth error.");
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
            <Key size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Platform Guide</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Diagnostic {currentStepIndex + 1} / {steps.length}</span>
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
            {currentStepIndex === 0 && <AlertCircle className="text-red-500" size={32} />}
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
              'ASK AI ABOUT KEY RESTRICTIONS'
            )}
          </button>

          {aiResponse && (
            <div className="p-8 bg-zinc-900/50 border border-blue-500/10 rounded-[32px] text-zinc-300 italic text-lg leading-relaxed shadow-xl">
              {aiResponse}
            </div>
          )}
        </div>

        {step.code && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Code Insight</span>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs font-black text-blue-500 hover:text-blue-400 transition-colors uppercase"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-8 bg-black rounded-[28px] border border-white/5 overflow-x-auto text-sm font-mono leading-relaxed text-blue-300 shadow-2xl">
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
    </div>
  );
};

export default TutorPanel;