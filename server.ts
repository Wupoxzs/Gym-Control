import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI coach will run in fallback mode.");
}

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// API: Default scientifically backed tips (static, fallback)
app.get("/api/coach/default-tips", (req, res) => {
  res.json([
    {
      id: "tip-1",
      category: "Hipertrofia",
      title: "Rango de repeticiones óptimo",
      summary: "La hipertrofia muscular ocurre de forma similar en un amplio rango de repeticiones (de 6 a 30 por serie), siempre y cuando las series se lleven cerca del fallo muscular (RIR 1-3).",
      source: "Schoenfeld, B. J., et al. (2017). Journal of Strength and Conditioning Research."
    },
    {
      id: "tip-2",
      category: "Sobrecarga Progresiva",
      title: "La regla de la sobrecarga",
      summary: "Para seguir ganando masa muscular o fuerza, debes aumentar progresivamente el estímulo. Esto puede ser mediante el peso (intensidad), el número de repeticiones por serie, o el número total de series (volumen).",
      source: "Kraemer, W. J., & Ratamess, N. A. (2004). Medicine & Science in Sports & Exercise."
    },
    {
      id: "tip-3",
      category: "Recuperación",
      title: "Tiempo de descanso entre series",
      summary: "Descansar de 2 a 3 minutos entre series multiarticulares (como sentadillas o press de banca) produce mayores incrementos de fuerza e hipertrofia que descansar solo 1 minuto, al permitir mantener una mayor intensidad relativa.",
      source: "Schoenfeld, B. J., et al. (2016). Journal of Strength and Conditioning Research."
    },
    {
      id: "tip-4",
      category: "Nutrición",
      title: "Consumo diario de proteína",
      summary: "Para maximizar la síntesis proteica muscular y la hipertrofia, se recomienda consumir entre 1.6 y 2.2 gramos de proteína por kilogramo de peso corporal al día, distribuidos en 3-4 comidas.",
      source: "Morton, R. W., et al. (2018). British Journal of Sports Medicine."
    }
  ]);
});

// Helper: Intelligent scientifically backed fitness AI generator when Gemini is offline or without key
function generateScientificFitnessResponse(
  question: string,
  userProfile?: { name?: string; weight?: number; height?: number; unit?: string },
  workoutHistory?: any[]
): string {
  const q = question.toLowerCase();
  const userName = userProfile?.name || "Atleta";
  const unit = userProfile?.unit || "kg";
  const weight = userProfile?.weight || 70;

  // Personalized protein calculation
  const minProtein = Math.round(weight * 1.6);
  const maxProtein = Math.round(weight * 2.2);

  // Check if user has recent workout data
  let historyContext = "";
  if (workoutHistory && workoutHistory.length > 0) {
    const lastSession = workoutHistory[0];
    const totalExercises = lastSession.exercises?.length || 0;
    historyContext = ` Analizando tu sesión reciente de **${lastSession.routine || 'entrenamiento'}** con ${totalExercises} ejercicios registrados:`;
  }

  if (q.includes("descanso") || q.includes("descansar") || q.includes("tiempo entre")) {
    return `### ⏱️ Descanso Óptimo Entre Series

Hola **${userName}**. Basado en la evidencia de la literatura deportiva contemporánea:

- **Ejercicios Multiarticulares Pesados** (Sentadillas, Press de Banca, Peso Muerto, Dominadas):
  * **2 a 3 minutos** de descanso. Esto permite restaurar los depósitos de fosfocreatina (CP) intramuscular y mitigar la fatiga del sistema nervioso central, manteniendo mayor volumen de carga total en series posteriores.
- **Ejercicios de Aislamiento** (Elevaciones laterales, Curl de bíceps, Extensiones de tríceps):
  * **60 a 90 segundos** es suficiente, dado que el impacto sistémico y cardiorrespiratorio es menor.

**Recomendación práctica:** No te apresures; recortar el descanso de 3 minutos a 1 minuto reduce el volumen efectivo hasta un 40% en ejercicios compuestos.

📚 **Evidencia científica:**
* Schoenfeld, B. J., et al. (2016). *Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men*. Journal of Strength and Conditioning Research, 30(7), 1805-1812.`;
  }

  if (q.includes("sobrecarga") || q.includes("progresar") || q.includes("progreso") || q.includes("estancad") || q.includes("peso")) {
    return `### 📈 Principio de Sobrecarga Progresiva

Hola **${userName}**. Para obligar a tus fibras musculares a adaptarse y crecer, debes aplicar un estímulo mecánico superior al de tus sesiones pasadas.${historyContext}

#### Métodos Científicos para Aplicar Sobrecarga:
1. **Doble Progresión (El método más eficaz):**
   - Elige un rango de repeticiones (ej. 8 a 12 reps).
   - Mantén el peso fijo hasta que logres 12 reps en **todas** las series programadas con buena técnica.
   - En la siguiente sesión, incrementa la carga en un **2.5% a 5%** y vuelve a empezar en 8 reps.
2. **Incremento de Volumen Técnico:**
   - Si no puedes subir peso, intenta realizar 1 o 2 repeticiones adicionales con el mismo peso y un control excéntrico de 2-3 segundos.
3. **Control del RIR (Repeticiones en Reserva):**
   - Tus series efectivas deben situarse consistentemente entre **RIR 1 y RIR 2** (a 1 o 2 repeticiones antes del fallo concéntrico).

📚 **Evidencia científica:**
* Kraemer, W. J., & Ratamess, N. A. (2004). *Fundamentals of resistance training: progression and exercise prescription*. Medicine & Science in Sports & Exercise, 36(4), 674-688.
* Helms, E. R., et al. (2014). *The Muscle and Strength Pyramid: Training*.`;
  }

  if (q.includes("proteina") || q.includes("proteína") || q.includes("dieta") || q.includes("nutricion") || q.includes("nutrición") || q.includes("comer")) {
    return `### 🥩 Ingesta Óptima de Proteína y Nutrición

Hola **${userName}**. Para optimizar la síntesis proteica muscular (MPS):

- **Meta Diaria Personalizada:**
  * Para tu peso actual (${weight} ${unit}), tu rango óptimo diario se sitúa entre **${minProtein}g y ${maxProtein}g de proteína al día** (1.6 a 2.2 g por kg de peso corporal).
- **Distribución en el Día:**
  * Distribuye tu ingesta en **3 a 5 comidas** a lo largo del día, consumiendo entre **0.4g y 0.55g/kg por comida** (aprox. 30g-45g por toma) para maximizar los picos de leucina en sangre.
- **Superávit / Déficit:**
  * Si buscas ganar masa muscular limpia: un superávit calórico moderado de **200 a 300 kcal** sobre tu mantenimiento evita la ganancia excesiva de tejido adiposo.

📚 **Evidencia científica:**
* Morton, R. W., et al. (2018). *A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults*. British Journal of Sports Medicine, 52(6), 376-384.
* Jäger, R., et al. (2017). *International Society of Sports Nutrition Position Stand: protein and exercise*. JISSN.`;
  }

  if (q.includes("fallo") || q.includes("fallar") || q.includes("rir") || q.includes("rpe") || q.includes("intensidad")) {
    return `### 🎯 Entrenamiento al Fallo Muscular vs. RIR (Reps en Reserva)

Hola **${userName}**. Una de las preguntas más debatidas en la biomecánica deportiva:

- **¿Es necesario llegar al fallo concéntrico absoluto?**
  * **No.** Los meta-análisis demuestran que entrenar a **RIR 1-3** (detener la serie cuando te quedan 1 a 3 repeticiones antes de no poder completar la fase concéntrica) genera prácticamente la misma hipertrofia muscular que llegar al fallo total.
- **Costo de Fatiga del Fallo:**
  * Llegar al fallo absoluto en cada serie dispara la fatiga neuromuscular, aumenta el daño muscular excesivo y reduce la capacidad de trabajo en las series siguientes de la sesión.
- **Recomendación Estratégica:**
  * En ejercicios multiarticulares (Sentadilla, Peso Muerto): quédate a **RIR 1-2** por seguridad espinal.
  * En la **última serie** de ejercicios de aislamiento (Curl, Extensiones, Pájaros): puedes llevarla a **RIR 0 o fallo técnico controlado**.

📚 **Evidencia científica:**
* Vieira, C. A., et al. (2021). *Effects of Resistance Training to Muscle Failure Versus Not to Failure on Muscle Strength and Hypertrophy: A Systematic Review and Meta-Analysis*. Journal of Strength and Conditioning Research.
* Refalo, M. C., et al. (2022). *Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy*. Sports Medicine.`;
  }

  if (q.includes("series") || q.includes("volumen") || q.includes("cuantas series") || q.includes("frecuencia")) {
    return `### 📊 Volumen y Frecuencia Semanal por Grupo Muscular

Hola **${userName}**. El volumen de series efectivas es el principal inductor de la hipertrofia muscular:

- **Volumen Semanal Recomendado:**
  * **Principiante / Intermedio:** 10 a 14 series semanales efectivas por grupo muscular.
  * **Avanzado:** 14 a 20 series semanales (más allá de 20-22 series suele entrarse en volumen "basura" o no recuperable).
- **Frecuencia Óptima:**
  * **Frecuencia 2 (F2):** Entrenar cada grupo muscular 2 veces por semana genera mayores adaptaciones que condensar todo el volumen en un único día (F1), debido a que la síntesis proteica post-entrenamiento decae a las 36-48 horas.
- **Distribución por Sesión:**
  * Lo ideal es no superar las **6 a 9 series efectivas** por grupo muscular en una sola sesión para mantener una alta calidad de reclutamiento de unidades motoras.

📚 **Evidencia científica:**
* Baz-Valle, E., et al. (2022). *A Systematic Review and Meta-Analysis of the Effects of Resistance Training Volume on Muscle Hypertrophy*. Journal of Human Kinetics.
* Schoenfeld, B. J., et al. (2016). *Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis*. Sports Medicine.`;
  }

  if (q.includes("creatina") || q.includes("suplemento") || q.includes("suplementos") || q.includes("cafeina") || q.includes("cafeína")) {
    return `### 🧪 Suplementación con Mayor Respaldo Científico

Hola **${userName}**. Menos del 5% de los suplementos en el mercado cuentan con evidencia nivel A (incontestable):

1. **Monohidrato de Creatina:**
   * **Dosis:** 3 a 5 gramos diarios todos los días (incluso días de descanso).
   * **Efecto:** Incrementa los niveles de fosfocreatina muscular entre un 15% y 40%, mejorando la fuerza máxima, la recuperación entre series y la retención intracelular de agua en el miocito.
   * *No es necesaria fase de carga.*
2. **Cafeína Anhidra:**
   * **Dosis:** 3 a 6 mg/kg de peso corporal consumida 45-60 min antes del entrenamiento.
   * **Efecto:** Aumenta la activación del sistema nervioso central y reduce la percepción del esfuerzo (RPE).
3. **Proteína de Suero (Whey):**
   * Es una herramienta de conveniencia para alcanzar tu meta diaria de ${minProtein}-${maxProtein}g.

📚 **Evidencia científica:**
* Kreider, R. B., et al. (2017). *International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine*. JISSN, 14(1), 18.
* Grgic, J., et al. (2019). *Wake up and smell the coffee: caffeine supplementation and resistance exercise performance*. Sports Medicine.`;
  }

  // General comprehensive scientific response
  return `### 💡 Guía Científica para tu Entrenamiento

Hola **${userName}**. Analizando tu consulta y tus objetivos de rendimiento físico:

1. **Intensidad y Proximidad al Fallo:**
   Asegúrate de que cada una de tus series de trabajo esté a una proximidad de **RIR 1 a 2** (1 o 2 repeticiones en reserva antes del fallo técnico). Si terminas una serie sintiendo que podías haber hecho 5 repeticiones más, esa serie no estimula la tensión mecánica necesaria para la hipertrofia.

2. **Rango de Repeticiones y Selección de Ejercicios:**
   La hipertrofia se estimula tanto a 6-8 reps como a 10-15 reps. La clave radica en seleccionar ejercicios estables donde sientas un buen estímulo muscular sin dolor articular.

3. **Recuperación y Adaptación:**
   Los músculos crecen durante el descanso y la recuperación. Procura dormir de **7 a 9 horas de calidad** y mantener una hidratación de al menos 35-40 ml por kg de peso corporal al día.

${historyContext ? `\nRecuerda revisar tus registros de historial en la app para verificar si en tu última sesión aumentaste repeticiones o peso en tus series.` : ''}

📚 **Referencias de respaldo:**
* Schoenfeld, B. J. (2020). *Science and Development of Muscle Hypertrophy* (2nd ed.). Human Kinetics.
* Helms, E. R., Cronin, J., Storey, A., & Zourdos, M. C. (2016). *Application of the Repetitions in Reserve-Based Rating of Perceived Exertion Scale*. Sports Medicine.`;
}

// API: IA Coach response endpoint
app.post("/api/coach/chat", async (req, res) => {
  const { messages, userProfile, workoutHistory } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages is required and must be an array." });
  }

  const latestUserMessage = messages[messages.length - 1]?.content || "";

  // If Gemini client is active, try using Gemini models with automatic fallback
  if (ai) {
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    
    // Prepare contents: Gemini multi-turn contents MUST start with role: 'user'
    const validTurnMessages = [];
    let foundFirstUser = false;

    for (const m of messages) {
      if (!foundFirstUser && m.role !== 'user') {
        // Skip any initial assistant greetings before the first user prompt
        continue;
      }
      foundFirstUser = true;
      validTurnMessages.push(m);
    }

    // Fallback if no user message found in conversation
    if (validTurnMessages.length === 0 && latestUserMessage) {
      validTurnMessages.push({ role: 'user', content: latestUserMessage });
    }

    // Ensure alternating user/model roles
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const m of validTurnMessages) {
      const role: 'user' | 'model' = m.role === 'user' ? 'user' : 'model';
      const text = typeof m.content === 'string' ? m.content.trim() : "";
      if (!text) continue;

      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n\n${text}`;
      } else {
        contents.push({
          role,
          parts: [{ text }]
        });
      }
    }

    const systemInstruction = `Eres un Coach de Fitness y Gimnasio de élite, sumamente profesional, motivador y con RIGOR CIENTÍFICO comprobado (estilo Schoenfeld, Helms, Henselmans, ACSM, ISSN).
Tus respuestas deben estar redactadas en un formato pulcro, con subtítulos en negrita, viñetas y referencias científicas reales.

Perfil del usuario actual:
- Nombre: ${userProfile?.name || 'Usuario'}
- Unidad de peso: ${userProfile?.unit || 'kg'}
- Peso corporal: ${userProfile?.weight ? `${userProfile.weight} ${userProfile.unit}` : 'No especificado'}

Historial de entrenamiento reciente del usuario:
${JSON.stringify(workoutHistory || [], null, 2)}

Directrices:
1. Responde siempre en español con tono profesional, claro y fundamentado.
2. Explica el porqué biológico, neuromuscular o mecánico.
3. Cita siempre al menos 1 o 2 estudios científicos reales (autor, año, revista) al final de tu respuesta.
4. Si la pregunta está relacionada con sus pesos, repeticiones o rutinas, utiliza los datos de su historial.`;

    if (contents.length > 0) {
      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });

          const replyText = response.text?.trim();
          if (replyText) {
            return res.json({
              role: "assistant",
              content: replyText,
            });
          }
        } catch (modelError: any) {
          const errorMsg = modelError?.message || String(modelError);
          // If model is busy (503/429/UNAVAILABLE), try the next candidate model
          if (errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand") || errorMsg.includes("429")) {
            console.log(`Model ${modelName} unavailable/busy. Trying next candidate model...`);
            continue;
          }
          console.warn(`Gemini generation error with ${modelName}:`, errorMsg);
        }
      }
    }
  }

  // Robust fallback: Always return high quality scientific coach response
  const fallbackResponse = generateScientificFitnessResponse(
    latestUserMessage,
    userProfile,
    workoutHistory
  );

  return res.json({
    role: "assistant",
    content: fallbackResponse,
  });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
