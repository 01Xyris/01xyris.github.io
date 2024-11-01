function createImageModal() {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-title-bar">
                <span class="modal-title">Image Viewer</span>
                <div class="modal-close">X</div>
            </div>
            <div class="modal-image-container">
                <img class="modal-image" src="" alt="Modal Image">
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function initImageModal() {
    const modal = createImageModal();
    const modalContent = modal.querySelector('.modal-content');
    const modalImage = modal.querySelector('.modal-image');
    const modalContainer = modal.querySelector('.modal-image-container');
    const closeBtn = modal.querySelector('.modal-close');
    
    // Handle image clicks
    document.querySelectorAll('.blog-image').forEach(img => {
        img.addEventListener('click', () => {
            // Set image source and title
            modalImage.src = img.src;
            modalImage.alt = img.alt;
            modal.querySelector('.modal-title').textContent = img.alt || 'Image Viewer';
            
            // Wait for image to load to calculate size
            modalImage.onload = () => {
                // Get original image dimensions
                const originalWidth = img.naturalWidth;
                const originalHeight = img.naturalHeight;
                
                // Calculate 30% larger dimensions
                let targetWidth = originalWidth * 1.3;
                let targetHeight = originalHeight * 1.3;
                
                // Get viewport dimensions (accounting for padding)
                const maxWidth = window.innerWidth * 0.9;
                const maxHeight = window.innerHeight * 0.9;
                
                // Scale down if necessary while maintaining aspect ratio
                if (targetWidth > maxWidth || targetHeight > maxHeight) {
                    const widthRatio = maxWidth / targetWidth;
                    const heightRatio = maxHeight / targetHeight;
                    const scaleFactor = Math.min(widthRatio, heightRatio);
                    
                    targetWidth *= scaleFactor;
                    targetHeight *= scaleFactor;
                }
                
                // Apply dimensions to modal content
                modalContent.style.width = `${targetWidth}px`;
                modalContainer.style.height = `${targetHeight}px`;
                
                // Show modal
                modal.classList.add('show');
            };
        });
    });
    
    // Close modal handlers
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        // Reset sizes
        modalContent.style.width = '';
        modalContainer.style.height = '';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            // Reset sizes
            modalContent.style.width = '';
            modalContainer.style.height = '';
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            modal.classList.remove('show');
            // Reset sizes
            modalContent.style.width = '';
            modalContainer.style.height = '';
        }
    });
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', initImageModal);