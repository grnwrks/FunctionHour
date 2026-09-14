import { MIN_HEIGHT, MIN_WIDTH } from "./config";
import type { CanvasElement, TextAlign } from "./types";

export default function PropertiesPanel({
  selectedElement,
  updateElement,
  moveLayer,
  duplicateSelected,
  deleteSelected,
}: {
  selectedElement: CanvasElement | null;
  updateElement: (
    id: string,
    patch:
      | Partial<CanvasElement>
      | ((element: CanvasElement) => Partial<CanvasElement>)
  ) => void;
  moveLayer: (direction: "up" | "down") => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;
}) {
  return (
    <aside className="max-h-[55vh] overflow-y-auto border-t border-white/10 bg-[#1b1b1b] p-4 lg:max-h-none lg:border-l lg:border-t-0">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">
        Properties
      </p>

      {selectedElement ? (
        <div className="mt-4 space-y-5">
          <div>
            <label className="text-xs font-bold text-white/50">Text</label>
            <textarea
              value={selectedElement.text}
              onChange={(event) =>
                updateElement(selectedElement.id, {
                  text: event.target.value,
                })
              }
              className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-bold text-white/50">
              Width
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(event) =>
                  updateElement(selectedElement.id, {
                    width: Math.max(MIN_WIDTH, Number(event.target.value)),
                  })
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white"
              />
            </label>
            <label className="text-xs font-bold text-white/50">
              Height
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(event) =>
                  updateElement(selectedElement.id, {
                    height: Math.max(MIN_HEIGHT, Number(event.target.value)),
                  })
                }
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-white"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-white/50">
              Font size
            </label>
            <input
              type="range"
              min={8}
              max={120}
              value={selectedElement.fontSize}
              onChange={(event) =>
                updateElement(selectedElement.id, {
                  fontSize: Number(event.target.value),
                })
              }
              className="mt-2 w-full"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["left", "center", "right"] as TextAlign[]).map(
              (alignment) => (
                <button
                  key={alignment}
                  type="button"
                  onClick={() =>
                    updateElement(selectedElement.id, { align: alignment })
                  }
                  className={`rounded-lg border px-2 py-2 text-xs font-black ${selectedElement.align === alignment ? "border-violet-400 bg-violet-500/20" : "border-white/10 bg-white/5"}`}
                >
                  {alignment}
                </button>
              )
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                updateElement(selectedElement.id, {
                  fontWeight: selectedElement.fontWeight >= 700 ? 400 : 900,
                })
              }
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black"
            >
              Bold
            </button>
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black">
              Color
              <input
                type="color"
                value={selectedElement.color}
                onChange={(event) =>
                  updateElement(selectedElement.id, {
                    color: event.target.value,
                  })
                }
                className="h-5 w-5"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => moveLayer("up")}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black"
            >
              Move up
            </button>
            <button
              type="button"
              onClick={() => moveLayer("down")}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black"
            >
              Move down
            </button>
            <button
              type="button"
              onClick={duplicateSelected}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() =>
                updateElement(selectedElement.id, {
                  locked: !selectedElement.locked,
                })
              }
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black"
            >
              {selectedElement.locked ? "Unlock" : "Lock"}
            </button>
          </div>

          <button
            type="button"
            onClick={deleteSelected}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300"
          >
            Delete element
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-white/35">
          Select an element on the canvas to edit its properties.
        </p>
      )}
    </aside>
  );
}
