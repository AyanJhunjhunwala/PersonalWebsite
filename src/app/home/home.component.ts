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
  
  // For auto-scrolling
  private autoScrollInterval: any;
  public isHovering = false;
  private scrollAmount = 0.8; // Scroll speed (pixels per interval)
  
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
      
      // Start the infinite scroll with a delay to ensure DOM is fully ready
      setTimeout(() => {
        this.startInfiniteScroll();
      }, 1000);
      
    }, 1500); // Longer delay to show loading animation
  }
  
  ngOnDestroy() {
    // Clear the auto-scroll interval when component is destroyed
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
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
    
    // Trigger initial animation check
    this.animateOnScroll();
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

  // Horizontal scrolling functionality for manual navigation with arrows
  scrollProjects(direction: string) {
    if (!this.projectsContainer) return;
    
    const container = this.projectsContainer.nativeElement;
    const cardWidth = 450; // Updated to match new CSS width
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({ 
      left: scrollAmount, 
      behavior: 'smooth' 
    });
  }
  
  // Infinite scrolling implementation
  startInfiniteScroll() {
    if (!this.projectsContainer?.nativeElement) return;
    
    const container = this.projectsContainer.nativeElement;
    
    this.autoScrollInterval = setInterval(() => {
      if (this.isHovering) return;
      
      // Get the total scroll width and current position
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      // If near the end, set up a reset to the beginning for infinite effect
      if (container.scrollLeft >= maxScrollLeft - 10) {
        // Do a quick reset to the beginning with no animation
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = 0;
        // Restore smooth scrolling
        setTimeout(() => {
          container.style.scrollBehavior = 'smooth';
        }, 50);
      } else {
        // Normal scrolling
        container.scrollLeft += this.scrollAmount;
      }
    }, 20); // Lower value = faster scroll
  }
}