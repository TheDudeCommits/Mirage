import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  MessageSquare,
  Mic,
  Bot,
  Shield,
  Wifi,
  Zap,
  Send,
  LogIn,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Type,
  Image,
  Video,
  AudioLines,
} from "lucide-react";
import backgroundVideo from "@assets/Header Minimal (1)_1754338987422.mp4";
import miraVideo from "@assets/Mira Vertical No Background 2_1754353314687.mp4";
import { playApiAudio } from "@/utils/playApiAudio";
import AuthModal from "@/components/AuthModal";
import { useAuthStore } from "@/store/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useDisconnect } from "wagmi";

type Mode = "text" | "voice" | "mira" | "detector";
type DetectorMode = "text" | "image" | "video" | "voice";

// Message formatting function for better readability
const formatMessage = (text: string): string => {
  return (
    text
      // Convert double asterisks to bold
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong style="color: var(--askmira-primary); font-weight: 600;">$1</strong>',
      )
      // Convert single asterisks to italic
      .replace(
        /\*(.*?)\*/g,
        '<em style="color: var(--askmira-text); font-style: italic;">$1</em>',
      )
      // Convert numbered lists
      .replace(
        /^(\d+)\.\s+(.+)$/gm,
        '<div style="margin: 8px 0; padding-left: 8px;"><span style="color: var(--askmira-primary); font-weight: bold;">$1.</span> $2</div>',
      )
      // Convert bullet points
      .replace(
        /^[-•*]\s+(.+)$/gm,
        '<div style="margin: 4px 0; padding-left: 8px;"><span style="color: var(--askmira-primary);">•</span> $1</div>',
      )
      // Convert double line breaks to paragraph breaks
      .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
      // Convert single line breaks to br tags
      .replace(/\n/g, "<br/>")
      // Wrap in paragraph tags if content exists
      .replace(/^(.+)/, '<p style="margin: 0;">$1</p>')
      // Clean up empty paragraphs
      .replace(/<p[^>]*><\/p>/g, "")
  );
};

export default function Home() {
  const [activeMode, setActiveMode] = useState<Mode>("text");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [latency, setLatency] = useState(12);
  const [messages, setMessages] = useState<
    Array<{ id: string; text: string; isUser: boolean; timestamp: Date }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth store
  const {
    openAuthModal,
    twitterUser,
    isTwitterAuthenticated,
    walletAddress,
    walletConnected,
    logout,
    disconnectWallet,
  } = useAuthStore();

  // Wagmi hook for wallet disconnect
  const { disconnect } = useDisconnect();

  // Handle wallet disconnect
  const handleWalletDisconnect = () => {
    disconnect();
    disconnectWallet();
  };

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isPlayingReply, setIsPlayingReply] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // AI Detector states
  const [activeDetectorMode, setActiveDetectorMode] =
    useState<DetectorMode>("text");
  const [detectorText, setDetectorText] = useState("");
  const [detectorFile, setDetectorFile] = useState<File | null>(null);
  const [detectorResult, setDetectorResult] = useState<{
    probability: number;
    label: string;
    imageInfo?: {
      classification: string;
      aiLikelihood: number;
      heatmapImage: string;
      detailedScores: Record<string, number>;
    };
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modes = [
    { id: "text" as Mode, label: "TEXT", icon: MessageSquare },
    { id: "voice" as Mode, label: "VOICE", icon: Mic },
    { id: "mira" as Mode, label: "MIRA", icon: Bot },
    { id: "detector" as Mode, label: "AI DETECTOR", icon: Shield },
  ];

  const detectorModes = [
    { id: "text" as DetectorMode, label: "TEXT", icon: Type },
    { id: "image" as DetectorMode, label: "IMAGE", icon: Image },
    { id: "video" as DetectorMode, label: "VIDEO", icon: Video },
    { id: "voice" as DetectorMode, label: "VOICE", icon: AudioLines },
  ];

  // Random latency animation
  useEffect(() => {
    const updateLatency = () => {
      // Generate random number between 6 and 36
      const newLatency = Math.floor(Math.random() * (36 - 6 + 1)) + 6;
      setLatency(newLatency);

      // Set next random interval between 1.5 and 6 seconds
      const nextInterval = Math.random() * (6000 - 1500) + 1500;
      setTimeout(updateLatency, nextInterval);
    };

    // Start the first update after a random initial delay
    const initialDelay = Math.random() * 2000 + 1000;
    const timeoutId = setTimeout(updateLatency, initialDelay);

    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // API function for sending messages to Mira
  async function sendMessageToMira(message: string): Promise<string> {
    try {
      const response = await fetch("https://back-text.askmira.io/api/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (data.reply) {
        return data.reply;
      } else if (data.error) {
        return "❌ Error: " + data.error;
      } else {
        return "❌ Unknown error occurred.";
      }
    } catch (error) {
      console.error("Mira API error:", error);
      return "❌ Network error: Unable to reach Mira backend.";
    }
  }

  // API function for AI detection
  async function detectAIContent(
    text?: string,
    file?: File,
  ): Promise<{ probability: number; label: string; imageInfo?: any }> {
    try {
      let response;

      if (file && activeDetectorMode === "image") {
        // Send image file as FormData to the new image detection endpoint
        const formData = new FormData();
        formData.append("image", file);

        response = await fetch(
          "https://back-imagedetect.askmira.io/api/detect",
          {
            method: "POST",
            body: formData,
          },
        );
      } else if (file) {
        // Send file as FormData for text detection
        const formData = new FormData();
        formData.append("file", file);

        response = await fetch(
          "https://back-textdetect.askmira.io/api/detect",
          {
            method: "POST",
            body: formData,
          },
        );
      } else if (text) {
        // First, try OpenAI pre-analysis to check for exact matches
        try {
          const openaiResponse = await fetch("/api/openai/analyze-text", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          });

          if (openaiResponse.ok) {
            const openaiData = await openaiResponse.json();
            console.log("OpenAI pre-analysis result:", openaiData.classification);

            // If OpenAI found an exact match, return the result immediately
            if (openaiData.classification === "Human-Written") {
              return {
                probability: 0, // 0% AI probability means 100% human
                label: "HUMAN-WRITTEN",
              };
            } else if (openaiData.classification === "AI-Generated") {
              return {
                probability: 100, // 100% AI probability
                label: "AI-GENERATED",
              };
            }
            // If "Not Found", continue with normal backend analysis
          }
        } catch (openaiError) {
          console.warn("OpenAI pre-analysis failed, proceeding with normal analysis:", openaiError);
          // Continue with normal backend analysis if OpenAI fails
        }

        // Send text as JSON for text detection (normal backend analysis)
        response = await fetch(
          "https://back-textdetect.askmira.io/api/detect",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          },
        );
      } else {
        throw new Error("No text or file provided");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error ${response.status}:`, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const rawText = await response.text();
        console.error("Failed to parse JSON response:", rawText);
        throw new Error(`Invalid JSON response from API: ${rawText.substring(0, 200)}...`);
      }
      
      // Debug log the actual API response
      console.log("API Response Data:", data);

      // Handle image detection response format - actual API structure
      if (activeDetectorMode === "image") {
        if (data.results) {
          // The actual API response format
          const results = data.results;
          const overallScore = results.overall_score || 0;
          const predictedClass = results.predicted_class || "Unknown";
          const classScores = results.class_scores || {};
          const heatmapImage = results.heatmap_image || "";
          
          // Convert heatmap from base64 string to data URL if it's just the base64 string
          const heatmapImageUrl = heatmapImage && !heatmapImage.startsWith('data:') 
            ? `data:image/png;base64,${heatmapImage}` 
            : heatmapImage;
          
          return {
            probability: overallScore * 100, // Convert to percentage
            label: predictedClass,
            imageInfo: {
              classification: predictedClass,
              aiLikelihood: overallScore * 100,
              heatmapImage: heatmapImageUrl,
              detailedScores: classScores,
            },
          };
        } else {
          // Fallback for other possible formats
          return {
            probability: 0,
            label: "Analysis Complete",
            imageInfo: {
              classification: "Analysis Complete", 
              aiLikelihood: 0,
              heatmapImage: "",
              detailedScores: data,
            },
          };
        }
      }

      // Handle text detection response format
      if (typeof data.probability === "number" && data.label) {
        return {
          probability: data.probability,
          label: data.label,
        };
      } else {
        console.error("Unexpected API response format:", data);
        throw new Error(`Unexpected API response format. Expected image analysis data but received: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("AI detection error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        activeDetectorMode,
        hasFile: !!file,
        hasText: !!text,
        fileType: file?.type,
        fileName: file?.name
      });
      throw error;
    }
  }

  // Voice recording functions
  const startRecording = async () => {
    try {
      console.log("Starting recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Try different mime types based on browser support
      let options = {};
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" };
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "audio/webm" };
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options = { mimeType: "audio/mp4" };
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        console.log("Data available:", event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log("Recording stopped, chunks:", chunks.length);
        setAudioChunks(chunks);
        // Auto-send voice message when recording stops
        setTimeout(() => {
          sendVoiceMessageWithChunks(chunks);
        }, 100);
      };

      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
      console.log("Recording started successfully");
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        "Could not access microphone. Please check permissions and try again.",
      );
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording...");
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      console.log("Recording stopped");
    }
  };

  const sendVoiceMessageWithChunks = async (chunks: Blob[]) => {
    console.log("Sending voice message, chunks:", chunks.length);
    if (chunks.length === 0) {
      console.error("No audio chunks to send");
      return;
    }

    setIsLoading(true);

    try {
      // Create blob from chunks
      const audioBlob = new Blob(chunks, {
        type: chunks[0]?.type || "audio/webm",
      });

      console.log(
        "Audio blob created:",
        audioBlob.size,
        "bytes, type:",
        audioBlob.type,
      );

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      console.log("Sending to API...");
      const response = await fetch("https://back-voice.askmira.io/api/voice", {
        method: "POST",
        body: formData,
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      // Check if response is JSON (contains both audio and text) or just audio
      const contentType = response.headers.get("content-type");
      console.log("Response content type:", contentType);

      let audioResponseBlob;
      let transcriptionText = "Mira is speaking...";

      if (contentType && contentType.includes("application/json")) {
        // Response contains both audio and text
        const jsonResponse = await response.json();
        transcriptionText = jsonResponse.text || "Mira is speaking...";

        // Convert base64 audio to blob if present
        if (jsonResponse.audio) {
          const audioData = atob(jsonResponse.audio);
          const audioArray = new Uint8Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            audioArray[i] = audioData.charCodeAt(i);
          }
          // Detect proper MIME type based on audio format
          const mime =
            audioData.startsWith("OggS") || audioData.includes("opus")
              ? "audio/ogg; codecs=opus"
              : "audio/mpeg";
          audioResponseBlob = new Blob([audioArray], { type: mime });
        }
      } else {
        // Response is just audio blob - use arrayBuffer for proper binary handling
        const arrayBuffer = await response.arrayBuffer();
        const mime = contentType || "audio/mpeg";
        audioResponseBlob = new Blob([arrayBuffer], { type: mime });
        console.log(
          "Direct audio blob created, type:",
          mime,
          "size:",
          arrayBuffer.byteLength,
        );
      }

      console.log(
        "Response audio blob:",
        audioResponseBlob?.size || 0,
        "bytes",
      );

      if (!audioResponseBlob || audioResponseBlob.size === 0) {
        throw new Error("No audio data received from API");
      }

      // Play the audio response and start video immediately
      setIsPlayingReply(true);
      setCurrentSubtitle(transcriptionText);

      try {
        // Use the new robust audio playback utility
        const audioElement = await playApiAudio("", audioResponseBlob);

        // Set up event listener for when audio ends
        audioElement.addEventListener("ended", () => {
          setIsPlayingReply(false);
          setCurrentSubtitle("");
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
        });

        // Start video when audio starts playing
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current
            .play()
            .then(() => {
              console.log("Video started playing");
            })
            .catch((e) => console.error("Video play error:", e));
        }
      } catch (audioError) {
        console.error("Audio playback failed:", audioError);
        // Try to start video anyway
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current
            .play()
            .catch((ve) => console.error("Video play error:", ve));
        }
      }

      // Clear audio chunks for next recording
      setAudioChunks([]);
    } catch (error) {
      console.error("Error sending voice message:", error);
      alert(
        `Error processing voice message: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendVoiceMessage = async () => {
    return sendVoiceMessageWithChunks(audioChunks);
  };

  // Handle audio playback events
  const handleAudioEnded = () => {
    setIsPlayingReply(false);
    setCurrentSubtitle("");
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() && activeMode === "text" && !isLoading) {
      const userMessage = inputMessage.trim();
      const userMessageObj = {
        id: Date.now().toString(),
        text: userMessage,
        isUser: true,
        timestamp: new Date(),
      };

      // Add user message and clear input
      setMessages((prev) => [...prev, userMessageObj]);
      setInputMessage("");
      setIsLoading(true);

      try {
        // Get AI response
        const reply = await sendMessageToMira(userMessage);
        const aiMessageObj = {
          id: (Date.now() + 1).toString(),
          text: reply,
          isUser: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessageObj]);
      } catch (error) {
        const errorMessageObj = {
          id: (Date.now() + 1).toString(),
          text: "❌ Failed to send message. Please try again.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessageObj]);
      } finally {
        setIsLoading(false);
      }
    } else if (inputMessage.trim() && activeMode !== "text") {
      console.log("Sending message for mode:", activeMode, inputMessage);
      setInputMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea function
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      const baseHeight = 60; // Base height in pixels (matching min-h-[60px])
      const maxHeight = 200; // Maximum height in pixels
      
      // Reset height to measure content
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      
      // Only expand if content exceeds the base height
      if (scrollHeight > baseHeight) {
        textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
      } else {
        // Keep base height if content fits within it
        textareaRef.current.style.height = `${baseHeight}px`;
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  };

  // Handle input change with auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    autoResizeTextarea();
  };

  // Auto-resize on mount and when input message changes
  useEffect(() => {
    autoResizeTextarea();
  }, [inputMessage]);

  // AI Detector handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Handle different file types based on detector mode
    if (activeDetectorMode === "image") {
      // Accept common image formats
      const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
      if (imageTypes.includes(file.type)) {
        setDetectorFile(file);
        setDetectorText(""); // Clear text when file is selected
        setDetectorResult(null); // Clear previous result
      } else {
        alert("Please select a valid image file (JPEG, PNG, GIF, WebP, BMP)");
        e.target.value = "";
      }
    } else if (activeDetectorMode === "text") {
      // Accept .docx files for text detection
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        setDetectorFile(file);
        setDetectorText(""); // Clear text when file is selected
        setDetectorResult(null); // Clear previous result
      } else {
        alert("Please select a .docx file");
        e.target.value = "";
      }
    } else {
      // For future modes (video, voice)
      alert(`File upload for ${activeDetectorMode} mode is not yet supported`);
      e.target.value = "";
    }
  };

  const handleDetectorTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDetectorText(e.target.value);
    if (e.target.value.trim()) {
      setDetectorFile(null); // Clear file when text is entered
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setDetectorResult(null); // Clear previous result
  };

  const handleDetectorSubmit = async () => {
    if (activeDetectorMode === "text") {
      if (!detectorText.trim() && !detectorFile) {
        alert("Please enter text or upload a .docx file");
        return;
      }
    } else if (activeDetectorMode === "image") {
      if (!detectorFile) {
        alert("Please upload an image file");
        return;
      }
    } else {
      alert(`${activeDetectorMode} detection is coming soon`);
      return;
    }

    setIsDetecting(true);
    setDetectorResult(null);

    try {
      const result = await detectAIContent(
        detectorText.trim() || undefined,
        detectorFile || undefined,
      );
      setDetectorResult(result);
    } catch (error) {
      console.error("Detection error:", error);
      alert("Error analyzing content. Please try again.");
    } finally {
      setIsDetecting(false);
    }
  };

  const clearDetectorInput = () => {
    setDetectorText("");
    setDetectorFile(null);
    setDetectorResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[var(--askmira-dark-300)] to-[var(--askmira-dark-400)] text-white">
      {/* Mobile Menu Button */}
      <Button
        className="fixed top-4 left-4 z-50 md:hidden p-2"
        style={{ backgroundColor: "var(--askmira-dark-200)" }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`
          futuristic-sidebar
          ${sidebarCollapsed && !sidebarOpen ? "sidebar-collapsed" : ""}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 
          fixed md:relative 
          z-40 
          w-80 md:w-70 
          flex flex-col 
          h-full 
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Collapse Button - Hidden on mobile */}
        <Button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="collapse-btn hidden md:flex w-8 h-8 p-0 rounded-md border-0 bg-[#17191b]"
          data-testid="button-collapse-sidebar"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen
              className="collapse-btn-icon h-4 w-4"
              style={{ color: "var(--askmira-primary)" }}
            />
          ) : (
            <PanelLeftClose
              className="collapse-btn-icon h-4 w-4"
              style={{ color: "var(--askmira-primary)" }}
            />
          )}
        </Button>

        {/* Status indicator */}
        <div className="sidebar-status-indicator"></div>

        {/* Main Content - wrapped for collapse animation */}
        <div className="sidebar-content flex flex-col h-full">
          {/* Header Section */}
          <div className="p-4 pt-16 md:pt-6">
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-[var(--askmira-primary)] rounded-full animate-pulse"></div>
                <span className="text-xs font-mono tracking-wider text-[var(--askmira-primary)] opacity-70">
                  MIRA Neural Interface
                </span>
              </div>
              <div className="text-xs font-mono text-[var(--askmira-text-muted)] opacity-50 mb-4">
                [INTERFACE_v0.01]
              </div>
            </div>

            {/* New Chat Button */}
            <Button
              className="neural-chat-btn w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg border-0 bg-[#17191b]"
              onClick={() => {
                console.log("New chat created");
                setSidebarOpen(false);
              }}
              data-testid="button-new-chat"
            >
              <Plus
                className="h-4 w-4"
                style={{ color: "var(--askmira-primary)" }}
              />
              <span style={{ color: "var(--askmira-primary)" }}>
                New Session
              </span>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="px-4 pb-4">
            <div className="relative neural-search rounded-lg">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--askmira-text-muted)" }}
              />
              <Input
                type="text"
                placeholder="▶ Search neural paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg placeholder:text-[var(--askmira-text-muted)] border-0 bg-transparent font-mono text-sm"
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  letterSpacing: "0.5px",
                }}
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Chat List Area */}
          <div className="flex-1 px-4">
            <div className="chat-list-empty p-6 text-center">
              <div className="mb-3">
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-br from-[var(--askmira-primary)] to-transparent opacity-20"></div>
              </div>
              <div
                className="text-xs font-mono tracking-wider"
                style={{ color: "var(--askmira-text-muted)" }}
              >
                NO ACTIVE SESSIONS
              </div>
              <div
                className="text-xs font-mono mt-1 opacity-50"
                style={{ color: "var(--askmira-text-muted)" }}
              >
                Initialize new connection
              </div>
            </div>
          </div>

          {/* Neural Authentication Button */}
          <div className="p-4">
            {isTwitterAuthenticated || walletConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="neural-signin-btn w-full font-semibold py-3 rounded-lg border-0 transition-all duration-300 hover:scale-105"
                    data-testid="button-auth-dropdown"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0, 214, 172, 1) 0%, rgba(0, 180, 144, 1) 100%)",
                      border: "1px solid rgba(0, 214, 172, 0.5)",
                      boxShadow:
                        "0 4px 25px rgba(0, 214, 172, 0.4), 0 0 20px rgba(0, 214, 172, 0.2)",
                      color: "white",
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Zap
                          className="mr-2 h-4 w-4"
                          style={{ color: "white" }}
                        />
                        <span style={{ color: "white" }}>
                          {twitterUser?.displayName ||
                            twitterUser?.username ||
                            (walletAddress
                              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                              : "Authenticated")}
                        </span>
                      </div>
                      <ChevronDown
                        className="h-4 w-4"
                        style={{ color: "white" }}
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-64 border-0 shadow-2xl"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.15)",
                    backdropFilter: "blur(25px)",
                    border: "1px solid rgba(0, 212, 170, 0.2)",
                    boxShadow:
                      "0 20px 40px rgba(0, 212, 170, 0.1), 0 0 30px rgba(0, 212, 170, 0.05)",
                  }}
                >
                  {/* User Info Section */}
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-[var(--askmira-primary)] rounded-full animate-pulse"></div>
                      <div className="text-sm font-mono text-[var(--askmira-primary)] tracking-wide">
                        {twitterUser?.displayName ||
                          twitterUser?.username ||
                          (walletAddress
                            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                            : "Neural User")}
                      </div>
                    </div>
                    {walletConnected && walletAddress && (
                      <div className="text-xs font-mono text-[var(--askmira-text-muted)] opacity-70 ml-5">
                        Wallet Connected
                      </div>
                    )}
                  </div>

                  {/* Separator with glow effect */}
                  <div className="mx-2 h-px bg-gradient-to-r from-transparent via-[var(--askmira-primary)] to-transparent opacity-30"></div>

                  {/* Action Items */}
                  <div className="py-2">
                    {isTwitterAuthenticated && (
                      <DropdownMenuItem
                        onClick={logout}
                        className="mx-2 my-1 rounded-lg font-mono text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-red-500/20"
                        style={{
                          backdropFilter: "blur(10px)",
                        }}
                        data-testid="menuitem-twitter-logout"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                          <span className="tracking-wide">Sign out X</span>
                        </div>
                      </DropdownMenuItem>
                    )}
                    {walletConnected && (
                      <DropdownMenuItem
                        onClick={handleWalletDisconnect}
                        className="mx-2 my-1 rounded-lg font-mono text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-orange-500/20"
                        style={{
                          backdropFilter: "blur(10px)",
                        }}
                        data-testid="menuitem-wallet-disconnect"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
                          <span className="tracking-wide">
                            Disconnect Wallet
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="neural-signin-btn w-full font-semibold py-3 rounded-lg border-0 transition-all duration-300 hover:scale-105"
                onClick={() => {
                  console.log("Opening auth modal...");
                  openAuthModal();
                  setSidebarOpen(false);
                }}
                data-testid="button-neural-auth"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0, 214, 172, 1) 0%, rgba(0, 180, 144, 1) 100%)",
                  border: "1px solid rgba(0, 214, 172, 0.5)",
                  boxShadow:
                    "0 4px 25px rgba(0, 214, 172, 0.4), 0 0 20px rgba(0, 214, 172, 0.2)",
                  color: "white",
                }}
              >
                <LogIn className="mr-2 h-4 w-4" style={{ color: "white" }} />
                <span style={{ color: "white" }}>Neural Authentication</span>
              </Button>
            )}
          </div>

          {/* Footer Status */}
          <div className="px-4 pb-3">
            <div className="text-xs font-mono text-center text-[var(--askmira-text-muted)] opacity-30">
              STATUS: OPERATIONAL
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-10 z-0"
          src={backgroundVideo}
        />

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Toggle Buttons */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 lg:gap-4 md:mb-8 px-2 overflow-x-auto scrollbar-hide mt-[30px] mb-[30px]">
            <div className="flex gap-1 sm:gap-2 lg:gap-4">
              {modes.map((mode) => {
                const IconComponent = mode.icon;
                const isActive = activeMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => setActiveMode(mode.id)}
                    className={`
                    askmira-toggle-btn 
                    ${isActive ? "active" : ""} 
                    whitespace-nowrap 
                    text-xs sm:text-sm 
                    px-2 sm:px-4 lg:px-6 
                    py-2 
                    flex-shrink-0
                    flex
                    items-center
                  `}
                    style={{
                      color: isActive
                        ? "var(--askmira-primary)"
                        : "rgba(255, 255, 255, 0.7)",
                    }}
                  >
                    <IconComponent className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{mode.label}</span>
                    <span className="sm:hidden">
                      {mode.label === "AI DETECTOR"
                        ? "AI"
                        : mode.label === "NEURAL LINK"
                          ? "NEURAL"
                          : mode.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Detector Sub-Mode Buttons - Only show when detector mode is active */}
          {activeMode === "detector" && (
            <div className="flex items-center justify-center gap-1 sm:gap-2 lg:gap-3 mb-6 px-2 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 sm:gap-2 lg:gap-3">
                {detectorModes.map((mode) => {
                  const IconComponent = mode.icon;
                  const isActive = activeDetectorMode === mode.id;

                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setActiveDetectorMode(mode.id);
                        // Reset state when switching modes
                        setDetectorText("");
                        setDetectorFile(null);
                        setDetectorResult(null);
                      }}
                      className="whitespace-nowrap text-xs sm:text-sm flex-shrink-0 flex items-center transition-all duration-300 cursor-pointer"
                      style={{
                        color: isActive
                          ? "var(--askmira-primary)"
                          : "rgba(255, 255, 255, 0.6)",
                        background: "none",
                        border: "none",
                        padding: "8px 12px",
                        textShadow: isActive
                          ? "0 0 10px rgba(0, 212, 170, 0.6), 0 0 20px rgba(0, 212, 170, 0.4)"
                          : "0 0 5px rgba(255, 255, 255, 0.2), 0 0 10px rgba(255, 255, 255, 0.1)",
                      }}
                      data-testid={`button-detector-${mode.id}`}
                    >
                      <IconComponent className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-mono">
                        {mode.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeMode === "text" ? (
              /* Chat Messages Area for Text Mode */
              <div className="max-w-4xl mx-auto h-full flex flex-col px-4 sm:px-8">
                <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[calc(100vh-280px)] chat-scroll">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div
                        className="askmira-upload-area w-full max-w-3xl h-56 sm:h-72 flex flex-col items-center justify-center relative group"
                        onClick={() => console.log("Upload area clicked")}
                      >
                        {/* Neural connection grid background */}
                        <div className="neural-connection-grid"></div>

                        {/* Floating particles */}
                        <div className="floating-particles"></div>

                        {/* Main content */}
                        <div className="relative z-10 flex flex-col items-center justify-center">
                          <div className="relative mb-6">
                            <Zap
                              className="h-16 w-16 sm:h-20 sm:w-20 transition-all duration-500 group-hover:scale-110"
                              style={{
                                color: "var(--askmira-primary)",
                                filter:
                                  "drop-shadow(0 0 20px rgba(0, 212, 170, 0.4))",
                              }}
                            />
                            {/* Icon glow effect */}
                            <div className="absolute inset-0 h-16 w-16 sm:h-20 sm:w-20 bg-[var(--askmira-primary)] rounded-full opacity-20 blur-xl animate-pulse"></div>
                          </div>

                          <div className="text-center space-y-2">
                            <p
                              className="text-xs sm:text-sm font-mono tracking-wider opacity-60"
                              style={{
                                color: "var(--askmira-text-muted)",
                                letterSpacing: "1px",
                              }}
                            >
                              INITIALIZE CONNECTION OR UPLOAD DATA PACKAGE
                            </p>
                          </div>
                        </div>

                        {/* Corner accent lines */}
                        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-lg text-sm ${
                            message.isUser
                              ? "bg-gradient-to-r from-[var(--askmira-primary)] to-[rgba(0,212,170,0.8)] text-white font-mono"
                              : "bg-[rgba(26,26,26,0.6)] border border-[rgba(0,212,170,0.2)] text-[var(--askmira-text)]"
                          }`}
                          style={{
                            backdropFilter: "blur(10px)",
                            boxShadow: message.isUser
                              ? "0 4px 15px rgba(0, 212, 170, 0.3)"
                              : "0 4px 15px rgba(0, 0, 0, 0.2)",
                            lineHeight: "1.6",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          <div
                            className={`message-content ${message.isUser ? "font-mono" : "font-sans"}`}
                            dangerouslySetInnerHTML={{
                              __html: formatMessage(message.text),
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-xs px-4 py-3 rounded-lg bg-[rgba(26,26,26,0.6)] border border-[rgba(0,212,170,0.2)]">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[var(--askmira-primary)] rounded-full animate-pulse"></div>
                          <div
                            className="w-2 h-2 bg-[var(--askmira-primary)] rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[var(--askmira-primary)] rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            ) : activeMode === "voice" ? (
              /* Voice Recording Interface */
              <div className="flex items-center justify-center h-full relative">
                {/* Mira Video - Only visible when playing reply */}
                {isPlayingReply && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-50 pointer-events-none">
                    {/* Video container with futuristic frame */}
                    <div className="relative">
                      {/* Outer glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--askmira-primary)] to-cyan-400 rounded-lg opacity-20 blur-xl animate-pulse"></div>

                      {/* Neural frame border */}
                      <div
                        className="relative rounded-lg overflow-hidden border-2 border-[var(--askmira-primary)] shadow-2xl"
                        style={{
                          background:
                            "linear-gradient(145deg, rgba(0,212,170,0.1), rgba(0,255,255,0.05))",
                          backdropFilter: "blur(20px)",
                          boxShadow:
                            "0 0 50px rgba(0, 212, 170, 0.4), inset 0 0 20px rgba(0, 212, 170, 0.1)",
                        }}
                      >
                        {/* Corner indicators */}
                        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[var(--askmira-primary)] z-10"></div>
                        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[var(--askmira-primary)] z-10"></div>
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[var(--askmira-primary)] z-10"></div>
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[var(--askmira-primary)] z-10"></div>

                        {/* Status indicator */}
                        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
                          <div className="flex items-center space-x-2 bg-black/50 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 bg-[var(--askmira-primary)] rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-[var(--askmira-primary)]">
                              MIRA ACTIVE
                            </span>
                          </div>
                        </div>

                        <video
                          ref={videoRef}
                          src={miraVideo}
                          loop
                          muted
                          autoPlay
                          playsInline
                          className="w-80 h-[500px] object-cover"
                          onLoadedData={() => {
                            console.log(
                              "Video loaded, playing:",
                              isPlayingReply,
                            );
                            if (videoRef.current && isPlayingReply) {
                              videoRef.current
                                .play()
                                .catch((e) =>
                                  console.error("Video play error:", e),
                                );
                            }
                          }}
                        />

                        {/* Scanning line effect */}
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="scan-line"></div>
                        </div>
                      </div>
                    </div>

                    {/* Subtitle display - Below the video frame */}
                    {currentSubtitle && (
                      <div className="mt-6 w-full max-w-3xl px-4">
                        <div
                          className="bg-gradient-to-r from-black/80 via-black/90 to-black/80 rounded-lg px-6 py-4 backdrop-blur-sm border border-[var(--askmira-primary)]/30"
                          style={{
                            boxShadow:
                              "0 4px 20px rgba(0, 212, 170, 0.2), inset 0 1px 0 rgba(0, 212, 170, 0.1)",
                          }}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-2 h-2 bg-[var(--askmira-primary)] rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-[var(--askmira-primary)] opacity-70 tracking-wider">
                              MIRA_TRANSMISSION
                            </span>
                          </div>
                          <p className="text-[var(--askmira-primary)] text-base font-mono text-center leading-relaxed tracking-wide">
                            {currentSubtitle}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Voice Recording Controls */}
                <div
                  className={`askmira-upload-area w-full max-w-3xl h-56 sm:h-72 flex flex-col items-center justify-center relative group ${isPlayingReply ? "z-10 opacity-10 blur-sm" : "z-10"} transition-all duration-700`}
                >
                  {/* Neural connection grid background */}
                  <div className="neural-connection-grid"></div>

                  {/* Floating particles */}
                  <div className="floating-particles"></div>

                  {/* Main content */}
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
                    <div className="relative mb-6">
                      <Mic
                        className={`h-16 w-16 sm:h-20 sm:w-20 transition-all duration-500 group-hover:scale-110 ${
                          isRecording ? "animate-pulse" : ""
                        }`}
                        style={{
                          color: isRecording
                            ? "#ff4444"
                            : "var(--askmira-primary)",
                          filter: `drop-shadow(0 0 20px ${isRecording ? "rgba(255, 68, 68, 0.4)" : "rgba(0, 212, 170, 0.4)"})`,
                        }}
                      />
                      {/* Icon glow effect */}
                      <div
                        className={`absolute inset-0 h-16 w-16 sm:h-20 sm:w-20 rounded-full opacity-20 blur-xl animate-pulse ${
                          isRecording
                            ? "bg-red-500"
                            : "bg-[var(--askmira-primary)]"
                        }`}
                      ></div>
                    </div>

                    {/* Recording Controls */}
                    <div className="flex flex-col items-center space-y-4">
                      {!isRecording && !isLoading ? (
                        <Button
                          onClick={startRecording}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-[var(--askmira-primary)] to-[rgba(0,212,170,0.8)] text-white font-mono text-sm px-8 py-4 rounded-lg hover:from-[rgba(0,212,170,0.9)] hover:to-[var(--askmira-primary)] transition-all duration-300"
                          style={{
                            boxShadow: "0 4px 15px rgba(0, 212, 170, 0.3)",
                            backdropFilter: "blur(10px)",
                          }}
                          data-testid="button-start-recording"
                        >
                          START RECORDING
                        </Button>
                      ) : isRecording ? (
                        <Button
                          onClick={stopRecording}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white font-mono text-sm px-8 py-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 animate-pulse"
                          style={{
                            boxShadow: "0 4px 15px rgba(255, 68, 68, 0.3)",
                            backdropFilter: "blur(10px)",
                          }}
                          data-testid="button-stop-recording"
                        >
                          STOP & SEND
                        </Button>
                      ) : isLoading ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 border-2 border-[var(--askmira-primary)] border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[var(--askmira-primary)] font-mono text-sm">
                            PROCESSING...
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="text-center space-y-2">
                      <p
                        className="text-xs sm:text-sm font-mono tracking-wider opacity-60"
                        style={{
                          color: "var(--askmira-text-muted)",
                          letterSpacing: "1px",
                        }}
                      >
                        {isRecording
                          ? "RECORDING... CLICK STOP TO SEND"
                          : isLoading
                            ? "SENDING TO MIRA..."
                            : isPlayingReply
                              ? "MIRA IS SPEAKING..."
                              : "READY FOR VOICE RECORDING"}
                      </p>
                    </div>
                  </div>

                  {/* Corner accent lines */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                </div>
                {/* Hidden audio element for playback */}
                <audio
                  ref={audioRef}
                  onEnded={handleAudioEnded}
                  style={{ display: "none" }}
                  preload="auto"
                  controls={false}
                  autoPlay={false}
                  crossOrigin="anonymous"
                />
              </div>
            ) : activeMode === "detector" ? (
              /* AI Detector Interface */
              <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
                  {/* Input Section */}
                  <div
                    className="askmira-upload-area relative group"
                    style={{ margin: "0 auto" }}
                  >
                    {/* Neural connection grid background */}
                    <div className="neural-connection-grid"></div>

                    {/* Floating particles */}
                    <div className="floating-particles"></div>

                    <div
                      className={`relative z-10 p-4 sm:p-6 lg:p-8 space-y-6 ${activeDetectorMode !== "text" && activeDetectorMode !== "image" ? "blur-sm opacity-60 pointer-events-none" : ""}`}
                    >
                      <div className="text-center space-y-2 mb-6">
                        <div className="flex items-center justify-center space-x-3 mb-3">
                          <Shield
                            className="h-8 w-8 transition-all duration-500"
                            style={{
                              color: "var(--askmira-primary)",
                              filter:
                                "drop-shadow(0 0 20px rgba(0, 212, 170, 0.4))",
                            }}
                          />
                          <h2
                            className="text-xl font-mono"
                            style={{ color: "var(--askmira-primary)" }}
                          >
                            AI CONTENT DETECTOR
                          </h2>
                        </div>
                        <p
                          className="text-xs font-mono tracking-wider opacity-60"
                          style={{
                            color: "var(--askmira-text-muted)",
                            letterSpacing: "1px",
                          }}
                        >
                          {activeDetectorMode === "text" &&
                            "ANALYZE TEXT OR UPLOAD .DOCX FILE"}
                          {activeDetectorMode === "image" &&
                            "UPLOAD IMAGE FILE FOR AI DETECTION"}
                          {activeDetectorMode === "video" &&
                            "UPLOAD VIDEO FILE FOR AI DETECTION"}
                          {activeDetectorMode === "voice" &&
                            "UPLOAD AUDIO FILE FOR AI DETECTION"}
                        </p>
                      </div>

                      {/* Dynamic Input Based on Detector Mode */}
                      <div className="space-y-4">
                        {activeDetectorMode === "text" ? (
                          <>
                            {/* Text Input */}
                            <div className="relative">
                              <textarea
                                value={detectorText}
                                onChange={handleDetectorTextChange}
                                placeholder="Paste your text here to analyze..."
                                className="w-full h-40 px-4 py-3 rounded-lg bg-[rgba(26,26,26,0.6)] border border-[rgba(0,212,170,0.2)] text-[var(--askmira-text)] placeholder:text-[var(--askmira-text-muted)] font-mono text-sm resize-none"
                                style={{
                                  backdropFilter: "blur(10px)",
                                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
                                  lineHeight: "1.6",
                                }}
                                data-testid="textarea-detector-text"
                              />
                            </div>

                            {/* OR Divider */}
                            <div className="flex items-center space-x-4">
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--askmira-primary)] to-transparent opacity-30"></div>
                              <span className="text-xs font-mono text-[var(--askmira-text-muted)] opacity-50">
                                OR
                              </span>
                              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--askmira-primary)] to-transparent opacity-30"></div>
                            </div>

                            {/* File Upload for Text */}
                            <div className="space-y-2">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".docx"
                                onChange={handleFileUpload}
                                className="hidden"
                                data-testid="input-file-upload"
                              />
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 px-4 rounded-lg border-2 border-dashed border-[rgba(0,212,170,0.3)] bg-transparent hover:border-[var(--askmira-primary)] transition-all duration-300"
                                style={{
                                  color: detectorFile
                                    ? "var(--askmira-primary)"
                                    : "var(--askmira-text-muted)",
                                }}
                                data-testid="button-upload-file"
                              >
                                {detectorFile ? (
                                  <div className="flex items-center space-x-2">
                                    <Shield className="h-4 w-4" />
                                    <span className="font-mono text-sm">
                                      {detectorFile.name}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <Plus className="h-4 w-4" />
                                    <span className="font-mono text-sm">
                                      UPLOAD .DOCX FILE
                                    </span>
                                  </div>
                                )}
                              </Button>
                              {detectorFile && (
                                <p className="text-xs font-mono text-[var(--askmira-primary)] opacity-70 text-center">
                                  File selected: {detectorFile.name}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          /* File Upload for Image/Video/Voice */
                          <div className="space-y-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept={
                                activeDetectorMode === "image"
                                  ? ".jpg,.jpeg,.png,.gif,.bmp,.webp"
                                  : activeDetectorMode === "video"
                                    ? ".mp4,.avi,.mov,.wmv,.flv,.webm"
                                    : activeDetectorMode === "voice"
                                      ? ".mp3,.wav,.ogg,.m4a,.aac,.flac"
                                      : "*"
                              }
                              onChange={handleFileUpload}
                              className="hidden"
                              data-testid="input-file-upload"
                            />
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-6 px-4 rounded-lg border-2 border-dashed border-[rgba(0,212,170,0.3)] bg-transparent hover:border-[var(--askmira-primary)] transition-all duration-300"
                              style={{
                                color: detectorFile
                                  ? "var(--askmira-primary)"
                                  : "var(--askmira-text-muted)",
                              }}
                              data-testid="button-upload-file"
                            >
                              {detectorFile ? (
                                <div className="flex flex-col items-center space-y-2">
                                  <span className="font-mono text-sm">
                                    {detectorFile.name}
                                  </span>
                                  <span className="font-mono text-xs opacity-70">
                                    {(detectorFile.size / 1024 / 1024).toFixed(
                                      2,
                                    )}{" "}
                                    MB
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center">
                                  <div className="text-center">
                                    <div className="font-mono text-sm">
                                      UPLOAD {activeDetectorMode.toUpperCase()} FILE
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Button>
                            {detectorFile && activeDetectorMode === "image" && (
                              <div className="mt-4 space-y-2">
                                <p className="text-xs font-mono text-[var(--askmira-primary)] opacity-70 text-center">
                                  File selected: {detectorFile.name}
                                </p>
                                <div className="flex justify-center">
                                  <div className="border border-[rgba(0,212,170,0.3)] rounded-lg p-2 bg-[rgba(0,0,0,0.2)] max-w-xs">
                                    <img
                                      src={URL.createObjectURL(detectorFile)}
                                      alt="Uploaded image preview"
                                      className="w-full h-auto rounded max-h-48 object-contain"
                                      style={{
                                        filter: "drop-shadow(0 0 10px rgba(0, 212, 170, 0.3))",
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            {detectorFile && activeDetectorMode !== "image" && (
                              <p className="text-xs font-mono text-[var(--askmira-primary)] opacity-70 text-center">
                                File selected: {detectorFile.name}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex space-x-3 pt-4">
                          <Button
                            onClick={handleDetectorSubmit}
                            disabled={
                              isDetecting ||
                              (activeDetectorMode === "text"
                                ? !detectorText.trim() && !detectorFile
                                : !detectorFile)
                            }
                            className="flex-1 py-3 px-6 rounded-lg font-mono text-sm transition-all duration-300"
                            style={{
                              background:
                                isDetecting ||
                                (activeDetectorMode === "text"
                                  ? !detectorText.trim() && !detectorFile
                                  : !detectorFile)
                                  ? "rgba(128, 128, 128, 0.3)"
                                  : "linear-gradient(135deg, rgba(0, 214, 172, 1) 0%, rgba(0, 180, 144, 1) 100%)",
                              border: "1px solid rgba(0, 214, 172, 0.5)",
                              boxShadow:
                                isDetecting ||
                                (activeDetectorMode === "text"
                                  ? !detectorText.trim() && !detectorFile
                                  : !detectorFile)
                                  ? "none"
                                  : "0 4px 25px rgba(0, 214, 172, 0.4)",
                              color: "white",
                            }}
                            data-testid="button-analyze-content"
                          >
                            {isDetecting ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>ANALYZING...</span>
                              </div>
                            ) : (
                              `ANALYZE ${activeDetectorMode.toUpperCase()}`
                            )}
                          </Button>

                          {(detectorText.trim() ||
                            detectorFile ||
                            detectorResult) && (
                            <Button
                              onClick={clearDetectorInput}
                              className="py-3 px-6 rounded-lg font-mono text-sm border border-[rgba(255,255,255,0.2)] bg-transparent hover:bg-[rgba(255,255,255,0.1)] transition-all duration-300"
                              style={{ color: "var(--askmira-text-muted)" }}
                              data-testid="button-clear-input"
                            >
                              CLEAR
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Coming Soon Overlay for non-text and non-image modes */}
                    {activeDetectorMode !== "text" && activeDetectorMode !== "image" && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 backdrop-blur-sm rounded-lg">
                        <div className="text-center">
                          <div
                            className="bg-gradient-to-r from-black/90 via-black/95 to-black/90 rounded-lg px-8 py-6 border-2 border-[var(--askmira-primary)]/60 backdrop-blur-sm"
                            style={{
                              boxShadow:
                                "0 0 30px rgba(0, 212, 170, 0.4), 0 0 60px rgba(0, 212, 170, 0.2), inset 0 1px 0 rgba(0, 212, 170, 0.3)",
                              filter: "blur(2px)",
                              opacity: "0.6",
                            }}
                          >
                            <div className="flex items-center justify-center space-x-3 mb-3"></div>
                            <h3 className="text-2xl font-mono text-[var(--askmira-primary)] mb-2 tracking-wider">
                              COMING SOON
                            </h3>
                            <p className="text-sm font-mono text-[var(--askmira-text-muted)] opacity-70 tracking-wide">
                              {activeDetectorMode.toUpperCase()} DETECTION UNDER
                              CONSTRUCTION
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Corner accent lines */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                  </div>

                  {/* Results Section */}
                  {detectorResult && (
                    <div
                      className="askmira-upload-area relative group"
                      style={{ margin: "0 auto" }}
                    >
                      {/* Neural connection grid background */}
                      <div className="neural-connection-grid"></div>

                      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
                        <div className="text-center space-y-6">
                          <div className="flex items-center justify-center space-x-3 mb-4">
                            <h3
                              className="text-lg font-mono"
                              style={{ color: "var(--askmira-primary)" }}
                            >
                              ANALYSIS RESULTS
                            </h3>
                          </div>

                          {/* Image Detection Results */}
                          {activeDetectorMode === "image" && detectorResult.imageInfo ? (
                            <div className="space-y-6">
                              {/* Image Information */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="text-left">
                                    <h4 className="text-sm font-mono text-[var(--askmira-primary)] mb-2">IMAGE INFORMATION</h4>
                                    <p className="text-sm font-mono text-[var(--askmira-text)] opacity-80">
                                      Classification: {detectorResult.imageInfo.classification}
                                    </p>
                                  </div>

                                  <div className="text-left">
                                    <h4 className="text-sm font-mono text-[var(--askmira-primary)] mb-2">AI LIKELIHOOD SCORE</h4>
                                    <div className="text-center">
                                      {(() => {
                                        const detailedScores = detectorResult.imageInfo.detailedScores;
                                        const authenticScore = detailedScores?.authentic;
                                        
                                        // Consider authentic if the authentic score is above 90%
                                        const isAuthentic = authenticScore && authenticScore > 0.9;
                                        const displayScore = isAuthentic ? authenticScore * 100 : detectorResult.imageInfo.aiLikelihood;
                                        
                                        return (
                                          <>
                                            <div
                                              className="text-3xl font-mono font-bold mb-2"
                                              style={{
                                                color: isAuthentic ? "#22c55e" : "#ef4444",
                                              }}
                                            >
                                              {displayScore.toFixed(1)}/100
                                            </div>
                                            <div
                                              className="inline-block px-4 py-2 rounded-lg font-mono text-xs font-bold"
                                              style={{
                                                backgroundColor: isAuthentic ? "#22c55e" : "#ef4444",
                                                color: "white",
                                              }}
                                            >
                                              {isAuthentic ? "AUTHENTIC" : "AI-GENERATED"}
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                    
                                    {/* Visual Progress Bar */}
                                    <div className="w-full max-w-xs mx-auto mt-4">
                                      {(() => {
                                        const detailedScores = detectorResult.imageInfo.detailedScores;
                                        const authenticScore = detailedScores?.authentic;
                                        
                                        // Consider authentic if the authentic score is above 90%
                                        const isAuthentic = authenticScore && authenticScore > 0.9;
                                        const displayScore = isAuthentic ? authenticScore * 100 : detectorResult.imageInfo.aiLikelihood;
                                        
                                        return (
                                          <>
                                            <div className="h-3 bg-[rgba(26,26,26,0.6)] rounded-full overflow-hidden border border-[rgba(0,212,170,0.2)]">
                                              <div
                                                className="h-full transition-all duration-1000 ease-out"
                                                style={{
                                                  width: `${displayScore}%`,
                                                  background: isAuthentic
                                                    ? "linear-gradient(90deg, #22c55e, #16a34a)"
                                                    : "linear-gradient(90deg, #ef4444, #dc2626)",
                                                }}
                                              />
                                            </div>
                                            <div className="flex justify-between text-xs font-mono text-[var(--askmira-text-muted)] mt-1">
                                              <span>0</span>
                                              <span>50</span>
                                              <span>100</span>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>

                                {/* AI Detection Heatmap */}
                                {detectorResult.imageInfo.heatmapImage && (
                                  <div className="text-center">
                                    <h4 className="text-sm font-mono text-[var(--askmira-primary)] mb-2">AI DETECTION HEATMAP</h4>
                                    <div className="border border-[rgba(0,212,170,0.3)] rounded-lg p-2 bg-[rgba(0,0,0,0.2)]">
                                      <img
                                        src={detectorResult.imageInfo.heatmapImage}
                                        alt="AI Detection Heatmap"
                                        className="w-full h-auto rounded max-w-xs mx-auto"
                                        style={{
                                          filter: "drop-shadow(0 0 10px rgba(0, 212, 170, 0.3))",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Detailed Scores by Model */}
                              {detectorResult.imageInfo.detailedScores && Object.keys(detectorResult.imageInfo.detailedScores).length > 0 && (
                                <div className="text-left">
                                  <h4 className="text-sm font-mono text-[var(--askmira-primary)] mb-3">DETAILED SCORES BY MODEL</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(detectorResult.imageInfo.detailedScores).map(([model, score]) => {
                                      const isAuthentic = model === 'authentic' && typeof score === 'number' && score > 0.9;
                                      const isAiGenerated = model !== 'authentic' && typeof score === 'number' && score > 0.5;
                                      
                                      return (
                                        <div key={model} className="flex justify-between items-center p-2 bg-[rgba(0,0,0,0.3)] rounded border border-[rgba(0,212,170,0.2)]">
                                          <span className="text-xs font-mono text-[var(--askmira-text)] opacity-80">{model}</span>
                                          <span
                                            className="text-sm font-mono font-bold"
                                            style={{
                                              color: isAuthentic ? "#22c55e" : isAiGenerated ? "#ef4444" : "#22c55e",
                                            }}
                                          >
                                            {typeof score === 'number' ? `${(score * 100).toFixed(1)}%` : score}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Text Detection Results */
                            <div className="space-y-4">
                              <div className="text-center">
                                <div
                                  className="text-3xl font-mono font-bold mb-2"
                                  style={{
                                    color:
                                      detectorResult.probability > 50
                                        ? "#ef4444"
                                        : "#22c55e",
                                  }}
                                >
                                  {detectorResult.probability.toFixed(1)}%
                                </div>
                                <div
                                  className="inline-block px-4 py-2 rounded-lg font-mono text-sm font-bold"
                                  style={{
                                    backgroundColor:
                                      detectorResult.probability > 50
                                        ? "#ef4444"
                                        : "#22c55e",
                                    color: "white",
                                  }}
                                >
                                  {detectorResult.probability > 50
                                    ? "AI-GENERATED"
                                    : "HUMAN-WRITTEN"}
                                </div>
                              </div>

                              {/* Visual Progress Bar */}
                              <div className="w-full max-w-md mx-auto">
                                <div className="h-4 bg-[rgba(26,26,26,0.6)] rounded-full overflow-hidden border border-[rgba(0,212,170,0.2)]">
                                  <div
                                    className="h-full transition-all duration-1000 ease-out"
                                    style={{
                                      width: `${detectorResult.probability}%`,
                                      background:
                                        detectorResult.probability > 50
                                          ? "linear-gradient(90deg, #ef4444, #dc2626)"
                                          : "linear-gradient(90deg, #22c55e, #16a34a)",
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs font-mono text-[var(--askmira-text-muted)] mt-2">
                                  <span>0%</span>
                                  <span>50%</span>
                                  <span>100%</span>
                                </div>
                              </div>

                              <p className="text-xs font-mono text-[var(--askmira-text-muted)] opacity-70 max-w-md mx-auto">
                                {detectorResult.probability > 50
                                  ? "This content appears to be generated by artificial intelligence."
                                  : "This content appears to be written by a human."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Corner accent lines */}
                      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[var(--askmira-primary)] opacity-30"></div>
                      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[var(--askmira-primary)] opacity-30"></div>
                      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[var(--askmira-primary)] opacity-30"></div>
                      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[var(--askmira-primary)] opacity-30"></div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Upload Area for Other Modes (MIRA) */
              <div className="flex items-center justify-center h-full px-4 sm:px-6 lg:px-8">
                <div
                  className="askmira-upload-area w-full max-w-3xl h-56 sm:h-72 flex flex-col items-center justify-center relative group blur-sm opacity-60 pointer-events-none"
                  style={{ filter: "blur(2px)" }}
                >
                  {/* Neural connection grid background */}
                  <div className="neural-connection-grid"></div>

                  {/* Floating particles */}
                  <div className="floating-particles"></div>

                  {/* Main content */}
                  <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                      <Zap
                        className="h-16 w-16 sm:h-20 sm:w-20 transition-all duration-500"
                        style={{
                          color: "var(--askmira-primary)",
                          filter:
                            "drop-shadow(0 0 20px rgba(0, 212, 170, 0.4))",
                        }}
                      />
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 h-16 w-16 sm:h-20 sm:w-20 bg-[var(--askmira-primary)] rounded-full opacity-20 blur-xl animate-pulse"></div>
                    </div>

                    <div className="text-center space-y-2">
                      <p
                        className="text-xs sm:text-sm font-mono tracking-wider opacity-60"
                        style={{
                          color: "var(--askmira-text-muted)",
                          letterSpacing: "1px",
                        }}
                      >
                        INITIALIZE CONNECTION OR UPLOAD DATA PACKAGE
                      </p>
                    </div>
                  </div>

                  {/* Coming Soon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-sm rounded-lg">
                    <div className="text-center">
                      <div
                        className="bg-gradient-to-r from-black/90 via-black/95 to-black/90 rounded-lg px-8 py-6 border border-[var(--askmira-primary)]/30"
                        style={{
                          boxShadow:
                            "0 8px 32px rgba(0, 212, 170, 0.2), inset 0 1px 0 rgba(0, 212, 170, 0.1)",
                        }}
                      >
                        <div className="flex items-center justify-center space-x-3 mb-3">
                          <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                          <span className="text-sm font-mono text-orange-400 tracking-wider">
                            DEVELOPMENT
                          </span>
                        </div>
                        <h3 className="text-2xl font-mono text-[var(--askmira-primary)] mb-2 tracking-wider">
                          COMING SOON
                        </h3>
                        <p className="text-sm font-mono text-[var(--askmira-text-muted)] opacity-70 tracking-wide">
                          MIRA MODE UNDER CONSTRUCTION
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Corner accent lines */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-[var(--askmira-primary)] opacity-30 transition-opacity duration-300 group-hover:opacity-60"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - Only show for text mode */}
          {activeMode === "text" && (
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="max-w-4xl mx-auto relative">
                {/* Status Bar */}
                <div className="flex items-center justify-between mb-3 px-2">
                  <div className="flex items-center space-x-3"></div>
                  <div className="text-xs font-mono text-[var(--askmira-text-muted)] opacity-50">
                    [SECURE_CHANNEL]
                  </div>
                </div>

                {/* Input Container */}
                <div className="futuristic-input-container rounded-xl">
                  <div className="neural-grid"></div>

                  {/* Data stream indicator */}
                  <div className="data-stream">&gt;&gt; DATA_STREAM_ACTIVE</div>

                  <Textarea
                    ref={textareaRef}
                    placeholder="Enter neural transmission"
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="askmira-input w-full pl-6 sm:pl-8 pr-12 sm:pr-14 py-4 sm:py-5 rounded-lg text-sm sm:text-lg placeholder:text-[var(--askmira-text-muted)] font-mono tracking-wide border-0 bg-transparent resize-none"
                    style={{
                      letterSpacing: "0.5px",
                      textShadow: "0 0 15px rgba(0, 212, 170, 0.4)",
                      height: '60px',
                      overflow: 'hidden',
                    }}
                    data-testid="input-neural-transmission"
                  />

                  <div className="status-dots">
                    <div className="status-dot"></div>
                    <div className="status-dot"></div>
                    <div className="status-dot"></div>
                  </div>

                  {/* Enhanced corner indicators */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-[var(--askmira-primary)] opacity-40 transition-all duration-300 group-hover:opacity-80"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-[var(--askmira-primary)] opacity-40 transition-all duration-300 group-hover:opacity-80"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-[var(--askmira-primary)] opacity-40 transition-all duration-300 group-hover:opacity-80"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-[var(--askmira-primary)] opacity-40 transition-all duration-300 group-hover:opacity-80"></div>
                </div>

                {/* Connection Status Footer */}
                <div className="flex items-center justify-center mt-3 space-x-4 text-xs font-mono text-[var(--askmira-text-muted)] opacity-40">
                  <span>LATENCY: {latency}ms</span>
                  <span>•</span>
                  <span>ENCRYPTION: AES-256</span>
                  <span>•</span>
                  <span>BANDWIDTH: ∞</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Authentication Modal */}
      <AuthModal />
    </div>
  );
}
