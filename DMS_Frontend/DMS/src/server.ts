import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes'; // Ensure this path is correct
import { renderApplication } from '@angular/platform-server';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Define paths for server and browser distribution folders
const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

// Initialize Express app
const app = express();

// Serve static files from the browser distribution folder
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y', // Cache static assets for 1 year
    index: false, // Disable directory listing
    redirect: false, // Prevent redirects for missing trailing slashes
  })
);

// Handle all GET requests for SSR
app.get('**', async (req, res, next) => {
  try {
    const html = await renderApplication(
      () =>
        bootstrapApplication(AppComponent, {
          providers: [
            provideHttpClient(), // Provides HTTP client for API calls
            provideRouter(routes), // Provides routing configuration
          ],
        }),
      {
        url: req.url, // Pass the requested URL for SSR
        document: '<app-root></app-root>', // Base HTML template
      }
    );
    res.send(html); // Send the rendered HTML
  } catch (err) {
    next(err); // Pass errors to Express error handler
  }
});

// Error handling middleware (optional but recommended)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Start the server only if this file is the main module
if (import.meta.url === process.argv[1]) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Export the Express app as reqHandler
export const reqHandler = app;