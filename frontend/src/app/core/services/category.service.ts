import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/categories`;

  // Signals State
  private readonly _categories = signal<CategoryDto[]>([]);
  public readonly categories = this._categories.asReadonly();

  private readonly _loading = signal<boolean>(false);
  public readonly loading = this._loading.asReadonly();

  loadCategories(): Observable<CategoryDto[]> {
    this._loading.set(true);
    return this.http.get<CategoryDto[]>(this.baseUrl).pipe(
      tap({
        next: (items) => {
          this._categories.set(items);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        }
      })
    );
  }

  getById(id: number): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.baseUrl, dto).pipe(
      tap((created) => {
        this._categories.update(list => [...list, created]);
      })
    );
  }

  update(id: number, dto: UpdateCategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.baseUrl}/${id}`, dto).pipe(
      tap((updated) => {
        this._categories.update(list =>
          list.map(item => item.id === id ? updated : item)
        );
      })
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this._categories.update(list => list.filter(item => item.id !== id));
      })
    );
  }
}
