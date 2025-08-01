function generateCSS() {
   
   return `
       * {
           margin: 0;
           padding: 0;
           box-sizing: border-box;
       }
       
       body {
           font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           background: #0a0f0a;
           color: #e2f0e2;
           line-height: 1.5;
       }
       
       .container {
           max-width: 1400px;
           margin: 0 auto;
           padding: 0.75rem;
       }
       
       .header {
           text-align: center;
           margin-bottom: 1.5rem;
           padding: 1rem;
           background: linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%);
           border-radius: 8px;
           border: 1px solid #3a5a3a;
       }
       
       .header h1 {
           color: #10b981;
           font-size: 2rem;
           font-weight: 700;
           margin-bottom: 0.25rem;
           text-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
       }
       
       .header p {
           color: #a0c0a0;
           font-size: 1rem;
       }
       
       .status {
           background: #1a2e1a;
           border: 1px solid #3a5a3a;
           border-radius: 6px;
           padding: 0.75rem;
           margin-bottom: 1.5rem;
           text-align: center;
       }
       
       #status-text {
           font-weight: 600;
           color: #10b981;
           font-size: 1rem;
       }
       
       #status-info {
           color: #a0c0a0;
           font-size: 0.85rem;
           margin-top: 0.25rem;
       }
       
       .grid {
           display: grid;
           grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
           gap: 1rem;
       }
       
       .card {
           background: #1a2e1a;
           border: 1px solid #3a5a3a;
           border-radius: 8px;
           padding: 1rem;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
       }
       
       .card h2 {
           color: #e8f5e8;
           margin-bottom: 0.75rem;
           font-size: 1.2rem;
           font-weight: 600;
       }
       
       .card.patch h2 {
           color: #84cc16;
       }
       
       .card.snapshot h2 {
           color: #22d3ee;
       }
       
       .card.history h2 {
           color: #06b6d4;
       }
       
       .card.files h2 {
           color: #10b981;
       }
       
       .card.future h2 {
           color: #65a30d;
       }
       
       /* Enhanced Snapshot Management Styles */
       .card.snapshot {
           max-height: 400px;
           display: flex;
           flex-direction: column;
       }
       
       .card.snapshot h2 {
           flex-shrink: 0;
       }
       
       .snapshot-controls {
           flex-shrink: 0;
           margin-bottom: 0.75rem;
       }
       
       .snapshot-list-container {
           flex: 1;
           min-height: 0;
           display: flex;
           flex-direction: column;
       }
       
       .snapshot-list {
           flex: 1;
           margin: 0;
           overflow-y: auto;
           background: #000000;
           border: 1px solid #2a4a2a;
           border-radius: 6px;
           padding: 0.5rem;
           font-size: 0.875rem;
           line-height: 1.4;
           scrollbar-width: thin;
           scrollbar-color: #3a5a3a #1a2e1a;
       }
       
       .snapshot-list::-webkit-scrollbar {
           width: 8px;
       }
       
       .snapshot-list::-webkit-scrollbar-track {
           background: #1a2e1a;
           border-radius: 4px;
       }
       
       .snapshot-list::-webkit-scrollbar-thumb {
           background: #3a5a3a;
           border-radius: 4px;
       }
       
       .snapshot-list::-webkit-scrollbar-thumb:hover {
           background: #4a6a4a;
       }
       
       .snapshot-info {
           flex-shrink: 0;
           color: #b0d0b0;
           font-size: 0.8rem;
           margin-top: 0.5rem;
           padding: 0.25rem 0;
       }
       
       .snapshot-list .empty-state {
           text-align: center;
           padding: 2rem 1rem;
           color: #70a070;
           font-style: italic;
           font-size: 0.875rem;
       }
       
       button {
           background: #10b981;
           color: #000000;
           border: none;
           padding: 0.5rem 1rem;
           border-radius: 6px;
           cursor: pointer;
           font-weight: 600;
           font-size: 0.875rem;
           transition: all 0.2s;
           margin: 0.25rem 0.25rem 0.25rem 0;
           display: inline-block;
       }
       
       button:hover {
           background: #059669;
           transform: translateY(-1px);
           box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
       }
       
       button.secondary {
           background: #4a6a4a;
           color: #e8f5e8;
       }
       
       button.secondary:hover {
           background: #3a5a3a;
           box-shadow: 0 4px 12px rgba(74, 106, 74, 0.4);
       }
       
       button.warning {
           background: #84cc16;
           color: #000000;
       }
       
       button.warning:hover {
           background: #65a30d;
           box-shadow: 0 4px 12px rgba(132, 204, 22, 0.4);
       }
       
       button.success {
           background: #10b981;
           color: #000000;
       }
       
       button.success:hover {
           background: #059669;
           box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
       }
       
       textarea {
           width: 100%;
           min-height: 180px;
           background: #000000;
           border: 1px solid #3a5a3a;
           border-radius: 6px;
           padding: 0.75rem;
           color: #e8f5e8;
           font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
           font-size: 0.85rem;
           line-height: 1.5;
           resize: vertical;
           margin-bottom: 0.75rem;
       }
       
       textarea:focus {
           outline: none;
           border-color: #10b981;
           box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
       }
       
       .info {
           color: #b0d0b0;
           font-size: 0.8rem;
           margin-top: 0.5rem;
           padding: 0.25rem 0;
       }
       
       .patch-history, .snapshot-list {
           margin-top: 0.75rem;
           max-height: 280px;
           overflow-y: auto;
           background: #000000;
           border: 1px solid #2a4a2a;
           border-radius: 6px;
           padding: 0.5rem;
           font-size: 0.875rem;
           line-height: 1.4;
       }
       
       .list-item {
           margin-bottom: 0.75rem;
           padding-bottom: 0.5rem;
           border-bottom: 1px solid #2a4a2a;
       }
       
       .list-item:last-child {
           margin-bottom: 0;
           border-bottom: none;
           padding-bottom: 0;
       }
       
       .item-main {
           display: block;
           font-weight: 600;
           color: #e8f5e8;
           margin-bottom: 0.25rem;
       }
       
       .item-meta {
           display: block;
           font-size: 0.75rem;
           color: #a0c0a0;
           margin-bottom: 0.25rem;
       }
       
       .item-link {
           color: #22d3ee;
           text-decoration: none;
           font-size: 0.8rem;
           font-weight: 500;
           transition: color 0.2s;
       }
       
       .item-link:hover {
           color: #67e8f9;
           text-decoration: underline;
       }
       
       .empty-state {
           text-align: center;
           padding: 1.5rem 1rem;
           color: #70a070;
           font-style: italic;
           font-size: 0.875rem;
       }
       
       .directory-tree {
           background: #000000;
           border: 1px solid #2a4a2a;
           border-radius: 6px;
           padding: 0.75rem;
           font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
           font-size: 0.8rem;
           max-height: 350px;
           overflow-y: auto;
           line-height: 1.3;
       }
       
       .tree-folder {
           color: #84cc16;
           font-weight: 600;
           margin: 0.1rem 0;
       }
       
       .tree-file {
           color: #c0d0c0;
           margin: 0.1rem 0;
       }
       
       .file-size {
           color: #a0c0a0;
           font-size: 0.75rem;
           margin-left: 0.5rem;
       }
       
       .tree-indent {
           margin-left: 1rem;
       }
       
       .file-list {
           max-height: 280px;
           overflow-y: auto;
           background: #000000;
           border: 1px solid #2a4a2a;
           border-radius: 6px;
           padding: 0.75rem;
           margin-top: 0.75rem;
       }
       
       .file-item {
           padding: 0.4rem;
           margin: 0.2rem 0;
           background: #1a2e1a;
           border-radius: 4px;
           font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
           font-size: 0.8rem;
           color: #e8f5e8;
       }
       
       .preview {
           margin-top: 1.5rem;
           background: #1a2e1a;
           border: 1px solid #3a5a3a;
           border-radius: 8px;
           padding: 1rem;
       }
       
       .preview h3 {
           color: #10b981;
           margin-bottom: 0.75rem;
       }
       
       .preview pre {
           background: #000000;
           border: 1px solid #2a4a2a;
           border-radius: 6px;
           padding: 0.75rem;
           overflow-x: auto;
           font-size: 0.8rem;
           line-height: 1.4;
           color: #e8f5e8;
       }
       
       .modal {
           display: none;
           position: fixed;
           top: 0;
           left: 0;
           width: 100%;
           height: 100%;
           background: rgba(0, 0, 0, 0.8);
           z-index: 1000;
           opacity: 0;
           transition: opacity 0.3s ease;
       }
       
       .modal.show {
           display: flex;
           align-items: center;
           justify-content: center;
           opacity: 1;
       }
       
       .modal-content {
           background: #1a2e1a;
           border: 1px solid #3a5a3a;
           border-radius: 8px;
           padding: 1.5rem;
           max-width: 80vw;
           max-height: 80vh;
           overflow-y: auto;
           position: relative;
           box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
       }
       
       .modal-close {
           position: absolute;
           top: 0.75rem;
           right: 0.75rem;
           background: #dc2626;
           color: #ffffff;
           border: none;
           width: 1.75rem;
           height: 1.75rem;
           border-radius: 50%;
           cursor: pointer;
           font-size: 1rem;
           font-weight: bold;
           display: flex;
           align-items: center;
           justify-content: center;
       }
       
       .modal-close:hover {
           background: #b91c1c;
       }
       
       .modal h3 {
           color: #10b981;
           margin-bottom: 1rem;
           font-size: 1.3rem;
       }
       
       .test-output {
           background: #000000;
           border: 1px solid #2a4a2a;
           border-radius: 6px;
           padding: 0.75rem;
           font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
           font-size: 0.8rem;
           line-height: 1.4;
           white-space: pre-wrap;
           word-wrap: break-word;
           max-height: 400px;
           overflow-y: auto;
           margin: 0.5rem 0;
           color: #e8f5e8;
       }
       
       .test-success {
           border-color: #10b981;
           color: #bbf7d0;
       }
       
       .test-error {
           border-color: #ef4444;
           color: #fecaca;
       }
       
       @media (max-width: 768px) {
           .container {
               padding: 0.5rem;
           }
           
           .grid {
               grid-template-columns: 1fr;
               gap: 0.75rem;
           }
           
           .header h1 {
               font-size: 1.75rem;
           }
           
           .card {
               padding: 0.75rem;
           }
           
           .modal-content {
               max-width: 95vw;
               max-height: 90vh;
               padding: 1rem;
           }
           
           /* Snapshot card mobile adjustments */
           .card.snapshot {
               max-height: 320px;
           }
           
           /* Reduce max-height on mobile for other scrollable areas */
           .patch-history, .snapshot-list, .directory-tree {
               max-height: 220px;
           }
           
           textarea {
               min-height: 150px;
           }
       }
       `;
}

module.exports = { generateCSS };
