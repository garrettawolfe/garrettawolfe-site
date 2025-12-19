// Background Music Player
document.addEventListener('DOMContentLoaded', function() {
    const musicToggle = document.getElementById('musicToggle');
    const backgroundMusic = document.getElementById('backgroundMusic');
    let isPlaying = false;
    let hasInteracted = false;

    // Try to auto-play music (will likely be blocked by browser)
    function attemptAutoPlay() {
        if (backgroundMusic && !hasInteracted) {
            backgroundMusic.volume = 0.3; // Set volume to 30%
            const playPromise = backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        isPlaying = true;
                        musicToggle.classList.add('playing');
                        updateMusicButton();
                    })
                    .catch(error => {
                        // Auto-play was prevented by browser
                        console.log('Auto-play prevented:', error);
                        isPlaying = false;
                        updateMusicButton();
                    });
            }
        }
    }

    // Update music button text and icon
    function updateMusicButton() {
        const musicText = musicToggle.querySelector('.music-text');
        if (isPlaying) {
            musicText.textContent = 'Music On';
            musicToggle.setAttribute('aria-label', 'Pause background music');
        } else {
            musicText.textContent = 'Music Off';
            musicToggle.setAttribute('aria-label', 'Play background music');
        }
    }

    // Toggle music on button click
    musicToggle.addEventListener('click', function() {
        hasInteracted = true;
        
        if (isPlaying) {
            backgroundMusic.pause();
            isPlaying = false;
        } else {
            backgroundMusic.play()
                .then(() => {
                    isPlaying = true;
                })
                .catch(error => {
                    console.error('Error playing music:', error);
                    alert('Unable to play music. Please check if the audio file exists.');
                });
        }
        
        musicToggle.classList.toggle('playing', isPlaying);
        updateMusicButton();
    });

    // Attempt auto-play after a short delay
    setTimeout(attemptAutoPlay, 500);

    // Also try auto-play on first user interaction (click anywhere)
    document.addEventListener('click', function() {
        if (!hasInteracted && !isPlaying) {
            attemptAutoPlay();
        }
    }, { once: true });

    // Initialize button state
    updateMusicButton();
});

// Smooth scroll for anchor links (if any are added later)
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

// Add subtle parallax effect to hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - (scrolled / 500);
    }
});

// Intersection Observer for fade-in animations on scroll
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

// Observe all experience cards and favorite items
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.experience-card, .favorite-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Photo gallery functionality (for when photos are added)
function loadGalleryPhotos() {
    // This function can be expanded when photos are added
    // For now, it's a placeholder
    const gallery = document.getElementById('photoGallery');
    if (gallery && gallery.children.length === 1) {
        // Gallery is empty, placeholder is showing
        // When photos are added, this can be used to dynamically load them
    }
}

// Initialize gallery on load
document.addEventListener('DOMContentLoaded', loadGalleryPhotos);

