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
  cursorPosition = { x: 50, y: 50 }; // Default cursor position
  
  // Auto-scrolling properties
  private autoScrollInterval: any;
  private autoScrollSpeed = 2.5; // pixels per interval - increased for faster scrolling
  private autoScrollDelay = 20; // milliseconds - decreased for smoother scrolling
  private isProjectsHovered = false;
  private isPaused = false;
  
  constructor(private renderer: Renderer2) {}
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Update cursor position for interactive gradient
    this.cursorPosition = {
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100
    };
    
    // Update the interactive gradient position
    const interactive = document.querySelector('.interactive') as HTMLElement;
    if (interactive) {
      interactive.style.setProperty('--cursor-x', `${this.cursorPosition.x}%`);
      interactive.style.setProperty('--cursor-y', `${this.cursorPosition.y}%`);
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Show/hide back to top button based on scroll position
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    }
    
    // Animate project cards on scroll
    this.animateOnScroll();
  }
  
  @HostListener('window:load', [])
  onWindowLoad() {
    // Hide loading screen when the window is fully loaded
    this.hideLoadingScreen();
  }
  
  ngAfterViewInit() {
    // Wait a brief moment to ensure view is ready
    setTimeout(() => {
      // Hide loading screen
      this.hideLoadingScreen();
      
      this.typeText(this.typingTarget.nativeElement, this.textToType, 0, () => {
        // Hide the first cursor
        this.renderer.setStyle(this.mainCursor.nativeElement, 'display', 'none');
        
        // After main text is typed, start typing subtitle
        setTimeout(() => {
          this.typeText(this.subText.nativeElement, this.subTextToType, 0, () => {
            // Hide the second cursor
            this.renderer.setStyle(this.subCursor.nativeElement, 'display', 'none');
            
            // After both texts are typed, fade in the remaining paragraph
            const buildingText = document.querySelector('.fade-in-text') as HTMLElement;
            if (buildingText) {
              buildingText.style.opacity = '1';
              buildingText.style.transition = 'opacity 0.8s ease';
            }
          });
        }, 300);
      });
      
      // Initialize smooth scrolling for navigation buttons
      this.initSmoothScrolling();

      // Initialize back to top button and animations
      this.onWindowScroll();
      
      // Add animation classes to project cards
      this.setupProjectCards();
      
      // Initialize project scrolling with JavaScript
      this.initProjectScrolling();
      
      // Setup pause/resume buttons
      this.setupScrollControls();
      
      // Start auto-scrolling for projects
      this.startAutoScroll();
      
    }, 1500); // Longer delay to show loading animation
  }
  
  ngOnDestroy() {
    // Clean up auto-scroll interval
    this.stopAutoScroll();
  }
  
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }
  
  setupProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
      (card as HTMLElement).style.setProperty('--card-index', index.toString());
      (card as HTMLElement).classList.add('animate-on-scroll');
    });
    
    // Trigger initial animation check
    this.animateOnScroll();
  }
  
  setupScrollControls() {
    const pauseButton = document.getElementById('pauseAutoScroll');
    const resumeButton = document.getElementById('resumeAutoScroll');
    
    if (pauseButton && resumeButton) {
      pauseButton.addEventListener('click', () => {
        this.isPaused = true;
        this.stopAutoScroll();
        pauseButton.style.display = 'none';
        resumeButton.style.display = 'flex';
      });
      
      resumeButton.addEventListener('click', () => {
        this.isPaused = false;
        this.startAutoScroll();
        resumeButton.style.display = 'none';
        pauseButton.style.display = 'flex';
      });
    }
  }
  
  animateOnScroll() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    animatedElements.forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      const elementBottom = element.getBoundingClientRect().bottom;
      const isVisible = (elementTop < window.innerHeight - 100) && (elementBottom > 0);
      
      if (isVisible) {
        element.classList.add('animated');
      }
    });
  }
  
  typeText(element: HTMLElement, text: string, index: number, callback: () => void) {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      setTimeout(() => {
        this.typeText(element, text, index + 1, callback);
      }, 100);
    } else {
      callback();
    }
  }
  
  initSmoothScrolling() {
    const navButtons = document.querySelectorAll('.tab-navigation button');
    navButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.textContent?.toLowerCase();
        if (targetId) {
          this.scrollToSection(targetId);
        }
      });
    });
  }
  
  scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Initialize project scrolling with JavaScript implementation
  initProjectScrolling() {
    // Get the projects grid container
    const scrollContainer = document.querySelector('.projects-grid') as HTMLElement;
    const leftArrow = document.querySelector('.scroll-arrow.left') as HTMLElement;
    const rightArrow = document.querySelector('.scroll-arrow.right') as HTMLElement;
    
    // If we have the scroll container and navigation arrows
    if (scrollContainer && leftArrow && rightArrow) {
      // Calculate the scroll distance (one card width + gap)
      const calculateScrollDistance = () => {
        const projectCard = document.querySelector('.project-card') as HTMLElement;
        const cardWidth = projectCard ? projectCard.offsetWidth : 450;
        const gap = 30; // gap between cards as defined in CSS
        return cardWidth + gap;
      };
      
      // Scroll left when clicking the left arrow
      leftArrow.addEventListener('click', () => {
        this.temporarilyPauseAutoScroll();
        const scrollDistance = calculateScrollDistance();
        scrollContainer.scrollBy({ 
          left: -scrollDistance, 
          behavior: 'smooth' 
        });
      });
      
      // Scroll right when clicking the right arrow
      rightArrow.addEventListener('click', () => {
        this.temporarilyPauseAutoScroll();
        const scrollDistance = calculateScrollDistance();
        scrollContainer.scrollBy({ 
          left: scrollDistance, 
          behavior: 'smooth' 
        });
      });
      
      // Show/hide arrows based on scroll position
      const toggleArrowVisibility = () => {
        const isAtStart = scrollContainer.scrollLeft <= 10;
        const isAtEnd = scrollContainer.scrollLeft >= (scrollContainer.scrollWidth - scrollContainer.clientWidth - 10);
        
        leftArrow.style.opacity = isAtStart ? '0.3' : '0.7';
        leftArrow.style.pointerEvents = isAtStart ? 'none' : 'auto';
        
        rightArrow.style.opacity = isAtEnd ? '0.3' : '0.7';
        rightArrow.style.pointerEvents = isAtEnd ? 'none' : 'auto';
      };
      
      // Add scroll event listener to toggle arrow visibility
      scrollContainer.addEventListener('scroll', toggleArrowVisibility);
      
      // Initialize arrow visibility
      toggleArrowVisibility();
      
      // Handle keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          this.temporarilyPauseAutoScroll();
          leftArrow.click();
        } else if (e.key === 'ArrowRight') {
          this.temporarilyPauseAutoScroll();
          rightArrow.click();
        }
      });

      // Add touch swipe support for mobile
      let startX: number | null = null;
      let scrollLeft: number = 0;
      
      scrollContainer.addEventListener('touchstart', (e: Event) => {
        this.temporarilyPauseAutoScroll();
        
        const touchEvent = e as TouchEvent;
        startX = touchEvent.touches[0].pageX - scrollContainer.offsetLeft;
        scrollLeft = scrollContainer.scrollLeft;
      }, { passive: true });
      
      scrollContainer.addEventListener('touchmove', (e: Event) => {
        if (startX === null) return;
        
        const touchEvent = e as TouchEvent;
        const x = touchEvent.touches[0].pageX - scrollContainer.offsetLeft;
        const distance = (x - startX);
        scrollContainer.scrollLeft = scrollLeft - distance;
      }, { passive: true });
      
      scrollContainer.addEventListener('touchend', () => {
        startX = null;
        
        // Resume auto-scroll after a delay
        this.resumeAutoScrollAfterDelay();
      }, { passive: true });
      
      // Pause auto-scroll on hover
      scrollContainer.addEventListener('mouseenter', () => {
        this.isProjectsHovered = true;
        this.stopAutoScroll();
      });
      
      // Resume auto-scroll when mouse leaves
      scrollContainer.addEventListener('mouseleave', () => {
        this.isProjectsHovered = false;
        // Only resume if not manually paused
        if (!this.isPaused) {
          this.startAutoScroll();
        }
      });
    }
  }
  
  // Temporarily pause auto-scrolling (e.g., for manual interaction)
  temporarilyPauseAutoScroll() {
    // Don't need to do anything if already paused
    if (this.isPaused) return;
    
    this.stopAutoScroll();
    
    // Resume auto-scroll after a delay
    this.resumeAutoScrollAfterDelay();
  }
  
  // Resume auto-scrolling after a delay
  resumeAutoScrollAfterDelay(delay = 2000) { // Reduced delay for better responsiveness
    // Don't resume if manually paused
    if (this.isPaused) return;
    
    setTimeout(() => {
      if (!this.isProjectsHovered && !this.isPaused) {
        this.startAutoScroll();
      }
    }, delay);
  }
  
  // Start auto-scrolling for projects
  startAutoScroll() {
    // Don't start if manually paused or already hovering
    if (this.isPaused || this.isProjectsHovered) return;
    
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
    
    const scrollContainer = document.querySelector('.projects-grid') as HTMLElement;
    if (!scrollContainer) return;

    this.autoScrollInterval = setInterval(() => {
      // Calculate the width and current position
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      const scrollPosition = scrollContainer.scrollLeft;
      
      // If near the end, prepare for looping
      if (scrollPosition >= scrollWidth - clientWidth - 20) {
        // We'll use a quick reset to the first card position
        // First, find the width of the first card plus gap
        const firstCard = scrollContainer.querySelector('.project-card') as HTMLElement;
        const cardWidth = firstCard ? firstCard.offsetWidth : 450;
        const gap = 30; // gap between cards

        // Reset to beginning (slight offset to avoid visual jump)
        // Set immediately to avoid visual "rewind" effect
        scrollContainer.scrollLeft = 10;
      } else {
        // Otherwise continue normal scrolling
        scrollContainer.scrollLeft += this.autoScrollSpeed;
      }
    }, this.autoScrollDelay);
  }
  
  // Stop auto-scrolling
  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }
} 