
import { Buffer } from 'buffer';

// Make Buffer available globally for blockchain libraries
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window.global || window;
  
  // Type-safe process polyfill for browser environment
  if (!window.process) {
    (window as any).process = { 
      env: {},
      nextTick: (callback: Function) => setTimeout(callback, 0),
      browser: true
    };
  }
}
