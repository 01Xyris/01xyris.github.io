const errorMessages = [
    {
        title: "System Error",
        message: "The system has detected an unauthorized modification to system files. This program will now close to prevent further damage.",
    },
    {
        title: "Fatal Error",
        message: "A fatal exception 0E has occurred at 0028:C11B3AD4 in VXD VMM(01) + 00010E34. The current application will be terminated.",
    },
    {
        title: "Application Error",
        message: "The instruction at \"0x77f41234\" referenced memory at \"0x00000000\". The memory could not be \"read\".",
    },
    {
        title: "System Warning",
        message: "Your system is running in low virtual memory. Please close some applications and try again.",
    },
    {
        title: "Illegal Operation",
        message: "This program has performed an illegal operation and will be shut down.",
    }
];

function createElementWithClass(tag, className) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    return element;
}

function setTextContent(element, text) {
    element.textContent = text;
}

function createErrorDialog() {
    const dialog = createElementWithClass('div', 'win2k-dialog');
    const titleBar = createElementWithClass('div', 'title-bar');
    const titleSpan = createElementWithClass('span');
    setTextContent(titleSpan, 'Error');
    const titleBarButtons = createElementWithClass('div', 'title-bar-buttons');
    const closeBtn = createElementWithClass('div', 'close-btn');
    setTextContent(closeBtn, 'X');
    titleBarButtons.appendChild(closeBtn);
    titleBar.appendChild(titleSpan);
    titleBar.appendChild(titleBarButtons);
    const content = createElementWithClass('div', 'content');
    const errorIcon = createElementWithClass('div', 'error-icon');
    const message = createElementWithClass('div', 'message');
    content.appendChild(errorIcon);
    content.appendChild(message);
    const buttons = createElementWithClass('div', 'buttons');
    const okBtn = document.createElement('button');
    okBtn.className = 'ok-btn';
    setTextContent(okBtn, 'OK');
    buttons.appendChild(okBtn);
    dialog.appendChild(titleBar);
    dialog.appendChild(content);
    dialog.appendChild(buttons);
    document.body.appendChild(dialog);
    return dialog;
}

function initErrorDialogs() {
    const dialog = createErrorDialog();
    const closeBtn = dialog.querySelector('.close-btn');
    const okBtn = dialog.querySelector('.ok-btn');
    const titleSpan = dialog.querySelector('.title-bar span');
    const messageDiv = dialog.querySelector('.message');

    function closeDialog() {
        dialog.style.display = 'none';
    }

    closeBtn.addEventListener('click', closeDialog.bind(null));
    okBtn.addEventListener('click', closeDialog.bind(null));

    document.querySelectorAll('.title-bar-buttons div').forEach(btn => {
        btn.addEventListener('click', () => {
            const randomIndex = Math.floor(Math.random() * errorMessages.length);
            const randomError = errorMessages[randomIndex] || errorMessages[0];
            setTextContent(titleSpan, randomError.title);
            setTextContent(messageDiv, randomError.message);
            dialog.style.display = 'block';
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initErrorDialogs);
} else {
    initErrorDialogs();
}

Object.freeze(errorMessages);

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