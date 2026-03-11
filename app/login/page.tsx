"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useFormState, useFormStatus } from "react-dom";
import { signIn } from "@/actions/auth";
import { FiMail, FiLock, FiLoader } from "react-icons/fi";

/**
 * Ondas animadas em tons de verde (padrão BMQ) para o fundo da tela de login.
 */
function useWaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    class Wave {
      amplitude: number;
      frequency: number;
      phase: number;
      speed: number;
      color: string;
      strokeWidth: number;

      constructor(
        amplitude: number,
        frequency: number,
        phase: number,
        speed: number,
        color: string,
        strokeWidth: number
      ) {
        this.amplitude = amplitude;
        this.frequency = frequency;
        this.phase = phase;
        this.speed = speed;
        this.color = color;
        this.strokeWidth = strokeWidth;
      }

      draw(
        ctx: CanvasRenderingContext2D,
        time: number,
        width: number,
        height: number
      ) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.strokeWidth;

        for (let x = 0; x <= width; x += 5) {
          const y =
            height / 2 +
            Math.sin(x * this.frequency + time * this.speed + this.phase) *
              this.amplitude *
              Math.sin(x * 0.0005);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }

    // Cores em tons de verde do sistema (BMQ) – fundo branco
    const waves = [
      new Wave(180, 0.003, 0, 0.015, "rgba(94, 127, 89, 0.25)", 1.5),
      new Wave(140, 0.004, 2, 0.02, "rgba(140, 174, 134, 0.2)", 1),
      new Wave(220, 0.002, 4, -0.01, "rgba(163, 198, 156, 0.15)", 2),
      new Wave(100, 0.005, 1, 0.025, "rgba(94, 127, 89, 0.08)", 1),
    ];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waves.forEach((wave) =>
        wave.draw(ctx, time, canvas.width, canvas.height)
      );
      time += 1;
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return canvasRef;
}

/**
 * Botão de submit do login; usa useFormStatus para mostrar estado "Entrando..." durante o envio.
 */
function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="login-btn-enter w-full py-3.5 mt-2 rounded-lg font-semibold text-sm transition-all bg-[#99C590] text-[#386A32] hover:bg-[#8ab882] shadow-[0_4px_6px_rgba(56,106,50,0.2)] hover:shadow-[0_6px_10px_rgba(56,106,50,0.25)] disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:bg-[#99C590] flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <FiLoader size={18} className="animate-spin flex-shrink-0" aria-hidden />
          <span>Entrando...</span>
        </>
      ) : (
        "Entrar"
      )}
    </button>
  );
}

export default function LoginPage() {
  const canvasRef = useWaveCanvas();
  const [state, formAction] = useFormState(signIn, {});

  return (
    <main className="relative min-h-screen bg-bmq-bg text-bmq-dark flex items-center justify-center overflow-hidden font-sans">
      <style>{`
        .login-breathing-box {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: login-breathe 6s ease-in-out infinite;
        }
        @keyframes login-breathe {
          0%, 100% {
            box-shadow: 0 0 20px rgba(94, 127, 89, 0.08);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 40px rgba(94, 127, 89, 0.18);
            transform: scale(1.005);
          }
        }
        .login-input-glow:focus {
          box-shadow: 0 0 0 2px rgba(163, 198, 156, 0.4);
        }
        .login-btn-enter {
          opacity: 0;
          animation: login-item-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }
        @keyframes login-item-enter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        aria-hidden
      />

      <div className="login-breathing-box relative z-10 flex flex-col md:flex-row w-full max-w-4xl mx-4 border border-bmq-mid/40 rounded-2xl overflow-hidden shadow-card">
        {/* Painel esquerdo (logo) */}
        <div className="hidden md:flex flex-1 p-10 flex-col items-center justify-center border-r border-bmq-border bg-bmq-pageBg/30">
          <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center mb-6">
            <Image
              src="/logo_bmq_transp.png"
              alt="Bem Me Quer"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 0px, 280px"
            />
          </div>
          <h2 className="text-2xl font-semibold text-bmq-dark mb-3">
            Bem Me Quer
          </h2>
          <p className="text-bmq-mid-dark text-sm text-center leading-relaxed px-4">
            Gerenciamento de Estoque e Financeiro
          </p>
        </div>

        {/* Painel direito (formulário) */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white/80">
          <div className="inline-block px-4 py-1.5 bg-bmq-accent/15 text-bmq-dark rounded-full text-xs font-semibold mb-8 self-start border border-bmq-accent/30">
            Entrar
          </div>

          <h3 className="text-2xl font-semibold text-bmq-dark mb-6">
            Acessar sua conta
          </h3>

          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-bmq-dark mb-2"
              >
                E-mail
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bmq-mid-dark">
                  <FiMail size={18} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-3 py-3 bg-bmq-bg border border-bmq-border rounded-lg text-bmq-dark placeholder:text-bmq-placeholder focus:outline-none focus:border-bmq-accent login-input-glow transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-bmq-dark mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bmq-mid-dark">
                  <FiLock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-3 bg-bmq-bg border border-bmq-border rounded-lg text-bmq-dark placeholder:text-bmq-placeholder focus:outline-none focus:border-bmq-accent login-input-glow transition-all"
                />
              </div>
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {state.error}
              </p>
            )}

            <LoginButton />
          </form>

        </div>
      </div>
    </main>
  );
}
