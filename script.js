// script.js – Complete file viewer with ALL file types opening inside app (offline-capable)
(function() {
  "use strict";

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  // DOM refs
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const themeToggle = document.getElementById('themeToggle');
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  const folderPicker = document.getElementById('folderPicker');
  const filePicker = document.getElementById('filePicker');
  const androidFilePicker = document.getElementById('androidFilePicker');
  const fileList = document.getElementById('fileList');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const fileTypeBadge = document.getElementById('fileTypeBadge');
  const codeContent = document.getElementById('codeContent');
  const fileStats = document.getElementById('fileStats');
  const fileSearch = document.getElementById('fileSearch');

  // State
  let currentTheme = 'dark';
  let selectedFile = null;
  let allFiles = [];

  // All supported extensions
  const textExtensions = [
    '.java','.html','.css','.js','.ts','.json','.xml','.svg','.txt','.md',
    '.py','.c','.cpp','.h','.sh','.bat','.yml','.yaml','.toml','.ini','.cfg',
    '.log','.csv','.sql','.php','.rb','.go','.rs','.swift','.kt','.dart',
    '.vue','.jsx','.tsx','.scss','.less','.sass','.lua','.r','.pl','.pm'
  ];

  const imageExtensions = ['.jpg','.jpeg','.png','.gif','.bmp','.webp','.ico','.tiff','.avif','.svg'];
  const videoExtensions = ['.mp4','.webm','.ogg','.mov','.avi','.mkv','.flv','.wmv','.m4v'];
  const audioExtensions = ['.mp3','.wav','.ogg','.aac','.flac','.m4a','.wma'];
  const pdfExtensions = ['.pdf'];
  const docExtensions = ['.doc','.docx','.odt','.rtf'];
  const pptExtensions = ['.ppt','.pptx','.odp'];
  const xlsExtensions = ['.xls','.xlsx','.ods'];
  const zipExtensions = ['.zip','.rar','.7z','.tar','.gz'];

  // ----- File Type Detection -----
  function getFileType(file) {
    const fullName = file.name.toLowerCase();
    if (imageExtensions.some(e => fullName.endsWith(e))) return 'image';
    if (videoExtensions.some(e => fullName.endsWith(e))) return 'video';
    if (audioExtensions.some(e => fullName.endsWith(e))) return 'audio';
    if (pdfExtensions.some(e => fullName.endsWith(e))) return 'pdf';
    if (docExtensions.some(e => fullName.endsWith(e))) return 'doc';
    if (pptExtensions.some(e => fullName.endsWith(e))) return 'ppt';
    if (xlsExtensions.some(e => fullName.endsWith(e))) return 'xls';
    if (zipExtensions.some(e => fullName.endsWith(e))) return 'zip';
    if (textExtensions.some(e => fullName.endsWith(e))) return 'text';
    return 'other';
  }

  function getFileIcon(file) {
    const type = getFileType(file);
    const icons = {
      'image': '🖼️', 'video': '🎬', 'audio': '🎵', 'pdf': '📄',
      'doc': '📝', 'ppt': '📊', 'xls': '📈', 'zip': '📦',
      'text': '📃', 'other': '📎'
    };
    return icons[type] || '📎';
  }

  function getBadgeClass(file) {
    const type = getFileType(file);
    const classes = {
      'image': 'badge-image', 'video': 'badge-video', 'audio': 'badge-audio',
      'pdf': 'badge-pdf', 'doc': 'badge-doc', 'ppt': 'badge-ppt',
      'xls': 'badge-xls', 'zip': 'badge-zip', 'text': 'badge-text',
      'other': 'badge-other'
    };
    return classes[type] || 'badge-other';
  }

  function getBadgeText(file) {
    const type = getFileType(file);
    const texts = {
      'image': 'Image', 'video': 'Video', 'audio': 'Audio',
      'pdf': 'PDF', 'doc': 'Document', 'ppt': 'Presentation',
      'xls': 'Spreadsheet', 'zip': 'Archive', 'text': 'Text', 'other': 'File'
    };
    return texts[type] || 'File';
  }

  function isSupported(file) {
    const allExts = [
      ...textExtensions, ...imageExtensions, ...videoExtensions,
      ...audioExtensions, ...pdfExtensions, ...docExtensions,
      ...pptExtensions, ...xlsExtensions, ...zipExtensions
    ];
    return allExts.some(e => file.name.toLowerCase().endsWith(e));
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(1) + ' GB';
  }

  // ----- theme -----
  function toggleTheme() {
    document.body.classList.toggle('light');
    currentTheme = document.body.classList.contains('light') ? 'light' : 'dark';
    themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('fileviewer-theme', currentTheme);
  }

  function loadTheme() {
    const saved = localStorage.getItem('fileviewer-theme');
    if (saved === 'light') {
      document.body.classList.add('light');
      themeToggle.textContent = '☀️';
      currentTheme = 'light';
    } else {
      document.body.classList.remove('light');
      themeToggle.textContent = '🌙';
      currentTheme = 'dark';
    }
  }

  // ----- Fullscreen -----
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // ----- sidebar toggle -----
  function toggleSidebar() {
    sidebar.classList.toggle('open');
  }

  function closeSidebar() {
    if (window.innerWidth < 720) {
      sidebar.classList.remove('open');
    }
  }

  // ----- render tree from files -----
  function buildTree(files) {
    const root = {};
    for (const file of files) {
      const path = file.webkitRelativePath || file.name;
      const parts = path.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          current[part] = file;
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
    }
    return root;
  }

  function renderTree(node, container, level = 0) {
    const entries = Object.entries(node);
    entries.sort((a, b) => {
      const aIsFile = a[1] instanceof File;
      const bIsFile = b[1] instanceof File;
      if (aIsFile && !bIsFile) return 1;
      if (!aIsFile && bIsFile) return -1;
      return a[0].localeCompare(b[0]);
    });

    for (const [key, value] of entries) {
      if (value instanceof File) {
        if (!isSupported(value)) continue;
        const div = document.createElement('div');
        div.className = 'file-item';
        div.style.paddingLeft = `${level * 20 + 6}px`;
        const icon = getFileIcon(value);
        div.textContent = `${icon} ${key}`;
        div.dataset.path = value.webkitRelativePath || value.name;
        div.dataset.fileType = getFileType(value);
        div.addEventListener('click', () => {
          openFile(value);
          closeSidebar();
          document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
          div.classList.add('active');
        });
        container.appendChild(div);
      } else {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'folder-item';
        folderDiv.style.paddingLeft = `${level * 20 + 4}px`;
        folderDiv.innerHTML = `<span class="arrow">▶</span> 📁 ${key}`;

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'children';
        childrenContainer.style.maxHeight = '0';
        childrenContainer.style.overflow = 'hidden';

        folderDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = childrenContainer.style.maxHeight !== '0px';
          if (isOpen) {
            childrenContainer.style.maxHeight = '0';
            folderDiv.querySelector('.arrow').textContent = '▶';
            folderDiv.classList.remove('open');
          } else {
            childrenContainer.style.maxHeight = childrenContainer.scrollHeight + 'px';
            folderDiv.querySelector('.arrow').textContent = '▼';
            folderDiv.classList.add('open');
          }
        });

        container.appendChild(folderDiv);
        container.appendChild(childrenContainer);
        renderTree(value, childrenContainer, level + 1);
      }
    }
  }

  // ----- Search functionality -----
  function filterFiles(query) {
    const items = fileList.querySelectorAll('.file-item');
    const folders = fileList.querySelectorAll('.folder-item');

    if (!query.trim()) {
      items.forEach(el => el.style.display = 'flex');
      folders.forEach(el => el.style.display = 'flex');
      return;
    }

    const lowerQuery = query.toLowerCase();
    items.forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(lowerQuery) ? 'flex' : 'none';
    });

    folders.forEach(el => {
      const parent = el.parentElement;
      const children = parent.querySelectorAll('.file-item');
      const visibleChildren = Array.from(children).some(c => c.style.display !== 'none');
      el.style.display = visibleChildren ? 'flex' : 'none';
    });
  }

  // ----- load folder -----
  function loadFolder(files) {
    const filtered = Array.from(files).filter(f => isSupported(f));
    if (filtered.length === 0) {
      fileList.innerHTML = `<p class="placeholder">No supported files found</p>`;
      fileStats.textContent = '0 files';
      return;
    }
    allFiles = filtered;
    const tree = buildTree(filtered);
    fileList.innerHTML = '';
    renderTree(tree, fileList, 0);
    fileStats.textContent = `${filtered.length} files loaded`;
  }

  // ----- load individual files -----
  function loadIndividualFiles(files) {
    const filtered = Array.from(files).filter(f => isSupported(f));
    if (filtered.length === 0) {
      fileList.innerHTML = `<p class="placeholder">No supported files found</p>`;
      fileStats.textContent = '0 files';
      return;
    }
    allFiles = filtered;
    const virtualRoot = {};
    for (const file of filtered) {
      virtualRoot[file.name] = file;
    }
    fileList.innerHTML = '';
    renderTree(virtualRoot, fileList, 0);
    fileStats.textContent = `${filtered.length} files loaded`;
  }

  // ----- Helper: Show Download Option -----
  function showDownloadOption(file, url, info) {
    codeContent.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;gap:15px;background:var(--bg-primary);text-align:center;">
        <div style="font-size:4rem;">${info.icon}</div>
        <div style="font-size:1.3rem;font-weight:600;color:var(--text-primary);">${file.name}</div>
        <div style="color:var(--text-secondary);">${info.label} File (${formatSize(file.size)})</div>
        <div style="color:var(--text-secondary);font-size:0.9rem;max-width:400px;">
          Preview not available for this format. Please download to view.
        </div>
        <button id="dlOptBtn" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
          📥 Download File
        </button>
      </div>
    `;
    const btn = document.getElementById('dlOptBtn');
    if (btn) btn.addEventListener('click', () => window.downloadFileDirect(url, file.name));
  }

  // ----- Direct Download Function (Global) -----
  window.downloadFileDirect = function(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----- PDF (pdf.js, fully offline once cached) -----
  function renderPdf(file) {
    codeContent.innerHTML = `<div class="empty-state">📄 Loading PDF...</div>`;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        codeContent.innerHTML = `<div id="pdfWrap" style="width:100%;height:100%;overflow:auto;background:#525659;padding:14px;box-sizing:border-box;"></div>`;
        const wrap = document.getElementById('pdfWrap');
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const viewport = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 14px';
          canvas.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
          wrap.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        }
      } catch (err) {
        showDownloadOption(file, URL.createObjectURL(file), { icon: '📄', label: 'PDF' });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ----- DOCX (mammoth.js) -----
  function renderDocx(file) {
    codeContent.innerHTML = `<div class="empty-state">📝 Loading document...</div>`;
    const reader = new FileReader();
    reader.onload = (e) => {
      mammoth.convertToHtml({ arrayBuffer: e.target.result })
        .then(result => {
          codeContent.innerHTML = `
            <div style="width:100%;height:100%;overflow:auto;background:white;color:#222;padding:30px;box-sizing:border-box;">
              <div style="max-width:800px;margin:0 auto;line-height:1.6;">${result.value}</div>
            </div>
          `;
        })
        .catch(() => {
          showDownloadOption(file, URL.createObjectURL(file), { icon: '📝', label: 'Document' });
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // ----- RTF (basic control-word strip) -----
  function renderRtf(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let text = e.target.result
          .replace(/\\par[d]?/g, '\n')
          .replace(/\{\\\*?\\[^{}]+\}/g, '')
          .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
          .replace(/[{}]/g, '')
          .replace(/\\'\w{2}/g, '');
        text = text.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;');
        codeContent.innerHTML = `
          <div style="width:100%;height:100%;overflow:auto;background:white;color:#222;padding:30px;box-sizing:border-box;">
            <div style="max-width:800px;margin:0 auto;white-space:pre-wrap;line-height:1.6;">${text}</div>
          </div>
        `;
      } catch (err) {
        showDownloadOption(file, URL.createObjectURL(file), { icon: '📝', label: 'Document' });
      }
    };
    reader.readAsText(file);
  }

  // ----- ODT/ODP (zip containing content.xml) -----
  function renderOpenDocXml(file, label) {
    codeContent.innerHTML = `<div class="empty-state">📝 Loading...</div>`;
    const reader = new FileReader();
    reader.onload = (e) => {
      JSZip.loadAsync(e.target.result)
        .then(zip => {
          const entry = zip.file('content.xml');
          if (!entry) throw new Error('content.xml not found');
          return entry.async('text');
        })
        .then(xml => {
          const doc = new DOMParser().parseFromString(xml, 'text/xml');
          const text = (doc.documentElement ? doc.documentElement.textContent : '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;');
          codeContent.innerHTML = `
            <div style="width:100%;height:100%;overflow:auto;background:white;color:#222;padding:30px;box-sizing:border-box;">
              <div style="max-width:800px;margin:0 auto;white-space:pre-wrap;line-height:1.6;">${text}</div>
            </div>
          `;
        })
        .catch(() => {
          showDownloadOption(file, URL.createObjectURL(file), { icon: '📎', label: label });
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // ----- PPTX (JSZip + slide text extraction) -----
  function renderPptx(file) {
    codeContent.innerHTML = `<div class="empty-state">📊 Loading presentation...</div>`;
    const reader = new FileReader();
    reader.onload = (e) => {
      JSZip.loadAsync(e.target.result)
        .then(zip => {
          const slideFiles = Object.keys(zip.files)
            .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
            .sort((a, b) => parseInt(a.match(/slide(\d+)\.xml/)[1]) - parseInt(b.match(/slide(\d+)\.xml/)[1]));
          return Promise.all(slideFiles.map(f => zip.files[f].async('text')));
        })
        .then(slidesXml => {
          let html = '';
          slidesXml.forEach((xml, i) => {
            const doc = new DOMParser().parseFromString(xml, 'text/xml');
            const texts = Array.from(doc.getElementsByTagName('a:t')).map(n => n.textContent).filter(Boolean);
            html += `
              <div style="background:white;color:#222;border-radius:8px;padding:24px;margin-bottom:16px;max-width:800px;box-shadow:0 2px 10px rgba(0,0,0,0.3);">
                <div style="font-size:0.75rem;color:#888;margin-bottom:10px;">Slide ${i + 1}</div>
                ${texts.map(t => `<p style="margin:6px 0;">${t.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join('') || '<p style="color:#999;">(No text content on this slide)</p>'}
              </div>
            `;
          });
          codeContent.innerHTML = `<div style="width:100%;height:100%;overflow:auto;background:var(--bg-primary);padding:20px;box-sizing:border-box;">${html}</div>`;
        })
        .catch(() => {
          showDownloadOption(file, URL.createObjectURL(file), { icon: '📊', label: 'Presentation' });
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // ----- XLS/XLSX/ODS (SheetJS) -----
  function renderSpreadsheet(file) {
    codeContent.innerHTML = `<div class="empty-state">📈 Loading spreadsheet...</div>`;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let tabsHtml = '';
        let sheetsHtml = '';
        workbook.SheetNames.forEach((name, i) => {
          const html = XLSX.utils.sheet_to_html(workbook.Sheets[name]);
          tabsHtml += `<button class="sheet-tab" data-sheet="${i}" style="padding:6px 14px;border:none;background:${i === 0 ? 'var(--accent)' : 'var(--bg-elevated)'};color:${i === 0 ? 'white' : 'var(--text-primary)'};border-radius:6px;cursor:pointer;font-size:0.8rem;margin-right:6px;">${name}</button>`;
          sheetsHtml += `<div class="sheet-pane" data-sheet="${i}" style="display:${i === 0 ? 'block' : 'none'};">${html}</div>`;
        });
        codeContent.innerHTML = `
          <div style="width:100%;height:100%;overflow:auto;background:white;color:#222;padding:16px;box-sizing:border-box;">
            <div style="margin-bottom:10px;">${tabsHtml}</div>
            <div id="sheetPanes">${sheetsHtml}</div>
          </div>
        `;
        codeContent.querySelectorAll('.sheet-tab').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = btn.dataset.sheet;
            codeContent.querySelectorAll('.sheet-tab').forEach(b => {
              b.style.background = 'var(--bg-elevated)';
              b.style.color = 'var(--text-primary)';
            });
            btn.style.background = 'var(--accent)';
            btn.style.color = 'white';
            codeContent.querySelectorAll('.sheet-pane').forEach(p => {
              p.style.display = p.dataset.sheet === idx ? 'block' : 'none';
            });
          });
        });
      } catch (err) {
        showDownloadOption(file, URL.createObjectURL(file), { icon: '📈', label: 'Spreadsheet' });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ----- ZIP listing (JSZip; .rar/.7z/.gz fall back to download) -----
  function renderZipListing(file) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.zip')) {
      showDownloadOption(file, URL.createObjectURL(file), { icon: '📦', label: 'Archive' });
      return;
    }
    codeContent.innerHTML = `<div class="empty-state">📦 Reading archive...</div>`;
    const reader = new FileReader();
    reader.onload = (e) => {
      JSZip.loadAsync(e.target.result)
        .then(zip => {
          let rows = '';
          Object.keys(zip.files).sort().forEach(name => {
            const entry = zip.files[name];
            const icon = entry.dir ? '📁' : '📄';
            rows += `<div style="padding:6px 10px;border-bottom:1px solid var(--border-color);font-size:0.85rem;color:var(--text-primary);">${icon} ${name}</div>`;
          });
          codeContent.innerHTML = `
            <div style="width:100%;height:100%;overflow:auto;background:var(--bg-primary);padding:16px;box-sizing:border-box;">
              <div style="font-weight:600;margin-bottom:10px;color:var(--text-primary);">📦 ${file.name}</div>
              <div style="background:var(--bg-elevated);border-radius:8px;overflow:hidden;">${rows}</div>
              <button id="zipDlBtn" style="margin-top:14px;padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;">📥 Download Archive</button>
            </div>
          `;
          const btn = document.getElementById('zipDlBtn');
          if (btn) btn.addEventListener('click', () => window.downloadFileDirect(URL.createObjectURL(file), file.name));
        })
        .catch(() => {
          showDownloadOption(file, URL.createObjectURL(file), { icon: '📦', label: 'Archive' });
        });
    };
    reader.readAsArrayBuffer(file);
  }

  // ----- OPEN FILE - ALL TYPES INSIDE APP, FULLY OFFLINE -----
  function openFile(file) {
    if (!file) return;
    selectedFile = file;
    const fileNameDisplay = file.webkitRelativePath || file.name;
    fileName.textContent = fileNameDisplay;
    fileSize.textContent = formatSize(file.size);

    const badgeText = getBadgeText(file);
    const badgeClass = getBadgeClass(file);
    fileTypeBadge.textContent = badgeText;
    fileTypeBadge.className = `file-type-badge ${badgeClass}`;

    const fileType = getFileType(file);
    const lowerName = file.name.toLowerCase();

    // ---- IMAGE ----
    if (fileType === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        codeContent.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;background:var(--bg-primary);">
            <img src="${e.target.result}" alt="${file.name}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);" />
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- VIDEO ----
    if (fileType === 'video') {
      const reader = new FileReader();
      reader.onload = (e) => {
        codeContent.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;height:100%;padding:20px;background:#000;">
            <video controls style="max-width:100%;max-height:85vh;border-radius:12px;">
              <source src="${e.target.result}">
              Your browser does not support the video tag.
            </video>
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- AUDIO ----
    if (fileType === 'audio') {
      const reader = new FileReader();
      reader.onload = (e) => {
        codeContent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;gap:20px;background:var(--bg-primary);">
            <div style="font-size:4rem;">🎵</div>
            <div style="font-size:1.2rem;font-weight:500;color:var(--text-primary);">${file.name}</div>
            <audio controls style="width:100%;max-width:500px;">
              <source src="${e.target.result}">
              Your browser does not support the audio tag.
            </audio>
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- PDF (client-side render, works offline & on mobile) ----
    if (fileType === 'pdf') {
      renderPdf(file);
      return;
    }

    // ---- WORD ----
    if (fileType === 'doc') {
      if (lowerName.endsWith('.docx')) {
        renderDocx(file);
      } else if (lowerName.endsWith('.odt')) {
        renderOpenDocXml(file, 'Document');
      } else if (lowerName.endsWith('.rtf')) {
        renderRtf(file);
      } else {
        // legacy binary .doc has no reliable client-side parser
        showDownloadOption(file, URL.createObjectURL(file), { icon: '📝', label: 'Document' });
      }
      return;
    }

    // ---- PRESENTATION ----
    if (fileType === 'ppt') {
      if (lowerName.endsWith('.pptx')) {
        renderPptx(file);
      } else if (lowerName.endsWith('.odp')) {
        renderOpenDocXml(file, 'Presentation');
      } else {
        // legacy binary .ppt has no reliable client-side parser
        showDownloadOption(file, URL.createObjectURL(file), { icon: '📊', label: 'Presentation' });
      }
      return;
    }

    // ---- SPREADSHEET ----
    if (fileType === 'xls') {
      renderSpreadsheet(file);
      return;
    }

    // ---- ZIP / ARCHIVE ----
    if (fileType === 'zip') {
      renderZipListing(file);
      return;
    }

    // ---- TEXT (Default) ----
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n');
      const maxLines = 10000;
      const displayLines = lines.slice(0, maxLines);

      let html = '';
      const lineNumWidth = String(displayLines.length).length;

      for (let i = 0; i < displayLines.length; i++) {
        const lineNum = String(i + 1).padStart(lineNumWidth, ' ');
        const lineContent = displayLines[i] || '';
        const escapedContent = lineContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

        html += `
          <div class="line-container">
            <span class="line-number">${lineNum}</span>
            <span class="line-content">${escapedContent}</span>
          </div>
        `;
      }

      if (lines.length > maxLines) {
        html += `
          <div class="line-container" style="opacity:0.6;font-style:italic;color:var(--text-secondary);padding-left:16px;">
            <span class="line-number">...</span>
            <span class="line-content">Truncated: ${lines.length - maxLines} more lines</span>
          </div>
        `;
      }

      codeContent.innerHTML = html;
      codeContent.scrollTop = 0;
    };
    reader.readAsText(file);
  }

  // ----- reset file inputs -----
  function resetFileInputs() {
    folderPicker.value = '';
    filePicker.value = '';
    if (androidFilePicker) androidFilePicker.value = '';
  }

  // ----- event listeners -----
  folderPicker.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadFolder(files);
      if (window.innerWidth < 720) sidebar.classList.remove('open');
    }
    resetFileInputs();
  });

  filePicker.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadIndividualFiles(files);
      if (window.innerWidth < 720) sidebar.classList.remove('open');
    }
    resetFileInputs();
  });

  if (androidFilePicker) {
    androidFilePicker.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        loadIndividualFiles(files);
        if (window.innerWidth < 720) sidebar.classList.remove('open');
      }
      resetFileInputs();
    });
  }

  // Search
  fileSearch.addEventListener('input', (e) => {
    filterFiles(e.target.value);
  });

  menuToggle.addEventListener('click', toggleSidebar);
  themeToggle.addEventListener('click', toggleTheme);
  fullscreenToggle.addEventListener('click', toggleFullscreen);

  // Close sidebar on outside click
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 720) {
      const isSidebar = sidebar.contains(e.target);
      const isHamburger = menuToggle.contains(e.target);
      if (!isSidebar && !isHamburger && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 720) {
      sidebar.classList.remove('open');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      fileSearch.focus();
    }
    if (e.key === 'Escape') {
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });

  // ---- init ----
  loadTheme();
  codeContent.innerHTML = `
    <div class="empty-state">
      <div class="big-icon">📂</div>
      <div>Select a file to preview</div>
      <div style="font-size:0.8rem;opacity:0.6;">Supports: PDF, DOC, PPT, XLS, Images, Videos, Audio & more — fully offline</div>
    </div>
  `;
  fileList.innerHTML = `<p class="placeholder">📁 Select a folder or files to get started</p>`;
  fileStats.textContent = '0 files';

  console.log('📂 File Viewer Pro ready!');
  console.log('✅ All files render inside the app, no internet needed');

  // ----- PWA INSTALL / OPEN-IN-APP NAVBAR BUTTON -----
  // Single button, three states:
  //  1. Running standalone (already the installed app)  -> button hidden
  //  2. Not installed, browser can prompt install       -> "Install App"
  //  3. Already installed but viewed in a normal browser -> "Open App" (best-effort)
  (function() {
    let deferredPrompt = null;
    const pwaBtn = document.getElementById('pwaActionBtn');
    if (!pwaBtn) return;

    function isAppInstalled() {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      const isMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      return isStandalone || isFullscreen || isMinimalUi || isIOSStandalone;
    }

    function setButtonState(state) {
      if (state === 'hidden') {
        pwaBtn.style.display = 'none';
      } else if (state === 'install') {
        pwaBtn.style.display = 'inline-block';
        pwaBtn.textContent = '📲';
        pwaBtn.setAttribute('aria-label', 'Install app');
        pwaBtn.title = 'Install App';
      } else if (state === 'open') {
        pwaBtn.style.display = 'inline-block';
        pwaBtn.textContent = '↗️';
        pwaBtn.setAttribute('aria-label', 'Open in app');
        pwaBtn.title = 'Open in App';
      }
    }

    function refreshButton() {
      if (isAppInstalled()) {
        // Running as the installed app itself -> no button at all
        setButtonState('hidden');
        localStorage.setItem('pwa-installed', 'true');
        return;
      }
      if (deferredPrompt) {
        setButtonState('install');
      } else if (localStorage.getItem('pwa-installed') === 'true') {
        setButtonState('open');
      } else {
        setButtonState('hidden');
      }
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      refreshButton();
    });

    pwaBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem('pwa-installed', 'true');
        }
        deferredPrompt = null;
        refreshButton();
      } else if (localStorage.getItem('pwa-installed') === 'true') {
        // Best-effort only: no browser exposes a universal JS API to force-launch
        // an already-installed PWA from a normal browser tab. We try a related-apps
        // check (Chrome/Android) and otherwise just guide the user.
        if ('getInstalledRelatedApps' in navigator) {
          try {
            const related = await navigator.getInstalledRelatedApps();
            if (related && related.length > 0) {
              alert('App pehle se installed hai. Apne home screen / app drawer se "CodeReader Pro" icon par tap karke usse kholein.');
              return;
            }
          } catch (err) {}
        }
        alert('App pehle se installed hai. Apne home screen se "CodeReader Pro" icon par tap karke usse kholein.');
      } else {
        alert('Is browser mein automatic install available nahi hai. Browser menu se "Add to Home Screen" option use karein.');
      }
    });

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      deferredPrompt = null;
      refreshButton();
    });

    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      if (e.matches) {
        localStorage.setItem('pwa-installed', 'true');
      }
      refreshButton();
    });

    document.addEventListener('DOMContentLoaded', refreshButton);
    refreshButton();
  })();

})();