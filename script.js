// script.js – full offline file viewer with image support, tree, toggle, theme, and permission reset
(function() {
  "use strict";

  // DOM refs
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const themeToggle = document.getElementById('themeToggle');
  const folderPicker = document.getElementById('folderPicker');
  const filePicker = document.getElementById('filePicker');
  const fileList = document.getElementById('fileList');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');
  const codeContent = document.getElementById('codeContent');

  // State
  let currentTheme = 'dark';
  let selectedFile = null;
  let fileTreeData = [];

  // Supported extensions (expandable)
  const textExtensions = ['.java','.html','.css','.js','.ts','.json','.xml','.svg','.txt','.md','.py','.c','.cpp','.h','.sh','.bat','.yml','.yaml','.toml','.ini','.cfg','.log','.csv'];
  const imageExtensions = ['.jpg','.jpeg','.png','.gif','.bmp','.webp','.ico','.tiff','.avif'];
  const allSupported = [...textExtensions, ...imageExtensions];

  // ----- helpers -----
  function isImage(file) {
    return imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  function isText(file) {
    return textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  function isSupported(file) {
    return allSupported.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
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

  // ----- sidebar toggle (hamburger) -----
  function toggleSidebar() {
    sidebar.classList.toggle('open');
  }

  // close sidebar on file click (mobile)
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
    // sort: folders first, then files
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
        div.textContent = `📄 ${key}`;
        div.dataset.path = value.webkitRelativePath || value.name;
        div.addEventListener('click', () => {
          openFile(value);
          closeSidebar();
        });
        container.appendChild(div);
      } else {
        // folder
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

  // ----- load folder -----
  function loadFolder(files) {
    const filtered = Array.from(files).filter(f => isSupported(f));
    if (filtered.length === 0) {
      fileList.innerHTML = `<p class="placeholder">No supported files found</p>`;
      return;
    }
    fileTreeData = filtered;
    const tree = buildTree(filtered);
    fileList.innerHTML = '';
    renderTree(tree, fileList, 0);
  }

  // ----- load files (individual) -----
  function loadIndividualFiles(files) {
    const filtered = Array.from(files).filter(f => isSupported(f));
    if (filtered.length === 0) {
      fileList.innerHTML = `<p class="placeholder">No supported files found</p>`;
      return;
    }
    // build a virtual root with files
    const virtualRoot = {};
    for (const file of filtered) {
      virtualRoot[file.name] = file;
    }
    fileTreeData = filtered;
    fileList.innerHTML = '';
    renderTree(virtualRoot, fileList, 0);
  }

  // ----- open file (text or image) with proper line numbers -----
  function openFile(file) {
    if (!file) return;
    selectedFile = file;
    fileName.textContent = file.webkitRelativePath || file.name;
    fileSize.textContent = formatSize(file.size);

    if (isImage(file)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        codeContent.innerHTML = `<img src="${e.target.result}" alt="${file.name}" style="max-width:100%;max-height:80vh;border-radius:12px;" />`;
      };
      reader.readAsDataURL(file);
      return;
    }

    // text file with line numbers and horizontal scrolling
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n');
      const maxLines = 10000; // safety limit
      const displayLines = lines.slice(0, maxLines);
      
      let html = '';
      // Calculate padding for line numbers based on total lines
      const lineNumWidth = String(displayLines.length).length;
      
      for (let i = 0; i < displayLines.length; i++) {
        const lineNum = String(i + 1).padStart(lineNumWidth, ' ');
        const lineContent = displayLines[i] || '';
        // Escape HTML special characters to prevent XSS
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
      
      // Scroll to top when opening new file
      codeContent.scrollTop = 0;
    };
    reader.readAsText(file);
  }

  // ----- reset file inputs (ask permission again) -----
  function resetFileInputs() {
    folderPicker.value = '';
    filePicker.value = '';
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

  // menu toggle
  menuToggle.addEventListener('click', toggleSidebar);

  // theme
  themeToggle.addEventListener('click', toggleTheme);

  // close sidebar on outside click (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 720) {
      const isSidebar = sidebar.contains(e.target);
      const isHamburger = menuToggle.contains(e.target);
      if (!isSidebar && !isHamburger && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    }
  });

  // handle resize: close sidebar on desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 720) {
      sidebar.classList.remove('open');
    }
  });

  // ---- init ----
  loadTheme();
  codeContent.innerHTML = `<div class="empty-state">📂 Select a file to preview</div>`;
  fileList.innerHTML = `<p class="placeholder">Select a folder or files</p>`;

  console.log('File Viewer Pro ready');
})();