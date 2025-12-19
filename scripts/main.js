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
    
    // All photos except "Garrett Hoi An Vietnam-min.JPG" for hero collage
    const photos = [
        'Ajax-min.jpeg',
        'Ediths Garrett-min.JPG',
        'Fam in Hamptons-min.jpeg',
        'Garrett Aix en Provence-min.JPG',
        'Garrett and Brendan Lobster Pasta-min.JPG',
        'Garrett and Devon Skiing-min.jpg',
        'Garrett and Tri in Copenhagen-min.JPG',
        'Garrett at Guerite-min.JPG',
        // 'Garrett Hoi An Vietnam-min.JPG', // Excluded from hero collage
        'Garrett Ibiza-min.jpeg',
        'Garrett in Cope-min.JPG',
        'Garrett in Marseille-min.JPG',
        'Garrett in Tokyo-min.JPG',
        'Garrett Marathon 2022-min.JPG',
        'Guerite Lunch-min.JPG',
        'Lads at Liam VDHs Wedding-min.JPG',
        'Shortys-min.JPG',
        'Squad at Guerite-min.JPG',
        'Squad Cloud9-min.jpeg',
        'Takalads-min.jpeg'
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
                <img src="assets/images/photos/${photo}" alt="${photoName} - Garrett Wolfe" loading="eager" width="200" height="200" style="aspect-ratio: 1 / 1; object-fit: cover;" onerror="console.error('Failed to load:', 'assets/images/photos/${photo}'); this.parentElement.parentElement.style.display='none';">
            </div>
            <div class="hero-photo-card-back">
                <img src="assets/images/photos/${backPhoto}" alt="${backPhotoName} - Garrett Wolfe" loading="eager" width="200" height="200" style="aspect-ratio: 1 / 1; object-fit: cover;" onerror="console.error('Failed to load:', 'assets/images/photos/${backPhoto}'); this.parentElement.parentElement.style.display='none';">
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
    const elements = document.querySelectorAll('.favorite-category, .toolbar-link, .playlist-item, .experience-card, .gallery-item, .network-link, .hero-cta, .film-photo-item');
    
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
        'Ajax-min.jpeg',
        'Ediths Garrett-min.JPG',
        'Fam in Hamptons-min.jpeg',
        'Garrett Aix en Provence-min.JPG',
        'Garrett and Brendan Lobster Pasta-min.JPG',
        'Garrett and Devon Skiing-min.jpg',
        'Garrett and Tri in Copenhagen-min.JPG',
        'Garrett at Guerite-min.JPG',
        'Garrett Hoi An Vietnam-min.JPG',
        'Garrett Ibiza-min.jpeg',
        'Garrett in Cope-min.JPG',
        'Garrett in Marseille-min.JPG',
        'Garrett in Tokyo-min.JPG',
        'Garrett Marathon 2022-min.JPG',
        'Guerite Lunch-min.JPG',
        'Lads at Liam VDHs Wedding-min.JPG',
        'Shortys-min.JPG',
        'Squad at Guerite-min.JPG',
        'Squad Cloud9-min.jpeg',
        'Takalads-min.jpeg'
    ];

    gallery.innerHTML = photos.map(photo => {
        const photoName = photo.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '').replace(/\s+/g, ' ');
        return `
        <div class="gallery-item">
            <img src="assets/images/photos/${photo}" alt="${photoName} - Garrett Wolfe Photography" loading="lazy" width="400" height="300" style="aspect-ratio: 4 / 3; object-fit: cover;" onerror="console.error('Failed to load gallery photo:', 'assets/images/photos/${photo}'); this.parentElement.style.display='none';">
        </div>
    `;
    }).join('');

    console.log('Photo gallery loaded with', photos.length, 'photos');

    // Re-setup modal after loading photos
    setTimeout(() => {
        setupPhotoModal();
    }, 100);
}

// Load Film Photography Grid
function loadFilmPhotos() {
    const filmGrid = document.getElementById('filmPhotosGrid');
    if (!filmGrid) return;
    
    const filmPhotos = [
        'Beach in Marseille-min.JPG',
        'Deer Valley Tree-min.JPG',
        'Guys skiing-min.jpg',
        'Ibiza Boat-min.JPG',
        'Koh Phangan drive-min.JPG',
        'Koh Phangan-min.JPG',
        'Lagos Portugal-min.JPG',
        'Osaka-min.JPG',
        'Paloma Beach-min.JPG',
        'Santa Teresa sunset-min.JPG',
        'Shibuya Crossing-min.JPG',
        'Tokyo Garden-min.JPG',
        'Unify dinner-min.jpg',
        'Vietnam Buggy-min.JPG',
        'Vietnam-min.JPG'
    ];
    
    filmGrid.innerHTML = filmPhotos.map(photo => {
        const photoName = photo.replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '').replace(/\s+/g, ' ');
        return `
        <div class="film-photo-item">
            <img src="assets/images/film photos/${photo}" alt="${photoName} - Film Photography by Garrett Wolfe" loading="lazy" width="300" height="300" style="aspect-ratio: 1 / 1; object-fit: cover;" onerror="console.error('Failed to load film photo:', 'assets/images/film photos/${photo}'); this.parentElement.style.display='none';">
        </div>
    `;
    }).join('');
    
    console.log('Film photography grid loaded with', filmPhotos.length, 'photos');
    
    // Setup modal for film photos too
    setTimeout(() => {
        setupFilmPhotoModal();
    }, 100);
}

// Setup modal for film photos
function setupFilmPhotoModal() {
    const filmPhotos = document.querySelectorAll('.film-photo-item img');
    const modal = document.getElementById('photoModal');
    const modalImage = document.getElementById('modalImage');
    const modalClose = document.getElementById('modalClose');
    
    if (!modal || !modalImage || !modalClose) return;
    
    // Close modal function
    const closeModal = function() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    filmPhotos.forEach(img => {
        img.addEventListener('click', function() {
            modalImage.src = this.src;
            modalImage.alt = this.alt;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Close modal when clicking outside or on close button
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
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
        loadFilmPhotos();
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

// ==================== NEW FEATURES ====================

// Loading Skeleton
window.addEventListener('load', function() {
    const skeleton = document.getElementById('loadingSkeleton');
    if (skeleton) {
        setTimeout(() => {
            skeleton.classList.add('hidden');
            setTimeout(() => skeleton.remove(), 500);
        }, 500);
    }
});

// Animated Stats Counters
function animateCounter(element, target, suffix = '', duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            const target = parseInt(statNumber.getAttribute('data-target'));
            const suffix = statNumber.getAttribute('data-suffix') || '';
            animateCounter(statNumber, target, suffix);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.stat-item').forEach(item => {
        statsObserver.observe(item);
    });
});

// Typing Animation for Tagline
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    element.style.opacity = '1';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            element.style.borderRight = 'none';
        }
    }
    type();
}

// Cursor Trail Effect
let cursorTrail = null;
let trailParticles = [];

function initCursorTrail() {
    cursorTrail = document.getElementById('cursorTrail');
    if (!cursorTrail) return;
    
    document.addEventListener('mousemove', (e) => {
        if (trailParticles.length > 10) {
            const oldParticle = trailParticles.shift();
            if (oldParticle) oldParticle.remove();
        }
        
        const particle = document.createElement('div');
        particle.className = 'cursor-trail';
        particle.style.left = e.clientX + 'px';
        particle.style.top = e.clientY + 'px';
        particle.style.opacity = '0.6';
        document.body.appendChild(particle);
        trailParticles.push(particle);
        
        setTimeout(() => {
            particle.style.opacity = '0';
            particle.style.transform = 'scale(0)';
            setTimeout(() => {
                particle.remove();
                trailParticles = trailParticles.filter(p => p !== particle);
            }, 300);
        }, 200);
    });
}

// Parallax Scrolling
function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-slow, .parallax-fast');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        parallaxElements.forEach(el => {
            const speed = el.classList.contains('parallax-fast') ? 0.5 : 0.2;
            const yPos = -(scrolled * speed);
            el.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// 3D Tilt Effect for Experience Cards and Favorites Cards
function init3DTilt() {
    const cards = document.querySelectorAll('.experience-card, .favorite-category');
    
    cards.forEach(card => {
        card.classList.add('tilt-3d');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// Dark/Light Mode Toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    // Check for saved theme preference or default to dark
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        lucide.createIcons();
    });
}

// Back to Top Button
function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ==================== EASTER EGGS ====================

// Easter Egg 1: Konami Code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        // Easter egg activated!
        document.body.style.animation = 'glitch-1 0.5s infinite';
        setTimeout(() => {
            document.body.style.animation = '';
            showEasterEggMessage('🎉 Konami Code! You found the easter egg! Garrett would be proud.');
        }, 2000);
        konamiCode = [];
    }
});

// Easter Egg 2: Type "garrett" or "wolfe"
let typedSequence = '';
const secretWords = ['garrett', 'wolfe', 'gtme', 'nyc'];
document.addEventListener('keydown', (e) => {
    // Only track letters
    if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
        typedSequence += e.key.toLowerCase();
        typedSequence = typedSequence.slice(-10); // Keep last 10 chars
        
        secretWords.forEach(word => {
            if (typedSequence.includes(word)) {
                typedSequence = '';
                showEasterEggMessage(`🔍 You typed "${word}"! Nice detective work.`);
                // Add a subtle effect
                document.body.style.filter = 'hue-rotate(90deg)';
                setTimeout(() => {
                    document.body.style.filter = '';
                }, 500);
            }
        });
    }
});

// Easter Egg 3: Triple-click on any section title
document.addEventListener('DOMContentLoaded', function() {
    const sectionTitles = document.querySelectorAll('.section-title');
    sectionTitles.forEach(title => {
        let clickCount = 0;
        let clickTimer = null;
        
        title.addEventListener('click', function() {
            clickCount++;
            clearTimeout(clickTimer);
            
            if (clickCount === 3) {
                clickCount = 0;
                const sectionName = title.textContent.trim();
                showEasterEggMessage(`✨ Triple-clicked on "${sectionName}"! You're thorough!`);
                title.style.transform = 'rotate(5deg)';
                setTimeout(() => {
                    title.style.transform = '';
                }, 500);
            }
            
            clickTimer = setTimeout(() => {
                clickCount = 0;
            }, 1000);
        });
    });
});


// Helper function to show easter egg messages
function showEasterEggMessage(message) {
    // Remove existing message if any
    const existing = document.getElementById('easterEggMessage');
    if (existing) {
        existing.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'easterEggMessage';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(99, 102, 241, 0.95);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 12px;
        font-size: 1.125rem;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: fadeInOut 3s ease;
        pointer-events: none;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(99, 102, 241, 0.5);
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => messageDiv.remove(), 500);
    }, 2500);
}

// Add CSS animations for easter egg messages
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    @keyframes fadeOut {
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(style);

// Social Sharing Buttons
function initSocialSharing() {
    const substackPosts = document.querySelectorAll('.substack-post');
    
    substackPosts.forEach(post => {
        const shareContainer = document.createElement('div');
        shareContainer.className = 'social-share';
        
        const title = post.querySelector('h3')?.textContent || '';
        const url = post.querySelector('a')?.href || window.location.href;
        
        const twitterShare = document.createElement('a');
        twitterShare.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        twitterShare.target = '_blank';
        twitterShare.className = 'share-button';
        twitterShare.innerHTML = '<i data-lucide="twitter"></i><span>Share</span>';
        
        const linkedinShare = document.createElement('a');
        linkedinShare.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        linkedinShare.target = '_blank';
        linkedinShare.className = 'share-button';
        linkedinShare.innerHTML = '<i data-lucide="linkedin"></i><span>Share</span>';
        
        shareContainer.appendChild(twitterShare);
        shareContainer.appendChild(linkedinShare);
        
        const content = post.querySelector('.substack-content');
        if (content) {
            content.appendChild(shareContainer);
        }
    });
}

// Lazy Load Images with WebP Support
function initImageOptimization() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                
                // Check WebP support
                const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                const testWebP = new Image();
                testWebP.onload = testWebP.onerror = function() {
                    if (testWebP.height === 2) {
                        img.src = webpSrc;
                    } else {
                        img.src = src;
                    }
                    img.removeAttribute('data-src');
                    img.loading = 'lazy';
                };
                testWebP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Lazy Load Non-Critical Scripts
function lazyLoadScripts() {
    // Lucide icons are already loaded, but we can defer other scripts if needed
    // For now, we'll ensure icons are created after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => lucide.createIcons(), 100);
        });
    } else {
        setTimeout(() => lucide.createIcons(), 100);
    }
}

// Analytics (Plausible - Privacy-friendly)
function initAnalytics() {
    // Add Plausible script
    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = 'garrettawolfe.com';
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
}

// Initialize all features
// ==================== TRAVEL MAP ====================

// Travel locations data structure
// Format: { name, lat, lng, type: 'favorite' | 'visited' | 'bucket-list', description }
const travelLocations = [
    // United States & Canada
    { name: 'United States', lat: 39.8283, lng: -98.5795, type: 'visited', description: 'Home country' },
    { name: 'Canada', lat: 56.1304, lng: -106.3468, type: 'visited', description: 'Neighbor to the north' },
    
    // South America
    { name: 'Peru', lat: -9.1900, lng: -75.0152, type: 'visited', description: 'Machu Picchu and more' },
    { name: 'Uruguay', lat: -32.5228, lng: -55.7658, type: 'visited', description: 'South American gem' },
    { name: 'Punta del Este, Uruguay', lat: -34.9475, lng: -54.9336, type: 'visited', description: 'Beach paradise' },
    
    // Central America
    { name: 'Santa Teresa, Costa Rica', lat: 9.6486, lng: -85.1633, type: 'favorite', description: 'Surf and sun' },
    
    // Europe
    { name: 'London, UK', lat: 51.5074, lng: -0.1278, type: 'visited', description: 'Historic capital' },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522, type: 'visited', description: 'City of lights' },
    { name: 'St. Tropez, France', lat: 43.2694, lng: 6.6389, type: 'visited', description: 'French Riviera' },
    { name: 'Capri, Italy', lat: 40.5503, lng: 14.2426, type: 'favorite', description: 'Mediterranean paradise' },
    { name: 'Puglia, Italy', lat: 40.6388, lng: 17.9448, type: 'visited', description: 'Italian countryside' },
    { name: 'Forte dei Marmi, Italy', lat: 43.9636, lng: 10.1750, type: 'visited', description: 'Tuscan coast' },
    { name: 'Munich, Germany', lat: 48.1351, lng: 11.5820, type: 'visited', description: 'Bavarian capital' },
    { name: 'Copenhagen, Denmark', lat: 55.6761, lng: 12.5683, type: 'visited', description: 'Scandinavian design' },
    { name: 'Mallorca, Spain', lat: 39.5696, lng: 2.6502, type: 'favorite', description: 'Balearic beauty' },
    { name: 'Ibiza, Spain', lat: 38.9067, lng: 1.4206, type: 'visited', description: 'Party island' },
    { name: 'Lisbon, Portugal', lat: 38.7223, lng: -9.1393, type: 'visited', description: 'Portuguese capital' },
    { name: 'Lagos, Portugal', lat: 37.1020, lng: -8.6753, type: 'visited', description: 'Algarve coast' },
    { name: 'Marseille, France', lat: 43.2965, lng: 5.3698, type: 'visited', description: 'Mediterranean port' },
    { name: 'Istanbul, Turkey', lat: 41.0082, lng: 28.9784, type: 'visited', description: 'Where Europe meets Asia' },
    { name: 'Bodrum, Turkey', lat: 37.0344, lng: 27.4305, type: 'visited', description: 'Turkish Riviera' },
    { name: 'Iceland', lat: 64.9631, lng: -19.0208, type: 'visited', description: 'Land of fire and ice' },
    
    // Asia
    { name: 'Koh Phangan, Thailand', lat: 9.7216, lng: 100.0188, type: 'favorite', description: 'Island vibes' },
    { name: 'Bangkok, Thailand', lat: 13.7563, lng: 100.5018, type: 'visited', description: 'Thai capital' },
    { name: 'Pai, Thailand', lat: 19.3600, lng: 98.4397, type: 'visited', description: 'Mountain town' },
    { name: 'Vietnam', lat: 14.0583, lng: 108.2772, type: 'visited', description: 'Southeast Asian adventure' },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503, type: 'favorite', description: 'Mega city' },
    { name: 'Osaka, Japan', lat: 34.6937, lng: 135.5023, type: 'visited', description: 'Food capital' },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694, type: 'visited', description: 'Asian metropolis' },
    { name: 'Tel Aviv, Israel', lat: 32.0853, lng: 34.7818, type: 'visited', description: 'Mediterranean city' },
    
    // Oceania
    { name: 'New Zealand', lat: -40.9006, lng: 174.8860, type: 'visited', description: 'Middle Earth' },
    { name: 'Fiji', lat: -17.7134, lng: 178.0650, type: 'visited', description: 'Pacific paradise' },
    
    // Africa
    { name: 'South Africa', lat: -30.5595, lng: 22.9375, type: 'visited', description: 'Rainbow nation' },
];

// Initialize Travel Map
function initTravelMap() {
    const mapContainer = document.getElementById('travelMap');
    if (!mapContainer || typeof L === 'undefined') return;
    
    // Initialize map centered on world view
    const map = L.map('travelMap', {
        zoomControl: true,
        scrollWheelZoom: false, // Disable scroll to zoom - only buttons and double-click
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true
    }).setView([20, 0], 2);
    
    // Add dark theme tile layer (using CartoDB dark theme)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Add markers for each location
    travelLocations.forEach(location => {
        const markerColor = 
            location.type === 'favorite' ? '#fbbf24' :
            location.type === 'bucket-list' ? '#10b981' : '#6366f1';
        
        // Create custom icon
        const customIcon = L.divIcon({
            className: 'custom-marker-div',
            html: `<div class="custom-marker ${location.type}" style="background: ${markerColor};"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 18],
            popupAnchor: [0, -18]
        });
        
        const marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(map);
        
        // Add popup with location info
        const popupContent = `
            <div style="text-align: center;">
                <h3 style="margin: 0 0 0.5rem 0; color: var(--color-purple-light);">${location.name}</h3>
                ${location.description ? `<p style="margin: 0; color: var(--color-text-secondary);">${location.description}</p>` : ''}
                <span style="display: inline-block; margin-top: 0.5rem; padding: 0.25rem 0.75rem; background: ${markerColor}20; border-radius: 12px; font-size: 0.75rem; color: ${markerColor};">
                    ${location.type === 'favorite' ? '⭐ Favorite' : location.type === 'bucket-list' ? '🎯 Bucket List' : '📍 Visited'}
                </span>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        // Add hover effect
        marker.on('mouseover', function() {
            this.openPopup();
        });
    });
    
    // Fit map to show all markers if there are locations
    if (travelLocations.length > 0) {
        const group = new L.featureGroup(travelLocations.map(loc => 
            L.marker([loc.lat, loc.lng])
        ));
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// ==================== EASTER EGGS MODAL ====================

// Easter Eggs List
const easterEggsList = [
    {
        number: 1,
        title: 'Konami Code',
        description: 'The classic video game cheat code!',
        howTo: 'Type: ↑ ↑ ↓ ↓ ← → ← → B A'
    },
    {
        number: 2,
        title: 'Secret Words',
        description: 'Type certain words to trigger hidden effects.',
        howTo: 'Type: "garrett", "wolfe", "gtme", or "nyc"'
    },
    {
        number: 3,
        title: 'Triple Click Sections',
        description: 'Interact with section titles in a special way.',
        howTo: 'Triple-click any section title'
    }
];

// Initialize Easter Eggs Modal
function initEasterEggsModal() {
    const button = document.getElementById('easterEggsButton');
    const modal = document.getElementById('easterEggsModal');
    const closeBtn = document.getElementById('easterEggsClose');
    const listContainer = document.getElementById('easterEggsList');
    
    if (!button || !modal || !closeBtn || !listContainer) return;
    
    // Populate the list
    listContainer.innerHTML = easterEggsList.map(egg => `
        <div class="easter-egg-item">
            <h3>
                <span class="egg-number">${egg.number}</span>
                <span>${egg.title}</span>
            </h3>
            <p>${egg.description}</p>
            <p class="how-to">How to activate: ${egg.howTo}</p>
        </div>
    `).join('');
    
    // Open modal
    button.addEventListener('click', () => {
        modal.classList.add('active');
        lucide.createIcons();
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initCursorTrail();
    initParallax();
    init3DTilt();
    initThemeToggle();
    initBackToTop();
    initSocialSharing();
    initImageOptimization();
    lazyLoadScripts();
    initTravelMap();
    initEasterEggsModal();
    // initAnalytics(); // Uncomment when you have Plausible account
});
