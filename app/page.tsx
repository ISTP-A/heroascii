"use client";

import HeroAscii from "@/src/widgets/hero-ascii";
import { useState } from "react";

const COLOR_TABLE = [
  "#000000",
  "#879cff",
  "#9faeff",
  "#b5c0ff",
  "#83bfff",
  "#9ccfff",
  "#b5deff",
  "#74d6d2",
  "#8fe3df",
  "#a9ece8",
  "#85d68f",
  "#9de3a6",
  "#b5ecbc",
  "#f09bc4",
  "#f4afd1",
  "#f8c2de",
  "#ea9bb1",
  "#efafc0",
  "#f4c3cf",
  "#f2b087",
  "#f6c2a0",
  "#fad4b8",
  "#e6b486",
  "#ecc6a1",
  "#f2d8bc",
  "#b39bff",
  "#c3afff",
  "#d2c2ff",
  "#9d9ecf",
  "#b0b1dc",
  "#c3c4e8",
];

export default function Home() {
  const [text, setText] = useState("devlog~");
  const [color, setColor] = useState("#000000");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-5 px-4 py-10">
      <section className="rounded-2xl sm:p-6">
        <HeroAscii content={text} color={color} />
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Text</span>
          <textarea
            className="min-h-24 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm outline-none transition focus:border-zinc-500"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type text here. The ASCII header updates in real time."
          />
        </label>

        <div className="mt-4 flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700">Color Table</span>
          <div className="flex flex-wrap gap-2">
            {COLOR_TABLE.map((swatch) => {
              const selected = swatch === color;
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  className={`h-10 w-10 rounded-md border transition ${selected
                    ? "border-zinc-900 ring-2 ring-zinc-900/20"
                    : "border-zinc-300 hover:border-zinc-500"
                    }`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Select color ${swatch}`}
                  title={swatch}
                />
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
