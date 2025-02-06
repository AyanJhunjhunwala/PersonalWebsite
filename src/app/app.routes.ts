import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component'; // Import the HomeComponent
import { ProjectsComponent } from './projects/projects.component'; // Import the ProjectsComponent

// Define routes
export const routes: Routes = [
  { path: '', component: HomeComponent }, // Route for the home page
  { path: 'portfolio', component: ProjectsComponent } // Route for the portfolio (projects) page
];
