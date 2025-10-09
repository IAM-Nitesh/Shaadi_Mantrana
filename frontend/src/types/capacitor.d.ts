// Extended Window interface for Capacitor global
interface Window {
  Capacitor?: {
    isNativePlatform: () => boolean;
    getPlatform: () => string;
    convertFileSrc?: (path: string) => string;
    registerPlugin?: (name: string, plugin: any) => any;
  };
}