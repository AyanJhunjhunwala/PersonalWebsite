import { Component, AfterViewInit, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('typingTarget') typingTarget!: ElementRef;
  @ViewChild('subText') subText!: ElementRef;
  @ViewChild('mainCursor') mainCursor!: ElementRef;
  @ViewChild('subCursor') subCursor!: ElementRef;
  
  textToType = "Hi I'm Ayan!";
  subTextToType = "CS @ UCI";
  
  constructor(private renderer: Renderer2) {}
  
  ngAfterViewInit() {
    // Wait a brief moment to ensure view is ready
    setTimeout(() => {
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
    }, 500);
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
}