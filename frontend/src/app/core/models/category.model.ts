export interface CategoryDto {
  id: number;
  name: string;
  monthlyBudgetLimit: number;
  colorHex: string;
  icon: string;
}

export interface CreateCategoryDto {
  name: string;
  monthlyBudgetLimit: number;
  colorHex: string;
  icon: string;
}

export interface UpdateCategoryDto {
  name: string;
  monthlyBudgetLimit: number;
  colorHex: string;
  icon: string;
}
