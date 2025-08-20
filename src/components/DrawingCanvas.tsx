import React, { useRef, useState, useEffect } from 'react';

interface DrawingCanvasProps {
  onSave: (drawingData: string) => void;
  initialDrawing?: string;
}

interface DrawingTool {
  name: string;
  icon: string;
}

interface Point {
  x: number;
  y: number;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, initialDrawing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState('pen');
  const [startPos, setStartPos] = useState<Point>({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState<Point>({ x: 0, y: 0 });
  
  const tools: DrawingTool[] = [
    { name: 'pen', icon: '✏️' },
    { name: 'rectangle', icon: '⬜' },
    { name: 'circle', icon: '⭕' },
    { name: 'arrow', icon: '➡️' },
    { name: 'text', icon: 'T' },
  ];

  const colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
  ];

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Get context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    
    setContext(ctx);

    // Load initial drawing if provided
    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialDrawing;
    }

    // Handle window resize
    const handleResize = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      if (tempCtx) {
        ctx.drawImage(tempCanvas, 0, 0);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [initialDrawing, color, lineWidth]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!context) return;

    setIsDrawing(true);
    
    const { x, y } = getCoordinates(e);
    setStartPos({ x, y });
    setCurrentPos({ x, y });

    if (tool === 'pen') {
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;

    const { x, y } = getCoordinates(e);
    setCurrentPos({ x, y });

    if (tool === 'pen') {
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const endDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;

    if (tool !== 'pen') {
      const { x, y } = startPos;
      const { x: currentX, y: currentY } = currentPos;

      context.beginPath();

      switch (tool) {
        case 'rectangle':
          context.rect(x, y, currentX - x, currentY - y);
          context.stroke();
          break;
        case 'circle':
          const radius = Math.sqrt(Math.pow(currentX - x, 2) + Math.pow(currentY - y, 2));
          context.arc(x, y, radius, 0, 2 * Math.PI);
          context.stroke();
          break;
        case 'arrow':
          drawArrow(context, x, y, currentX, currentY);
          break;
        case 'text':
          const text = prompt('Enter text:');
          if (text) {
            context.font = '20px Arial';
            context.fillStyle = color;
            context.fillText(text, x, y);
          }
          break;
      }
    }

    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    // Check if it's a touch event
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert client coordinates to canvas coordinates
    const x = Math.max(0, Math.min(canvas.width, canvas.width * (clientX - rect.left) / canvas.offsetWidth));
    const y = Math.max(0, Math.min(canvas.height, canvas.height * (clientY - rect.top) / canvas.offsetHeight));

    return { x, y };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw the arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveDrawing = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="drawing-canvas-container">
      <div className="drawing-toolbar">
        <div className="tool-section">
          {tools.map((t) => (
            <button
              key={t.name}
              className={`tool-button ${tool === t.name ? 'active' : ''}`}
              onClick={() => setTool(t.name)}
              title={t.name}
            >
              {t.icon}
            </button>
          ))}
        </div>
        
        <div className="tool-section">
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            title="Brush Size"
          />
        </div>
        
        <div className="color-section">
          {colors.map((c) => (
            <button
              key={c}
              className={`color-button ${color === c ? 'active' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
        
        <button className="clear-button" onClick={clearCanvas} title="Clear Canvas">
          🗑️
        </button>
      </div>
      
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      
      <div className="drawing-actions">
        <button className="action-button save-button" onClick={saveDrawing}>
          Save
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvas;