export interface CategoryRecord {
  id: string;
  parentCategoryId: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'Expense' | 'Income';
  isDefault: boolean;
}

export interface CategoryTreeNode extends CategoryRecord {
  children: CategoryRecord[];
}
