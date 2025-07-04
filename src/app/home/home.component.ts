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
  @ViewChild('projectsContainer') projectsContainer!: ElementRef;
  
  textToType = "Hello I'm Ayan!";
  subTextToType = "CS @ UCI";
  greetings = ["Hello I'm", "Hola soy", "Bonjour je suis", "Ciao sono", "Namaste main", "こんにちは私は", "안녕하세요 저는", "你好我是", "Hallo ich bin", "Olá eu sou"];
  currentGreetingIndex = 0;
  cursorPosition = { x: 50, y: 50 }; // Default cursor position
  targetPosition = { x: 50, y: 50 }; // Target position for smooth transition
  
  private scrollContainer!: HTMLElement;
  private autoScrollSpeed = 0.4; // Reduced from 0.7 for smoother scrolling
  private autoScrollActive = true;
  private autoScrollRafId: number | null = null;
  private isProjectsHovered = false;
  private infiniteScrollRafId: number | null = null;
  private scrollPosition = 0;
  
  private isThrottled = false;
  private animationFrameId: number | null = null;
  private cursorUpdating = false;
  
  private lastScrollY = 0;
  private parallaxRafId: number | null = null;
  private isMobile = false;
  private touchStartX = 0;
  private touchStartY = 0;
  
  constructor(private renderer: Renderer2) {
    this.checkIfMobile();
  }
  
  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  @HostListener('window:resize', [])
  onWindowResize() {
    this.checkIfMobile();
  }
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Skip cursor effects on mobile devices
    if (this.isMobile) return;
    
    // Calculate target cursor position as percentage of window
    this.targetPosition = {
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100
    };
    
    // Start the smooth animation if not already running
    if (!this.cursorUpdating) {
      this.cursorUpdating = true;
      this.updateCursorPosition();
    }
  }
  
  @HostListener('document:touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (!this.isMobile) return;
    
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }
  
  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isMobile) return;
    
    // Prevent default to avoid scrolling issues
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    
    // If horizontal swipe is more significant, handle project scrolling
    if (deltaX > deltaY && deltaX > 50) {
      const projectsGrid = document.getElementById('projectsGrid');
      if (projectsGrid && this.isElementInViewport(projectsGrid)) {
        event.preventDefault();
        
        if (touch.clientX > this.touchStartX) {
          this.scrollProjectsTo('left');
        } else {
          this.scrollProjectsTo('right');
        }
        
        this.touchStartX = touch.clientX;
      }
    }
  }
  
  private isElementInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  updateCursorPosition() {
    // Skip cursor effects on mobile devices
    if (this.isMobile) {
      this.cursorUpdating = false;
      return;
    }
    
    // Smoothly interpolate current position towards target position
    this.cursorPosition.x += (this.targetPosition.x - this.cursorPosition.x) * 0.1;
    this.cursorPosition.y += (this.targetPosition.y - this.cursorPosition.y) * 0.1;
    
    // Update interactive gradient position
    const interactive = document.querySelector('.interactive') as HTMLElement;
    if (interactive) {
      interactive.style.setProperty('--cursor-x', `${this.cursorPosition.x}%`);
      interactive.style.setProperty('--cursor-y', `${this.cursorPosition.y}%`);
    }
    
    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(() => this.updateCursorPosition());
    
    // Stop animation if cursor is very close to target (optimization)
    const dx = Math.abs(this.targetPosition.x - this.cursorPosition.x);
    const dy = Math.abs(this.targetPosition.y - this.cursorPosition.y);
    
    if (dx < 0.01 && dy < 0.01 && this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.cursorUpdating = false;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
      if (window.scrollY > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    }
    
    // Tab navigation hide/show
    const tabNavigation = document.querySelector('.tab-navigation') as HTMLElement;
    const navIndicator = document.querySelector('.nav-indicator') as HTMLElement;
    
    if (tabNavigation && navIndicator) {
      if (window.scrollY > 100) {
        tabNavigation.classList.add('hidden');
        navIndicator.classList.add('visible');
      } else {
        tabNavigation.classList.remove('hidden');
        navIndicator.classList.remove('visible');
      }
    }
    
    this.animateOnScroll();
    this.scheduleParallaxUpdate();
  }
  
  @HostListener('window:load', [])
  onWindowLoad() {
    this.hideLoadingScreen();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.hideLoadingScreen();
      
      this.typeGreeting();
      
      this.initSmoothScrolling();
      this.onWindowScroll();
      this.setupProjectCards();
      this.initProjectScrolling();
      this.initTabNavHover();
      
      // Start cursor animation
      this.updateCursorPosition();
    }, 1500);
  }
  
  ngOnDestroy() {
    // Clean up animation frame on component destroy
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.autoScrollRafId !== null) {
      cancelAnimationFrame(this.autoScrollRafId);
    }
    if (this.parallaxRafId !== null) {
      cancelAnimationFrame(this.parallaxRafId);
    }
    if (this.infiniteScrollRafId !== null) {
      cancelAnimationFrame(this.infiniteScrollRafId);
    }
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
    this.animateOnScroll();
  }
  
  animateOnScroll() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    animatedElements.forEach((element) => {
      const top = element.getBoundingClientRect().top;
      const bottom = element.getBoundingClientRect().bottom;
      if (top < window.innerHeight - 100 && bottom > 0) {
        element.classList.add('animated');
      }
    });
  }
  
  typeGreeting() {
    // Reset the text content
    if (this.typingTarget) {
      const currentText = this.typingTarget.nativeElement.textContent || "";
      const greeting = this.greetings[this.currentGreetingIndex];
      const staticText = " Ayan!";
      
      // If there's existing text, delete it first
      if (currentText.length > 0) {
        this.deleteText(this.typingTarget.nativeElement, currentText, () => {
          // After deletion, type the new greeting
          this.typeText(this.typingTarget.nativeElement, greeting + staticText, 0, () => {
            // After typing is complete
            this.renderer.setStyle(this.mainCursor.nativeElement, 'display', 'none');
            
            // Show the "Building AI & ML platforms daily" text
            const buildingText = document.querySelector('.fade-in-text') as HTMLElement;
            if (buildingText) {
              buildingText.style.opacity = '1';
              buildingText.style.transition = 'opacity 0.8s ease';
            }
            
            // Cycle to next greeting after a shorter delay (7 seconds instead of 10)
            setTimeout(() => {
              this.currentGreetingIndex = (this.currentGreetingIndex + 1) % this.greetings.length;
              this.renderer.setStyle(this.mainCursor.nativeElement, 'display', 'inline-block');
              this.typeGreeting();
            }, 7000);
          });
        });
      } else {
        // Initial typing (no text to delete)
        this.typeText(this.typingTarget.nativeElement, greeting + staticText, 0, () => {
          this.renderer.setStyle(this.mainCursor.nativeElement, 'display', 'none');
          
          // Show the "Building AI & ML platforms daily" text
          const buildingText = document.querySelector('.fade-in-text') as HTMLElement;
          if (buildingText) {
            buildingText.style.opacity = '1';
            buildingText.style.transition = 'opacity 0.8s ease';
          }
          
          // Cycle to next greeting after a shorter delay
          setTimeout(() => {
            this.currentGreetingIndex = (this.currentGreetingIndex + 1) % this.greetings.length;
            this.renderer.setStyle(this.mainCursor.nativeElement, 'display', 'inline-block');
            this.typeGreeting();
          }, 7000);
        });
      }
    }
  }
  
  deleteText(element: HTMLElement, text: string, callback: () => void) {
    if (text.length > 0) {
      element.textContent = text.substring(0, text.length - 1);
      setTimeout(() => this.deleteText(element, element.textContent || "", callback), 50);
    } else {
      callback();
    }
  }
  
  typeText(element: HTMLElement, text: string, index: number, callback: () => void) {
    if (index < text.length) {
      element.textContent += text.charAt(index);
      setTimeout(() => this.typeText(element, text, index + 1, callback), 100);
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
    if (section) section.scrollIntoView({ behavior: 'smooth' });
    }

  initProjectScrolling() {
    const container = document.querySelector('.projects-grid') as HTMLElement;
    if (!container) {
      console.error('Projects grid container not found');
      return;
    }
    this.scrollContainer = container;

    // Clone project cards for infinite scrolling
    const projectCards = container.querySelectorAll('.project-card');
    const originalCards = Array.from(projectCards);
    
    // Clear existing clones
    container.querySelectorAll('.cloned-card').forEach(clone => clone.remove());
    
    // Clone cards and append to the end
    originalCards.forEach(card => {
      const clone = card.cloneNode(true) as HTMLElement;
      clone.classList.add('cloned-card');
      container.appendChild(clone);
    });

    // Set up infinite scrolling
    this.startInfiniteScroll();

    // --- Mouse events for pause/resume ---
    container.addEventListener('mouseenter', () => {
      this.isProjectsHovered = true;
      this.stopInfiniteScroll();
    });
    container.addEventListener('mouseleave', () => {
      this.isProjectsHovered = false;
      this.startInfiniteScroll();
    });
    
    // --- Arrow navigation ---
    const leftArrow = document.querySelector('.scroll-arrow.left') as HTMLElement;
    const rightArrow = document.querySelector('.scroll-arrow.right') as HTMLElement;
    
    if (leftArrow) {
      leftArrow.addEventListener('click', () => this.scrollProjectsTo('left'));
    }
    
    if (rightArrow) {
      rightArrow.addEventListener('click', () => this.scrollProjectsTo('right'));
    }
  }

  startInfiniteScroll() {
    if (this.infiniteScrollRafId !== null) return;
    
    const animate = () => {
      if (!this.isProjectsHovered && this.scrollContainer) {
        const cardWidth = 400 + 25; // card width + gap
        const originalCards = this.scrollContainer.querySelectorAll('.project-card:not(.cloned-card)');
        const totalWidth = cardWidth * originalCards.length;
        
        this.scrollPosition += this.autoScrollSpeed;
        
        // Reset position when we've scrolled through all original cards
        if (this.scrollPosition >= totalWidth) {
          this.scrollPosition = 0;
        }
        
        this.scrollContainer.scrollLeft = this.scrollPosition;
      }
      
      this.infiniteScrollRafId = requestAnimationFrame(animate);
    };
    
    this.infiniteScrollRafId = requestAnimationFrame(animate);
  }

  stopInfiniteScroll() {
    if (this.infiniteScrollRafId !== null) {
      cancelAnimationFrame(this.infiniteScrollRafId);
      this.infiniteScrollRafId = null;
    }
  }

  // Add a method to handle manual navigation with the arrows
  scrollProjectsTo(direction: 'left' | 'right') {
    if (!this.scrollContainer) return;
    
    // Calculate the scroll distance with improved smoothness
    const projectCard = this.scrollContainer.querySelector('.project-card') as HTMLElement;
    const cardWidth = projectCard ? projectCard.offsetWidth : 450;
    const gap = 25; // gap from CSS
    const scrollDistance = cardWidth + gap;
    
    // Use requestAnimationFrame for smoother scrolling
    const currentScroll = this.scrollContainer.scrollLeft;
    const targetScroll = direction === 'left' 
      ? Math.max(0, currentScroll - scrollDistance)
      : currentScroll + scrollDistance;
    
    // Custom smooth scroll implementation for better control
    this.smoothScrollTo(this.scrollContainer, targetScroll, 400);
  }

  // Custom smooth scroll function for better performance
  private smoothScrollTo(element: HTMLElement, targetX: number, duration: number) {
    const startX = element.scrollLeft;
    const distance = targetX - startX;
    const startTime = performance.now();
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => 
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      const easedProgress = easeInOutCubic(progress);
      element.scrollLeft = startX + (distance * easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
  }

  scheduleParallaxUpdate() {
    if (this.parallaxRafId !== null) return;
    this.parallaxRafId = requestAnimationFrame(() => this.updateParallax());
  }

  updateParallax() {
    const scrollY = window.scrollY;
    if (scrollY !== this.lastScrollY) {
      document.body.setAttribute('data-parallax-scroll', '');
      document.body.style.setProperty('--parallax-bg', `${scrollY * 0.4}px`);
      document.body.style.setProperty('--parallax-content', `${scrollY * 0.15}px`);
      
      // Enhanced parallax effect for deep elements
      const deepElements = document.querySelectorAll('.parallax-deep');
      deepElements.forEach(element => {
        const rect = (element as HTMLElement).getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const viewportCenter = window.innerHeight / 2;
        const distanceFromCenter = (centerY - viewportCenter) * 0.05;
        (element as HTMLElement).style.transform = `translateY(${-distanceFromCenter}px) scale(${1 + Math.abs(distanceFromCenter) * 0.0005})`;
      });
    }
    this.lastScrollY = scrollY;
    this.parallaxRafId = null;
  }

  // Method to handle hover behavior for tab navigation
  initTabNavHover() {
    setTimeout(() => {
      const hoverArea = document.querySelector('.nav-hover-area') as HTMLElement;
      const tabNavigation = document.querySelector('.tab-navigation') as HTMLElement;
      const navIndicator = document.querySelector('.nav-indicator') as HTMLElement;
      
      if (!hoverArea || !tabNavigation || !navIndicator) {
        console.error('Navigation elements not found');
        return;
      }
      
      // Initial state based on scroll
      this.updateNavigationVisibility(tabNavigation, navIndicator);
      
      // Show navigation on hover area mouseenter
      hoverArea.addEventListener('mouseenter', () => {
        console.log('Mouse entered hover area');
        tabNavigation.style.opacity = '1';
        tabNavigation.style.transform = 'translateX(-50%)';
        tabNavigation.style.pointerEvents = 'auto';
        navIndicator.style.opacity = '0';
      });
      
      // Direct interaction with navigation
      tabNavigation.addEventListener('mouseenter', () => {
        console.log('Mouse entered navigation');
        tabNavigation.style.opacity = '1';
        tabNavigation.style.transform = 'translateX(-50%)';
        tabNavigation.style.pointerEvents = 'auto';
        navIndicator.style.opacity = '0';
      });
      
      // Hide when leaving both areas
      document.addEventListener('mousemove', (e) => {
        const target = e.target as HTMLElement;
        const isOverNavArea = tabNavigation.contains(target) || hoverArea.contains(target);
        
        if (!isOverNavArea && window.scrollY > 100) {
          this.updateNavigationVisibility(tabNavigation, navIndicator);
        }
      });
      
      // Also update on scroll
      window.addEventListener('scroll', () => {
        // Check if not hovering over the navigation or hover area
        if (!hoverArea.matches(':hover') && !tabNavigation.matches(':hover')) {
          this.updateNavigationVisibility(tabNavigation, navIndicator);
        }
      });
      
      console.log('Navigation hover behavior initialized');
    }, 2000); // Wait for DOM to fully initialize
  }

  // Helper method to update navigation visibility based on scroll
  updateNavigationVisibility(tabNavigation: HTMLElement, navIndicator: HTMLElement) {
    if (window.scrollY > 100) {
      // Hide navigation
      tabNavigation.style.opacity = '0';
      tabNavigation.style.transform = 'translateX(-50%) translateY(-20px)';
      tabNavigation.style.pointerEvents = 'none';
      navIndicator.style.opacity = '1';
    } else {
      // Show navigation
      tabNavigation.style.opacity = '1';
      tabNavigation.style.transform = 'translateX(-50%)';
      tabNavigation.style.pointerEvents = 'auto';
      navIndicator.style.opacity = '0';
  }
}
}
