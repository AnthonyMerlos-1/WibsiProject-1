// Verificación de seguridad automática al cargar la página privada
(function verificarAccesoPrivado() {
    const sesionAutorizada = sessionStorage.getItem("wibsitihub_acceso_autorizado");
    if (sesionAutorizada === "true") {
        document.body.classList.remove("bloqueado-privado");
    } else {
        document.body.classList.add("bloqueado-privado");
    }
})();

// Función de validación de contraseña que puedes llamar desde el index.html
function verificarAccesoIndex() {
    const pass = prompt("Introduce la contraseña de acceso privado:");
    if (pass === "2436anthony123privado123") {
        sessionStorage.setItem("wibsitihub_acceso_autorizado", "true");
        window.location.href = "privado.html";
    } else if (pass !== null) {
        alert("Contraseña incorrecta. Acceso denegado.");
    }
}

function cerrarSesionPrivada() {
    sessionStorage.removeItem("wibsitihub_acceso_autorizado");
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
    cargarVideosGuardados();
});

/* ==========================================================
   Almacenamiento de archivos locales (IndexedDB)
   Los archivos de video subidos (ej. .mp4 descargados) pueden
   pesar demasiado para localStorage, así que se guardan aquí.
   Solo quedan disponibles en este navegador/dispositivo.
   ========================================================== */
const WH_DB_NAME = 'wibsitihub_archivos_db';
const WH_DB_VERSION = 1;
const WH_STORE_NAME = 'archivos';

function abrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(WH_DB_NAME, WH_DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(WH_STORE_NAME)) {
                db.createObjectStore(WH_STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

function guardarArchivoEnDB(id, blob) {
    return abrirDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(WH_STORE_NAME, 'readwrite');
        tx.objectStore(WH_STORE_NAME).put({ id, blob });
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    }));
}

function obtenerArchivoDeDB(id) {
    return abrirDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(WH_STORE_NAME, 'readonly');
        const req = tx.objectStore(WH_STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = (e) => reject(e.target.error);
    }));
}

function eliminarArchivoDeDB(id) {
    return abrirDB().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction(WH_STORE_NAME, 'readwrite');
        tx.objectStore(WH_STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    }));
}

/* Genera una miniatura automática tomando un fotograma del video subido */
function generarMiniaturaDeVideo(file) {
    return new Promise((resolve) => {
        try {
            const tempUrl = URL.createObjectURL(file);
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;
            video.src = tempUrl;

            const limpiar = () => URL.revokeObjectURL(tempUrl);

            video.addEventListener('loadeddata', () => {
                try {
                    video.currentTime = Math.min(1, (video.duration || 1) / 4);
                } catch (e) {
                    limpiar();
                    resolve('');
                }
            });
            video.addEventListener('seeked', () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 180;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    limpiar();
                    resolve(dataUrl);
                } catch (e) {
                    limpiar();
                    resolve('');
                }
            });
            video.addEventListener('error', () => {
                limpiar();
                resolve('');
            });
        } catch (e) {
            resolve('');
        }
    });
}

async function agregarNuevoVideo() {
    const titulo = document.getElementById('inputTitulo').value.trim();
    const urlVideo = document.getElementById('inputUrlVideo').value.trim();
    const miniaturaInput = document.getElementById('inputMiniatura').value.trim();
    const inputArchivo = document.getElementById('inputArchivoVideo');
    const archivo = inputArchivo && inputArchivo.files && inputArchivo.files[0] ? inputArchivo.files[0] : null;

    if (!titulo) {
        alert("Por favor ingresa un título.");
        return;
    }

    if (!urlVideo && !archivo) {
        alert("Ingresa un enlace o selecciona un archivo de video para subir.");
        return;
    }

    const btn = document.getElementById('btnGuardarElemento');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
        let nuevoVideo;

        if (archivo) {
            const idArchivo = 'archivo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
            await guardarArchivoEnDB(idArchivo, archivo);

            let miniatura = miniaturaInput;
            if (!miniatura) {
                miniatura = await generarMiniaturaDeVideo(archivo);
            }

            nuevoVideo = {
                titulo,
                tipo: 'archivo',
                idArchivo,
                miniatura: miniatura || '',
                nombreOriginal: archivo.name
            };
        } else {
            nuevoVideo = {
                titulo,
                tipo: 'enlace',
                urlVideo,
                miniatura: miniaturaInput || ''
            };
        }

        let misVideos = JSON.parse(localStorage.getItem('wibsitihub_custom_videos')) || [];
        misVideos.push(nuevoVideo);
        localStorage.setItem('wibsitihub_custom_videos', JSON.stringify(misVideos));

        actualizarGrillaCompleta();

        document.getElementById('inputTitulo').value = '';
        document.getElementById('inputUrlVideo').value = '';
        document.getElementById('inputMiniatura').value = '';
        if (inputArchivo) inputArchivo.value = '';

        mostrarToast("¡Video guardado con éxito!");
    } catch (e) {
        console.error(e);
        alert("Ocurrió un error al guardar el video. Es posible que el archivo sea demasiado grande para el almacenamiento disponible en este navegador.");
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar Elemento'; }
    }
}

function cargarVideosGuardados() {
    actualizarGrillaCompleta();
}

function actualizarGrillaCompleta() {
    const grid = document.getElementById('secureVideoGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    let misVideos = JSON.parse(localStorage.getItem('wibsitihub_custom_videos')) || [];

    if (misVideos.length === 0) {
        grid.innerHTML = `
            <div class="grid-vacio">
                <div style="font-size: 28px; margin-bottom: 8px;">📂</div>
                <strong>No hay videos guardados</strong>
                <p>Usa el formulario superior para añadir enlaces de cualquier formato.</p>
            </div>
        `;
        return;
    }

    misVideos.forEach((video, index) => {
        const article = document.createElement('article');
        article.className = 'video-card';
        article.setAttribute('data-category', 'Privado');
        article.setAttribute('data-title', video.titulo);
        article.dataset.index = String(index);

        const esArchivoSubido = video.tipo === 'archivo';
        const etiqueta = esArchivoSubido ? 'SUBIDO' : 'VIDEO';

        article.innerHTML = `
            <div class="thumbnail">
                <img src="${video.miniatura || ''}" alt="Portada" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'1\'><rect width=\'18\' height=\'18\' x=\'3\' y=\'3\' rx=\'2\'/><path d=\'m9 10 5 3-5 3v-6z\'/></svg>'">
                <div class="thumbnail-gradient"></div>
                <div class="quality" style="background: var(--accent-blue); color: #fff;">${etiqueta}</div>
                <div class="duration">VIP</div>
                <button class="play-button">▶</button>
            </div>
            <div class="video-info" style="position: relative;">
                <div class="video-title">${video.titulo}</div>
                <div class="creator">
                    <div class="creator-avatar" style="background: var(--accent-blue); color: #fff;">V</div>
                    <span>Guardado</span>
                    <i>✓</i>
                </div>
                <button class="btn-eliminar-video" data-index="${index}" title="Eliminar" style="position: absolute; right: 10px; bottom: 10px; background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 13px;">🗑️</button>
            </div>
        `;

        article.addEventListener('click', () => openVideo(index));
        const btnEliminar = article.querySelector('.btn-eliminar-video');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', (event) => {
                event.stopPropagation();
                eliminarVideo(index);
            });
        }

        grid.appendChild(article);
    });
}

async function eliminarVideo(index) {
    if (!confirm("¿Deseas eliminar este elemento?")) return;
    let misVideos = JSON.parse(localStorage.getItem('wibsitihub_custom_videos')) || [];
    const video = misVideos[index];

    if (video && video.tipo === 'archivo' && video.idArchivo) {
        try { await eliminarArchivoDeDB(video.idArchivo); } catch (e) { console.error(e); }
    }

    misVideos.splice(index, 1);
    localStorage.setItem('wibsitihub_custom_videos', JSON.stringify(misVideos));
    actualizarGrillaCompleta();
    mostrarToast("Elemento eliminado");
}

/* URL de objeto activa del reproductor local, para liberarla al cambiar/cerrar */
let whUrlObjetoActual = null;

function liberarUrlObjetoActual() {
    if (whUrlObjetoActual) {
        URL.revokeObjectURL(whUrlObjetoActual);
        whUrlObjetoActual = null;
    }
}

async function openVideo(index) {
    let misVideos = JSON.parse(localStorage.getItem('wibsitihub_custom_videos')) || [];
    const video = misVideos[index];
    if (!video) return;

    const titulo = video.titulo;
    const imagen = video.miniatura || '';

    const videoModal = document.getElementById('videoModal');
    const playerContainer = document.querySelector('.player');
    const playerTitle = document.getElementById('playerTitle');

    if (playerTitle) playerTitle.textContent = titulo;
    if (videoModal) {
        videoModal.classList.add('show');
        videoModal.style.display = 'flex';
        document.body.style.overflow = "hidden";
    }

    if (!playerContainer) return;

    liberarUrlObjetoActual();
    playerContainer.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-family:sans-serif;font-size:13px;">Cargando…</div>';

    // Archivo subido por el usuario (guardado en IndexedDB de este navegador)
    if (video.tipo === 'archivo') {
        try {
            const blob = await obtenerArchivoDeDB(video.idArchivo);
            if (!blob) {
                playerContainer.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ef4444;font-family:sans-serif;font-size:13px;padding:20px;text-align:center;">No se pudo cargar el archivo. Puede que se haya borrado el almacenamiento del navegador.</div>';
                return;
            }
            const objectUrl = URL.createObjectURL(blob);
            whUrlObjetoActual = objectUrl;

            playerContainer.innerHTML = '';
            const videoEl = document.createElement('video');
            videoEl.id = 'videoPlayer';
            videoEl.src = objectUrl;
            videoEl.controls = true;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.style.width = '100%';
            videoEl.style.height = '100%';
            playerContainer.appendChild(videoEl);

            setupVideoEvents(videoEl, titulo, imagen);
            mostrarBarraFlotante(titulo, imagen);
        } catch (e) {
            console.error(e);
            playerContainer.innerHTML = '<div style="color:#ef4444;">Error al cargar el video.</div>';
        }
        return;
    }

    // Enlace externo (YouTube, MP4 remoto, página web, etc.)
    const urlVideo = video.urlVideo || '';
    playerContainer.innerHTML = '';

  if (urlVideo.includes('youtube.com') || urlVideo.includes('youtu.be')) {
        let videoId = '';
        if (urlVideo.includes('youtu.be/')) {
            videoId = urlVideo.split('youtu.be/')[1].split('?')[0];
        } else if (urlVideo.includes('watch?v=')) {
            videoId = urlVideo.split('watch?v=')[1].split('&')[0];
        } else if (urlVideo.includes('/embed/')) {
            videoId = urlVideo.split('/embed/')[1].split('?')[0];
        }
        
        // Limpieza adicional por si quedan caracteres extra al final
        videoId = videoId.split('/')[0];

        playerContainer.innerHTML = `
            <iframe 
                src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0" 
                style="width:100%; height:100%; border:none;" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
            <div style="position:absolute; bottom:15px; right:15px; background:rgba(0,0,0,0.85); padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); z-index:10;">
                <p style="color:#fff; font-size:12px; margin:0 0 6px 0; font-family:sans-serif;">¿El autor bloqueó la reproducción aquí?</p>
                <a href="${urlVideo}" target="_blank" style="background:#e0115f; color:#fff; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:600; display:inline-block;">Abrir en YouTube ↗</a>
            </div>
        `;
        
        mostrarBarraFlotante(titulo, imagen);
    

    } else if (urlVideo.includes('.mp4') || urlVideo.includes('.webm') || urlVideo.includes('.ogg') || urlVideo.startsWith('blob:') || urlVideo.startsWith('data:')) {
        const video = document.createElement('video');
        video.id = 'videoPlayer';
        video.src = urlVideo;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.height = '100%';
        playerContainer.appendChild(video);
        
        setupVideoEvents(video, titulo, imagen);
        mostrarBarraFlotante(titulo, imagen);

    } else {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#13131a; color:#fff; text-align:center; padding:30px;";
        
        wrapper.innerHTML = `
            <div style="font-size: 42px; margin-bottom: 12px; color: var(--accent-blue);">🌐</div>
            <h3 style="margin-bottom: 8px; color: var(--accent-blue);">Enlace Web Externo</h3>
            <p style="max-width: 400px; font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
                Este enlace externo se abrirá de forma segura en una pestaña independiente.
            </p>
            <a href="${urlVideo}" target="_blank" rel="noopener noreferrer" style="background: var(--accent-blue); color: #fff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 8px; font-size: 14px;">
                Abrir Enlace ↗
            </a>
        `;
        playerContainer.appendChild(wrapper);
        mostrarBarraFlotante(titulo, imagen);
    } 
}

function minimizarAReproductorBarra() {
    const videoModal = document.getElementById('videoModal');
    if (videoModal) {
        videoModal.classList.remove('show');
        videoModal.style.display = 'none';
        document.body.style.overflow = "auto";
    }
}

const closePlayerBtn = document.getElementById('closePlayer');
if (closePlayerBtn) {
    closePlayerBtn.addEventListener('click', () => {
        minimizarAReproductorBarra();
        const playerContainer = document.querySelector('.player');
        if (playerContainer) playerContainer.innerHTML = '';
        liberarUrlObjetoActual();
        const ymusicBar = document.getElementById('ymusicBar');
        if (ymusicBar) ymusicBar.style.display = 'none';
    });
}

const ymusicBar = document.getElementById('ymusicBar');
const barPlayPause = document.getElementById('barPlayPause');
const barTitle = document.getElementById('barTitle');
const barThumb = document.getElementById('barThumb');

function mostrarBarraFlotante(titulo, imagen) {
    if (barTitle) barTitle.textContent = titulo || "Reproduciendo";
    if (barThumb && imagen) {
        barThumb.src = imagen;
    } else if (barThumb) {
        barThumb.src = "data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'1\'><rect width=\'18\' height=\'18\' x=\'3\' y=\'3\' rx=\'2\'/><path d=\'m9 10 5 3-5 3v-6z\'/></svg>";
    }
    if (ymusicBar) {
        ymusicBar.style.display = 'flex';
        ymusicBar.classList.remove('closing');
    }
}

function setupVideoEvents(video, titulo, imagen) {
    video.addEventListener('play', () => { if (barPlayPause) barPlayPause.textContent = "❚❚"; });
    video.addEventListener('pause', () => { if (barPlayPause) barPlayPause.textContent = "▶"; });
    video.addEventListener('timeupdate', () => {
        if (!isNaN(video.duration) && video.duration > 0) {
            const porcentaje = (video.currentTime / video.duration) * 100;
            const progressFilled = document.querySelector('.ymusic-progress-filled');
            if (progressFilled) progressFilled.style.width = `${porcentaje}%`;
            const timeDisplay = document.querySelector('.ymusic-time');
            if (timeDisplay) timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
        }
    });
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function abrirModalDesdeBarra() {
    const videoModal = document.getElementById('videoModal');
    if (videoModal) {
        videoModal.classList.add('show');
        videoModal.style.display = 'flex';
        document.body.style.overflow = "hidden";
    }
    if (ymusicBar) ymusicBar.style.display = 'none';
}

function toggleLikeBar(btn) {
    btn.classList.toggle('active-state');
    mostrarToast(btn.classList.contains('active-state') ? "Añadido a favoritos" : "Removido de favoritos");
}

function toggleDislikeBar(btn) {
    btn.classList.toggle('active-state');
}

function toggleMuteBar(btn) {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer && videoPlayer.tagName.toLowerCase() === "video") {
        videoPlayer.muted = !videoPlayer.muted;
        btn.textContent = videoPlayer.muted ? "🔇" : "🔊";
    }
}

function mostrarToast(mensaje) {
    if (!mensaje) return;
    const toast = document.getElementById('toast');
    if (toast) {
        toast.querySelector('p').textContent = mensaje;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 2500);
    }
}