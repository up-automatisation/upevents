/**
 * Phusion Passenger entry point for O2Switch deployment.
 *
 * Passenger loads this file and expects the app to call listen('passenger').
 * We dynamically import the compiled Express app (ESM) and bind it to Passenger.
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

if (typeof PhusionPassenger !== 'undefined') {
  PhusionPassenger.configure({ autoInstall: false });
}

(async () => {
  try {
    const { default: app } = await import('./backend/dist/index.js');

    if (typeof PhusionPassenger !== 'undefined') {
      // Passenger manages the socket/port
      app.listen('passenger', () => {
        console.log('UpEvents running under Phusion Passenger');
      });
    } else {
      // Fallback for manual production start
      const port = process.env.PORT || 3001;
      app.listen(port, () => {
        console.log(`UpEvents running on http://localhost:${port}`);
      });
    }
  } catch (error) {
    console.error('Failed to start UpEvents:', error);
    process.exit(1);
  }
})();
