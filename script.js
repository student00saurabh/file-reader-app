// script.js – Complete file viewer with ALL file types opening inside app
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

  // ----- Helper: Convert data URL to Blob URL -----
  function dataURLToBlobURL(dataUrl) {
    return fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => URL.createObjectURL(blob));
  }

  // ----- Helper: Show Office Document using multiple viewers -----
  function showOfficeDocument(file, dataUrl, fileType) {
    const fileTypeMap = {
      'doc': { icon: '📝', label: 'Document' },
      'ppt': { icon: '📊', label: 'Presentation' },
      'xls': { icon: '📈', label: 'Spreadsheet' }
    };
    
    const info = fileTypeMap[fileType] || { icon: '📎', label: 'File' };
    
    // Try to convert to blob URL and use viewers
    dataURLToBlobURL(dataUrl)
      .then(blobUrl => {
        // Try Google Docs Viewer first (more reliable)
        const googleViewer = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(blobUrl)}`;
        
        // Try Microsoft Office Viewer as fallback
        const msViewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(blobUrl)}`;
        
        // Create viewer with both options
        codeContent.innerHTML = `
          <div style="width:100%;height:100%;background:#f0f0f0;display:flex;flex-direction:column;padding:10px;">
            <div style="display:flex;gap:10px;padding:8px;background:var(--bg-secondary);border-radius:8px;margin-bottom:8px;flex-wrap:wrap;">
              <button id="viewerGoogleBtn" style="padding:6px 16px;background:var(--accent);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;">Google Viewer</button>
              <button id="viewerMsBtn" style="padding:6px 16px;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-color);border-radius:6px;cursor:pointer;font-size:0.8rem;">Microsoft Viewer</button>
              <button id="viewerDownloadBtn" style="padding:6px 16px;background:var(--bg-elevated);color:var(--text-primary);border:1px solid var(--border-color);border-radius:6px;cursor:pointer;font-size:0.8rem;">📥 Download</button>
            </div>
            <div id="officeViewerFrame" style="flex:1;border-radius:8px;overflow:hidden;background:white;">
              <iframe src="${googleViewer}" style="width:100%;height:100%;border:none;" allow="fullscreen"></iframe>
            </div>
          </div>
        `;
        
        // Add button functionality
        const googleBtn = document.getElementById('viewerGoogleBtn');
        const msBtn = document.getElementById('viewerMsBtn');
        const downloadBtn = document.getElementById('viewerDownloadBtn');
        const frame = document.querySelector('#officeViewerFrame iframe');
        
        if (googleBtn) {
          googleBtn.addEventListener('click', () => {
            frame.src = googleViewer;
            googleBtn.style.background = 'var(--accent)';
            googleBtn.style.color = 'white';
            msBtn.style.background = 'var(--bg-elevated)';
            msBtn.style.color = 'var(--text-primary)';
          });
        }
        
        if (msBtn) {
          msBtn.addEventListener('click', () => {
            frame.src = msViewer;
            msBtn.style.background = 'var(--accent)';
            msBtn.style.color = 'white';
            googleBtn.style.background = 'var(--bg-elevated)';
            googleBtn.style.color = 'var(--text-primary)';
          });
        }
        
        if (downloadBtn) {
          downloadBtn.addEventListener('click', () => {
            window.downloadFileDirect(dataUrl, file.name);
          });
        }
      })
      .catch(() => {
        // Fallback: Show download option
        showDownloadOption(file, dataUrl, info);
      });
  }

  // ----- Helper: Show Download Option -----
  function showDownloadOption(file, dataUrl, info) {
    codeContent.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;gap:15px;background:var(--bg-primary);text-align:center;">
        <div style="font-size:4rem;">${info.icon}</div>
        <div style="font-size:1.3rem;font-weight:600;color:var(--text-primary);">${file.name}</div>
        <div style="color:var(--text-secondary);">${info.label} File (${formatSize(file.size)})</div>
        <div style="color:var(--text-secondary);font-size:0.9rem;max-width:400px;">
          Preview not available. Please download to view.
        </div>
        <button onclick="window.downloadFileDirect('${dataUrl}', '${file.name}')" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
          📥 Download File
        </button>
      </div>
    `;
  }

  // ----- Direct Download Function (Global) -----
  window.downloadFileDirect = function(data, filename) {
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
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      })
      .catch(() => {
        const link = document.createElement('a');
        link.href = data;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  // ----- OPEN FILE - ALL TYPES INSIDE APP -----
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

    // ---- PDF ----
    if (fileType === 'pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        dataURLToBlobURL(dataUrl).then(blobUrl => {
          codeContent.innerHTML = `
            <div style="width:100%;height:100%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;padding:10px;">
              <iframe src="${blobUrl}" style="width:100%;height:100%;border:none;border-radius:8px;background:white;" allow="fullscreen"></iframe>
            </div>
          `;
        }).catch(() => {
          showDownloadOption(file, dataUrl, { icon: '📄', label: 'PDF' });
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // ---- WORD, EXCEL, PPT - Using Dual Viewer ----
    if (['doc', 'ppt', 'xls'].includes(fileType)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        showOfficeDocument(file, dataUrl, fileType);
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
            <button onclick="window.downloadFileDirect('${data}', '${file.name}')" style="padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;font-weight:500;">
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
      <div style="font-size:0.8rem;opacity:0.6;">Supports: PDF, DOC, PPT, XLS, Images, Videos, Audio & more</div>
    </div>
  `;
  fileList.innerHTML = `<p class="placeholder">📁 Select a folder or files to get started</p>`;
  fileStats.textContent = '0 files';

  console.log('📂 File Viewer Pro ready!');
  console.log('✅ All files will open inside the app');

  // ----- DIRECT APK DOWNLOAD (No PWA, No Browser) -----
  (function() {
    const downloadBtn = document.getElementById('downloadApkBtn');
    const downloadModal = document.getElementById('downloadModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const directDownloadLink = document.getElementById('directDownloadLink');
    
    // APK file path - Direct download link
    const APK_FILE_PATH = 'CodeReader.apk';

    // Function to download APK directly
    function downloadAPK() {
      // Create an invisible anchor tag
      const link = document.createElement('a');
      link.href = APK_FILE_PATH;
      link.download = 'CodeReader.apk';
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 1000);
      
      console.log('📱 APK Download started');
    }

    // Check if APK exists before showing modal
    function checkAPKExists() {
      fetch(APK_FILE_PATH, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            // APK exists - Enable direct download
            if (directDownloadLink) {
              directDownloadLink.href = '#';
              directDownloadLink.textContent = '⬇️ Download APK';
              directDownloadLink.onclick = function(e) {
                e.preventDefault();
                downloadAPK();
                closeModal();
              };
            }
            console.log('✅ APK file found');
          } else {
            // APK not found - Show alternative
            if (directDownloadLink) {
              directDownloadLink.href = '#';
              directDownloadLink.textContent = '🔗 Generate APK Online';
              directDownloadLink.onclick = function(e) {
                e.preventDefault();
                window.open('https://www.pwabuilder.com', '_blank');
                closeModal();
              };
            }
            console.log('⚠️ APK file not found');
          }
        })
        .catch(() => {
          // Fetch failed - Show alternative
          if (directDownloadLink) {
            directDownloadLink.href = '#';
            directDownloadLink.textContent = '🔗 Generate APK Online';
            directDownloadLink.onclick = function(e) {
              e.preventDefault();
              window.open('https://www.pwabuilder.com', '_blank');
              closeModal();
            };
          }
          console.log('⚠️ APK fetch failed');
        });
    }

    // Show modal on download button click
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // First try to download directly (if APK exists)
        fetch(APK_FILE_PATH, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              // APK exists - Download directly without modal
              downloadAPK();
            } else {
              // APK not found - Show modal with options
              downloadModal.classList.add('active');
              checkAPKExists();
            }
          })
          .catch(() => {
            // Show modal with options
            downloadModal.classList.add('active');
            checkAPKExists();
          });
      });
    }

    // Close modal
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

    console.log('📱 Direct APK Download feature added!');
  })();

})();