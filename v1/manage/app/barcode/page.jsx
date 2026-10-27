"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import Barcode, { BarcodeInput } from "@/components/Barcode";

export default function BarcodePage() {
  const [scan, setScan] = useState("");
  const [selected, setSelected] = useState([]);
  const product = useQuery(api.products.getProductByItemId, scan ? { itemId: scan } : "skip") || null;
  const all = useQuery(api.products.getAll, { limit: 1000 }) || [];

  const onScan = (code) => {
    setScan(code);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">BARCODE TOOLS</p>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Scan / Print Labels</h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(all.map(p => p.itemId))} className="px-3 py-2 bg-gray-100 rounded">Select All</button>
              <button onClick={() => setSelected([])} className="px-3 py-2 bg-gray-100 rounded">Clear</button>
              <button onClick={() => printMultiple(selected.length ? selected : all.map(p => p.itemId))} className="px-3 py-2 bg-gray-900 text-white rounded">Print Selected</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">
            <p className="text-sm text-gray-600 mb-2">Scan barcode or type Item ID:</p>
            <BarcodeInput onScan={onScan} placeholder="Scan or type item id..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Scanned product</p>
              {scan ? (
                product ? (
                  <div className="flex gap-4 items-start">
                    <div className="w-28 h-28 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      {product.mainImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">No image</div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold">{product.name} ({product.itemId})</p>
                      <p className="text-sm text-gray-500">Price: ₹{product.price}</p>

                      <div className="mt-4">
                        <Barcode value={product.itemId} width={2} height={80} printable={true} dataItem={product.itemId} />
                        <div className="mt-3">
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No product found for <span className="font-mono">{scan}</span></p>
                )
              ) : (
                <p className="text-sm text-gray-500">Scan or select a product to view barcode.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">All products (click to preview)</p>
              <div className="max-h-80 overflow-auto">
                {all.map(p => (
                  <div key={p._id} className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.itemId)}
                        onChange={(e) => {
                          if (e.target.checked) setSelected(prev => [...prev, p.itemId]);
                          else setSelected(prev => prev.filter(id => id !== p.itemId));
                        }}
                      />
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                        {p.mainImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.mainImage} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">—</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{p.itemId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setScan(p.itemId)} className="px-3 py-1 bg-gray-100 rounded">Preview</button>
                      <button onClick={() => printMultiple([p.itemId])} className="px-3 py-1 bg-gray-900 text-white rounded">Print</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function printMultiple(itemIds) {
  if (!itemIds || !itemIds.length) return alert('No products selected');
  const ids = itemIds.map(i => String(i));
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>Labels</title><style>
    @page { size: 50mm 25mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { background: #fff; display: flex; flex-direction: column; }
    /* Each printed page should contain exactly one label sized to the page */
    .label { width: 50mm; height: 25mm; box-sizing: border-box; display:flex; align-items:center; justify-content:center; padding:2mm; page-break-after: always; }
    .label-inner { width: 100%; height: 100%; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    svg { width: 100%; height: auto; }
    .id-text { font-family: monospace; font-weight: 700; font-size: 10px; text-align: center; margin-top: 4px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style></head><body>
    ${ids.map((id, idx) => `<div class="label"><div class="label-inner"><svg id="b${idx}"></svg><div class="id-text">${id}</div></div></div>`).join('')}
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <script>
      const ids = ${JSON.stringify(ids)};
      ids.forEach((val, i) => {
        try {
          const svg = document.getElementById('b'+i);
          JsBarcode(svg, val, {
            format: 'CODE128',
            displayValue: false,
            height: 36,
            width: 2,
            margin: 0,
            lineColor: '#000'
          });
        } catch (e) { console.error(e); }
      });
      // Give rendering a moment then print
      setTimeout(() => { window.print(); setTimeout(() => window.close(), 300); }, 300);
    </script>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  if (!w) alert('Please allow popups to print barcode');
}
