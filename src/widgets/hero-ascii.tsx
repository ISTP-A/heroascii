"use client";

import {
    layout,
    layoutWithLines,
    prepareWithSegments,
    type PreparedTextWithSegments,
} from "@chenglou/pretext";
import { useEffect, useRef } from "react";

const FULL = ".:+-=*#@&~<>{}[]|/\\";
const DOTS = "01";
const SPRING = 0.04;
const DAMP = 0.80;
const BASE_FONT = 100;
const MIN_FONT = 40;

type LayoutLine = { text: string; width: number };
type Particle = {
    x: number;
    y: number;
    tx: number;
    ty: number;
    vx: number;
    vy: number;
    char: string;
    a: number;
    ta: number;
    text: boolean;
    phase: number;
    delay: number;
};

const font = (size: number) => `500 ${size}px "pretendard"`;
const lh = (size: number) => Math.ceil(size * 1.2);
const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

function createPreparedGetter(text: string) {
    const cache = new Map<number, PreparedTextWithSegments>();
    return (size: number) => {
        const hit = cache.get(size);
        if (hit) {
            return hit;
        }

        const prepared = prepareWithSegments(text, font(size), { whiteSpace: "normal" });
        cache.set(size, prepared);
        return prepared;
    };
}

function toLines(content: string, prepared: PreparedTextWithSegments, width: number, lineHeight: number): LayoutLine[] {
    const { lines } = layoutWithLines(prepared, width, lineHeight);
    const typed = lines as LayoutLine[];
    return typed.length ? typed : [{ text: content, width: 0 }];
}

function fitFontSize(
    width: number,
    maxLines: number,
    getPrepared: (size: number) => PreparedTextWithSegments,
): number {
    let lo = MIN_FONT;
    let hi = BASE_FONT;
    let best = MIN_FONT;

    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const result = layout(getPrepared(mid), width, lh(mid));

        if (result.lineCount <= maxLines) {
            best = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    return best;
}

interface HeroAsciiProps {
    content: string;
    color?: string;
}

export default function HeroAscii({ content, color = "#111111" }: HeroAsciiProps) {
    const heroRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const headingRef = useRef<HTMLHeadingElement | null>(null);

    useEffect(() => {
        const hero = heroRef.current;
        const canvas = canvasRef.current;
        const heading = headingRef.current;

        if (!hero || !canvas || !heading) {
            return;
        }

        let cleanup = () => { };
        let token = 0;

        const init = () => {
            token += 1;
            const current = token;
            cleanup();

            hero.style.display = "";
            heading.style.cssText = "";

            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                hero.style.display = "none";
                cleanup = () => { };
                return;
            }

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                cleanup = () => { };
                return;
            }

            heading.classList.add("sr-only");

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const mobile = window.innerWidth <= 600;
            // const chars = mobile ? DOTS : FULL;
            const step = mobile ? 2 : 4;
            const chars = DOTS;
            // const step = 5;

            const width = hero.parentElement?.clientWidth ?? hero.clientWidth;
            const glyphSize = mobile ? 3 : 6;
            const mouseR = mobile ? 50 : 100;
            const mouseF = mobile ? 5 : 3;
            const baseH = mobile ? 58 : 100;

            canvas.style.width = `${width}px`;
            canvas.style.height = `${baseH}px`;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(baseH * dpr);
            ctx.scale(dpr, dpr);

            document.fonts.ready.then(() => {
                if (current !== token) {
                    return;
                }

                const text = content.length ? content : " ";
                const getPrepared = createPreparedGetter(text);
                const maxLines = mobile ? 4 : 3;

                let size = BASE_FONT;
                try {
                    size = fitFontSize(width, maxLines, getPrepared);
                } catch {
                    size = BASE_FONT;
                }

                const lineHeight = lh(size);
                const lines = toLines(text, getPrepared(size), width, lineHeight);
                const textH = Math.max(lineHeight, lineHeight * lines.length);
                const height = Math.max(baseH, Math.ceil(textH * 1.15));

                canvas.style.height = `${height}px`;
                canvas.width = Math.floor(width * dpr);
                canvas.height = Math.floor(height * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                const off = document.createElement("canvas");
                off.width = width;
                off.height = height;
                const oc = off.getContext("2d");

                if (!oc) return;

                oc.font = font(size);
                oc.fillStyle = "#fff";
                oc.textBaseline = "middle";

                const y0 = (height - textH) / 2 + lineHeight / 2;
                lines.forEach((line, i) => {
                    oc.fillText(line.text || " ", 0, y0 + i * lineHeight);
                });

                const image = oc.getImageData(0, 0, width, height);
                const particles: Particle[] = [];

                for (let y = 0; y < height; y += step) {
                    for (let x = 0; x < width; x += step) {
                        if (image.data[(y * width + x) * 4 + 3] <= 100) continue;

                        particles.push({
                            x: x + (Math.random() - 0.5) * width * 0.5,
                            y: y + (Math.random() - 0.5) * height * 2.5,
                            tx: x,
                            ty: y,
                            vx: 0,
                            vy: 0,
                            char: pick(chars),
                            a: 0,
                            ta: mobile ? 0.95 + Math.random() * 0.05 : 0.85 + Math.random() * 0.15,
                            text: true,
                            phase: Math.random() * Math.PI * 2,
                            delay: (x / width) * 1.2,
                        });
                    }
                }

                const ambient = Math.max(30, Math.floor(particles.length * 0.15));
                for (let i = 0; i < ambient; i += 1) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    particles.push({
                        x,
                        y,
                        tx: x,
                        ty: y,
                        vx: (Math.random() - 0.5) * 0.15,
                        vy: (Math.random() - 0.5) * 0.15,
                        char: pick(chars),
                        a: 0,
                        ta: 0.04 + Math.random() * 0.07,
                        text: false,
                        phase: Math.random() * Math.PI * 2,
                        delay: Math.random() * 0.6,
                    });
                }

                let mx = -9999;
                let my = -9999;
                const resetPointer = () => {
                    mx = -9999;
                    my = -9999;
                };
                const setPointer = (x: number, y: number) => {
                    const rect = canvas.getBoundingClientRect();
                    mx = x - rect.left;
                    my = y - rect.top;
                };

                const onMouse = (event: MouseEvent) => setPointer(event.clientX, event.clientY);
                const onTouch = (event: TouchEvent) => {
                    const touch = event.touches[0];
                    if (touch) {
                        setPointer(touch.clientX, touch.clientY);
                    }
                };

                canvas.addEventListener("mousemove", onMouse, { passive: true });
                canvas.addEventListener("mouseleave", resetPointer);
                canvas.addEventListener("touchstart", onTouch, { passive: true });
                canvas.addEventListener("touchmove", onTouch, { passive: true });
                canvas.addEventListener("touchend", resetPointer);

                const accent = color || getComputedStyle(heading).color || "#c44b28";
                const start = performance.now();
                let raf = 0;

                const frame = (now: number) => {
                    const elapsed = (now - start) / 1000;
                    ctx.clearRect(0, 0, width, height);
                    ctx.font = `500 ${glyphSize}px "pretendard"`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = accent;

                    for (const p of particles) {
                        const t = Math.max(0, elapsed - p.delay);
                        if (p.text && t < 0.01) {
                            ctx.globalAlpha = 0.02;
                            ctx.fillText(p.char, p.x, p.y);
                            continue;
                        }

                        p.vx += (p.tx - p.x) * SPRING;
                        p.vy += (p.ty - p.y) * SPRING;

                        const dx = p.x - mx;
                        const dy = p.y - my;
                        const dist = Math.hypot(dx, dy);
                        if (dist > 0 && dist < mouseR) {
                            const force = (1 - dist / mouseR) ** 2 * mouseF;
                            p.vx += (dx / dist) * force;
                            p.vy += (dy / dist) * force;
                        }

                        p.vx *= DAMP;
                        p.vy *= DAMP;
                        p.x += p.vx;
                        p.y += p.vy;
                        p.a += (p.ta - p.a) * 0.04;

                        if (p.text) {
                            p.a = p.ta + Math.sin(elapsed * 0.8 + p.phase) * 0.08;
                            if (t < 0.8 || Math.random() < 0.0008) {
                                p.char = pick(chars);
                            }
                        } else {
                            p.tx += (Math.random() - 0.5) * 0.2;
                            p.ty += (Math.random() - 0.5) * 0.2;
                            if (p.x < -20) p.x = p.tx = width + 10;
                            if (p.x > width + 20) p.x = p.tx = -10;
                            if (p.y < -20) p.y = p.ty = height + 10;
                            if (p.y > height + 20) p.y = p.ty = -10;
                            if (Math.random() < 0.003) p.char = pick(chars);
                        }

                        ctx.globalAlpha = Math.max(0, p.a);
                        ctx.fillText(p.char, p.x, p.y);
                    }

                    ctx.globalAlpha = 1;
                    raf = requestAnimationFrame(frame);
                };

                raf = requestAnimationFrame(frame);

                cleanup = () => {
                    cancelAnimationFrame(raf);
                    canvas.removeEventListener("mousemove", onMouse);
                    canvas.removeEventListener("mouseleave", resetPointer);
                    canvas.removeEventListener("touchstart", onTouch);
                    canvas.removeEventListener("touchmove", onTouch);
                    canvas.removeEventListener("touchend", resetPointer);
                };
            });
        };

        init();
        window.addEventListener("resize", init);

        return () => {
            cleanup();
            window.removeEventListener("resize", init);
        };
    }, [content, color]);

    return (
        <>
            <div ref={heroRef} className="mb-4 leading-none" aria-hidden="true">
                <canvas ref={canvasRef} className="block max-w-full" />
            </div>

            <h1
                ref={headingRef}
                data-intro-heading
                className="mb-3 whitespace-pre-wrap break-words font-mono text-[clamp(2rem,6vw,4rem)] leading-none font-light italic"
                style={{ color }}
            >
                {content}
            </h1>
        </>
    );
}
