// Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
});

// Music Playlist System
const playlist = [
    { title: 'Ease My Mind', file: 'ease my mind.mp3' },
    { title: 'Isaka 6am', file: 'isaka 6am.mp3' },
    { title: 'Too Cool to be Careless', file: 'too cool to be careless.mp3' },
    { title: 'When You Were Young', file: 'when you were young.mp3' },
    { title: 'Always Get Through to You', file: 'always get through to you.mp3' },
    { title: 'Differences', file: 'differences.mp3' },
    { title: 'Insomnia', file: 'insomnia.mp3' },
    { title: 'Still Sleepless', file: 'still sleepless.mp3' }
];

let currentTrackIndex = 0;
let isPlaying = false;
let hasInteracted = false;
let volumeFadeInterval = null;
let playedTracks = new Set(); // Track which songs have been played

const backgroundMusic = document.getElementById('backgroundMusic');
const musicToggle = document.getElementById('musicToggle');
const musicPrev = document.getElementById('musicPrev');
const musicNext = document.getElementById('musicNext');

function loadTrack(index) {
    if (index < 0) index = playlist.length - 1;
    if (index >= playlist.length) index = 0;
    currentTrackIndex = index;
    backgroundMusic.src = `assets/audio/${playlist[index].file}`;
    backgroundMusic.load(); // Ensure the track is loaded
    updatePlaylistUI();
    
    // Reset progress border when loading new track
    const activeItem = document.querySelector('.playlist-item.active');
    if (activeItem) {
        activeItem.style.setProperty('--progress-degrees', '0');
    }
}

function updatePlaylistUI() {
    const playlistContainer = document.getElementById('musicPlaylist');
    if (!playlistContainer) return;
    
    playlistContainer.innerHTML = playlist.map((track, index) => `
        <div class="playlist-item ${index === currentTrackIndex ? 'active' : ''}" data-index="${index}">
            <span class="playlist-item-number">${index + 1}</span>
            <span class="playlist-item-title">${track.title}</span>
        </div>
    `).join('');
    
    playlistContainer.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            loadTrack(index);
            if (isPlaying) {
                playMusic();
            }
        });
    });
    
    lucide.createIcons();
}

function updateMusicControls() {
    if (!musicToggle) {
        console.error('musicToggle not found');
        return;
    }
    
    // Clear all content first
    musicToggle.innerHTML = '';
    
    // Create new icon element
    const newIcon = document.createElement('i');
    const iconName = isPlaying ? 'pause' : 'play';
    newIcon.setAttribute('data-lucide', iconName);
    musicToggle.appendChild(newIcon);
    
    // Force lucide to recreate the icon - but only for this button
    const icons = musicToggle.querySelectorAll('[data-lucide]');
    lucide.createIcons(icons);
    
    console.log('Music controls updated, isPlaying:', isPlaying, 'icon:', iconName);
}

function updateMusicProgress() {
    const progressFill = document.getElementById('musicProgressFill');
    if (!progressFill || !backgroundMusic) return;
    
    if (backgroundMusic.duration) {
        const percent = (backgroundMusic.currentTime / backgroundMusic.duration) * 100;
        progressFill.style.width = percent + '%';
        
        // Update progress border on active playlist item (convert percent to degrees)
        const activeItem = document.querySelector('.playlist-item.active');
        if (activeItem) {
            const degrees = (percent / 100) * 360;
            activeItem.style.setProperty('--progress-degrees', degrees);
        }
    }
}

function playMusic() {
    console.log('Playing music');
    backgroundMusic.play()
        .then(() => {
            isPlaying = true;
            updateMusicControls();
            console.log('Music playing, isPlaying:', isPlaying);
            
            // Gradual volume increase over 6 seconds
            backgroundMusic.volume = 0.1; // Start immediately at low volume
            clearInterval(volumeFadeInterval);
            let volume = 0.1;
            const targetVolume = 0.3;
            const fadeDuration = 6000; // 6 seconds
            const steps = 100;
            const volumeStep = (targetVolume - 0.1) / steps;
            const timeStep = fadeDuration / steps;
            
            volumeFadeInterval = setInterval(() => {
                volume += volumeStep;
                if (volume >= targetVolume) {
                    volume = targetVolume;
                    clearInterval(volumeFadeInterval);
                }
                backgroundMusic.volume = volume;
            }, timeStep);
        })
        .catch(error => {
            console.error('Error playing music:', error);
        });
}

function pauseMusic() {
    console.log('Pausing music');
    backgroundMusic.pause();
    isPlaying = false;
    clearInterval(volumeFadeInterval);
    updateMusicControls();
    console.log('Music paused, isPlaying:', isPlaying);
}

// Setup music controls
function setupMusicControls() {
    if (!musicToggle || !backgroundMusic) return;
    
    musicToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        hasInteracted = true;
        console.log('Music toggle clicked, isPlaying:', isPlaying);
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });

    if (musicPrev) {
        musicPrev.addEventListener('click', function() {
            hasInteracted = true;
            loadTrack(currentTrackIndex - 1);
            if (isPlaying) {
                playMusic();
            }
        });
    }

    if (musicNext) {
        musicNext.addEventListener('click', function() {
            hasInteracted = true;
            loadTrack(currentTrackIndex + 1);
            if (isPlaying) {
                playMusic();
            }
        });
    }

    let isHandlingEnded = false; // Prevent multiple ended events from firing
    
    backgroundMusic.addEventListener('ended', function() {
        // Prevent multiple ended events from being processed
        if (isHandlingEnded) {
            console.log('Already handling ended event, skipping');
            return;
        }
        
        isHandlingEnded = true;
        
        // Mark current track as played BEFORE calculating next
        const justPlayedIndex = currentTrackIndex;
        playedTracks.add(justPlayedIndex);
        
        console.log('Track ended:', justPlayedIndex, 'Played tracks:', Array.from(playedTracks));
        
        // If all tracks have been played, reset the set BUT exclude the current one
        if (playedTracks.size >= playlist.length) {
            console.log('All tracks played, resetting set (excluding current)');
            playedTracks.clear();
            // Don't add current back - we want to skip it
        }
        
        // Find next unplayed track - start from next index
        let nextIndex = (justPlayedIndex + 1) % playlist.length;
        let attempts = 0;
        const maxAttempts = playlist.length * 2; // More attempts to be safe
        
        // Skip tracks that have already been played AND ensure it's not the same track
        while ((playedTracks.has(nextIndex) || nextIndex === justPlayedIndex) && attempts < maxAttempts) {
            nextIndex = (nextIndex + 1) % playlist.length;
            attempts++;
            console.log('Skipping track', nextIndex, 'attempt', attempts);
        }
        
        // CRITICAL: Final safety check - if we somehow ended up with the same track, force move
        if (nextIndex === justPlayedIndex) {
            console.warn('Same track detected, forcing next');
            nextIndex = (nextIndex + 1) % playlist.length;
            // Also mark it so we don't get stuck
            if (nextIndex === justPlayedIndex) {
                // If we only have 1 song (shouldn't happen), just skip it
                nextIndex = (nextIndex + 1) % playlist.length;
            }
        }
        
        console.log('Loading next track:', nextIndex, '(was:', justPlayedIndex, ')');
        
        // CRITICAL: Update currentTrackIndex BEFORE loading to prevent race conditions
        currentTrackIndex = nextIndex;
        
        // Load the next track directly (don't use loadTrack to avoid state conflicts)
        const wasPlaying = isPlaying; // Remember if we were playing
        backgroundMusic.src = `assets/audio/${playlist[nextIndex].file}`;
        backgroundMusic.load(); // Ensure the track is loaded
        updatePlaylistUI();
        
        // Reset progress border
        const activeItem = document.querySelector('.playlist-item.active');
        if (activeItem) {
            activeItem.style.setProperty('--progress-degrees', '0');
        }
        
        // Wait for track to load, then play if we were playing
        const playNextTrack = function() {
            // Remove listeners to prevent multiple calls
            backgroundMusic.removeEventListener('canplay', playNextTrack);
            backgroundMusic.removeEventListener('loadeddata', playNextTrack);
            
            isHandlingEnded = false; // Reset flag
            
            if (wasPlaying) {
                // Verify we're loading the right track
                const expectedSrc = `assets/audio/${playlist[nextIndex].file}`;
                if (backgroundMusic.src.includes(playlist[nextIndex].file)) {
                    // Small delay to ensure audio is fully ready
                    setTimeout(() => {
                        backgroundMusic.play()
                            .then(() => {
                                isPlaying = true;
                                updateMusicControls();
                                console.log('Next track playing:', nextIndex, playlist[nextIndex].title);
                            })
                            .catch(error => {
                                console.error('Error playing next track:', error);
                                isPlaying = false;
                                updateMusicControls();
                                isHandlingEnded = false;
                            });
                    }, 150);
                } else {
                    console.error('Track mismatch! Expected:', expectedSrc, 'Got:', backgroundMusic.src);
                    isHandlingEnded = false;
                }
            } else {
                isHandlingEnded = false;
            }
        };
        
        // Listen for when track is ready
        if (backgroundMusic.readyState >= 2) {
            // Already loaded, play immediately
            setTimeout(() => {
                playNextTrack();
            }, 50);
        } else {
            // Wait for load
            backgroundMusic.addEventListener('canplay', playNextTrack, { once: true });
            backgroundMusic.addEventListener('loadeddata', playNextTrack, { once: true });
            
            // Timeout fallback
            setTimeout(() => {
                if (isHandlingEnded) {
                    console.log('Timeout waiting for track to load, playing anyway');
                    playNextTrack();
                }
            }, 2000);
        }
    });

    backgroundMusic.addEventListener('timeupdate', updateMusicProgress);
    backgroundMusic.addEventListener('loadedmetadata', function() {
        updateMusicProgress();
    });

    // Music progress bar click to seek
    const musicProgressBar = document.getElementById('musicProgressBar');
    if (musicProgressBar) {
        musicProgressBar.addEventListener('click', function(e) {
            if (!backgroundMusic.duration) return;
            const rect = this.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            backgroundMusic.currentTime = percent * backgroundMusic.duration;
            updateMusicProgress();
        });
    }

    // Initialize
    loadTrack(0);
    updateMusicControls();

    // Auto-play immediately - start at low volume and fade in
    function startMusicWithFade() {
        if (isPlaying) return; // Already playing
        
        // Ensure audio is loaded first
        if (backgroundMusic.readyState === 0) {
            backgroundMusic.load();
        }
        
        backgroundMusic.volume = 0.1;
        
        // Try to play
        const tryPlay = () => {
            const playPromise = backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        isPlaying = true;
                        updateMusicControls();
                        console.log('Music autoplay started successfully');
                        
                        // Then fade in volume over 6 seconds
                        let volume = 0.1;
                        const targetVolume = 0.3;
                        const fadeDuration = 6000;
                        const steps = 100;
                        const volumeStep = (targetVolume - 0.1) / steps;
                        const timeStep = fadeDuration / steps;
                        
                        volumeFadeInterval = setInterval(() => {
                            volume += volumeStep;
                            if (volume >= targetVolume) {
                                volume = targetVolume;
                                clearInterval(volumeFadeInterval);
                            }
                            backgroundMusic.volume = volume;
                        }, timeStep);
                    })
                    .catch(error => {
                        console.log('Auto-play prevented:', error);
                        // Try again when audio is ready
                        if (backgroundMusic.readyState < 2) {
                            backgroundMusic.addEventListener('canplay', () => {
                                if (!isPlaying) {
                                    tryPlay();
                                }
                            }, { once: true });
                        } else {
                            // Audio is ready but play was blocked - try on interaction
                            const tryPlayOnInteraction = () => {
                                if (!isPlaying) {
                                    tryPlay();
                                }
                            };
                            document.addEventListener('click', tryPlayOnInteraction, { once: true });
                            document.addEventListener('touchstart', tryPlayOnInteraction, { once: true });
                            document.addEventListener('keydown', tryPlayOnInteraction, { once: true });
                            document.addEventListener('mousemove', tryPlayOnInteraction, { once: true });
                        }
                    });
            }
        };
        
        // Wait for audio to be ready if needed
        if (backgroundMusic.readyState >= 2) {
            tryPlay();
        } else {
            backgroundMusic.addEventListener('canplay', tryPlay, { once: true });
            backgroundMusic.addEventListener('loadeddata', tryPlay, { once: true });
        }
    }
    
    // Try to start immediately - multiple attempts
    // First attempt: immediate (after a small delay to ensure audio element is ready)
    setTimeout(() => {
        if (!isPlaying) {
            startMusicWithFade();
        }
    }, 200);
    
    // Second attempt: after DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (!isPlaying) {
                    startMusicWithFade();
                }
            }, 300);
        });
    } else {
        setTimeout(() => {
            if (!isPlaying) {
                startMusicWithFade();
            }
        }, 300);
    }
    
    // Third attempt: after window load
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (!isPlaying) {
                startMusicWithFade();
            }
        }, 500);
    });
    
    // Fourth attempt: when audio metadata is loaded
    backgroundMusic.addEventListener('loadedmetadata', () => {
        setTimeout(() => {
            if (!isPlaying) {
                startMusicWithFade();
            }
        }, 100);
    }, { once: true });
}

// Hero Photo Collage with Flipping Cards
function loadHeroCollage() {
    const collage = document.getElementById('heroCollage');
    if (!collage) return;
    
    // All photos except "Garrett Hoi An Vietnam.JPG" for hero collage
    const photos = [
        'Ajax.jpeg',
        'Ediths Garrett.JPG',
        'Fam in Hamptons.jpeg',
        'Garrett Aix en Provence.JPG',
        'Garrett and Brendan Lobster Pasta.JPG',
        'Garrett and Devon Skiing.jpg',
        'Garrett and Tri in Copenhagen.JPG',
        'Garrett at Guerite.JPG',
        // 'Garrett Hoi An Vietnam.JPG', // Excluded from hero collage
        'Garrett Ibiza.jpeg',
        'Garrett in Cope.JPG',
        'Garrett in Marseille.JPG',
        'Garrett in Tokyo.JPG',
        'Garrett Marathon 2022.JPG',
        'Guerite Lunch.JPG',
        'Lads at Liam VDHs Wedding.JPG',
        'Shortys.JPG',
        'Squad at Guerite.JPG',
        'Squad Cloud9.jpeg',
        'Takalads.jpeg'
    ];
    
    // Shuffle and take 12 photos for the grid
    const shuffled = [...photos].sort(() => Math.random() - 0.5).slice(0, 12);
    
    collage.innerHTML = shuffled.map((photo, index) => {
        const backPhoto = shuffled[(index + 6) % shuffled.length];
        const photoName = photo.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '').replace(/\s+/g, ' ');
        const backPhotoName = backPhoto.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '').replace(/\s+/g, ' ');
        return `
        <div class="hero-photo-card" style="animation-delay: ${index * 0.1}s">
            <div class="hero-photo-card-front">
                <img src="assets/images/photos/${photo}" alt="${photoName} - Garrett Wolfe" loading="eager" onerror="console.error('Failed to load:', 'assets/images/photos/${photo}'); this.parentElement.parentElement.style.display='none';">
            </div>
            <div class="hero-photo-card-back">
                <img src="assets/images/photos/${backPhoto}" alt="${backPhotoName} - Garrett Wolfe" loading="eager" onerror="console.error('Failed to load:', 'assets/images/photos/${backPhoto}'); this.parentElement.parentElement.style.display='none';">
            </div>
        </div>
    `;
    }).join('');
    
    console.log('Hero collage loaded with', shuffled.length, 'photos');
    
    // Add flip on hover (immediate, no delay)
    setTimeout(() => {
        collage.querySelectorAll('.hero-photo-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.classList.add('flipped');
            });
            card.addEventListener('mouseleave', function() {
                this.classList.remove('flipped');
            });
        });
    }, 100);
}

// Photo Modal
function setupPhotoModal() {
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalClose = document.getElementById('modalClose');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (!modal || !modalImage || !modalClose) return;
    
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                modalImage.src = img.src;
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Dynamic Hover Effects Based on Mouse Position
function setupDynamicHover() {
    const elements = document.querySelectorAll('.favorite-category, .toolbar-link, .playlist-item, .experience-card, .gallery-item, .network-link, .hero-cta');
    
    elements.forEach(element => {
        element.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update CSS variables for the ::before pseudo-element
            this.style.setProperty('--mouse-x', `${x}px`);
            this.style.setProperty('--mouse-y', `${y}px`);
        });
        
        element.addEventListener('mouseleave', function() {
            // Reset to center on leave
            const rect = this.getBoundingClientRect();
            this.style.setProperty('--mouse-x', `${rect.width / 2}px`);
            this.style.setProperty('--mouse-y', `${rect.height / 2}px`);
        });
    });
}

// Scroll Effects - Header, Toolbar, Tron Corners
let lastScrollTop = 0;
const header = document.getElementById('mainHeader');
const bottomToolbar = document.getElementById('bottomToolbar');
const scrollbarThumb = document.getElementById('scrollbarThumb');
const heroSection = document.getElementById('heroSection');
const tronCorners = document.querySelectorAll('.tron-corner');

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / documentHeight) * 100;
    
    // Floating header like Cycle's - after first scroll
    if (header) {
        if (scrollTop > 100) {
            header.classList.add('floating');
            header.classList.add('scrolled');
        } else {
            header.classList.remove('floating');
            header.classList.remove('scrolled');
        }
    }
    
    // Bottom toolbar shrinking
    if (scrollTop > 100) {
        bottomToolbar.classList.add('scrolled');
    } else {
        bottomToolbar.classList.remove('scrolled');
    }
    
    // Custom scrollbar
    if (scrollbarThumb) {
        scrollbarThumb.style.height = scrollPercent + '%';
    }
    
    // Tron corner effects based on scroll
    const scrollIntensity = Math.min(scrollPercent / 10, 1);
    tronCorners.forEach(corner => {
        corner.style.opacity = scrollIntensity * 0.6;
        if (scrollIntensity > 0.1) {
            corner.classList.add('visible');
        } else {
            corner.classList.remove('visible');
        }
    });
    
    lastScrollTop = scrollTop;
});

// Load Substack Posts with Caching
let substackCache = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

async function loadSubstackPosts() {
    const substackContainer = document.getElementById('substackPosts');
    if (!substackContainer) return;

    // Check cache first
    const cached = localStorage.getItem('substackPosts');
    const cacheTime = localStorage.getItem('substackPostsTime');
    
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < CACHE_DURATION) {
        try {
            const data = JSON.parse(cached);
            renderSubstackPosts(data, substackContainer);
            return;
        } catch (e) {
            console.error('Error parsing cached posts:', e);
        }
    }

    try {
        const rssUrl = 'https://garrettawolfe.substack.com/feed';
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
            // Cache the results
            localStorage.setItem('substackPosts', JSON.stringify(data));
            localStorage.setItem('substackPostsTime', Date.now().toString());
            
            renderSubstackPosts(data, substackContainer);
        } else {
            substackContainer.innerHTML = '<div class="loading">Unable to load posts. <a href="https://garrettawolfe.substack.com" target="_blank">Visit Substack</a></div>';
        }
    } catch (error) {
        console.error('Error loading Substack posts:', error);
        substackContainer.innerHTML = '<div class="loading">Unable to load posts. <a href="https://garrettawolfe.substack.com" target="_blank">Visit Substack</a></div>';
    }
    
    lucide.createIcons();
}

function renderSubstackPosts(data, container) {
    const posts = data.items.slice(0, 3);
    
    container.innerHTML = posts.map(post => {
        const contentMatch = post.content.match(/<img[^>]+src="([^"]+)"/);
        const thumbnail = contentMatch ? contentMatch[1] : 'https://via.placeholder.com/400x200?text=Substack+Post';
        
        const pubDate = new Date(post.pubDate);
        const formattedDate = pubDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        return `
            <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="substack-post">
                <img src="${thumbnail}" alt="${post.title}" class="substack-post-thumbnail" onerror="this.src='https://via.placeholder.com/400x200?text=Substack+Post'">
                <div class="substack-post-content">
                    <h3 class="substack-post-title">${post.title}</h3>
                    <p class="substack-post-date">${formattedDate}</p>
                </div>
            </a>
        `;
    }).join('');
    
    lucide.createIcons();
}

// Load Photo Gallery
function loadPhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    if (!gallery) return;

    const photos = [
        'Ajax.jpeg',
        'Ediths Garrett.JPG',
        'Fam in Hamptons.jpeg',
        'Garrett Aix en Provence.JPG',
        'Garrett and Brendan Lobster Pasta.JPG',
        'Garrett and Devon Skiing.jpg',
        'Garrett and Tri in Copenhagen.JPG',
        'Garrett at Guerite.JPG',
        'Garrett Hoi An Vietnam.JPG',
        'Garrett Ibiza.jpeg',
        'Garrett in Cope.JPG',
        'Garrett in Marseille.JPG',
        'Garrett in Tokyo.JPG',
        'Garrett Marathon 2022.JPG',
        'Guerite Lunch.JPG',
        'Lads at Liam VDHs Wedding.JPG',
        'Shortys.JPG',
        'Squad at Guerite.JPG',
        'Squad Cloud9.jpeg',
        'Takalads.jpeg'
    ];

    gallery.innerHTML = photos.map(photo => {
        const photoName = photo.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '').replace(/\s+/g, ' ');
        return `
        <div class="gallery-item">
            <img src="assets/images/photos/${photo}" alt="${photoName} - Garrett Wolfe Photography" loading="lazy" onerror="console.error('Failed to load gallery photo:', 'assets/images/photos/${photo}'); this.parentElement.style.display='none';">
        </div>
    `;
    }).join('');

    console.log('Photo gallery loaded with', photos.length, 'photos');

    // Re-setup modal after loading photos
    setTimeout(() => {
        setupPhotoModal();
    }, 100);
}

// Murmuration Background Effect
function initMurmuration() {
    const canvas = document.getElementById('murmurationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 80;
    const maxDistance = 150;
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            
            // Keep in bounds
            this.x = Math.max(0, Math.min(canvas.width, this.x));
            this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, 0.3)`;
            ctx.fill();
        }
    }
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        particles.forEach((particle, i) => {
            particles.slice(i + 1).forEach(other => {
                const dx = particle.x - other.x;
                const dy = particle.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < maxDistance) {
                    const opacity = (1 - distance / maxDistance) * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    setupMusicControls();
    
    // Load images with a small delay to ensure DOM is ready
    setTimeout(() => {
        loadHeroCollage();
        loadPhotoGallery();
    }, 100);
    
    loadSubstackPosts();
    setupDynamicHover();
    updatePlaylistUI();
    initMurmuration();
    
    // Initialize scrollbar
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollbarThumb && documentHeight > 0) {
        const scrollPercent = (window.pageYOffset / documentHeight) * 100;
        scrollbarThumb.style.height = scrollPercent + '%';
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.experience-card, .favorite-category, .substack-post, .gallery-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});
