import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private _isOpen = new BehaviorSubject<boolean>(true);
  isOpen$ = this._isOpen.asObservable();
  isOpen = signal(true);

  toggle() {
    const newValue = !this.isOpen();
    this._isOpen.next(newValue);
    this.isOpen.set(newValue);
  }

  close() {
    this._isOpen.next(false);
    this.isOpen.set(false);
  }

  open() {
    this._isOpen.next(true);
    this.isOpen.set(true);
  }
}