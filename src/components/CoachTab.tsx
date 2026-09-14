import React, { useState, useEffect, useRef } from "react";
import { CoachMessage, Profile, WorkoutSession } from "../types";
import { Send, Info, BookOpen, Brain, RotateCcw, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

interface CoachTabProps {
  profile: Profile;
  sessions: WorkoutSession[];
  chatHistory: CoachMessage[];
  setChatHistory: (messages: CoachMessage[]) => void;
}

interface DefaultTip {
  id: string;
  category: string;
  title: string;
  summary: string;
  source: string;
}

export default function CoachTab({
  profile,
  sessions,
  chatHistory,
  setChatHistory
}: CoachTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'library'>('chat');
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tips, setTips] = useState<DefaultTip[]>([]);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Suggested questions for quick tap
  const quickQuestions = [
    "¿Cuánto descanso entre series es mejor?",
    "¿Cómo aplicar la sobrecarga progresiva?",
    "¿Cuánta proteína debo consumir al día?",
    "¿Debo entrenar al fallo muscular para hipertrofia?",
    "¿Cuántas series por músculo a la semana son óptimas?",
    "¿Sirve la creatina y cómo se toma?"
  ];

  // Fetch static scientifically-backed tips from backend with instant fallback
  useEffect(() => {
    fetch("/api/coach/default-tips")
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setTips(data);
        }
      })
      .catch(() => {
        setTips([
          {
            id: "tip-1",
            category: "Hipertrofia",
            title: "Rango de repeticiones óptimo",
            summary: "La hipertrofia ocurre de forma similar en un amplio espectro de repeticiones (de 6 a 30 por serie), siempre y cuando las series se lleven a una proximidad cercana al fallo (RIR 1-3).",
            source: "Schoenfeld, B. J., et al. (2017). Journal of Strength and Conditioning Research."
          },
          {
            id: "tip-2",
            category: "Sobrecarga Progresiva",
            title: "La regla de la sobrecarga",
            summary: "Para progresar en fuerza o volumen, debes aumentar el estímulo mecánico periódicamente mediante peso, repeticiones por serie, o volumen de series totales.",
            source: "Kraemer, W. J., & Ratamess, N. A. (2004). Medicine & Science in Sports & Exercise."
          },
          {
            id: "tip-3",
            category: "Recuperación",
            title: "Tiempo de descanso entre series",
            summary: "Descansar de 2 a 3 minutos entre series multiarticulares pesadas maximiza el volumen de carga sostenido y acelera las ganancias en comparación con descansos de 1 minuto.",
            source: "Schoenfeld, B. J., et al. (2016). Journal of Strength and Conditioning Research."
          },
          {
            id: "tip-4",
            category: "Nutrición",
            title: "Consumo diario de proteína",
            summary: "Se aconseja una ingesta de 1.6 a 2.2 gramos de proteína por kilogramo de peso corporal al día, dividida en 3 a 5 tomas para mantener la síntesis proteica en niveles óptimos.",
            source: "Morton, R. W., et al. (2018). British Journal of Sports Medicine."
          }
        ]);
      });
  }, []);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, activeSubTab, isLoading]);

  // Client-side instant emergency responder ensuring 100% functional coach even with full offline state
  const getEmergencyCoachResponse = (query: string): string => {
    const q = query.toLowerCase();
    const name = profile?.name || "Atleta";
    const weight = profile?.weight || 70;
    const unit = profile?.unit || "kg";
    const minProt = Math.round(weight * 1.6);
    const maxProt = Math.round(weight * 2.2);

    if (q.includes("descanso") || q.includes("tiempo")) {
      return `### ⏱️ Descanso Óptimo Entre Series\n\nHola **${name}**. En ejercicios compuestos pesados descansa **2 a 3 minutos** para disipar la fatiga del sistema nervioso central y recargar la fosfocreatina. En ejercicios analíticos o de aislamiento, **60 a 90 segundos** es adecuado.\n\n📚 **Referencia:** Schoenfeld, B. J., et al. (2016). *Journal of Strength and Conditioning Research*.`;
    }
    if (q.includes("proteina") || q.includes("proteína") || q.includes("dieta")) {
      return `### 🥩 Ingesta de Proteína Personalizada\n\nHola **${name}**. Para tu peso de **${weight} ${unit}**, tu consumo recomendado es de **${minProt}g a ${maxProt}g de proteína al día** (1.6 - 2.2 g/kg), repartido en 3 a 4 ingestas.\n\n📚 **Referencia:** Morton, R. W., et al. (2018). *British Journal of Sports Medicine*.`;
    }
    if (q.includes("creatina")) {
      return `### 🧪 Uso y Dosis de Creatina\n\nConsume **3 a 5 gramos de monohidrato de creatina al día** de manera constante. No requiere fase de carga ni interrupción periódica.\n\n📚 **Referencia:** Kreider, R. B., et al. (2017). *JISSN*.`;
    }
    return `### 📈 Principio de Sobrecarga Progresiva\n\nHola **${name}**. Para progresar de forma sostenida, mantén tus series a **RIR 1-2** (1 a 2 repeticiones antes del fallo concéntrico). Aplica la *doble progresión*: cuando alcances el límite superior de tu rango de repeticiones en todas las series, añade de 1 a 2.5 kg en tu próxima sesión.\n\n📚 **Referencia:** Helms, E. R., et al. (2016). *Sports Medicine*.`;
  };

  // Handle sending message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: CoachMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...chatHistory, userMessage];
    setChatHistory(updatedHistory);
    setUserInput("");
    setIsLoading(true);

    try {
      const workoutHistory = sessions.slice(0, 5).map(s => ({
        date: s.date,
        routine: s.routineName,
        exercises: s.logs.map(l => ({
          name: l.exerciseName,
          sets: l.sets.filter(st => st.isCompleted).map(st => `${st.weight}${profile?.unit || 'kg'} x ${st.reps}`)
        }))
      }));

      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          userProfile: profile,
          workoutHistory
        })
      });

      let replyContent = "";

      if (res.ok) {
        const data = await res.json();
        replyContent = data.content;
      } else {
        // Use client emergency generator so user always receives answer
        replyContent = getEmergencyCoachResponse(textToSend);
      }

      if (!replyContent) {
        replyContent = getEmergencyCoachResponse(textToSend);
      }
      
      const assistantMessage: CoachMessage = {
        id: "msg-" + Date.now() + "-reply",
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toISOString()
      };

      setChatHistory([...updatedHistory, assistantMessage]);
    } catch (error) {
      console.warn("Using resilient client-side fitness science engine:", error);
      
      const assistantMessage: CoachMessage = {
        id: "msg-" + Date.now() + "-reply",
        role: "assistant",
        content: getEmergencyCoachResponse(textToSend),
        timestamp: new Date().toISOString()
      };
      
      setChatHistory([...updatedHistory, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history with modal (NO window.confirm)
  const handleConfirmResetChat = () => {
    setChatHistory([
      {
        id: "welcome-msg",
        role: "assistant",
        content: "¡Hola de nuevo! Iniciemos una nueva consulta científica. ¿Qué dudas tienes sobre tu entrenamiento, nutrición o selección de ejercicios?",
        timestamp: new Date().toISOString()
      }
    ]);
    setIsResetConfirmOpen(false);
  };

  // Helper to render formatting in chat content
  const formatCoachText = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("* ") || line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 list-disc pl-1 py-0.5 text-zinc-900 text-xs">
            {renderInlineStyles(line.substring(2))}
          </li>
        );
      }
      if (line.startsWith("#### ")) {
        return (
          <h5 key={i} className="font-bold text-black text-xs mt-2 mb-0.5">
            {renderInlineStyles(line.substring(5))}
          </h5>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4 key={i} className="font-black text-black text-xs mt-3 mb-1">
            {renderInlineStyles(line.substring(4))}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={i} className="font-black text-black text-sm mt-3 mb-1">
            {renderInlineStyles(line.substring(3))}
          </h3>
        );
      }
      if (line.trim() === "") return <div key={i} className="h-1.5" />;
      
      return (
        <p key={i} className="leading-relaxed mb-1 text-xs text-zinc-800">
          {renderInlineStyles(line)}
        </p>
      );
    });
  };

  const renderInlineStyles = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-bold text-black">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={index} className="font-medium text-black">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-150px)] md:h-[calc(100vh-130px)] max-w-full">
      
      {/* Head with Tabs Selector & Reset Action */}
      <div className="flex-shrink-0 flex items-center justify-between border-b border-zinc-200 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center shadow-xs">
            <Brain className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-black">Coach & Tips</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider hidden sm:block">Asesoría Científica 100% Funcional</p>
          </div>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-100 p-1 rounded-xl text-xs font-bold border border-zinc-200">
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'chat'
                  ? "bg-black text-white shadow-xs"
                  : "text-zinc-500 hover:text-black"
              }`}
            >
              Chat IA
            </button>
            <button
              onClick={() => setActiveSubTab('library')}
              className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'library'
                  ? "bg-black text-white shadow-xs"
                  : "text-zinc-500 hover:text-black"
              }`}
            >
              Evidencia
            </button>
          </div>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="p-2 sm:p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-black rounded-xl transition-colors cursor-pointer"
            title="Reiniciar conversación"
            aria-label="Reiniciar chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: INTERACTIVE COACH CHAT */}
      {activeSubTab === 'chat' && (
        <div className="flex-grow flex flex-col min-h-0 space-y-3">
          
          {/* Chat Messages Body */}
          <div className="flex-grow overflow-y-auto pr-1 space-y-3.5 text-xs">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-4 shadow-2xs border ${
                    msg.role === 'user'
                      ? "bg-black border-black text-white rounded-tr-xs font-medium"
                      : "bg-white border-zinc-200 text-black rounded-tl-xs"
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="leading-relaxed text-xs">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {formatCoachText(msg.content)}
                    </div>
                  )}
                  
                  <span className={`block text-[9px] mt-1.5 text-right font-mono ${msg.role === 'user' ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-zinc-200 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-2xs">
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] text-zinc-500 font-semibold pl-1">Consultando evidencia científica...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Questions Chips - Scrollable Horizontally on mobile, wrapped on PC */}
          {!isLoading && (
            <div className="flex-shrink-0 space-y-1.5 pt-1">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block px-1">
                Consultas rápidas:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="whitespace-nowrap sm:whitespace-normal px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[11px] font-semibold text-black transition-colors cursor-pointer shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar - Highly responsive and clean */}
          <div className="flex-shrink-0 flex gap-2 border-t border-zinc-200 pt-3 bg-[#FAFAFA]">
            <input
              type="text"
              placeholder="Pregunta sobre sobrecarga, repeticiones, descansos, nutrición..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(userInput);
              }}
              className="flex-grow px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-zinc-400 font-medium shadow-2xs"
            />
            
            <button
              onClick={() => handleSendMessage(userInput)}
              disabled={!userInput.trim() || isLoading}
              className="px-4 py-3 bg-black hover:bg-zinc-800 text-white rounded-2xl disabled:opacity-30 transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-95 shrink-0"
              aria-label="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: SCIENTIFIC EVIDENCE LIBRARY - Responsive Cards for PC and Mobile */}
      {activeSubTab === 'library' && (
        <div className="flex-grow overflow-y-auto pr-1 space-y-4 pb-20">
          
          <div className="p-4 bg-zinc-100 border border-zinc-200 rounded-2xl text-xs text-zinc-800 leading-relaxed flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-black">Criterio Científico:</strong> Cada pilar proviene de investigaciones publicadas en revistas indexadas (JSCR, JISSN, Medicine & Science in Sports & Exercise).
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-black bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                      {tip.category}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-sm text-black tracking-tight">{tip.title}</h3>
                  
                  <p className="text-xs text-zinc-600 leading-relaxed font-medium mt-1.5">{tip.summary}</p>
                </div>
                
                <div className="pt-3 border-t border-zinc-100 flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400">
                  <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">Fuente: <em className="text-zinc-600 not-italic font-bold">{tip.source}</em></span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* In-app Reset Chat Confirmation Modal (NO window.confirm) */}
      {isResetConfirmOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div 
            className="relative bg-white w-full max-w-sm sm:max-w-md rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-black">
              <div className="w-10 h-10 rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200 shrink-0">
                <RotateCcw className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-base text-black">¿Reiniciar chat?</h3>
                <p className="text-xs text-zinc-500">Se limpiará la conversación actual.</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Comenzarás una consulta limpia con el Coach con tu historial de entrenamiento y datos vigentes.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetChat}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
