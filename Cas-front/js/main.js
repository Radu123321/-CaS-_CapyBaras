document.addEventListener("DOMContentLoaded", () => {
  function preloadImage(img) {
    return new Promise((resolve, reject) => {
      if (!img.dataset.src) {
        resolve(img);
        return;
      }

      const tempImage = new Image();
      tempImage.src = img.dataset.src;

      tempImage.onload = () => {
        img.src = img.dataset.src;
        resolve(img);
      };

      tempImage.onerror = () => {
        console.error('Eroare la încărcarea imaginii:', img.dataset.src);
        reject(new Error(`Failed to load image: ${img.dataset.src}`));
      };
    });
  }

  function handleImageLoading() {
    const lazyImages = document.querySelectorAll("img[loading='lazy']");
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            
            preloadImage(img)
              .then(() => {
                requestAnimationFrame(() => {
                  img.classList.add("loaded");
                });
              })
              .catch(() => {
                img.classList.add('loaded'); // Show placeholder on error
              })
              .finally(() => {
                observer.unobserve(img);
              });
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      lazyImages.forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      lazyImages.forEach(img => {
        preloadImage(img)
          .then(() => {
            img.classList.add('loaded');
          })
          .catch(() => {
            img.classList.add('loaded');
          });
      });
    }
  }

  handleImageLoading();

  document.addEventListener('contentChanged', handleImageLoading);

  window.addEventListener('load', () => {
    setTimeout(handleImageLoading, 1000);
  });
});
