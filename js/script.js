/* =====================================================
   WIBSITIHUB
   INTERACTIVIDAD COMPLETA (CON BARRA FLOTANTE YMUSIC Y SUBIDA)
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("searchInput");
    let cards = document.querySelectorAll(".video-card");
    const categories = document.querySelectorAll(".category");
    const modal = document.getElementById("videoModal");
    let videoPlayer = document.getElementById("videoPlayer");
    const playerTitle = document.getElementById("playerTitle");
    const closePlayerBtn = document.getElementById("closePlayer");
    const randomButton = document.getElementById("randomButton");
    const heroRandom = document.getElementById("heroRandom");
    const discoverRandom = document.getElementById("discoverRandom");
    const exploreButton = document.getElementById("exploreButton");
    const likeButton = document.getElementById("likeButton");

    let contenidoActualReproduciendose = { title: "", video: "", image: "" };
    
    // Lista global de videos y control de índice actual para botones de Anterior y Siguiente
    window.videosListaOriginalPerfil = [];
    window.indiceVideoActual = 0;

    function actualizarListaVideosGlobal() {
        const currentCards = document.querySelectorAll(".video-card");
        window.videosListaOriginalPerfil = Array.from(currentCards).map(card => {
            return {
                title: card.dataset.title || card.querySelector('.video-title')?.textContent || "Video",
                video: card.dataset.video || "",
                image: card.dataset.image || card.querySelector('img')?.src || ""
            };
        }).filter(v => v.video !== "");
    }

    /* =================================================
        ABRIR VIDEOS DESDE LAS TARJETAS
    ================================================ */

    function asignarEventosTarjetas() {
        cards = document.querySelectorAll(".video-card");
        cards.forEach(card => {
            if (card.dataset.listenerAttached) return;
            card.dataset.listenerAttached = "true";

            card.addEventListener("click", () => {
                const title = card.dataset.title;
                const video = card.dataset.video;
                const image = card.dataset.image;

                openVideo(title, video, image);
            });
        });
        actualizarListaVideosGlobal();
    }

    asignarEventosTarjetas();



    /* =================================================
        FUNCIÓN PLAYER UNIVERSAL
    ================================================ */

    window.openVideo = function(title, video, image) {
        if (!modal || !videoPlayer) return;

        contenidoActualReproduciendose = { title, video, image };

        // Actualizar el índice actual según la lista global
        const idx = window.videosListaOriginalPerfil.findIndex(v => v.video === video || v.title === title);
        if (idx !== -1) {
            window.indiceVideoActual = idx;
        }

        const ymusicBar = document.getElementById("ymusicBar");
        if (ymusicBar) ymusicBar.style.display = "none";

        playerTitle.textContent = title;
        modal.classList.add("show");
        document.body.style.overflow = "hidden";

        let processedVideo = video;
        
        const isRestrictedPlatform = 
            video.includes("pornhub.com") || 
            video.includes("clips4sale.com") || 
            video.includes("istockphoto.com");

        if (isRestrictedPlatform) {
            if (videoPlayer.tagName.toLowerCase() !== "div") {
                const wrapperDiv = document.createElement("div");
                wrapperDiv.id = "videoPlayer";
                wrapperDiv.style.cssText = "width:100%; height:100%; position:relative; background:#0a0a0c; display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 20px; text-align: center;";
                videoPlayer.replaceWith(wrapperDiv);
                videoPlayer = wrapperDiv;
            }

            videoPlayer.innerHTML = `
                <div style="max-width: 400px; font-family: sans-serif;">
                    <p style="color: #fff; font-size: 16px; margin-bottom: 15px; font-weight: 500;">Este contenido externo requiere abrirse directamente en su plataforma de origen por motivos de seguridad.</p>
                    <a href="${video}" target="_blank" style="background: #e0115f; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">Ver en plataforma externa ↗</a>
                </div>
            `;
            return;
        }

        if (video.includes("youtu.be/")) {
            const videoId = video.split("youtu.be/")[1].split("?")[0];
            processedVideo = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        } else if (video.includes("youtube.com/watch?v=")) {
            const videoId = video.split("v=")[1].split("&")[0];
            processedVideo = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
        } else if (video.includes("vimeo.com/")) {
            const vimeoId = video.split("vimeo.com/")[1].split("?")[0];
            processedVideo = `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
        } else if (video.includes("youtube.com/embed/")) {
            processedVideo = video.includes("?") ? `${video}&autoplay=1&rel=0` : `${video}?autoplay=1&rel=0`;
            if (!processedVideo.includes("youtube-nocookie.com")) {
                processedVideo = processedVideo.replace("youtube.com", "youtube-nocookie.com");
            }
        }

        const isDirectVideo = processedVideo.endsWith(".mp4") || 
                              processedVideo.endsWith(".webm") || 
                              processedVideo.endsWith(".ogg") || 
                              processedVideo.includes("cdn.pixabay.com") ||
                              processedVideo.includes("/videos/download/");

        if (isDirectVideo) {
            if (videoPlayer.tagName.toLowerCase() !== "video") {
                const vidElement = document.createElement("video");
                vidElement.id = "videoPlayer";
                vidElement.controls = true;
                vidElement.playsInline = true;
                vidElement.muted = false; 
                vidElement.style.width = "100%";
                vidElement.style.height = "100%";
                vidElement.style.background = "#000";
                
                videoPlayer.replaceWith(vidElement);
                videoPlayer = vidElement;
                inicializarEventosBarraYMusic(); 
            }
            videoPlayer.src = processedVideo;
            videoPlayer.poster = image || "";
            videoPlayer.play().catch(() => {
                videoPlayer.muted = true;
                videoPlayer.play();
                mostrarToast("Reproduciendo en silencio por restricciones del navegador. Haz clic en el audio.");
            });
        } else {
            const iframeHTML = `
                <iframe 
                    id="universalIframe" 
                    src="${processedVideo}" 
                    title="${title}" 
                    frameborder="0" 
                    referrerpolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowfullscreen
                    style="width:100%; height:100%; border:none;">
                </iframe>
                <div id="iframeFallback" style="position:absolute; bottom:15px; right:15px; display:none; background:rgba(0,0,0,0.85); padding:10px 14px; border-radius:8px; border:1px solid rgba(255,255,255,0.15); z-index:10;">
                    <p style="color:#fff; font-size:12px; margin:0 0 6px 0; font-family:sans-serif;">¿El sitio bloquea la vista previa?</p>
                    <a href="${video}" target="_blank" style="background:#6366f1; color:#fff; padding:6px 12px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:600; display:inline-block;">Abrir en pestaña nueva ↗</a>
                </div>
            `;

            if (videoPlayer.tagName.toLowerCase() !== "div") {
                const wrapperDiv = document.createElement("div");
                wrapperDiv.id = "videoPlayer";
                wrapperDiv.style.cssText = "width:100%; height:100%; position:relative; background:#0a0a0c; display:flex; align-items:center; justify-content:center;";
                videoPlayer.replaceWith(wrapperDiv);
                wrapperDiv.innerHTML = iframeHTML;
                videoPlayer = wrapperDiv;
            } else {
                videoPlayer.innerHTML = iframeHTML;
            }

            setTimeout(() => {
                const fallback = document.getElementById("iframeFallback");
                if (fallback) fallback.style.display = "block";
            }, 3000);
        }
    };



    /* =================================================
        CERRAR Y MINIMIZAR PLAYER (ESTILO YMUSIC)
    ================================================ */

    function closeVideo() {
        modal.classList.remove("show");

        if (videoPlayer && videoPlayer.tagName && videoPlayer.tagName.toLowerCase() === "video") {
            videoPlayer.pause();
            videoPlayer.currentTime = 0;
        }

        if (videoPlayer && videoPlayer.tagName && videoPlayer.tagName.toLowerCase() === "div") {
            videoPlayer.innerHTML = "";
        } else if (videoPlayer) {
            videoPlayer.removeAttribute("src");
        }

        document.body.style.overflow = "";
    }

    window.minimizarAReproductorBarra = function() {
        if (modal) modal.classList.remove("show");
        document.body.style.overflow = "";

        const ymusicBar = document.getElementById("ymusicBar");
        const barTitle = document.getElementById("barTitle");
        const barThumb = document.getElementById("barThumb");

        if (barTitle) barTitle.textContent = contenidoActualReproduciendose.title;
        if (barThumb) barThumb.src = contenidoActualReproduciendose.image || "../assets/img/portada1.jpg";

        if (ymusicBar) {
            ymusicBar.style.display = "flex";
            ymusicBar.classList.remove("closing");
        }
    };

    window.abrirModalDesdeBarra = function() {
        const ymusicBar = document.getElementById("ymusicBar");
        if (ymusicBar) ymusicBar.style.display = "none";

        window.openVideo(
            contenidoActualReproduciendose.title,
            contenidoActualReproduciendose.video,
            contenidoActualReproduciendose.image
        );
    };

    window.cerrarBarraFlotante = function(event) {
        if (event) event.stopPropagation();
        const ymusicBar = document.getElementById("ymusicBar");
        if (ymusicBar) {
            ymusicBar.classList.add("closing");
            setTimeout(() => {
                ymusicBar.style.display = "none";
                ymusicBar.classList.remove("closing");
            }, 300);
        }

        if (videoPlayer && videoPlayer.tagName && videoPlayer.tagName.toLowerCase() === "video") {
            videoPlayer.pause();
            videoPlayer.currentTime = 0;
        } else if (videoPlayer && videoPlayer.tagName && (videoPlayer.tagName.toLowerCase() === "div" || videoPlayer.tagName.toLowerCase() === "iframe")) {
            if (videoPlayer.tagName.toLowerCase() === "iframe") {
                videoPlayer.src = "";
            } else {
                videoPlayer.innerHTML = "";
            }
        }
    };



    /* =================================================
        CONTROLES Y FUNCIONES COMPLETAS DE LA BARRA FLOTANTE
    ================================================ */

    window.togglePlayBar = function(event) {
        if (event) event.stopPropagation();
        const btn = document.getElementById("barPlayPause");
        const currentVideo = document.getElementById("videoPlayer");
        if (currentVideo && currentVideo.tagName && currentVideo.tagName.toLowerCase() === "video") {
            if (currentVideo.paused) {
                currentVideo.play().catch(()=>{});
                if (btn) btn.textContent = "❚❚";
            } else {
                currentVideo.pause();
                if (btn) btn.textContent = "▶";
            }
        } else {
            const firstCard = document.querySelector('.video-grid .video-card');
            if (firstCard) {
                const videoUrl = firstCard.getAttribute('data-video');
                const titulo = firstCard.getAttribute('data-title');
                const imagen = firstCard.querySelector('img') ? firstCard.querySelector('img').src : '';
                if (videoUrl && typeof window.openVideo === 'function') {
                    window.openVideo(titulo, videoUrl, imagen);
                }
            }
        }
    };

    window.toggleLikeBar = function(btn) {
        btn.classList.toggle('active-state');
        const dislikeBtn = document.getElementById('btnDislikeBar');
        if (dislikeBtn) dislikeBtn.classList.remove('active-state');
        mostrarToast(btn.classList.contains('active-state') ? "¡Te gusta este video!" : "Me gusta retirado");
    };

    window.toggleDislikeBar = function(btn) {
        btn.classList.toggle('active-state');
        const likeBtn = document.getElementById('btnLikeBar');
        if (likeBtn) likeBtn.classList.remove('active-state');
        mostrarToast(btn.classList.contains('active-state') ? "Marcado como no me gusta" : "");
    };

    window.toggleMuteBar = function(btn) {
        const currentVideo = document.getElementById("videoPlayer");
        if (!currentVideo || currentVideo.tagName.toLowerCase() !== "video") {
            mostrarToast("Audio no aplicable a este formato");
            return;
        }
        currentVideo.muted = !currentVideo.muted;
        btn.textContent = currentVideo.muted ? "🔇" : "🔊";
        mostrarToast(currentVideo.muted ? "Silenciado" : "Audio activado");
    };

    window.toggleActivo = function(btn) {
        btn.classList.toggle('active-state');
        const title = btn.getAttribute('title') || "Opción";
        mostrarToast(btn.classList.contains('active-state') ? `${title}: Activado` : `${title}: Desactivado`);
    };

    window.controlAnterior = function(event) {
        if (event) event.stopPropagation();
        if (window.videosListaOriginalPerfil && window.videosListaOriginalPerfil.length > 0) {
            if (window.indiceVideoActual > 0) {
                window.indiceVideoActual--;
                const v = window.videosListaOriginalPerfil[window.indiceVideoActual];
                window.openVideo(v.title, v.video, v.image);
            } else {
                mostrarToast("Este es el primer video de la lista");
            }
        } else {
            mostrarToast("No hay lista de videos disponible");
        }
    };

    window.controlSiguiente = function(event) {
        if (event) event.stopPropagation();
        if (window.videosListaOriginalPerfil && window.videosListaOriginalPerfil.length > 0) {
            if (window.indiceVideoActual < window.videosListaOriginalPerfil.length - 1) {
                window.indiceVideoActual++;
                const v = window.videosListaOriginalPerfil[window.indiceVideoActual];
                window.openVideo(v.title, v.video, v.image);
            } else {
                mostrarToast("No hay más videos en la lista");
            }
        } else {
            mostrarToast("No hay lista de videos disponible");
        }
    };

    window.mostrarMenuOpciones = function(event) {
        if (event) event.stopPropagation();
        alert("Opciones adicionales: Calidad, Velocidad de reproducción, Reportar.");
    };

    function mostrarToast(mensaje) {
        if (!mensaje) return;
        const toast = document.getElementById('toast');
        if (toast) {
            const pTag = toast.querySelector('p');
            if (pTag) pTag.textContent = mensaje;
            toast.style.display = 'flex';
            toast.classList.add('show');
            setTimeout(() => {
                toast.style.display = 'none';
                toast.classList.remove('show');
            }, 2500);
        }
    }

    if (closePlayerBtn) {
        closePlayerBtn.addEventListener("click", closeVideo);
    }

    modal.addEventListener("click", event => {
        if (event.target === modal) {
            closeVideo();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeVideo();
        }
    });



    /* =================================================
        CONTROLADOR DE BARRA DE PROGRESO Y TIEMPOS (YMUSIC)
    ================================================ */

    function inicializarEventosBarraYMusic() {
        const progressFilled = document.querySelector(".ymusic-progress-filled");
        const progressBar = document.querySelector(".ymusic-progress-bar");
        const timeDisplay = document.querySelector(".ymusic-time");
        const barPlayPause = document.getElementById("barPlayPause");

        const activeVid = document.getElementById("videoPlayer");
        if (activeVid && activeVid.tagName && activeVid.tagName.toLowerCase() === "video") {
            activeVid.addEventListener("play", () => {
                if (barPlayPause) barPlayPause.textContent = "❚❚";
            });
            activeVid.addEventListener("pause", () => {
                if (barPlayPause) barPlayPause.textContent = "▶";
            });

            activeVid.addEventListener("timeupdate", () => {
                if (!isNaN(activeVid.duration) && activeVid.duration > 0) {
                    const porcentaje = (activeVid.currentTime / activeVid.duration) * 100;
                    if (progressFilled) progressFilled.style.width = `${porcentaje}%`;
                    
                    const tiempoActualFmt = formatTime(activeVid.currentTime);
                    const duracionTotalFmt = formatTime(activeVid.duration);
                    if (timeDisplay) timeDisplay.textContent = `${tiempoActualFmt} / ${duracionTotalFmt}`;
                }
            });
        }

        if (progressBar) {
            progressBar.replaceWith(progressBar.cloneNode(true));
            const newProgressBar = document.querySelector(".ymusic-progress-bar");
            
            newProgressBar.addEventListener("click", (e) => {
                e.stopPropagation();
                const currentVid = document.getElementById("videoPlayer");
                const rect = newProgressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const width = rect.width;
                if (currentVid && currentVid.tagName && currentVid.tagName.toLowerCase() === "video" && !isNaN(currentVid.duration) && currentVid.duration > 0) {
                    currentVid.currentTime = (clickX / width) * currentVid.duration;
                    currentVid.play().catch(() => {});
                    const barPlayPause = document.getElementById("barPlayPause");
                    if (barPlayPause) barPlayPause.textContent = "❚❚";
                }
            });
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    inicializarEventosBarraYMusic();



    /* =================================================
        CATEGORÍAS
    ================================================ */

    categories.forEach(category => {
        category.addEventListener("click", () => {
            categories.forEach(item => {
                item.classList.remove("active");
            });

            category.classList.add("active");

            const selected = category.dataset.category;
            const actualCards = document.querySelectorAll(".video-card");

            actualCards.forEach(card => {
                if (selected === "Todos") {
                    card.style.display = "";
                    return;
                }

                if (card.dataset.category === selected) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });



    /* =================================================
        BUSCADOR
    ================================================ */

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            const actualCards = document.querySelectorAll(".video-card");

            actualCards.forEach(card => {
                const title = card.dataset.title.toLowerCase();
                const category = card.dataset.category.toLowerCase();

                if (title.includes(query) || category.includes(query)) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            });
        });

        searchInput.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                const actualCards = document.querySelectorAll(".video-card");
                const firstVisible = [...actualCards].find(card => card.style.display !== "none");

                if (firstVisible) {
                    openVideo(
                        firstVisible.dataset.title,
                        firstVisible.dataset.video,
                        firstVisible.dataset.image
                    );
                }
            }
        });
    }



    /* =================================================
        VIDEO ALEATORIO
    ================================================ */

    function randomVideo() {
        const actualCards = document.querySelectorAll(".video-card");
        const visibleCards = [...actualCards].filter(card => card.style.display !== "none");

        if (visibleCards.length === 0) return;

        const random = visibleCards[Math.floor(Math.random() * visibleCards.length)];

        openVideo(
            random.dataset.title,
            random.dataset.video,
            random.dataset.image
        );
    }

    if (randomButton) randomButton.addEventListener("click", randomVideo);
    if (heroRandom) heroRandom.addEventListener("click", randomVideo);
    if (discoverRandom) discoverRandom.addEventListener("click", randomVideo);



    /* =================================================
        EXPLORAR
    ================================================ */

    if (exploreButton) {
        exploreButton.addEventListener("click", () => {
            const videoSection = document.querySelector(".video-section");
            if (videoSection) {
                videoSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    }



    /* =================================================
        LIKE PRINCIPAL
    ================================================ */

    if (likeButton) {
        likeButton.addEventListener("click", () => {
            const liked = likeButton.classList.toggle("liked");

            if (liked) {
                likeButton.innerHTML = "♥ <span>Te gusta</span>";
                mostrarToast("Video añadido a favoritos");
            } else {
                likeButton.innerHTML = "♡ <span>Me gusta</span>";
            }
        });
    }



    /* =================================================
        BOTONES SIDEBAR
    ================================================ */

    const sideLinks = document.querySelectorAll(".side-link");
    sideLinks.forEach(link => {
        link.addEventListener("click", () => {
            sideLinks.forEach(item => item.classList.remove("active"));
            link.classList.add("active");
        });
    });



    /* =================================================
        PANEL DE CREACIÓN Y SUBIDA DE VIDEOS (CON PERSISTENCIA)
    ================================================ */
    const modalSubida = document.getElementById("modalSubida");
    const btnAbrirSubida = document.getElementById("btnAbrirSubida");
    const closeSubida = document.getElementById("closeSubida");
    const btnSubirVideoForm = document.getElementById("btnSubirVideoForm");

    if (btnAbrirSubida && modalSubida) {
        btnAbrirSubida.addEventListener("click", () => {
            modalSubida.style.display = "flex";
            modalSubida.classList.add("show");
            document.body.style.overflow = "hidden";
        });
    }

    if (closeSubida && modalSubida) {
        closeSubida.addEventListener("click", () => {
            modalSubida.style.display = "none";
            modalSubida.classList.remove("show");
            document.body.style.overflow = "";
        });
    }

    if (modalSubida) {
        modalSubida.addEventListener("click", (event) => {
            if (event.target === modalSubida) {
                modalSubida.style.display = "none";
                modalSubida.classList.remove("show");
                document.body.style.overflow = "";
            }
        });
    }

    function renderizarTarjetaVideo(titulo, urlVideo, urlPortada, categoriaDetectada, esGuardado = false) {
        const videoGrid = document.getElementById("videoGrid");
        if (!videoGrid) return;

        const nuevaCard = document.createElement("article");
        nuevaCard.className = "video-card";
        nuevaCard.setAttribute("data-category", categoriaDetectada);
        nuevaCard.setAttribute("data-title", titulo);
        nuevaCard.setAttribute("data-video", urlVideo);
        nuevaCard.setAttribute("data-image", urlPortada);

        nuevaCard.innerHTML = `
            <div class="thumbnail">
                <img src="${urlPortada}" alt="${titulo}">
                <div class="thumbnail-gradient"></div>
                <div class="quality">HD</div>
                <div class="duration">Nuevo</div>
                <button class="play-button">▶</button>
            </div>
            <div class="video-info">
                <div class="video-title">${titulo}</div>
                <div class="creator">
                    <div class="creator-avatar" style="background: #6366f1;">AM</div>
                    <span>Anthony (Tú)</span>
                    <i>✓</i>
                </div>
                <div class="video-meta">
                    <span>${esGuardado ? 'Guardado local' : 'Hace un momento'}</span>
                    <b>•</b>
                    <span>0 vistas</span>
                </div>
            </div>
        `;

        nuevaCard.addEventListener("click", () => {
            openVideo(titulo, urlVideo, urlPortada);
        });

        videoGrid.prepend(nuevaCard);
        asignarEventosTarjetas();
    }

    function cargarVideosGuardados() {
        let videosAlmacenados = JSON.parse(localStorage.getItem('wibsitihub_mis_videos')) || [];
        videosAlmacenados.forEach(v => {
            renderizarTarjetaVideo(v.titulo, v.urlVideo, v.urlPortada, v.categoria, true);
        });
    }

    cargarVideosGuardados();

    if (btnSubirVideoForm) {
        btnSubirVideoForm.addEventListener("click", () => {
            const titulo = document.getElementById("inputTituloVideo").value.trim();
            const urlVideo = document.getElementById("inputUrlVideo").value.trim();
            const urlPortada = document.getElementById("inputPortadaVideo").value.trim() || "../assets/img/portada1.jpg";

            if (!titulo || !urlVideo) {
                alert("Por favor, completa al menos el título y el enlace del video.");
                return;
            }

            let categoriaDetectada = "Videos";
            const tLower = titulo.toLowerCase();
            if (tLower.includes("phonk") || tLower.includes("drift") || tLower.includes("slowed") || tLower.includes("reverb")) {
                categoriaDetectada = "Phonk";
            } else if (tLower.includes("gameplay") || tLower.includes("juego") || tLower.includes("gta") || tLower.includes("minecraft")) {
                categoriaDetectada = "Gaming";
            } else if (tLower.includes("musica") || tLower.includes("music") || tLower.includes("mix") || tLower.includes("song") || tLower.includes("audio")) {
                categoriaDetectada = "Musica";
            } else if (tLower.includes("corto") || tLower.includes("short") || tLower.includes("reel")) {
                categoriaDetectada = "Cortos";
            }

            let videosAlmacenados = JSON.parse(localStorage.getItem('wibsitihub_mis_videos')) || [];
            const nuevoObjetoVideo = { titulo, urlVideo, urlPortada, categoria: categoriaDetectada };
            videosAlmacenados.push(nuevoObjetoVideo);
            localStorage.setItem('wibsitihub_mis_videos', JSON.stringify(videosAlmacenados));

            renderizarTarjetaVideo(titulo, urlVideo, urlPortada, categoriaDetectada, false);

            document.getElementById("inputTituloVideo").value = "";
            document.getElementById("inputUrlVideo").value = "";
            document.getElementById("inputPortadaVideo").value = "";

            modalSubida.style.display = "none";
            modalSubida.classList.remove("show");
            document.body.style.overflow = "";

            mostrarToast("¡Video y miniatura guardados con éxito!");
        });
    }

    console.log("WIBSITIHUB — SISTEMA CARGADO CORRECTAMENTE");







    
});