'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import axios from "axios";
import styles from "../../../page.module.css";
import debounce from 'lodash/debounce';
import { requestSaveDiagram, requestSelectedDiagram, requestUpdateDiagram } from '@/app/function/requestServer';
import { useRouter } from "next/navigation";

interface DiagramComponent {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  highValue: number;
  lowValue: number | null;
  color: string;
  zIndex: number;
  type: 'Organic' | 'Metal' | 'Other';
  cuts: { start: number; end: number }[];
  showValues: boolean;
  invert: boolean;
}

interface CutOperation {
  rectangleId: number;
  previousCuts: { start: number; end: number }[];
  newCuts: { start: number; end: number }[];
}

interface Suggestion {
  name: string;
  highValue: string;
  lowValue: string;
}

interface TemporaryDiagram {
  uuid : string;
  diagram: string;
  createDate: string;
}

export default function newDiagram() {
  const searchParams = useSearchParams();
  const { uuid } = useParams<{uuid : string}>();
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [diagram, setDiagram] = useState<DiagramComponent[]>([]);
  const [selectedDiagram, setSelectedDiagram] = useState<number[]>([]);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [cursor, setCursor] = useState('default');
  const [cutOperations, setCutOperations] = useState<CutOperation[]>([]);

  // State for rectangle creation and editing
  const [diagramName, setDiagramName] = useState('');
  const [diagramHighValue, setDiagramHighValue] = useState('');
  const [diagramLowValue, setDiagramLowValue] = useState('');
  const [diagramColor, setDiagramColor] = useState('#000000');
  const [diagramType, setDiagramType] = useState<'Organic' | 'Metal' | 'Other'>('Organic');

  const [title, setTitle] = useState('');

  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isNew, setIsNew] = useState(searchParams.get("new") === 'true');
  const [isTemporary, setIsTemporary] = useState(uuid.startsWith("DrawDTS-"));
  const ischange = useRef(false);
  const isInitialRender = useRef(true);
  const nowDiagram = useRef<DiagramComponent[]>([]);

  const getSelectedDiagram = async () => {
    if(isTemporary) {
      const data = localStorage.getItem(uuid);
      
      if(data) {
        const parseData : TemporaryDiagram = JSON.parse(data);
        const parseDiagram : DiagramComponent[] = JSON.parse(parseData.diagram);

        setDiagram(parseDiagram);
      }
      else {
        alert('Error, Temporarily stored data was corrupted or deleted');
        localStorage.removeItem(uuid);

        router.replace("/dashboard");
      }
    }
    else {
      const data = await requestSelectedDiagram(uuid);
      
      if(data !== null) {
        const {title, diagramData} = data;
        const parseDiagram : DiagramComponent[] = JSON.parse(diagramData);
        
        setTitle(title);
        setDiagram(parseDiagram);
      }
      else {
        alert('Error, try logging in again or contact us');
        router.replace("/");
      }
    }
  };

  useEffect(() => {
    if (!isNew) {
      getSelectedDiagram();
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight * 0.9;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.lineTo(50, 50);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('0 eV', 5, 35);

    diagram.sort((a, b) => a.zIndex - b.zIndex).forEach((rect) => {
      ctx.fillStyle = selectedDiagram.includes(rect.id) ? `${rect.color}80` : rect.color;
      
      const getBorderColor = (fillColor: string) => {
        if (fillColor === '#ffffff') return '#000000'
        const rgb = parseInt(fillColor.slice(1), 16)
        const r = (rgb >> 16) & 0xff
        const g = (rgb >> 8) & 0xff
        const b = (rgb >> 0) & 0xff
        return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`
      }

      if (rect.type === 'Organic' || rect.type === 'Other') {
        if (rect.cuts.length > 0) {
          let lastX = rect.x
          rect.cuts.forEach(cut => {
            if (cut.start > lastX) {
              ctx.fillRect(lastX, rect.y, cut.start - lastX, rect.height)
              ctx.strokeStyle = getBorderColor(rect.color)
              ctx.strokeRect(lastX, rect.y, cut.start - lastX, rect.height)
            }
            lastX = cut.end
          })
          if (lastX < rect.x + rect.width) {
            ctx.fillRect(lastX, rect.y, (rect.x + rect.width) - lastX, rect.height)
            ctx.strokeStyle = getBorderColor(rect.color)
            ctx.strokeRect(lastX, rect.y, (rect.x + rect.width) - lastX, rect.height)
          }
        } else {
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
          ctx.strokeStyle = getBorderColor(rect.color)
          ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
        }
      } else if (rect.type === 'Metal') {
        ctx.beginPath()
        ctx.moveTo(rect.x, rect.y)
        ctx.lineTo(rect.x + rect.width, rect.y)
        ctx.strokeStyle = rect.color
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(rect.x, rect.y + 7)
        ctx.lineTo(rect.x + rect.width, rect.y + 7)
        ctx.stroke()
      }
      
      if (selectedDiagram.includes(rect.id)) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.setLineDash([]);
      }

      const length = rect.type === 'Organic' ? 100 : 50;
      const xpos = rect.invert ? (rect.x + rect.width - length) + length / 2 : rect.x + length / 2;
      ctx.fillStyle = 'black';
      ctx.font = '20px Arial';
      
      if(rect.type === 'Organic' || rect.type === 'Other') {
        ctx.save();
        ctx.translate(xpos, rect.y + rect.height / 2);
        ctx.rotate(Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rect.name, 0, 0);
        ctx.restore();
      }
      else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rect.name, rect.x + rect.width / 2, rect.y - 25);
      }

      if (rect.showValues) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        if(rect.type === 'Organic' || rect.type === 'Other') {
          ctx.fillText(`${rect.highValue.toFixed(1)}eV`, xpos, rect.y - 5);
        }
        else {
          ctx.fillText(`${rect.highValue.toFixed(1)}eV`, rect.x + rect.width / 2, rect.y + 42);
        }

        if (rect.type !== 'Metal' && rect.lowValue !== null) {
          ctx.textBaseline = 'top';
          ctx.fillText(`${rect.lowValue.toFixed(1)}eV`, xpos, rect.y + rect.height + 5);
        }
      }
    });

    ctx.restore();
  }, [diagram, selectedDiagram, offset, scale]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * 0.9 * dpr;
        canvasRef.current.style.width = `${window.innerWidth}px`;
        canvasRef.current.style.height = `${window.innerHeight * 0.9}px`;
        draw();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  useEffect(() => {
    const animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const mouseX = (e.clientX - rect.left) * dpr;
      const mouseY = (e.clientY - rect.top) * dpr;

      setScale(prevScale => {
        const newScale = Math.min(Math.max(prevScale * delta, 0.1), 5);
        const scaleDiff = newScale - prevScale;

        setOffset(prev => ({
          x: prev.x - (mouseX - prev.x) * (scaleDiff / prevScale),
          y: prev.y - (mouseY - prev.y) * (scaleDiff / prevScale)
        }));

        return newScale;
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    return {
      x: ((e.clientX - rect.left) * dpr - offset.x) / scale,
      y: ((e.clientY - rect.top) * dpr - offset.y) / scale
    };
  }, [offset, scale]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);

    const clickedDiagram = diagram
      .filter(d => 
        x >= d.x - 5 && x <= d.x + d.width + 5 && y >= d.y && y <= d.y + d.height
      )
      .sort((a, b) => b.zIndex - a.zIndex)[0];

    if (clickedDiagram) {
      if (e.ctrlKey || e.metaKey) {
        setSelectedDiagram(prev => 
          prev.includes(clickedDiagram.id)
            ? prev.filter(id => id !== clickedDiagram.id)
            : [...prev, clickedDiagram.id]
        );
      } else {
        setSelectedDiagram([clickedDiagram.id]);
      }
      setDiagramName(clickedDiagram.name);
      setDiagramHighValue(clickedDiagram.highValue.toString());
      setDiagramLowValue(clickedDiagram.lowValue?.toString() ?? '');
      setDiagramColor(clickedDiagram.color);
      setDiagramType(clickedDiagram.type);
      if (Math.abs(x - clickedDiagram.x) <= 5) {
        setIsResizing('left');
      } else if (Math.abs(x - (clickedDiagram.x + clickedDiagram.width)) <= 5) {
        setIsResizing('right');
      } else {
        setIsMoving(true);
      }
    } else {
      setSelectedDiagram([]);
      setDiagramName('');
      setDiagramHighValue('');
      setDiagramLowValue('');
      setDiagramColor(diagramColor);
      setDiagramType('Organic');
      setIsPanning(true);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);

    if (isResizing && selectedDiagram.length > 0) {
      const dx = (e.clientX - dragStart.x) / scale;

      setDiagram(prevDiagram => prevDiagram.map(d => {
        if (selectedDiagram.includes(d.id)) {
          if (isResizing === 'left') {
            const newX = Math.min(d.x + dx, d.x + d.width - 10);
            const newWidth = d.width - (newX - d.x);
            return { ...d, x: newX, width: newWidth };
          } else {
            const newWidth = Math.max(d.width + dx, 10);
            return { ...d, width: newWidth };
          }
        }
        return d;
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isMoving && selectedDiagram.length > 0) {
      const dx = (e.clientX - dragStart.x) / scale;

      setDiagram(prevDiagram => prevDiagram.map(d => {
        if (selectedDiagram.includes(d.id)) {
          return { ...d, x: d.x + dx };
        }
        return d;
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isPanning) {
      setOffset(prev => ({
        x: prev.x + (e.clientX - dragStart.x),
        y: prev.y + (e.clientY - dragStart.y)
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      const hoverRect = diagram.find(d => 
        x >= d.x - 5 && x <= d.x + d.width + 5 && y >= d.y && y <= d.y + d.height
      );

      if (hoverRect) {
        if (Math.abs(x - hoverRect.x) <= 5) {
          setCursor('ew-resize');
        } else if (Math.abs(x - (hoverRect.x + hoverRect.width)) <= 5) {
          setCursor('ew-resize');
        } else {
          setCursor('move');
        }
      } else {
        setCursor('default');
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(null);
    setIsMoving(false);
    setIsPanning(false);
  };

  const addOrUpdateDiagram = () => {
    if (!diagramName || !diagramHighValue || (diagramType !== 'Metal' && !diagramLowValue)) {
      alert('Please fill in all required fields');
      return;
    }

    const highValue = parseFloat(diagramHighValue);
    const lowValue = diagramType === 'Metal' ? null : parseFloat(diagramLowValue);

    if (isNaN(highValue) || (lowValue !== null && (isNaN(lowValue) || highValue >= lowValue))) {
      alert('Invalid high or low value. High value must be less than low value.');
      return;
    }

    const yPosition = highValue * 110 + 50;
    const height = lowValue !== null ? (lowValue - highValue) * 110 : 2;

    if (selectedDiagram.length === 1) {
      setDiagram(prevDiagram => prevDiagram.map(d => 
        d.id === selectedDiagram[0]
          ? { ...d, name: diagramName, highValue, lowValue, color: diagramColor, y: yPosition, height, type: diagramType }
          : d
      ));
    } else {
      const lastDiagram = diagram[diagram.length - 1];
      const newX = lastDiagram ? lastDiagram.x + lastDiagram.width : 0;
      const newDiagram: DiagramComponent = {
        id: Date.now(),
        x: newX,
        y: yPosition,
        width: diagramType === 'Other' ? 50 : 100,
        height,
        name: diagramName,
        highValue,
        lowValue,
        color: diagramColor,
        zIndex: 0,
        type: diagramType,
        cuts: [],
        showValues: true,
        invert: false,
      };
      setDiagram(prevDiagram => [...prevDiagram, newDiagram]);
    }
    setDiagramName('');
    setDiagramHighValue('');
    setDiagramLowValue('');
    setDiagramColor(diagramColor);
    setDiagramType('Organic');
    setSelectedDiagram([]);
  };

  const moveDiagram = (direction: 'front' | 'back') => {
    if (selectedDiagram.length === 0) return;

    setDiagram(prevDiagram => {
      const newDiagram = [...prevDiagram];
      selectedDiagram.forEach(selectedId => {
        const selectedIndex = newDiagram.findIndex(d => d.id === selectedId);
        const diagram = newDiagram[selectedIndex];

        if (direction === 'front') {
          const maxZIndex = Math.max(...newDiagram.map(d => d.zIndex));
          diagram.zIndex = maxZIndex + 1;
        } else if (direction === 'back') {
          const minZIndex = Math.min(...newDiagram.map(d => d.zIndex));
          diagram.zIndex = minZIndex - 1;
        }
      });

      return newDiagram;
    });
  };

  const deleteSelectedDiagram = () => {
    if (selectedDiagram.length === 0) return;
    setDiagram(prevDiagram => prevDiagram.filter(d => !selectedDiagram.includes(d.id)));
    setSelectedDiagram([]);
    setDiagramName('');
    setDiagramHighValue('');
    setDiagramLowValue('');
    setDiagramColor(diagramColor);
    setDiagramType('Organic');
  };

  const deleteAllDiagram = () => {
    setDiagram([]);
    setSelectedDiagram([]);
    setDiagramName('');
    setDiagramHighValue('');
    setDiagramLowValue('');
    setDiagramColor(diagramColor);
    setDiagramType('Organic');
    setCutOperations([]);
  };

  const cutDiagram = () => {
    if (selectedDiagram.length === 0) return;

    const newCutOperations: CutOperation[] = [];

    setDiagram(prevDiagram => {
      const selectDiagram = prevDiagram.filter(d => selectedDiagram.includes(d.id));
      const sortedDiagram = prevDiagram.sort((a, b) => b.zIndex - a.zIndex);

      return sortedDiagram.map(diagram => {
        if (!selectedDiagram.includes(diagram.id)) {
          const newCuts: { start: number; end: number }[] = [...diagram.cuts];

          selectDiagram.forEach(selectedDiagram => {
            if (diagram.zIndex < selectedDiagram.zIndex &&
              diagram.y < selectedDiagram.y + selectedDiagram.height &&
              diagram.y + diagram.height > selectedDiagram.y) {
              const start = Math.max(diagram.x, selectedDiagram.x);
              const end = Math.min(diagram.x + diagram.width, selectedDiagram.x + selectedDiagram.width);

              if (start < end) {
                newCuts.push({ start, end });
              }
            }
          });

          const mergedCuts = newCuts.reduce((acc, cut) => {
            if (acc.length === 0) {
              return [cut];
            }
            const lastCut = acc[acc.length - 1];
            if (cut.start <= lastCut.end) {
              lastCut.end = Math.max(lastCut.end, cut.end);
            } else {
              acc.push(cut);
            }
            return acc;
          }, [] as { start: number; end: number }[]);

          if (mergedCuts.length !== diagram.cuts.length) {
            newCutOperations.push({
              rectangleId: diagram.id,
              previousCuts: diagram.cuts,
              newCuts: mergedCuts,
            });
          }

          return {
            ...diagram,
            cuts: mergedCuts,
          };
        }
        return diagram;
      });
    });

    setCutOperations(prev => [...prev, ...newCutOperations]);
    setSelectedDiagram([]);
  };

  const undoCut = () => {
    if (cutOperations.length === 0) return;

    const lastCutOperation = cutOperations[cutOperations.length - 1];

    setDiagram(prevDiagram => prevDiagram.map(diagram => {
      if (diagram.id === lastCutOperation.rectangleId) {
        return {
          ...diagram,
          cuts: lastCutOperation.previousCuts,
        };
      }
      return diagram;
    }));

    setCutOperations(prev => prev.slice(0, -1));
  };

  const toggleValueVisibility = () => {
    setDiagram(prevDiagram => prevDiagram.map(diagram => {
      if (selectedDiagram.includes(diagram.id)) {
        return { ...diagram, showValues: !diagram.showValues };
      }
      return diagram;
    }));
  };

  const invertValue = () => {
    setDiagram(prevDiagram => prevDiagram.map(diagram => {
      if(selectedDiagram.includes(diagram.id)) {
        return { ...diagram, invert: !diagram.invert};
      }
      return diagram;
    }));
  };

  const copyDiagram = () => {
    if (selectedDiagram.length !== 1) {
      alert('Please select exactly one rectangle to copy.');
      return;
    }
  
    const selectDiagram = diagram.find(d => d.id === selectedDiagram[0]);
    if (!selectDiagram) return;

    const lastDiagram = diagram[diagram.length - 1];
    const newX = lastDiagram ? lastDiagram.x + lastDiagram.width : 0;
  
    const copyDiagram: DiagramComponent = {
      ...selectDiagram,
      id: Date.now(),
      x: newX,
      y: selectDiagram.y,
      zIndex: 0,
    };
  
    setDiagram(prevDiagram => [...prevDiagram, copyDiagram]);
    setSelectedDiagram([copyDiagram.id]);
  };

  const saveDiagram = async () => {
    if (!title.trim()) {
      alert("Please enter a title before saving.");
      return;
    }

    const nowUuid = uuid.startsWith("DrawDTS-") ? uuid.replace("DrawDTS-", "") : uuid;
    const date = (new Date()).toISOString().slice(0, 19).replace('T', ' ');
    const Diagram = {
      title,
      uuid : nowUuid,
      diagram : JSON.stringify(diagram),
      createDate : date,
    };

    if(isNew) {
      if(await requestSaveDiagram(Diagram)) {
        setIsNew(false);
        ischange.current = false;
        localStorage.removeItem(`DrawDTS-${nowUuid}`);
        alert('Diagram saved successfully!');
      }
      else {
        alert('Error, try logging in again or contact us');
        router.replace("/");
      }
    }
    else {
      if(await requestUpdateDiagram(Diagram)) {
        ischange.current = false;
        localStorage.removeItem(`DrawDTS-${nowUuid}`);
        alert('Diagram update successfully!');
      }
      else {
        alert('Error, try logging in again or contact us');
        router.replace("/");
      }
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (value : String) => {
      if(value.length < 1) {
        setSuggestions([]);

        return;
      }

      try {
        const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/search/material`, {
          headers : {
            "Content-Type" : "application/json"
          },
          params : {partial : value}
        });

        const data : Suggestion[] = response.data;
        setSuggestions(data);
      }
      catch (e) {
        console.log(e);
        setSuggestions([]);
      }
    }, 600), []
  );

  const temporarySave = () => {
    const date = (new Date()).toISOString().slice(0, 19).replace('T', ' ');
      const nowUuid = uuid.startsWith("DrawDTS-") ? uuid : `DrawDTS-${uuid}`;

      const data = {
        uuid : nowUuid,
        diagram : JSON.stringify(nowDiagram.current),
        createDate : date
      };

      localStorage.setItem(nowUuid, JSON.stringify(data));
  };

  const handleInputChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleSuggestionClick = (suggestion : Suggestion) => {
    if(suggestion.lowValue !== null) {
      setDiagramName(suggestion.name);
      setDiagramHighValue(suggestion.highValue);
      setDiagramLowValue(suggestion.lowValue);
      setSuggestions([]);
      setSearchValue('');
    }
    else {
      setDiagramType("Metal");
      setDiagramName(suggestion.name);
      setDiagramHighValue(suggestion.highValue);
      setSuggestions([]);
      setSearchValue('');
    }
  };

  useEffect (() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect (() => {
    return () => {
      console.log(ischange.current)
      if(ischange.current) {
        temporarySave();
        ischange.current = false;
      }
    }
  }, []);

  useEffect (() => {
    if (!isInitialRender.current) {
      ischange.current = true;
      nowDiagram.current = diagram;
    } 
    else {
      if(diagram.length > 0) {
        isInitialRender.current = false;
      }
    }

    console.log(ischange.current)
    console.log(isInitialRender.current)
  }, [diagram]);

  return (
    <div className={`${styles.newMain}`}>
      <div className="mb-4 space-y-2 mt-10">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={diagramName}
            onChange={(e) => setDiagramName(e.target.value)}
            placeholder="Rectangle Name"
            className="px-2 py-2 border rounded"
            aria-label="Name"
          />
          <input
            type="number"
            value={diagramHighValue}
            onChange={(e) => setDiagramHighValue(e.target.value)}
            placeholder="High Value (eV)"
            className="px-2 py-2 border rounded"
            aria-label="HighValue"
          />
          <input
            type="number"
            value={diagramLowValue}
            onChange={(e) => setDiagramLowValue(e.target.value)}
            placeholder="Low Value (eV)"
            className="px-2 py-2 border rounded"
            aria-label="LowValue"
            disabled={diagramType === 'Metal'}
          />
          <input
            type="color"
            value={diagramColor}
            onChange={(e) => setDiagramColor(e.target.value)}
            className="px-2 py-1 border rounded"
            aria-label="Color"
          />
          <select
            value={diagramType}
            onChange={(e) => {
              setDiagramType(e.target.value as 'Organic' | 'Metal' | 'Other');
              if (e.target.value === 'Metal') {
                setDiagramLowValue('');
              }
            }}
            className="w-40 px-2 py-2 border rounded"
            aria-label="Type"
          >
            <option value="Organic">Organic</option>
            <option value="Metal">Metal</option>
            <option value="Other">Other</option>
          </select>
          <button
            type="button"
            onClick={addOrUpdateDiagram}
            className="w-40 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            aria-label="Add"
          >
            {selectedDiagram.length === 1 ? 'Update' : 'Draw'}
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="px-2 py-2 border rounded flex-grow"
            aria-label="Title"
          />
          <button
            type="button"
            onClick={saveDiagram}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            aria-label="Save Structure"
          >
            Save
          </button>
        </div>
        <div className="flex justify-center space-x-2">
          <button
            type="button"
            onClick={() => moveDiagram('front')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            disabled={selectedDiagram.length === 0}
            aria-label="Move selected rectangle to front"
            title="Move to Front"
          >
            Move to Front
          </button>
          <button
            type="button"
            onClick={() => moveDiagram('back')}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            disabled={selectedDiagram.length === 0}
            aria-label="Move selected rectangle to back"
            title="Move to Back"
          >
           Move to Back
          </button>
          <button
            type="button"
            onClick={deleteSelectedDiagram}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            disabled={selectedDiagram.length === 0}
            aria-label="Delete selected rectangles"
            title="Delete Selected"
          >
            Delete Selected
          </button>
          <button
            type="button"
            onClick={deleteAllDiagram}
            className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
            aria-label="Delete all rectangles"
            title="Delete All"
          >
            Delete All
          </button>
          <button
            type="button"
            onClick={cutDiagram}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            disabled={selectedDiagram.length === 0}
            aria-label="Cut selected rectangles"
            title="Cut"
          >
            Cut
          </button>
          <button
            type="button"
            onClick={undoCut}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            disabled={cutOperations.length === 0}
            aria-label="Undo cut operation"
            title="Undo Cut"
          >
            Undo Cut
          </button>
          <button
            type="button"
            onClick={toggleValueVisibility}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            disabled={selectedDiagram.length === 0}
            aria-label="Toggle visibility of values"
            title="Toggle Values"
          >
            Toggle Values
          </button>
          <button
            type="button"
            onClick={invertValue}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={selectedDiagram.length === 0}
            aria-label="Invert values of selected rectangles"
            title="Invert Values"
          >
            Invert Values
          </button>
          <button
            type="button"
            onClick={copyDiagram}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            disabled={selectedDiagram.length === 0}
            aria-label="Copy selected rectangles"
            title="Copy"
          >
            Copy
          </button>
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={handleInputChange}
              placeholder='Enter a purpose'
              className="px-2 py-2 border rounded"
              aria-label="Search Material Input"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-md shadow-lg">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion.name}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                  >
                    {suggestion.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: '100%', height: '90%', cursor, borderRadius: '15px' }}
        className="border border-gray-300 bg-white"
      />
    </div>
  );
}



