"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { toPng } from "html-to-image";
import ToolPanel from "@/components/host/flyer-studio-v2/ToolPanel";
import PropertiesPanel from "@/components/host/flyer-studio-v2/PropertiesPanel";
import CanvasStage from "@/components/host/flyer-studio-v2/CanvasStage";
import {
  CANVAS_WIDTH,
  MIN_HEIGHT,
  MIN_WIDTH,
  SNAP_THRESHOLD,
  formats,
  initialElements,
  sidebarTools,
  styleOptions,
  templates,
} from "@/components/host/flyer-studio-v2/config";
import {
  cloneElements,
  getElementAnchors,
  parseFlyerDocument,
} from "@/components/host/flyer-studio-v2/editor-utils";
import { useEditorHistory } from "@/components/host/flyer-studio-v2/hooks/useEditorHistory";
import { useFlyerDraft } from "@/components/host/flyer-studio-v2/hooks/useFlyerDraft";
import type {
  CanvasElement,
  FlyerDocument,
  Guide,
  Interaction,
  ResizeHandle,
  SidebarTool,
} from "@/components/host/flyer-studio-v2/types";

export default function FlyerStudioV2Page() {
  const { isLoaded, isSignedIn } = useAuth();
  const events = useQuery(
    api.events.getMyEvents,
    isLoaded && isSignedIn ? {} : "skip",
  ) as any[] | undefined;

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const editingStartRef = useRef<CanvasElement[] | null>(null);
  const clipboardRef = useRef<CanvasElement | null>(null);
  const loadedEventIdRef = useRef("");

  const [activeTool, setActiveTool] = useState<SidebarTool>("templates");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Luxury");
  const [format, setFormat] = useState("poster");
  const [imagePreview, setImagePreview] = useState("");
  const [variations, setVariations] = useState<
    { id: string; imageUrl: string; caption?: string }[]
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");
  const [overlayStrength, setOverlayStrength] = useState(55);
  const [zoom, setZoom] = useState(85);
  const {
    elements,
    commitElements,
    updateElement,
    undo: restoreUndo,
    redo: restoreRedo,
    commitSnapshot,
    resetElements,
    canUndo,
    canRedo,
  } = useEditorHistory(initialElements);
  const [selectedElementId, setSelectedElementId] = useState("headline");
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const {
    savedDraft,
    isLoading: isDraftLoading,
    isSaving,
    saveStatus,
    saveDraft,
  } = useFlyerDraft(selectedEventId);

  const selectedEvent = events?.find((event) => event._id === selectedEventId);
  const selectedFormat =
    formats.find((item) => item.id === format) || formats[0];
  const canvasHeight = selectedFormat.height;
  const canvasScale = useMemo(() => zoom / 100, [zoom]);
  const selectedElement =
    elements.find((element) => element.id === selectedElementId) || null;
  const headline =
    elements.find((element) => element.id === "headline")?.text ||
    "Night Moves";
  const eventTitle = selectedEvent?.name || headline;

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setZoom(55);
    }

    const linkedEventId = new URLSearchParams(window.location.search).get(
      "eventId"
    );

    if (linkedEventId) {
      setSelectedEventId(linkedEventId);
    }
  }, []);

  useEffect(() => {
    if (
      !selectedEventId ||
      !selectedEvent ||
      isDraftLoading ||
      loadedEventIdRef.current === selectedEventId
    ) {
      return;
    }

    const eventDraft =
      savedDraft && String(savedDraft.eventId) === selectedEventId
        ? savedDraft
        : null;
    const document = eventDraft?.editorState
      ? parseFlyerDocument(eventDraft.editorState)
      : null;

    loadedEventIdRef.current = selectedEventId;

    if (document) {
      setFormat(document.format);
      setPrompt(document.prompt);
      setStyle(document.style);
      setImagePreview(document.imageUrl);
      setOverlayStrength(document.overlayStrength);
      resetElements(document.elements);
    } else {
      const eventElements = cloneElements(initialElements).map((element) => {
        if (element.id === "headline" && selectedEvent?.name) {
          return { ...element, text: String(selectedEvent.name).toUpperCase() };
        }
        if (element.id === "venue" && selectedEvent) {
          const venue = selectedEvent.venue || selectedEvent.city;
          return venue
            ? { ...element, text: String(venue).toUpperCase() }
            : element;
        }
        return element;
      });

      setFormat("poster");
      setPrompt("");
      setStyle("Luxury");
      setImagePreview("");
      setOverlayStrength(55);
      resetElements(eventElements);
    }

    setSelectedElementId("");
    setEditingElementId(null);
  }, [
    isDraftLoading,
    resetElements,
    savedDraft,
    selectedEvent,
    selectedEventId,
  ]);

  async function saveCurrentDraft() {
    if (!selectedEventId) {
      setStatus("Select an event before saving.");
      return;
    }

    const document: FlyerDocument = {
      version: 1,
      format,
      prompt,
      style,
      imageUrl: imagePreview,
      overlayStrength,
      elements: cloneElements(elements),
    };

    await saveDraft({
      document,
      title: `${eventTitle} Flyer`,
      prompt,
      style,
      imageUrl: imagePreview,
    });
  }

  const undo = useCallback(() => {
    restoreUndo();
    setEditingElementId(null);
    setGuides([]);
  }, [restoreUndo]);

  const redo = useCallback(() => {
    restoreRedo();
    setEditingElementId(null);
    setGuides([]);
  }, [restoreRedo]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTyping) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }

      // Copy the selected element to the internal clipboard.
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "c" &&
        selectedElementId
      ) {
        event.preventDefault();

        const selected = elements.find(
          (element) => element.id === selectedElementId,
        );

        if (selected) {
          clipboardRef.current = cloneElements([selected])[0];
        }

        return;
      }

      // Paste the copied element with a small visual offset.
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "v" &&
        clipboardRef.current
      ) {
        event.preventDefault();

        const copied = cloneElements([clipboardRef.current])[0];
        const pastedId = `${copied.id}-copy-${Date.now()}`;

        const pastedElement: CanvasElement = {
          ...copied,
          id: pastedId,
          x: Math.min(
            CANVAS_WIDTH - copied.width,
            Math.max(0, copied.x + 20),
          ),
          y: Math.min(
            canvasHeight - copied.height,
            Math.max(0, copied.y + 20),
          ),
        };

        commitElements((current) => [...current, pastedElement]);
        clipboardRef.current = cloneElements([pastedElement])[0];
        setSelectedElementId(pastedId);
        setEditingElementId(null);
        setGuides([]);

        return;
      }

      // Duplicate the selected element immediately.
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "d" &&
        selectedElementId
      ) {
        event.preventDefault();

        const selected = elements.find(
          (element) => element.id === selectedElementId,
        );

        if (!selected) return;

        const duplicateId = `${selected.id}-copy-${Date.now()}`;

        const duplicatedElement: CanvasElement = {
          ...cloneElements([selected])[0],
          id: duplicateId,
          x: Math.min(
            CANVAS_WIDTH - selected.width,
            Math.max(0, selected.x + 20),
          ),
          y: Math.min(
            canvasHeight - selected.height,
            Math.max(0, selected.y + 20),
          ),
        };

        commitElements((current) => [...current, duplicatedElement]);
        setSelectedElementId(duplicateId);
        setEditingElementId(null);
        setGuides([]);

        return;
      }

      // Escape clears the current selection.
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedElementId("");
        setEditingElementId(null);
        setGuides([]);
        return;
      }

      // Arrow keys move the selected element by 1px.
      // Hold Shift to move it by 10px.
      if (
        selectedElementId &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        event.preventDefault();

        const distance = event.shiftKey ? 10 : 1;

        commitElements((current) =>
          current.map((element) => {
            if (element.id !== selectedElementId || element.locked) {
              return element;
            }

            let x = element.x;
            let y = element.y;

            switch (event.key) {
              case "ArrowLeft":
                x = Math.max(0, x - distance);
                break;

              case "ArrowRight":
                x = Math.min(
                  CANVAS_WIDTH - element.width,
                  x + distance,
                );
                break;

              case "ArrowUp":
                y = Math.max(0, y - distance);
                break;

              case "ArrowDown":
                y = Math.min(
                  canvasHeight - element.height,
                  y + distance,
                );
                break;
            }

            return {
              ...element,
              x,
              y,
            };
          }),
        );

        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedElementId
      ) {
        event.preventDefault();
        commitElements((current) =>
          current.filter((element) => element.id !== selectedElementId),
        );
        setSelectedElementId("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvasHeight, commitElements, elements, redo, selectedElementId, undo]);

  function applyTemplate(template: (typeof templates)[number]) {
    setPrompt(template.prompt);
    setStyle(template.style);
    commitElements((current) =>
      current.map((element) => {
        if (element.id === "headline") {
          return { ...element, text: template.name.toUpperCase() };
        }
        if (element.id === "style") {
          return { ...element, text: template.style.toUpperCase() };
        }
        return element;
      }),
    );
    setActiveTool("ai");
  }

  function addTextElement(kind: "heading" | "subheading" | "body") {
    const id = `text-${Date.now()}`;
    const presets = {
      heading: {
        text: "NEW HEADING",
        fontSize: 42,
        fontWeight: 900,
        height: 90,
      },
      subheading: {
        text: "Add a subheading",
        fontSize: 24,
        fontWeight: 700,
        height: 54,
      },
      body: {
        text: "Add body text",
        fontSize: 16,
        fontWeight: 400,
        height: 48,
      },
    };
    const preset = presets[kind];

    commitElements((current) => [
      ...current,
      {
        id,
        kind: "text",
        name: `Text ${current.length + 1}`,
        text: preset.text,
        x: 80,
        y: 180,
        width: 360,
        height: preset.height,
        fontSize: preset.fontSize,
        fontWeight: preset.fontWeight,
        color: "#ffffff",
        align: "left",
      },
    ]);
    setSelectedElementId(id);
  }

  async function generateFlyer() {
    if (!prompt.trim()) {
      alert("Add a creative prompt first.");
      return;
    }

    try {
      setIsGenerating(true);
      setStatus("Generating your flyer...");
      const response = await fetch("/api/ai/generate-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style,
          format,
          eventType: selectedEvent?.category || "nightlife",
          composition: "cinematic",
          quality: "premium",
          city: selectedEvent?.city || "New Orleans",
          eventTitle,
          venue: selectedEvent?.venue || "",
          cta:
            elements.find((element) => element.id === "cta")?.text ||
            "Get Tickets",
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success || !data.imageUrl) {
        throw new Error(data.error || "No image was returned.");
      }

      setImagePreview(data.imageUrl);
      setVariations(data.variations || []);
      setStatus("Flyer generated.");
    } catch (error) {
      console.error(error);
      setStatus("");
      alert(
        error instanceof Error
          ? error.message
          : "The flyer could not be generated.",
      );
    } finally {
      setIsGenerating(false);
      window.setTimeout(() => setStatus(""), 2500);
    }
  }

  async function downloadCanvas() {
    if (!canvasRef.current) return;
    const dataUrl = await toPng(canvasRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#000000",
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${eventTitle || "functionhour-flyer"}.png`;
    link.click();
  }

  function calculateSnappedPosition(
    moving: CanvasElement,
    proposedX: number,
    proposedY: number,
  ) {
    const candidate = { ...moving, x: proposedX, y: proposedY };
    const candidateAnchors = getElementAnchors(candidate);
    const xTargets = [0, CANVAS_WIDTH / 2, CANVAS_WIDTH];
    const yTargets = [0, canvasHeight / 2, canvasHeight];

    elements
      .filter((element) => element.id !== moving.id && !element.hidden)
      .forEach((element) => {
        const anchors = getElementAnchors(element);
        xTargets.push(anchors.left, anchors.centerX, anchors.right);
        yTargets.push(anchors.top, anchors.centerY, anchors.bottom);
      });

    let nextX = proposedX;
    let nextY = proposedY;
    let bestXDistance = SNAP_THRESHOLD + 1;
    let bestYDistance = SNAP_THRESHOLD + 1;
    let xGuide: Guide | null = null;
    let yGuide: Guide | null = null;

    const xCandidates = [
      { value: candidateAnchors.left, offset: 0 },
      { value: candidateAnchors.centerX, offset: moving.width / 2 },
      { value: candidateAnchors.right, offset: moving.width },
    ];
    const yCandidates = [
      { value: candidateAnchors.top, offset: 0 },
      { value: candidateAnchors.centerY, offset: moving.height / 2 },
      { value: candidateAnchors.bottom, offset: moving.height },
    ];

    xTargets.forEach((target) => {
      xCandidates.forEach((anchor) => {
        const distance = Math.abs(anchor.value - target);
        if (distance < bestXDistance && distance <= SNAP_THRESHOLD) {
          bestXDistance = distance;
          nextX = target - anchor.offset;
          xGuide = { axis: "x", position: target };
        }
      });
    });

    yTargets.forEach((target) => {
      yCandidates.forEach((anchor) => {
        const distance = Math.abs(anchor.value - target);
        if (distance < bestYDistance && distance <= SNAP_THRESHOLD) {
          bestYDistance = distance;
          nextY = target - anchor.offset;
          yGuide = { axis: "y", position: target };
        }
      });
    });

    const nextGuides: Guide[] = [];
    if (xGuide) nextGuides.push(xGuide);
    if (yGuide) nextGuides.push(yGuide);

    return {
      x: Math.max(0, Math.min(CANVAS_WIDTH - moving.width, nextX)),
      y: Math.max(0, Math.min(canvasHeight - moving.height, nextY)),
      guides: nextGuides,
    };
  }

  function beginDrag(
    event: React.PointerEvent<HTMLDivElement>,
    element: CanvasElement,
  ) {
    if (element.locked || editingElementId === element.id) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedElementId(element.id);
    interactionRef.current = {
      mode: "drag",
      elementId: element.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startElement: { ...element },
      startSnapshot: cloneElements(elements),
    };
  }

  function beginResize(
    event: React.PointerEvent<HTMLButtonElement>,
    element: CanvasElement,
    handle: ResizeHandle,
  ) {
    if (element.locked) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedElementId(element.id);
    interactionRef.current = {
      mode: "resize",
      elementId: element.id,
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startElement: { ...element },
      startSnapshot: cloneElements(elements),
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const interaction = interactionRef.current;
    if (!interaction) return;

    const dx = (event.clientX - interaction.startClientX) / canvasScale;
    const dy = (event.clientY - interaction.startClientY) / canvasScale;
    const start = interaction.startElement;

    if (interaction.mode === "drag") {
      const snapped = calculateSnappedPosition(
        start,
        start.x + dx,
        start.y + dy,
      );
      setGuides(snapped.guides);
      updateElement(
        interaction.elementId,
        { x: snapped.x, y: snapped.y },
        false,
      );
      return;
    }

    let x = start.x;
    let y = start.y;
    let width = start.width;
    let height = start.height;
    const { handle } = interaction;

    if (handle.includes("e")) width = Math.max(MIN_WIDTH, start.width + dx);
    if (handle.includes("s")) height = Math.max(MIN_HEIGHT, start.height + dy);
    if (handle.includes("w")) {
      width = Math.max(MIN_WIDTH, start.width - dx);
      x = start.x + (start.width - width);
    }
    if (handle.includes("n")) {
      height = Math.max(MIN_HEIGHT, start.height - dy);
      y = start.y + (start.height - height);
    }

    x = Math.max(0, x);
    y = Math.max(0, y);
    width = Math.min(width, CANVAS_WIDTH - x);
    height = Math.min(height, canvasHeight - y);
    updateElement(interaction.elementId, { x, y, width, height }, false);
  }

  function finishInteraction() {
    const interaction = interactionRef.current;
    if (!interaction) return;
    interactionRef.current = null;
    setGuides([]);

    commitSnapshot(interaction.startSnapshot);
  }

  function startInlineEditing(
    event: React.MouseEvent<HTMLDivElement>,
    element: CanvasElement,
  ) {
    if (element.locked || element.kind !== "text") return;
    event.stopPropagation();
    editingStartRef.current = cloneElements(elements);
    setSelectedElementId(element.id);
    setEditingElementId(element.id);

    window.setTimeout(() => {
      const editable = document.querySelector<HTMLElement>(
        `[data-editable-id="${element.id}"]`,
      );
      editable?.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      if (editable && selection) {
        range.selectNodeContents(editable);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 0);
  }

  function finishInlineEditing() {
    const startSnapshot = editingStartRef.current;
    editingStartRef.current = null;
    setEditingElementId(null);
    if (!startSnapshot) return;

    commitSnapshot(startSnapshot);
  }

  function duplicateSelected() {
    if (!selectedElement) return;
    const id = `${selectedElement.id}-${Date.now()}`;
    commitElements((current) => [
      ...current,
      {
        ...selectedElement,
        id,
        name: `${selectedElement.name} copy`,
        x: Math.min(
          CANVAS_WIDTH - selectedElement.width,
          selectedElement.x + 18,
        ),
        y: Math.min(
          canvasHeight - selectedElement.height,
          selectedElement.y + 18,
        ),
      },
    ]);
    setSelectedElementId(id);
  }

  function moveLayer(direction: "up" | "down") {
    if (!selectedElementId) return;
    commitElements((current) => {
      const index = current.findIndex(
        (element) => element.id === selectedElementId,
      );
      if (index < 0) return current;
      const nextIndex =
        direction === "up"
          ? Math.min(current.length - 1, index + 1)
          : Math.max(0, index - 1);
      if (nextIndex === index) return current;
      const next = cloneElements(current);
      const [element] = next.splice(index, 1);
      next.splice(nextIndex, 0, element);
      return next;
    });
  }

  function deleteSelected() {
    if (!selectedElementId) return;
    commitElements((current) =>
      current.filter((element) => element.id !== selectedElementId),
    );
    setSelectedElementId("");
  }

  return (
    <main className="min-h-screen bg-[#111111] text-white">
      <header className="flex min-h-16 flex-col gap-3 border-b border-white/10 bg-[#181818] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href={
              selectedEventId
                ? `/host/events/${selectedEventId}/flyers`
                : "/host"
            }
            className="rounded-lg px-3 py-2 text-sm font-bold text-white/60 hover:bg-white/10 hover:text-white"
          >
            ← Back
          </Link>
          <div className="min-w-0">
            <p className="text-sm font-black">Function Hour Studio</p>
            <p className="hidden text-xs text-white/35 sm:block">Canva-style editor V2</p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-30 sm:px-4"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-30 sm:px-4"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() => void saveCurrentDraft()}
            disabled={!selectedEventId || isSaving}
            className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-30 sm:px-4"
          >
            {isSaving ? "Saving…" : "Save draft"}
          </button>
          {saveStatus ? (
            <span className="shrink-0 text-xs font-bold text-white/40">
              {saveStatus}
            </span>
          ) : null}
          <button
            type="button"
            onClick={downloadCanvas}
            className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-black hover:bg-violet-500 sm:px-5"
          >
            Download
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[76px_300px_minmax(0,1fr)_290px]">
        <aside className="border-b border-white/10 bg-[#171717] py-2 lg:border-b-0 lg:border-r lg:py-3">
          <div className="flex gap-2 overflow-x-auto px-2 lg:block lg:space-y-2">
            {sidebarTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`flex min-w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl px-1 py-3 text-[10px] font-bold transition lg:w-full lg:min-w-0 ${
                  activeTool === tool.id
                    ? "bg-violet-600 text-white"
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="text-xl">{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>
        </aside>

        <aside className="max-h-[42vh] overflow-y-auto border-b border-white/10 bg-[#202020] p-4 lg:max-h-none lg:border-b-0 lg:border-r">
          {activeTool === "templates" && (
            <ToolPanel title="Templates">
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="overflow-hidden rounded-xl border border-white/10 bg-black/30 text-left hover:border-violet-400/50"
                  >
                    <div className="aspect-[4/5] bg-gradient-to-br from-violet-700/50 via-black to-orange-500/30 p-3">
                      <p className="text-xs font-black">{template.name}</p>
                    </div>
                    <p className="p-2 text-[11px] font-bold text-white/60">
                      Use template
                    </p>
                  </button>
                ))}
              </div>
            </ToolPanel>
          )}

          {activeTool === "uploads" && (
            <ToolPanel title="Uploads">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-7 text-center hover:border-violet-400/50">
                <span className="text-2xl">↑</span>
                <span className="mt-2 text-sm font-black">Upload media</span>
                <span className="mt-1 text-xs text-white/40">
                  JPG, PNG or WebP
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>
            </ToolPanel>
          )}

          {activeTool === "ai" && (
            <ToolPanel title="AI Image Generator">
              <label className="text-xs font-bold text-white/50">
                Select event
              </label>
              <select
                value={selectedEventId}
                onChange={(event) => {
                  const value = event.target.value;
                  setSelectedEventId(value);
                  const nextEvent = events?.find((item) => item._id === value);
                  commitElements((current) =>
                    current.map((element) => {
                      if (element.id === "headline" && nextEvent?.name) {
                        return {
                          ...element,
                          text: String(nextEvent.name).toUpperCase(),
                        };
                      }
                      if (
                        element.id === "venue" &&
                        (nextEvent?.venue || nextEvent?.city)
                      ) {
                        return {
                          ...element,
                          text: String(
                            nextEvent.venue || nextEvent.city,
                          ).toUpperCase(),
                        };
                      }
                      return element;
                    }),
                  );
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none"
              >
                <option value="">No event selected</option>
                {(events || []).map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.name || "Untitled Event"}
                  </option>
                ))}
              </select>

              <label className="mt-5 block text-xs font-bold text-white/50">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the flyer background and atmosphere..."
                className="mt-2 min-h-36 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-violet-400"
              />

              <label className="mt-5 block text-xs font-bold text-white/50">
                Style
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {styleOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setStyle(option);
                      updateElement("style", { text: option.toUpperCase() });
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-bold ${style === option ? "border-violet-400 bg-violet-500/20" : "border-white/10 bg-white/5 text-white/55"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={generateFlyer}
                disabled={isGenerating}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-orange-500 px-4 py-3 text-sm font-black disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Image"}
              </button>
              {status && (
                <p className="mt-3 text-center text-xs font-bold text-white/50">
                  {status}
                </p>
              )}
            </ToolPanel>
          )}

          {activeTool === "text" && (
            <ToolPanel title="Text">
              <div className="space-y-3">
                {(["heading", "subheading", "body"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => addTextElement(kind)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
                  >
                    <span
                      className={`block font-black ${kind === "heading" ? "text-2xl" : kind === "subheading" ? "text-lg" : "text-sm"}`}
                    >
                      Add {kind}
                    </span>
                  </button>
                ))}
              </div>
            </ToolPanel>
          )}

          {activeTool === "elements" && (
            <ToolPanel title="Layers">
              <div className="space-y-2">
                {[...elements].reverse().map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() => setSelectedElementId(element.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selectedElementId === element.id ? "border-violet-400 bg-violet-500/15" : "border-white/10 bg-white/5"}`}
                  >
                    <span className="flex-1 truncate text-sm font-bold">
                      {element.name}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        updateElement(element.id, { hidden: !element.hidden });
                      }}
                      className="rounded px-2 py-1 text-xs text-white/50 hover:bg-white/10"
                    >
                      {element.hidden ? "Show" : "Hide"}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        updateElement(element.id, { locked: !element.locked });
                      }}
                      className="rounded px-2 py-1 text-xs text-white/50 hover:bg-white/10"
                    >
                      {element.locked ? "Unlock" : "Lock"}
                    </span>
                  </button>
                ))}
              </div>
            </ToolPanel>
          )}

          {activeTool === "brand" && (
            <ToolPanel title="Brand Kit">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-black">Function Hour</p>
                <p className="mt-1 text-xs text-white/40">
                  Brand presets can be connected here next.
                </p>
              </div>
            </ToolPanel>
          )}

          {activeTool === "background" && (
            <ToolPanel title="Background">
              <label className="text-xs font-bold text-white/50">
                Overlay strength
              </label>
              <input
                type="range"
                min={0}
                max={90}
                value={overlayStrength}
                onChange={(event) =>
                  setOverlayStrength(Number(event.target.value))
                }
                className="mt-3 w-full"
              />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {variations.map((variation) => (
                  <button
                    key={variation.id}
                    type="button"
                    onClick={() => setImagePreview(variation.imageUrl)}
                    className="aspect-square overflow-hidden rounded-lg border border-white/10"
                  >
                    <img
                      src={variation.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </ToolPanel>
          )}
        </aside>

        <CanvasStage
          canvasRef={canvasRef}
          format={format}
          onFormatChange={setFormat}
          zoom={zoom}
          onZoomChange={setZoom}
          canvasHeight={canvasHeight}
          canvasScale={canvasScale}
          imagePreview={imagePreview}
          overlayStrength={overlayStrength}
          elements={elements}
          selectedElementId={selectedElementId}
          editingElementId={editingElementId}
          guides={guides}
          onPointerMove={handlePointerMove}
          onInteractionFinish={finishInteraction}
          onClearSelection={() => {
            setSelectedElementId("");
            setEditingElementId(null);
          }}
          onBeginDrag={beginDrag}
          onBeginResize={beginResize}
          onStartInlineEditing={startInlineEditing}
          onFinishInlineEditing={finishInlineEditing}
          updateElement={updateElement}
        />
        <PropertiesPanel
          selectedElement={selectedElement}
          updateElement={updateElement}
          moveLayer={moveLayer}
          duplicateSelected={duplicateSelected}
          deleteSelected={deleteSelected}
        />
      </div>
    </main>
  );
}
