import { VirtualFile } from "./types";

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: "Frontend" | "Backend" | "Fullstack";
  files: VirtualFile[];
}

export const SAMPLE_PROJECTS: ProjectTemplate[] = [
  {
    id: "express-api",
    name: "Express REST API Backend",
    description: "A Node.js & Express REST interface managing a virtual workspace with CRUD endpoints.",
    category: "Backend",
    files: [
      {
        path: "package.json",
        name: "package.json",
        content: `{
  "name": "workspace-api-server",
  "version": "1.0.0",
  "description": "Secure express backend for workspace operations",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.2.1"
  }
}`,
        size: 389,
        extension: "json",
        includedInContext: true,
      },
      {
        path: "src/index.js",
        name: "index.js",
        content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { taskRouter } from './routes/tasks.js';
import { loggerMiddleware } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// Routes
app.use('/api/tasks', taskRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use((err, req, res, next) => {
  console.error('[Global Error]:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(\`[Server] Workspace API running on port \${PORT}\`);
});`,
        size: 692,
        extension: "js",
        includedInContext: true,
      },
      {
        path: "src/middleware/logger.js",
        name: "logger.js",
        content: `export function loggerMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.originalUrl} \${res.statusCode} - \${duration}ms\`);
  });
  next();
}`,
        size: 236,
        extension: "js",
        includedInContext: false,
      },
      {
        path: "src/routes/tasks.js",
        name: "tasks.js",
        content: `import { Router } from 'express';

export const taskRouter = Router();

// In-memory data store for the workspace sample
let tasks = [
  { id: '1', title: 'Compile metadata blueprint', completed: true, priority: 'high' },
  { id: '2', title: 'Audit API route middleware patterns', completed: false, priority: 'medium' },
  { id: '3', title: 'Refactor Express index entrypoint', completed: false, priority: 'low' }
];

taskRouter.get('/', (req, res) => {
  const { priority } = req.query;
  if (priority) {
    return res.json(tasks.filter(t => t.priority === priority));
  }
  res.json(tasks);
});

taskRouter.post('/', (req, res) => {
  const { title, priority } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required for tasks' });
  }
  
  const newTask = {
    id: String(tasks.length + 1),
    title,
    completed: false,
    priority: priority || 'medium'
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

taskRouter.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { completed, title, priority } = req.body;
  
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  if (completed !== undefined) task.completed = completed;
  if (title !== undefined) task.title = title;
  if (priority !== undefined) task.priority = priority;
  
  res.json(task);
});

taskRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  tasks = tasks.filter(t => t.id !== id);
  res.status(204).send();
});`,
        size: 1395,
        extension: "js",
        includedInContext: true,
      },
      {
        path: ".env.example",
        name: ".env.example",
        content: `PORT=5000
MONGO_URI=mongodb://localhost:27017/workspace
JWT_SECRET=your_super_secret_session_key_goes_here`,
        size: 120,
        extension: "example",
        includedInContext: false,
      },
    ],
  },
  {
    id: "react-calculator",
    name: "React TypeScript Unit Metrics",
    description: "A sleek dashboard calculating metric system conversions with visual responsive components.",
    category: "Frontend",
    files: [
      {
        path: "src/App.tsx",
        name: "App.tsx",
        content: `import React, { useState } from 'react';
import { Calculator, ArrowRightLeft, Sparkles } from 'lucide-react';

export default function App() {
  const [val, setVal] = useState<number>(1);
  const [direction, setDirection] = useState<'km-to-mi' | 'mi-to-km'>('km-to-mi');

  const convert = (v: number) => {
    if (direction === 'km-to-mi') {
      return (v * 0.621371).toFixed(3);
    }
    return (v / 0.621371).toFixed(3);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Metric Converter</h1>
            <p className="text-xs text-slate-400">Quick geospatial length estimates</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Value to convert</label>
            <input
              type="number"
              value={val}
              onChange={(e) => setVal(Number(e.target.value))}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setDirection(d => d === 'km-to-mi' ? 'mi-to-km' : 'km-to-mi')}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Switch conversion order
          </button>

          <div className="bg-indigo-950/40 border border-indigo-900/50 p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium">Result:</span>
            <span className="text-xl font-bold text-indigo-400">
              {val} {direction === 'km-to-mi' ? 'km' : 'mi'} = {convert(val)} {direction === 'km-to-mi' ? 'mi' : 'km'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}`,
        size: 1912,
        extension: "tsx",
        includedInContext: true,
      },
      {
        path: "package.json",
        name: "package.json",
        content: `{
  "name": "metric-converter-react",
  "private": true,
  "version": "0.1.0",
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lucide-react": "^0.390.0"
  },
  "devDependencies": {
    "typescript": "^5.0.2",
    "vite": "^5.2.0"
  }
}`,
        size: 228,
        extension: "json",
        includedInContext: false,
      },
    ],
  },
  {
    id: "fastapi-python",
    name: "Python FastAPI Ground Control",
    description: "A lightweight FastAPI application featuring background orchestration and schema parsing.",
    category: "Backend",
    files: [
      {
        path: "main.py",
        name: "main.py",
        content: `from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(
    title="Ground Control System API",
    description="Automated orchestration layer for project telemetry analysis",
    version="1.4.0"
)

# InMemory Database
telemetry_log = []

class MetricPayload(BaseModel):
    metric_name: str
    value: float
    timestamp: Optional[float] = None
    cluster_node: str = "node-alpha-1"

@app.get("/")
def read_root():
    return {
        "service": "Ground Control Operations",
        "api_status": "online",
        "active_connections": 12,
        "engine_version": "9.2.0"
    }

@app.post("/api/metrics", response_model=MetricPayload, status_code=201)
def record_metric(payload: MetricPayload):
    if payload.value < 0:
        raise HTTPException(status_code=400, detail="Metric value cannot be lower than absolute zero")
    
    if not payload.timestamp:
        payload.timestamp = time.time()
        
    telemetry_log.append(payload)
    return payload

@app.get("/api/metrics", response_model=List[MetricPayload])
def get_metrics(node: Optional[str] = None):
    if node:
        return [m for m in telemetry_log if m.cluster_node.lower() == node.lower()]
    return telemetry_log`,
        size: 1198,
        extension: "py",
        includedInContext: true,
      },
      {
        path: "requirements.txt",
        name: "requirements.txt",
        content: `fastapi>=0.110.0
pydantic>=2.6.0
uvicorn>=0.27.0
requests>=2.31.0
pytest>=8.1.0`,
        size: 89,
        extension: "txt",
        includedInContext: false,
      },
    ],
  },
];
