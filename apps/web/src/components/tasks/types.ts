// Type aliases for better maintainability
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  farmId: string;
  createdAt: string;
  updatedAt: string;
}

// Extended task interface with additional properties
export interface ExtendedTask extends Task {
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  timeSpent?: number;
  timerActive?: boolean;
  subtasks?: Task[];
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

// Task form data interface
export interface TaskFormData {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeId?: string;
  farmId: string;
  estimatedHours?: number;
  tags?: string[];
}

// Task template interface
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  taskTemplate: {
    title: string;
    description?: string;
    priority: TaskPriority;
    estimatedHours?: number;
    tags?: string[];
    checklist?: string[];
  };
  category: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}
