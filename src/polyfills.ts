
import { Buffer } from 'buffer';

// Make Buffer available globally for blockchain libraries
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window.global || window;
  window.process = window.process || { env: {} };
}
