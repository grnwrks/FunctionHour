import type { MutableRefObject } from "react";
import { CANVAS_WIDTH, formats, resizeHandles } from "./config";
import { resizeHandleClass } from "./editor-utils";
import type {
  CanvasElement,
  Guide,
  ResizeHandle,
} from "./types";

type UpdateElement = (
  id: string,
  patch:
    | Partial<CanvasElement>
    | ((element: CanvasElement) => Partial<CanvasElement>),
  recordHistory?: boolean
) => void;

export default function CanvasStage({
  canvasRef,
  format,
  onFormatChange,
  zoom,
  onZoomChange,
  canvasHeight,
  canvasScale,
  imagePreview,
  overlayStrength,
  elements,
  selectedElementId,
  editingElementId,
  guides,
  onPointerMove,
  onInteractionFinish,
  onClearSelection,
  onBeginDrag,
  onBeginResize,
  onStartInlineEditing,
  onFinishInlineEditing,
  updateElement,
}: {
  canvasRef: MutableRefObject<HTMLDivElement | null>;
  format: string;
  onFormatChange: (format: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  canvasHeight: number;
  canvasScale: number;
  imagePreview: string;
  overlayStrength: number;
  elements: CanvasElement[];
  selectedElementId: string;
  editingElementId: string | null;
  guides: Guide[];
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onInteractionFinish: () => void;
  onClearSelection: () => void;
  onBeginDrag: (
    event: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement
  ) => void;
  onBeginResize: (
    event: React.PointerEvent<HTMLButtonElement>,
    element: CanvasElement,
    handle: ResizeHandle
  ) => void;
  onStartInlineEditing: (
    event: React.MouseEvent<HTMLDivElement>,
    element: CanvasElement
  ) => void;
  onFinishInlineEditing: () => void;
  updateElement: UpdateElement;
}) {
  return (
    <section className="relative flex min-h-[70vh] min-w-0 flex-col bg-[#ececef] text-black lg:min-h-0">
      <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-2 border-b border-black/10 bg-white px-3 py-2 sm:px-4">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto">
          {formats.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFormatChange(item.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black ${format === item.id ? "bg-black text-white" : "bg-black/5 text-black/55"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onZoomChange(Math.max(40, zoom - 5))}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm font-black"
          >
            −
          </button>
          <span className="min-w-12 text-center text-xs font-black">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => onZoomChange(Math.min(120, zoom + 5))}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm font-black"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto p-4 sm:p-8 lg:p-12">
        <div
          className="relative shrink-0"
          style={{
            width: CANVAS_WIDTH * canvasScale,
            height: canvasHeight * canvasScale,
          }}
        >
          <div
            ref={canvasRef}
            className="absolute left-0 top-0 origin-top-left overflow-hidden bg-black shadow-2xl"
            style={{
              width: CANVAS_WIDTH,
              height: canvasHeight,
              transform: `scale(${canvasScale})`,
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onInteractionFinish}
            onPointerCancel={onInteractionFinish}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                onClearSelection();
              }
            }}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,.9),transparent_35%),radial-gradient(circle_at_85%_85%,rgba(249,115,22,.7),transparent_40%),linear-gradient(145deg,#111,#26113e_55%,#190b10)]" />
            )}
            <div
              className="pointer-events-none absolute inset-0 bg-black"
              style={{ opacity: overlayStrength / 100 }}
            />

            {elements.map((element) => {
              if (element.hidden) return null;
              const isSelected = selectedElementId === element.id;
              const isEditing = editingElementId === element.id;

              return (
                <div
                  key={element.id}
                  className={`absolute select-none ${element.locked ? "cursor-default" : isEditing ? "cursor-text" : "cursor-move"}`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                  }}
                  onPointerDown={(event) => onBeginDrag(event, element)}
                  onDoubleClick={(event) =>
                    onStartInlineEditing(event, element)
                  }
                >
                  <div
                    data-editable-id={element.id}
                    contentEditable={isEditing}
                    suppressContentEditableWarning
                    onInput={(event) =>
                      updateElement(
                        element.id,
                        { text: event.currentTarget.textContent || "" },
                        false
                      )
                    }
                    onBlur={onFinishInlineEditing}
                    onKeyDown={(event) => {
                      event.stopPropagation();
                      if (event.key === "Escape") {
                        event.preventDefault();
                        onFinishInlineEditing();
                      }
                    }}
                    className="flex h-full w-full items-center whitespace-pre-wrap break-words outline-none"
                    style={{
                      justifyContent:
                        element.align === "left"
                          ? "flex-start"
                          : element.align === "right"
                            ? "flex-end"
                            : "center",
                      textAlign: element.align,
                      fontSize: element.fontSize,
                      fontWeight: element.fontWeight,
                      color: element.color,
                      letterSpacing: element.letterSpacing,
                      textTransform: element.uppercase ? "uppercase" : "none",
                      borderRadius: element.borderRadius,
                      background:
                        element.kind === "button"
                          ? element.background
                          : undefined,
                      padding: element.kind === "button" ? "0 16px" : undefined,
                      lineHeight: element.kind === "button" ? 1 : 1.05,
                    }}
                  >
                    {element.text}
                  </div>

                  {isSelected && !isEditing ? (
                    <>
                      <div className="pointer-events-none absolute inset-0 border-2 border-violet-500" />
                      <div className="pointer-events-none absolute -top-7 left-0 rounded bg-violet-600 px-2 py-1 text-[10px] font-black text-white">
                        {Math.round(element.width)} × {Math.round(element.height)}
                      </div>
                      {!element.locked
                        ? resizeHandles.map((handle) => (
                            <button
                              key={handle}
                              type="button"
                              aria-label={`Resize ${handle}`}
                              onPointerDown={(event) =>
                                onBeginResize(event, element, handle)
                              }
                              className={`absolute z-20 h-3 w-3 rounded-full border-2 border-white bg-violet-600 ${resizeHandleClass(handle)}`}
                            />
                          ))
                        : null}
                    </>
                  ) : null}
                </div>
              );
            })}

            {guides.map((guide, index) => (
              <div
                key={`${guide.axis}-${guide.position}-${index}`}
                className={`pointer-events-none absolute z-[999] bg-cyan-400 ${guide.axis === "x" ? "bottom-0 top-0 w-px" : "left-0 right-0 h-px"}`}
                style={
                  guide.axis === "x"
                    ? { left: guide.position }
                    : { top: guide.position }
                }
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
