import React, { useEffect, useRef, useState } from 'react';

const callGemini = async (prompt: string, isJson = false) => {
  const apiKey = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload: {
    contents: { parts: { text: string }[] }[];
    generationConfig?: { responseMimeType: string };
  } = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (isJson) {
    payload.generationConfig = {
      responseMimeType: "application/json"
    };
  }

  let retries = 0;
  const maxRetries = 5;
  const delays = [1000, 2000, 4000, 8000, 16000];

  while (retries <= maxRetries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return isJson ? JSON.parse(text) : text;
    } catch (error) {
      if (retries === maxRetries) throw error;
      await new Promise(res => setTimeout(res, delays[retries]));
      retries++;
    }
  }
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  // Novos estados para a integração da IA
  const [isGeneratingPassword, setIsGeneratingPassword] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('Conecte-se com ferramentas e funcionalidades poderosas desenhadas para fluxos de trabalho modernos.');
  const [isGeneratingWelcome, setIsGeneratingWelcome] = useState(false);
  const [lastNameChecked, setLastNameChecked] = useState('');

  // Efeito para gerir o Canvas e a animação das ondas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number | undefined;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Wave {
      amplitude: number;
      frequency: number;
      phase: number;
      speed: number;
      color: string;
      strokeWidth: number;

      constructor(amplitude: number, frequency: number, phase: number, speed: number, color: string, strokeWidth: number) {
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.phase = phase;
        this.speed = speed;
        this.color = color;
        this.strokeWidth = strokeWidth;
      }

      draw(ctx: CanvasRenderingContext2D, time: number, width: number, height: number) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;
        
        for (let x = 0; x <= width; x += 5) {
          // Equação para criar o efeito de ondas que se entrelaçam
          const y = height / 2 + Math.sin(x * this.frequency + time * this.speed + this.phase) * this.amplitude * Math.sin(x * 0.0005);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // Configuração das diferentes linhas (cores, velocidade, amplitude)
    const waves = [
      new Wave(180, 0.003, 0, 0.015, 'rgba(138, 43, 226, 0.4)', 1.5),
      new Wave(140, 0.004, 2, 0.02, 'rgba(99, 102, 241, 0.3)', 1),
      new Wave(220, 0.002, 4, -0.01, 'rgba(168, 85, 247, 0.2)', 2),
      new Wave(100, 0.005, 1, 0.025, 'rgba(255, 255, 255, 0.05)', 1)
    ];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waves.forEach(wave => wave.draw(ctx, time, canvas.width, canvas.height));
      time += 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Limpeza para evitar fugas de memória (memory leaks)
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId != null) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNameBlur = async () => {
    if (formData.name.trim().length > 2 && formData.name !== lastNameChecked) {
      setLastNameChecked(formData.name);
      setIsGeneratingWelcome(true);
      const prompt = `Escreva uma mensagem de boas-vindas tecnológica e entusiasmante (máximo 2 frases) em português de Portugal para uma plataforma SaaS. O utilizador chama-se "${formData.name}". Retorne apenas a mensagem final de boas-vindas, sem aspas ou introduções.`;
      try {
        const message = await callGemini(prompt, false);
        setWelcomeMessage(message);
      } catch (error) {
        console.error("Erro ao gerar boas-vindas", error);
      } finally {
        setIsGeneratingWelcome(false);
      }
    }
  };

  const handleGeneratePassword = async () => {
    setIsGeneratingPassword(true);
    const prompt = `Gere uma senha forte e segura de 12 caracteres (incluindo letras, números e símbolos). Em seguida, crie uma frase mnemónica muito curta e engraçada em português de Portugal para ajudar o utilizador a memorizá-la. Retorne estritamente um JSON neste formato: { "password": "a_senha_gerada", "mnemonic": "a_frase_engracada" }`;
    try {
      const data = await callGemini(prompt, true);
      setFormData(prev => ({ ...prev, password: data.password }));
      setMnemonic(data.mnemonic);
    } catch (error) {
      console.error("Erro ao gerar senha", error);
    } finally {
      setIsGeneratingPassword(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Dados do formulário submetidos:', formData);
    // Aqui iria a lógica de autenticação (ex: Supabase, Firebase, etc.)
  };

  return (
    <div className="relative min-h-screen bg-[#030308] text-white flex items-center justify-center overflow-hidden font-sans">
      {/* Estilos customizados injetados para animações complexas e glassmorphism */}
      <style>{`
        .breathing-box {
          background: rgba(13, 12, 22, 0.65);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: breathe 6s ease-in-out infinite;
        }
        
        @keyframes breathe {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.05);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 60px rgba(139, 92, 246, 0.25);
            transform: scale(1.005);
          }
        }

        .custom-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }

        .input-glow:focus {
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.2);
        }
      `}</style>

      {/* Fundo animado com Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Contentor Principal */}
      <div className="breathing-box relative z-10 flex flex-col md:flex-row w-full max-w-4xl mx-4 border border-purple-500/20 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Painel Esquerdo (Ilustração visual) */}
        <div className="hidden md:flex flex-1 p-10 flex-col items-center justify-center border-r border-white/5">
          <div className="w-full h-64 border border-purple-500/30 rounded-xl mb-8 relative flex items-center justify-center custom-grid overflow-hidden">
            {/* Brilho radial de fundo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)]"></div>
            
            {/* Elementos decorativos nos cantos */}
            <div className="absolute top-4 left-4 w-10 h-10 bg-indigo-500/10 rounded-lg border border-indigo-500/20"></div>
            <div className="absolute top-4 right-4 w-10 h-10 bg-indigo-500/10 rounded-lg border border-indigo-500/20"></div>
            <div className="absolute bottom-4 left-4 w-10 h-10 bg-indigo-500/10 rounded-lg border border-indigo-500/20"></div>
            <div className="absolute bottom-4 right-4 w-10 h-10 bg-indigo-500/10 rounded-lg border border-indigo-500/20"></div>
            
            {/* Ícone Central */}
            <div className="relative z-10 w-14 h-14 bg-white/5 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-2xl font-bold shadow-[0_0_30px_rgba(139,92,246,0.5)]">
              S
            </div>

            {/* Linhas conectivas (decorativas) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <line x1="30%" y1="30%" x2="45%" y2="45%" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeDasharray="4 4"/>
              <line x1="70%" y1="30%" x2="55%" y2="45%" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeDasharray="4 4"/>
              <line x1="30%" y1="70%" x2="45%" y2="55%" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeDasharray="4 4"/>
              <line x1="70%" y1="70%" x2="55%" y2="55%" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeDasharray="4 4"/>
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold mb-3">Junte-se à nossa plataforma</h2>
          <div className="h-24 flex items-start justify-center">
            {isGeneratingWelcome ? (
              <p className="text-purple-400 text-sm text-center animate-pulse px-4">
                A preparar uma experiência personalizada...
              </p>
            ) : (
              <p className="text-gray-400 text-sm text-center leading-relaxed px-4 transition-all duration-500">
                {welcomeMessage}
              </p>
            )}
          </div>
        </div>

        {/* Painel Direito (Formulário) */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="inline-block px-4 py-1.5 bg-purple-500/15 text-purple-300 rounded-full text-xs font-semibold mb-8 self-start border border-purple-500/20">
            Começar
          </div>
          
          <h3 className="text-2xl font-semibold mb-6">Criar Conta</h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo
              </label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleNameBlur}
                placeholder="Introduza o seu nome" 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 input-glow transition-all"
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                E-mail
              </label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@exemplo.com" 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 input-glow transition-all"
                required 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Palavra-passe
                </label>
                <button 
                  type="button" 
                  onClick={handleGeneratePassword}
                  disabled={isGeneratingPassword}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 disabled:opacity-50 font-medium"
                >
                  {isGeneratingPassword ? 'A processar...' : '✨ Gerar Segura'}
                </button>
              </div>
              <input 
                type={mnemonic ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Crie uma palavra-passe" 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 input-glow transition-all"
                required 
              />
              {mnemonic && (
                <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-200 leading-relaxed shadow-inner">
                  <span className="font-semibold block mb-1">💡 Dica para memorizar:</span>
                  {mnemonic}
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 rounded-lg text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]"
            >
              Registar
            </button>
          </form>
          
          <div className="text-center mt-8 text-sm text-gray-400">
            Já tem uma conta? <a href="#" className="text-purple-400 hover:text-white font-medium transition-colors">Iniciar sessão</a>
          </div>
        </div>
      </div>
    </div>
  );
}