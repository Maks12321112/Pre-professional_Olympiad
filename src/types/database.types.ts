export type Equipment = {
  id: string;
  name: string;
  quantity: number;
  status: 'new' | 'in_use' | 'broken';
  category_id: string | null;
  description?: string;
  owner?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
};

export type EquipmentCategory = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
};

export type RequestType = 'item' | 'category' | 'repair' | 'purchase';

export type Request = {
  id: string;
  type: RequestType;
  name: string;
  description?: string;
  quantity?: number;
  category_id?: string;
  equipment_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  user_id: string;
  best_price?: number;
  purchase_url?: string;
  seller?: string;
  bought?: boolean;
};