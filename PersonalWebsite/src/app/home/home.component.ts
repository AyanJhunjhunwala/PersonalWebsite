import { Component, AfterViewInit, ElementRef, ViewChild, Renderer2, HostListener, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('typingTarget') typingTarget!: ElementRef;
  @ViewChild('subText') subText!: ElementRef;
  @ViewChild('mainCursor') mainCursor!: ElementRef;
  @ViewChild('subCursor') subCursor!: ElementRef;
  @ViewChild('projectsContainer') projectsContainer!: ElementRef;
  
  textToType = "Hi I'm Ayan!";
  subTextToType = "CS @ UCI";
  cursorPosition = { x: 50, y: 50 };
  
  // Auto-scrolling properties - optimized for smoothness
  private autoScrollInterval: any;
  private autoScrollSpeed = 2.5; // Increased for faster scrolling
  private autoScrollDelay = 16; // ~60fps for smooth animation
  private isProjectsHovered = false;
  private isPaused = false;
  private isScrolling = false;
  
  // Performance optimization flags
  private rafId: number | null = null;
  private lastScrollTime = 0;
  private scrollDirection = 1; // 1 for forward, -1 for backward
  private isLooping = false;
  
  constructor(private renderer: Renderer2) {}
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Throttle mouse move events for better performance
    if (this.rafId) return;
    
    this.rafId = requestAnimationFrame(() => {
      this.cursorPosition = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100
      };
      
      // Update the interactive gradient position with smooth transition
      const interactive = document.querySelector('.interactive') as HTMLElement;
      if (interactive) {
        interactive.style.setProperty('--cursor-x', `${this.cursorPosition.x}%`);
        interactive.style.setProperty('--cursor-y', `${this.cursorPosition.y}%`);
      }
      
      this.rafId = null;
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Throttle scroll events
    const now = Date.now();
    if (now - this.lastScrollTime < 16) return; // ~60fps throttling
    this.lastScrollTime = now;
    
    // Show/hide back to top button with smooth transition
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
      const shouldShow = window.scrollY > 300;
      backToTopButton.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      if (shouldShow) {
        backToTopButton.classList.add('visible');
        backToTopButton.style.opacity = '1';
        backToTopButton.style.transform = 'translateY(0)';
      } else {
        backToTopButton.classList.remove('visible');
        backToTopButton.style.opacity = '0';
        backToTopButton.style.transform = 'translateY(10px)';
      }
    }
    
    // Animate project cards on scroll with intersection observer fallback
    this.animateOnScroll();
  }
  
  @HostListener('window:load', [])
  onWindowLoad() {
    this.hideLoadingScreen();
  }
  
  ngAfterViewInit() {
    // Use requestAnimationFrame for smooth initialization
    requestAnimationFrame(() => {
      this.hideLoadingScreen();
      
      // Smoother typing animation with variable speeds
      this.typeTextSmooth(this.typingTarget.nativeElement, this.textToType, 0, () => {
        this.renderer.setStyle(this.mainCursor.nativeElement, 'opacity', '0');
        this.renderer.setStyle(this.mainCursor.nativeElement, 'transition', 'opacity 0.3s ease');
        
        setTimeout(() => {
          this.typeTextSmooth(this.subText.nativeElement, this.subTextToType, 0, () => {
            this.renderer.setStyle(this.subCursor.nativeElement, 'opacity', '0');
            this.renderer.setStyle(this.subCursor.nativeElement, 'transition', 'opacity 0.3s ease');
            
            // Smooth fade-in for remaining content
            const buildingText = document.querySelector('.fade-in-text') as HTMLElement;
            if (buildingText) {
              buildingText.style.opacity = '1';
              buildingText.style.transition = 'opacity 1s ease';
              buildingText.style.transform = 'translateY(0)';
            }
          });
        }, 200);
      });
      
      this.initSmoothScrolling();
      this.onWindowScroll();
      this.setupProjectCards();
      this.initProjectScrolling();
      this.setupScrollControls();
      this.startAutoScroll();
    });
  }
  
  ngOnDestroy() {
    this.stopAutoScroll();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
  
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transform = 'scale(0.95)';
      
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 500);
    }
  }
  
  setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
      const element = card as HTMLElement;
      element.style.setProperty('--card-index', index.toString());
      element.classList.add('animate-on-scroll');
      
      // Add smooth hover effects
      element.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      
      element.addEventListener('mouseenter', () => {
        element.style.transform = 'translateY(-10px) scale(1.02)';
        element.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
      });
      
      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translateY(0) scale(1)';
        element.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
      });
    });
    
    this.animateOnScroll();
  }
  
  setupScrollControls() {
    const pauseButton = document.getElementById('pauseAutoScroll');
    const resumeButton = document.getElementById('resumeAutoScroll');
    
    if (pauseButton && resumeButton) {
      // Add smooth transitions to buttons
      [pauseButton, resumeButton].forEach(button => {
        button.style.transition = 'all 0.3s ease';
      });
      
      pauseButton.addEventListener('click', () => {
        this.isPaused = true;
        this.stopAutoScroll();
        pauseButton.style.opacity = '0';
        pauseButton.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          pauseButton.style.display = 'none';
          resumeButton.style.display = 'flex';
          resumeButton.style.opacity = '1';
          resumeButton.style.transform = 'scale(1)';
        }, 150);
      });
      
      resumeButton.addEventListener('click', () => {
        this.isPaused = false;
        this.startAutoScroll();
        resumeButton.style.opacity = '0';
        resumeButton.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          resumeButton.style.display = 'none';
          pauseButton.style.display = 'flex';
          pauseButton.style.opacity = '1';
          pauseButton.style.transform = 'scale(1)';
        }, 150);
      });
    }
  }
  
  animateOnScroll() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    animatedElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight - 50 && rect.bottom > 0;
      
      if (isVisible && !element.classList.contains('animated')) {
        // Stagger animation based on index
        setTimeout(() => {
          element.classList.add('animated');
          const htmlElement = element as HTMLElement;
          htmlElement.style.opacity = '1';
          htmlElement.style.transform = 'translateY(0)';
          htmlElement.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }, index * 100);
      }
    });
  }
  
  // Enhanced typing animation with natural variation
  typeTextSmooth(element: HTMLElement, text: string, index: number, callback: () => void) {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      
      // Variable typing speed for more natural feel
      const baseDelay = 80;
      const variation = Math.random() * 40 - 20; // ±20ms variation
      const delay = baseDelay + variation;
      
      setTimeout(() => {
        this.typeTextSmooth(element, text, index + 1, callback);
      }, delay);
    } else {
      callback();
    }
  }
  
  initSmoothScrolling() {
    const navButtons = document.querySelectorAll('.tab-navigation button');
    navButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = button.textContent?.toLowerCase();
        if (targetId) {
          this.scrollToSectionSmooth(targetId);
        }
      });
    });
  }
  
  scrollToSectionSmooth(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (section) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  initProjectScrolling() {
    const scrollContainer = document.querySelector('.projects-grid') as HTMLElement;
    const leftArrow = document.querySelector('.scroll-arrow.left') as HTMLElement;
    const rightArrow = document.querySelector('.scroll-arrow.right') as HTMLElement;
    
    if (scrollContainer && leftArrow && rightArrow) {
      // Enhanced scroll calculations
      const calculateScrollDistance = () => {
        const projectCard = document.querySelector('.project-card') as HTMLElement;
        const cardWidth = projectCard ? projectCard.offsetWidth : 450;
        const gap = 30;
        return cardWidth + gap;
      };
      
      // Smooth arrow interactions
      const handleArrowClick = (direction: 'left' | 'right') => {
        this.temporarilyPauseAutoScroll();
        const scrollDistance = calculateScrollDistance();
        const targetScroll = direction === 'left' ? -scrollDistance : scrollDistance;
        
        scrollContainer.scrollBy({ 
          left: targetScroll, 
          behavior: 'smooth' 
        });
      };
      
      leftArrow.addEventListener('click', () => handleArrowClick('left'));
      rightArrow.addEventListener('click', () => handleArrowClick('right'));
      
      // Smooth arrow visibility transitions
      const toggleArrowVisibility = () => {
        const isAtStart = scrollContainer.scrollLeft <= 10;
        const isAtEnd = scrollContainer.scrollLeft >= (scrollContainer.scrollWidth - scrollContainer.clientWidth - 10);
        
        leftArrow.style.transition = 'opacity 0.3s ease';
        rightArrow.style.transition = 'opacity 0.3s ease';
        
        leftArrow.style.opacity = isAtStart ? '0.3' : '0.8';
        leftArrow.style.pointerEvents = isAtStart ? 'none' : 'auto';
        
        rightArrow.style.opacity = isAtEnd ? '0.3' : '0.8';
        rightArrow.style.pointerEvents = isAtEnd ? 'none' : 'auto';
      };
      
      // Throttled scroll listener for better performance
      let scrollTimeout: any = null;
      scrollContainer.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(toggleArrowVisibility, 50);
      });
      
      toggleArrowVisibility();
      
      // Enhanced touch support with momentum
      let startX: number | null = null;
      let startY: number | null = null;
      let scrollLeft: number = 0;
      let isScrollingHorizontally = false;
      
      scrollContainer.addEventListener('touchstart', (e: Event) => {
        this.temporarilyPauseAutoScroll();
        
        const touchEvent = e as TouchEvent;
        const touch = touchEvent.touches[0];
        startX = touch.pageX - scrollContainer.offsetLeft;
        startY = touch.pageY - scrollContainer.offsetTop;
        scrollLeft = scrollContainer.scrollLeft;
        isScrollingHorizontally = false;
      }, { passive: true });
      
      scrollContainer.addEventListener('touchmove', (e: Event) => {
        if (startX === null || startY === null) return;
        
        const touchEvent = e as TouchEvent;
        const touch = touchEvent.touches[0];
        const x = touch.pageX - scrollContainer.offsetLeft;
        const y = touch.pageY - scrollContainer.offsetTop;
        
        const deltaX = Math.abs(x - startX);
        const deltaY = Math.abs(y - startY);
        
        // Determine if this is horizontal scrolling
        if (!isScrollingHorizontally && deltaX > deltaY && deltaX > 10) {
          isScrollingHorizontally = true;
        }
        
        if (isScrollingHorizontally) {
          e.preventDefault();
          const distance = (x - startX) * 1.2; // Slight acceleration
          scrollContainer.scrollLeft = scrollLeft - distance;
        }
      }, { passive: false });
      
      scrollContainer.addEventListener('touchend', () => {
        startX = null;
        startY = null;
        isScrollingHorizontally = false;
        this.resumeAutoScrollAfterDelay();
      }, { passive: true });
      
      // Enhanced hover effects
      scrollContainer.addEventListener('mouseenter', () => {
        this.isProjectsHovered = true;
        this.stopAutoScroll();
        scrollContainer.style.cursor = 'grab';
      });
      
      scrollContainer.addEventListener('mouseleave', () => {
        this.isProjectsHovered = false;
        scrollContainer.style.cursor = 'default';
        if (!this.isPaused) {
          this.startAutoScroll();
        }
      });
    }
  }
  
  temporarilyPauseAutoScroll() {
    if (this.isPaused) return;
    
    this.stopAutoScroll();
    this.resumeAutoScrollAfterDelay();
  }
  
  resumeAutoScrollAfterDelay(delay = 1500) {
    if (this.isPaused) return;
    
    setTimeout(() => {
      if (!this.isProjectsHovered && !this.isPaused) {
        this.startAutoScroll();
      }
    }, delay);
  }
  
  // Ultra-smooth auto-scrolling with seamless looping
  startAutoScroll() {
    if (this.isPaused || this.isProjectsHovered) return;
    
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
    
    const scrollContainer = document.querySelector('.projects-grid') as HTMLElement;
    if (!scrollContainer) return;

    this.autoScrollInterval = setInterval(() => {
      if (this.isScrolling) return; // Prevent conflicts
      
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      const scrollPosition = scrollContainer.scrollLeft;
      
      // Seamless looping logic
      if (scrollPosition >= scrollWidth - clientWidth - 5) {
        // Smooth reset to beginning
        this.isLooping = true;
        scrollContainer.style.scrollBehavior = 'auto';
        scrollContainer.scrollLeft = 0;
        
        // Re-enable smooth scrolling after reset
        requestAnimationFrame(() => {
          scrollContainer.style.scrollBehavior = 'smooth';
          this.isLooping = false;
        });
      } else if (!this.isLooping) {
        // Continue smooth scrolling
        scrollContainer.scrollLeft += this.autoScrollSpeed;
      }
    }, this.autoScrollDelay);
  }
  
  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }
}