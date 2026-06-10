// Multi-page: index.html = the main game; spike.html = the roguelite architecture
// spike; showcase.html = the kid-facing "how we build together" showcase.
export default {
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        spike: 'spike.html',
        showcase: 'showcase.html'
      }
    }
  }
};
