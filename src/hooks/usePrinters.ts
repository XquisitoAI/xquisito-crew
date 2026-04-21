import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface Printer {
  ip: string;
  port: number;
  // Campos que vienen del backend/Supabase al sincronizar
  id?: string;
  name?: string | null;
  role?: "bar" | "kitchen" | "other" | "all" | null;
  is_active?: boolean;
}

export interface UsbPrinterDevice {
  device_name: string;
  vendor_id: number;
  product_id: number;
  is_printer_class?: boolean;
}

export function usePrinters() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [scanning, setScanning] = useState(false);
  const [testingIp, setTestingIp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── WiFi ────────────────────────────────────────────────

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const found = await invoke<Printer[]>("scan_printers");
      setPrinters(found);
      return found;
    } catch (err: any) {
      setError(err?.message || String(err));
      return [];
    } finally {
      setScanning(false);
    }
  }, []);

  const printTest = useCallback(async (ip: string, port = 9100) => {
    setTestingIp(ip);
    try {
      await invoke("print_test", { ip, port });
    } catch (err: any) {
      setError(err?.message || String(err));
      throw err;
    } finally {
      setTestingIp(null);
    }
  }, []);

  const printRaw = useCallback(async (ip: string, port: number, data: number[]) => {
    await invoke("print_raw", { ip, port, data });
  }, []);

  // ── USB ─────────────────────────────────────────────────

  const [usbDevices, setUsbDevices] = useState<UsbPrinterDevice[]>([]);
  const [scanningUsb, setScanningUsb] = useState(false);
  const [testingUsbDevice, setTestingUsbDevice] = useState<string | null>(null);

  const scanUsb = useCallback(async () => {
    setScanningUsb(true);
    setError(null);
    try {
      const found = await invoke<UsbPrinterDevice[]>("list_usb_printers");
      setUsbDevices(found);
      return found;
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(msg);
      throw new Error(msg);
    } finally {
      setScanningUsb(false);
    }
  }, []);

  const printTestUsb = useCallback(async (printerName: string) => {
    setTestingUsbDevice(printerName);
    try {
      await invoke("print_test_usb", { printerName });
    } catch (err: any) {
      setError(err?.message || String(err));
      throw err;
    } finally {
      setTestingUsbDevice(null);
    }
  }, []);

  return {
    printers,
    setPrinters,
    scanning,
    testingIp,
    error,
    scan,
    printTest,
    printRaw,
    // USB
    usbDevices,
    scanningUsb,
    testingUsbDevice,
    scanUsb,
    printTestUsb,
  };
}
