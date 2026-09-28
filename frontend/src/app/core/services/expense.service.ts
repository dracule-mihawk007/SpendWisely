import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ExpenseDto,
  CreateExpenseDto,
  ExpenseFilterDto
} from '../models/expense.model';
import { ScanPreviewDto } from '../models/receipt.model';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/expenses`;

  // Signals State
  private readonly _expenses = signal<ExpenseDto[]>([]);
  public readonly expenses = this._expenses.asReadonly();

  private readonly _loading = signal<boolean>(false);
  public readonly loading = this._loading.asReadonly();

  private readonly _activeFilter = signal<ExpenseFilterDto>({});
  public readonly activeFilter = this._activeFilter.asReadonly();

  loadExpenses(filter?: ExpenseFilterDto): Observable<ExpenseDto[]> {
    this._loading.set(true);
    const active = filter ?? {};
    this._activeFilter.set(active);

    let params = new HttpParams();

    if (active.fromDate) {
      params = params.set('fromDate', active.fromDate);
    }
    if (active.toDate) {
      params = params.set('toDate', active.toDate);
    }
    if (active.categoryId !== null && active.categoryId !== undefined) {
      params = params.set('categoryId', active.categoryId.toString());
    }

    return this.http.get<ExpenseDto[]>(this.baseUrl, { params }).pipe(
      tap({
        next: (items) => {
          this._expenses.set(items);
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
        }
      })
    );
  }

  getById(id: number): Observable<ExpenseDto> {
    return this.http.get<ExpenseDto>(`${this.baseUrl}/${id}`);
  }

  createExpense(dto: CreateExpenseDto): Observable<ExpenseDto> {
    return this.http.post<ExpenseDto>(this.baseUrl, dto).pipe(
      tap((created) => {
        this._expenses.update(list => [created, ...list]);
      })
    );
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this._expenses.update(list => list.filter(item => item.id !== id));
      })
    );
  }

  getMonthlyTotal(categoryId: number, year: number, month: number): Observable<number> {
    const params = new HttpParams()
      .set('categoryId', categoryId.toString())
      .set('year', year.toString())
      .set('month', month.toString());

    return this.http.get<number>(`${this.baseUrl}/monthly-total`, { params });
  }

  scanReceipt(file: File): Observable<ScanPreviewDto> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<ScanPreviewDto>(`${this.baseUrl}/scan`, formData);
  }
}
