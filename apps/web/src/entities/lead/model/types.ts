export interface Lead {
  id: string;
  name: string;
  contact: string;
  budget: string;
  description: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
}
