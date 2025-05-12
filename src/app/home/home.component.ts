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
  
  // Removed autoScroll related properties
  private scrollContainer!: HTMLElement;
  
  constructor(private renderer: Renderer2) {}
  
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Calculate cursor position as percentage of window
    this.cursorPosition = {
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100
    };
    
    // Update interactive gradient position
    const interactive = document.querySelector('.interactive') as HTMLElement;
    if (interactive) {
      interactive.style.setProperty('--cursor-x', `${this.cursorPosition.x}%`);
      interactive.style.setProperty('--cursor-y', `${this.cursorPosition.y}%`);
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
    this.animateOnScroll();
  }
  
  @HostListener('window:load', [])
  onWindowLoad() {
    this.hideLoadingScreen();
  }
  
  ngAfterViewInit() {
    setTimeout(() => {
      this.hideLoadingScreen();
      
      this.typeText(this.typingTarget.nativeElement, this.textToType, 0, () => {
        this.renderer.setStyle(this.mainCursor.nativeElement, 'display', 'none');
        
        setTimeout(() => {
          this.typeText(this.subText.nativeElement, this.subTextToType, 0, () => {
            this.renderer.setStyle(this.subCursor.nativeElement, 'display', 'none');
            
            const buildingText = document.querySelector('.fade-in-text') as HTMLElement;
            if (buildingText) {
              buildingText.style.opacity = '1';
              buildingText.style.transition = 'opacity 0.8s ease';
            }
          });
        }, 300);
      });
      
      this.initSmoothScrolling();
      this.onWindowScroll();
      this.setupProjectCards();
      this.initProjectScrolling();
    }, 1500);
  }
  
  ngOnDestroy() {
    // Cleanup resources if needed
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
    
    const leftArrow = document.querySelector('.scroll-arrow.left') as HTMLElement;
    const rightArrow = document.querySelector('.scroll-arrow.right') as HTMLElement;
    
    if (leftArrow && rightArrow) {
      // Calculate the scroll distance (one card width + gap)
      const calculateScrollDistance = () => {
        const projectCard = document.querySelector('.project-card') as HTMLElement;
        const cardWidth = projectCard ? projectCard.offsetWidth : 450;
        const gap = 30; // gap between cards as defined in CSS
        return cardWidth + gap;
      };
      
      // Scroll left when clicking the left arrow
      leftArrow.addEventListener('click', () => {
        const scrollDistance = calculateScrollDistance();
        container.scrollBy({ 
          left: -scrollDistance, 
          behavior: 'smooth' 
        });
      });
      
      // Scroll right when clicking the right arrow
      rightArrow.addEventListener('click', () => {
        const scrollDistance = calculateScrollDistance();
        container.scrollBy({ 
          left: scrollDistance, 
          behavior: 'smooth' 
        });
      });
      
      // Show/hide arrows based on scroll position
      const toggleArrowVisibility = () => {
        const isAtStart = container.scrollLeft <= 10;
        const isAtEnd = container.scrollLeft >= (container.scrollWidth - container.clientWidth - 10);
        
        leftArrow.style.opacity = isAtStart ? '0.3' : '0.7';
        leftArrow.style.pointerEvents = isAtStart ? 'none' : 'auto';
        
        rightArrow.style.opacity = isAtEnd ? '0.3' : '0.7';
        rightArrow.style.pointerEvents = isAtEnd ? 'none' : 'auto';
      };
      
      // Add scroll event listener to toggle arrow visibility
      container.addEventListener('scroll', toggleArrowVisibility);
      
      // Initialize arrow visibility
      toggleArrowVisibility();
      
      // Handle keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          leftArrow.click();
        } else if (e.key === 'ArrowRight') {
          rightArrow.click();
        }
      });

      // Add touch swipe support for mobile
      let startX: number | null = null;
      let scrollLeft: number = 0;
      
      container.addEventListener('touchstart', (e: Event) => {
        const touchEvent = e as TouchEvent;
        startX = touchEvent.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
      }, { passive: true });
      
      container.addEventListener('touchmove', (e: Event) => {
        if (startX === null) return;
        
        const touchEvent = e as TouchEvent;
        const x = touchEvent.touches[0].pageX - container.offsetLeft;
        const distance = (x - startX);
        container.scrollLeft = scrollLeft - distance;
      }, { passive: true });
      
      container.addEventListener('touchend', () => {
        startX = null;
      }, { passive: true });
    }
  }
}
