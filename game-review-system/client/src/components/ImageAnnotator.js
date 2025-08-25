import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import {
  Box,
  IconButton,
  Tooltip,
  ButtonGroup,
  Slider,
  Typography,
  Button,
  Paper
} from '@mui/material';
import {
  Brush,
  Rectangle,
  Circle,
  TextFields,
  Undo,
  Redo,
  Delete,
  Save,
  Clear
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const ImageAnnotator = ({ imageUrl, originalFilename, onSave }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [drawingMode, setDrawingMode] = useState('select');
  const [brushWidth, setBrushWidth] = useState(5);
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#2a2a2a'
    });

    // Load the image
    fabric.Image.fromURL(imageUrl, (img) => {
      const scale = Math.min(
        fabricCanvas.width / img.width,
        fabricCanvas.height / img.height
      );
      
      img.scale(scale);
      img.set({
        left: (fabricCanvas.width - img.width * scale) / 2,
        top: (fabricCanvas.height - img.height * scale) / 2,
        selectable: false,
        evented: false
      });
      
      fabricCanvas.add(img);
      fabricCanvas.sendToBack(img);
      fabricCanvas.renderAll();
      
      // Save initial state
      saveHistory(fabricCanvas);
    });

    // Set up drawing brush
    fabricCanvas.freeDrawingBrush.color = brushColor;
    fabricCanvas.freeDrawingBrush.width = brushWidth;

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, [imageUrl]);

  const saveHistory = (canvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => [...prev.slice(0, historyStep + 1), json]);
    setHistoryStep(prev => prev + 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      canvas.loadFromJSON(history[newStep], () => {
        canvas.renderAll();
        setHistoryStep(newStep);
      });
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      canvas.loadFromJSON(history[newStep], () => {
        canvas.renderAll();
        setHistoryStep(newStep);
      });
    }
  };

  const setMode = (mode) => {
    setDrawingMode(mode);
    canvas.isDrawingMode = mode === 'draw';
    
    if (mode === 'draw') {
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    }
  };

  const addShape = (shapeType) => {
    let shape;
    
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: 'transparent',
          stroke: brushColor,
          strokeWidth: 2
        });
        break;
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: 'transparent',
          stroke: brushColor,
          strokeWidth: 2
        });
        break;
      case 'text':
        shape = new fabric.IText('Add text here', {
          left: 100,
          top: 100,
          fontFamily: 'Arial',
          fontSize: 20,
          fill: brushColor
        });
        break;
      default:
        return;
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    saveHistory(canvas);
  };

  const deleteSelected = () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
      saveHistory(canvas);
    }
  };

  const clearAnnotations = () => {
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj.type !== 'image') {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
    saveHistory(canvas);
  };

  const saveAnnotatedImage = async () => {
    try {
      const dataURL = canvas.toDataURL('image/png');
      
      const response = await axios.post('/api/upload/save-annotation', {
        imageData: dataURL,
        originalFilename: originalFilename
      });
      
      toast.success('Annotated image saved!');
      if (onSave) {
        onSave(response.data.file);
      }
    } catch (error) {
      console.error('Error saving annotated image:', error);
      toast.error('Failed to save annotated image');
    }
  };

  useEffect(() => {
    if (canvas) {
      canvas.freeDrawingBrush.color = brushColor;
    }
  }, [brushColor, canvas]);

  useEffect(() => {
    if (canvas) {
      canvas.freeDrawingBrush.width = brushWidth;
    }
  }, [brushWidth, canvas]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ButtonGroup variant="contained">
            <Tooltip title="Select">
              <IconButton
                onClick={() => setMode('select')}
                color={drawingMode === 'select' ? 'primary' : 'default'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M3,3V21L7,17L11,21V3H3Z" />
                </svg>
              </IconButton>
            </Tooltip>
            <Tooltip title="Draw">
              <IconButton
                onClick={() => setMode('draw')}
                color={drawingMode === 'draw' ? 'primary' : 'default'}
              >
                <Brush />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <ButtonGroup variant="outlined">
            <Tooltip title="Rectangle">
              <IconButton onClick={() => addShape('rectangle')}>
                <Rectangle />
              </IconButton>
            </Tooltip>
            <Tooltip title="Circle">
              <IconButton onClick={() => addShape('circle')}>
                <Circle />
              </IconButton>
            </Tooltip>
            <Tooltip title="Text">
              <IconButton onClick={() => addShape('text')}>
                <TextFields />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Color:</Typography>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              style={{ width: 40, height: 30, border: 'none', borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
            <Typography variant="body2">Size:</Typography>
            <Slider
              value={brushWidth}
              onChange={(e, newValue) => setBrushWidth(newValue)}
              min={1}
              max={50}
              sx={{ flex: 1 }}
            />
          </Box>

          <ButtonGroup variant="outlined">
            <Tooltip title="Undo">
              <IconButton onClick={undo} disabled={historyStep <= 0}>
                <Undo />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton onClick={redo} disabled={historyStep >= history.length - 1}>
                <Redo />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Selected">
              <IconButton onClick={deleteSelected}>
                <Delete />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear All">
              <IconButton onClick={clearAnnotations}>
                <Clear />
              </IconButton>
            </Tooltip>
          </ButtonGroup>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={saveAnnotatedImage}
          >
            Save Annotated
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, backgroundColor: '#1e1e1e' }}>
        <canvas ref={canvasRef} />
      </Paper>
    </Box>
  );
};

export default ImageAnnotator;