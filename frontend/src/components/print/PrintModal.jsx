/**
 * PrintModal — Orkestrasi print untuk semua jenis laporan
 *
 * Cara kerja:
 * 1. Fetch data laporan berdasarkan id + type
 * 2. Render print view ke div#print-root (portal ke body)
 * 3. Panggil window.print()
 * 4. Cleanup setelah dialog cetak ditutup
 *
 * Props:
 *   type     : 'qclab-shift' | 'mdf' | 'chipper' | 'cooling' | 'imal' | 'sanding' | 'kertas-pasir' | 'daily-test'
 *   id       : ID record
 *   token    : JWT
 *   onClose  : callback setelah selesai / error
 *
 * Dipakai di tombol Print dari luar (tidak perlu mount JSX di parent):
 *   <PrintModal type="qclab-shift" id={row.id} token={token} onClose={() => {}} />
 */

import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';

// Print views per jenis laporan
import PrintQcLabShift  from './views/PrintQcLabShift';
import PrintMdf         from './views/PrintMdf';
import PrintChipper     from './views/PrintChipper';
import PrintCooling     from './views/PrintCooling';
import PrintImal        from './views/PrintImal';
import PrintSanding     from './views/PrintSanding';
import PrintKertasPasir from './views/PrintKertasPasir';
import PrintDailyTest   from './views/PrintDailyTest';

const API_URL = `http://${window.location.hostname}:5000/api`;

// Map type → endpoint dan komponen print view
const CONFIG = {
  'qclab-shift':  { endpoint: (id) => `${API_URL}/laporan-qclab-shift/${id}`,  View: PrintQcLabShift  },
  'mdf':          { endpoint: (id) => `${API_URL}/laporan-mdf/${id}`,           View: PrintMdf         },
  'chipper':      { endpoint: (id) => `${API_URL}/laporan-chipper/${id}`,       View: PrintChipper     },
  'cooling':      { endpoint: (id) => `${API_URL}/laporan-cooling/${id}`,       View: PrintCooling     },
  'imal':         { endpoint: (id) => `${API_URL}/laporan-imal/${id}`,          View: PrintImal        },
  'sanding':      { endpoint: (id) => `${API_URL}/laporan-sanding/${id}`,       View: PrintSanding     },
  'kertas-pasir': { endpoint: (id) => `${API_URL}/laporan-kertas-pasir/${id}`,  View: PrintKertasPasir },
  'daily-test':   { endpoint: (id) => `${API_URL}/laporan-daily-test/${id}`,    View: PrintDailyTest   },
};

/**
 * usePrint — hook untuk trigger print dari tombol
 * Return: { triggerPrint, isPrinting }
 */
export const usePrint = () => {
  const isPrinting = useRef(false);

  const triggerPrint = async ({ type, id, token, onError }) => {
    if (isPrinting.current) return;
    isPrinting.current = true;

    const cfg = CONFIG[type];
    if (!cfg) {
      console.error(`[PrintModal] Unknown type: ${type}`);
      isPrinting.current = false;
      return;
    }

    try {
      const res  = await axios.get(cfg.endpoint(id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.laporan;

      // Buat / pakai div#print-root
      let root = document.getElementById('print-root');
      if (!root) {
        root = document.createElement('div');
        root.id = 'print-root';
        document.body.appendChild(root);
      }

      // Render print view ke root menggunakan React
      const reactRoot = createRoot(root);
      reactRoot.render(<cfg.View data={data} />);

      // Tunggu render selesai (microtask + 1 frame)
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 120)));

      window.print();

      // Cleanup setelah dialog ditutup
      window.addEventListener(
        'afterprint',
        () => {
          reactRoot.unmount();
          root.innerHTML = '';
          isPrinting.current = false;
        },
        { once: true }
      );
    } catch (err) {
      console.error('[PrintModal] Error:', err);
      isPrinting.current = false;
      if (onError) onError(err.response?.data?.message || 'Gagal memuat data cetak.');
    }
  };

  return { triggerPrint };
};

export default usePrint;
