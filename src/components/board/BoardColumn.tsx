"use client";

import { FiPlus } from "react-icons/fi";
import TaskCard from "./TaskCard";
import { useState } from "react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  assignee?: {
    name: string;
    color: string;
  };
  labels?: Label[];
}

interface BoardColumnProps {
  columnId: string;
  title: string;
  tasks: Task[];
  badgeColor?: string;
  onAddTask?: () => void;
  onColumnClick?: () => void;
  onTaskClick?: (taskId: string) => void;
  onTaskMove?: (taskId: string, sourceColumnId: string, targetColumnId: string) => void;
  onDragStart?: (taskId: string) => void;
  onDragEnd?: () => void;
  draggedTask?: string | null;
}

export default function BoardColumn({
  columnId,
  title,
  tasks,
  badgeColor = "bg-spotlight-purple",
  onAddTask = () => console.log("Add task clicked"),
  onColumnClick = () => console.log("Column clicked"),
  onTaskClick = (taskId) => console.log("Task clicked:", taskId),
  onTaskMove = (taskId, sourceColumnId, targetColumnId) => console.log("Move task:", taskId, sourceColumnId, targetColumnId),
  onDragStart = (taskId) => console.log("Drag start:", taskId),
  onDragEnd = () => console.log("Drag end"),
  draggedTask = null
}: BoardColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set isDragOver to false if we're leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Clear drag state immediately when drop happens
    onDragEnd();
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData("application/json"));
      const { taskId, sourceColumnId } = dragData;
      
      if (sourceColumnId !== columnId) {
        onTaskMove(taskId, sourceColumnId, columnId);
      }
    } catch (error) {
      console.error("Error parsing drag data:", error);
    }
  };

  const handleTaskDragStart = (e: React.DragEvent, task: Task) => {
    onDragStart(task.id);
  };

  const handleTaskDragEnd = () => {
    onDragEnd();
  };

  return (
    <div 
      className={`flex flex-col h-fit min-w-[280px] w-80 ${
        isDragOver ? 'ring-2 ring-spotlight-purple ring-opacity-50' : ''
      }`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="relative flex w-full items-center gap-3 mb-2 bg-background-secondary p-3 rounded-lg group">
        {/* Clickable header area */}
        <button
          onClick={onColumnClick}
          className="flex items-center gap-3 flex-1 text-left hover:bg-background-tertiary/50 rounded-md p-1 -m-1 transition-all duration-200"
        >
          <div className={`w-3 h-3 rounded-full ${badgeColor} shadow-sm`} />
          <h2 className="text-text-primary font-display font-medium text-base">
            {title}
          </h2>
        </button>
        
        {/* Add Task Button */}
        <button 
          className="bg-spotlight-purple/20 p-1.5 rounded-full cursor-pointer text-text-tertiary hover:bg-spotlight-purple hover:text-text-primary transition-all duration-200 opacity-70 group-hover:opacity-100" 
          onClick={onAddTask}
          title="Add Task"
        >
          <FiPlus size={14} />
        </button>
      </div>

      {/* Tasks Container */}
      <div className={`flex-1 space-y-3 pr-1 pt-2 min-h-[200px] rounded-lg transition-colors duration-200 ${
        isDragOver ? 'bg-background-secondary/30' : ''
      }`}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            columnId={columnId}
            onClick={() => onTaskClick(task.id)}
            onDragStart={handleTaskDragStart}
            onDragEnd={handleTaskDragEnd}
            isDragging={draggedTask === task.id}
            className={`${Math.random() > 0.5 ? 'rotate-slight hover:rotate-1' : 'rotate-slight-reverse hover:-rotate-1'} transition-transform duration-200 border-2 ${
              ['border-spotlight-purple', 'border-spotlight-pink', 'border-spotlight-blue', 'border-spotlight-green'][
                Math.floor(Math.random() * 4)
              ]
            }`}
          />
        ))}
        
        {/* Drop zone indicator when dragging */}
        {isDragOver && tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-spotlight-purple rounded-lg text-text-secondary">
            Drop task here
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <div className="mt-6">
        <button
          onClick={onAddTask}
          className="w-full p-1 rounded-xl bg-background-secondary/50 hover:bg-background-secondary border-2 border-dashed border-text-tertiary hover:border-spotlight-purple text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer font-display font-medium text-sm flex items-center justify-center gap-2"
        >
          <FiPlus size={16} />
          Add Task
        </button>
      </div>
    </div>
  );
}