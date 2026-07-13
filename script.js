// script.js – Complete file viewer with all file type support (FIXED PDF)
(function() {
  "use strict";

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

  const allSupported = [
    ...textExtensions, ...imageExtensions, ...videoExtensions, 
    ...audioExtensions, ...pdfExtensions, ...docExtensions, 
    ...pptExtensions, ...xlsExtensions, ...zipExtensions
  ];

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
    return allSupported.some(ext => file.name.toLowerCase().endsWith(ext));
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

  // ----- DOWNLOAD FILE FUNCTION -----
  function downloadFile(data, filename) {
    // Create a blob from data URL
    fetch(data)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        // Fallback for older browsers
        const link = document.createElement('a');
        link.href = data;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  }

  // Make downloadFile globally accessible
  window.downloadFile = downloadFile;

  // ----- OPEN FILE - COMPLETE FIX FOR ALL TYPES -----
  function openFile(file) {
    if (!file) return;
    selectedFile = file;
    const fileNameDisplay = file.webkitRelativePath || file.name;
    fileName.textContent = fileNameDisplay;
    fileSize.textContent = formatSize(file.size);
    
    // Update badge
    const badgeText = getBadgeText(file);
    const badgeClass = getBadgeClass(file);
    fileTypeBadge.textContent = badgeText;
    fileTypeBadge.className = `file-type-badge ${badgeClass}`;

    const fileType = getFileType(file);

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
              <source src="${e.target.result}" type="video/mp4">
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
              <source src="${e.target.result}" type="audio/mpeg">
              Your browser does not support the audio tag.
            </audio>
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- PDF - FIXED: Using blob URL instead of data URL ----
    if (fileType === 'pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        // Convert data URL to blob URL for better PDF support
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            codeContent.innerHTML = `
              <div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;padding:10px;">
                <iframe src="${blobUrl}" style="width:100%;height:100%;border:none;border-radius:8px;background:white;" allow="fullscreen"></iframe>
              </div>
            `;
          })
          .catch(() => {
            // Fallback: try with data URL
            codeContent.innerHTML = `
              <div style="width:100%;height:100%;background:#f0f0f0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:15px;">
                <div style="font-size:4rem;">📄</div>
                <div style="font-size:1.2rem;font-weight:600;">${file.name}</div>
                <div style="color:var(--text-secondary);">PDF cannot be previewed in this browser</div>
                <button onclick="downloadFile('${dataUrl}', '${file.name}')" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
                  📥 Download PDF
                </button>
              </div>
            `;
          });
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- DOC, DOCX, ODT, RTF ----
    if (fileType === 'doc') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        codeContent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;gap:15px;background:var(--bg-primary);text-align:center;">
            <div style="font-size:4rem;">📝</div>
            <div style="font-size:1.3rem;font-weight:600;color:var(--text-primary);">${file.name}</div>
            <div style="color:var(--text-secondary);">Document File (${formatSize(file.size)})</div>
            <button onclick="downloadFile('${data}', '${file.name}')" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
              📥 Download File
            </button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- PPT, PPTX, ODP ----
    if (fileType === 'ppt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        codeContent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;gap:15px;background:var(--bg-primary);text-align:center;">
            <div style="font-size:4rem;">📊</div>
            <div style="font-size:1.3rem;font-weight:600;color:var(--text-primary);">${file.name}</div>
            <div style="color:var(--text-secondary);">Presentation File (${formatSize(file.size)})</div>
            <button onclick="downloadFile('${data}', '${file.name}')" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
              📥 Download File
            </button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- XLS, XLSX, ODS ----
    if (fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        codeContent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;gap:15px;background:var(--bg-primary);text-align:center;">
            <div style="font-size:4rem;">📈</div>
            <div style="font-size:1.3rem;font-weight:600;color:var(--text-primary);">${file.name}</div>
            <div style="color:var(--text-secondary);">Spreadsheet File (${formatSize(file.size)})</div>
            <button onclick="downloadFile('${data}', '${file.name}')" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
              📥 Download File
            </button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- ZIP ----
    if (fileType === 'zip') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        codeContent.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;gap:20px;text-align:center;background:var(--bg-primary);">
            <div style="font-size:4rem;">📦</div>
            <div style="font-size:1.5rem;font-weight:600;color:var(--text-primary);">${file.name}</div>
            <div style="color:var(--text-secondary);">Archive File (${formatSize(file.size)})</div>
            <button onclick="downloadFile('${data}', '${file.name}')" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
              📥 Download Archive
            </button>
          </div>
        `;
      };
      reader.readAsDataURL(file);
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
      <div style="font-size:0.8rem;opacity:0.6;">Supports all file types: PDF, DOC, PPT, Images, Videos, Audio & more</div>
    </div>
  `;
  fileList.innerHTML = `<p class="placeholder">📁 Select a folder or files to get started</p>`;
  fileStats.textContent = '0 files';

  console.log('📂 File Viewer Pro ready!');
  console.log('Supported file types:', allSupported.length);

  // ----- Download APK Functionality -----
  (function() {
    const downloadBtn = document.getElementById('downloadApkBtn');
    const downloadModal = document.getElementById('downloadModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const directDownloadLink = document.getElementById('directDownloadLink');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        downloadModal.classList.add('active');
      });
    }

    function closeModal() {
      downloadModal.classList.remove('active');
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && downloadModal.classList.contains('active')) {
        closeModal();
      }
    });

    // Check if APK exists
    fetch('CodeReader.apk')
      .then(response => {
        if (response.ok) {
          directDownloadLink.href = 'CodeReader.apk';
          directDownloadLink.textContent = '⬇️ Download APK';
        } else {
          directDownloadLink.href = '#';
          directDownloadLink.textContent = '🔗 Get APK from PWA Builder';
          directDownloadLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://www.pwabuilder.com', '_blank');
          });
        }
      })
      .catch(() => {
        directDownloadLink.href = '#';
        directDownloadLink.textContent = '🔗 Generate APK Online';
        directDownloadLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.open('https://www.pwabuilder.com', '_blank');
        });
      });

    console.log('📱 Download APK feature added!');
  })();
})();