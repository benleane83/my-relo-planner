export interface Location {
  city: string;
  country: string;
}

export interface FamilyMember {
  name: string;
  notes: string;
}

export interface Config {
  origin: Location;
  destination: Location;
  moveDate: string;
  familyMembers: FamilyMember[];
  originCurrency: string;
  destinationCurrency: string;
  conversionRate: number;
}

export interface ResearchTopic {
  slug: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'done';
  lastUpdated: string;
  tags: string[];
  content?: string;
}

export interface Milestone {
  id: string;
  title: string;
  category: string;
  targetDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  milestone?: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  notes: string;
}

export interface ShoppingItem {
  id: string;
  item: string;
  category: 'furniture' | 'electronics' | 'household' | 'clothing' | 'other';
  quantity: number;
  estimatedCost: number;
  actualCost: number;
  currency: string;
  status: 'needed' | 'researching' | 'purchased' | 'shipped';
  store: string;
  notes: string;
}

export interface ShoppingBudget {
  total: number;
  categories: Record<string, number>;
}

export interface ShoppingData {
  budget: ShoppingBudget;
  items: ShoppingItem[];
}
