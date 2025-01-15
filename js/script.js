document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

class WindowManager {
    constructor(windowElement, titleBar, initialOffset = { x: 20, y: 20 }) {
        this.window = windowElement;
        this.titleBar = titleBar;
        this.isDragging = false;
        this.offset = initialOffset;
        this.initialPos = { x: 0, y: 0 };
        
        this.titleBar.addEventListener('mousedown', this.dragStart.bind(this));
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', () => this.isDragging = false);
    }

    dragStart(e) {
        if (e.target === this.titleBar || e.target.parentNode === this.titleBar) {
            this.isDragging = true;
            this.initialPos = {
                x: e.clientX - this.offset.x,
                y: e.clientY - this.offset.y
            };
        }
    }

    drag(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        this.offset = {
            x: e.clientX - this.initialPos.x,
            y: e.clientY - this.initialPos.y
        };
        this.window.style.left = `${this.offset.x}px`;
        this.window.style.top = `${this.offset.y}px`;
    }

    show(centerScreen = false) {
        this.window.style.display = 'block';
        if (centerScreen) {
            this.offset = {
                x: (window.innerWidth - this.window.offsetWidth) / 2,
                y: (window.innerHeight - this.window.offsetHeight) / 2
            };
        }
        this.window.style.left = `${this.offset.x}px`;
        this.window.style.top = `${this.offset.y}px`;
    }

    hide() {
        this.window.style.display = 'none';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const mainWindow = new WindowManager(
        document.querySelector('.window'),
        document.querySelector('.window .title-bar'),
        { x: 50, y: 50 }
    );

    const projectsWindow = new WindowManager(
        document.getElementById('projects-window'),
        document.querySelector('#projects-window .title-bar')
    );

    const mediaWindow = new WindowManager(
        document.querySelector('.media-window'),
        document.querySelector('.media-window .title-bar')
    );

    const audioPlayer = new Audio('CODEX_Installer_2018-06.m4a');
    let isPlaying = false;

    document.getElementById('xyris-exe').addEventListener('dblclick', () => mainWindow.show());
    document.getElementById('projects-folder').addEventListener('dblclick', () => projectsWindow.show());
    document.getElementById('vibing-player').addEventListener('dblclick', () => mediaWindow.show(true));

    document.querySelectorAll('.window-button:last-child, .close-folder, .close-media').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.window, .folder-window, .media-window').style.display = 'none';
            if (btn.classList.contains('close-media')) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                isPlaying = false;
                document.querySelector('.play-pause').textContent = '►';
            }
        });
    });

    const volumeControl = {
        level: 35,
        init() {
            document.getElementById('volume-down').onclick = () => {
                this.level = Math.max(0, this.level - 10);
                audioPlayer.volume = this.level / 100;
                document.getElementById('volume-level').textContent = `Volume: ${this.level}%`;
            };
            document.getElementById('volume-up').onclick = () => {
                this.level = Math.min(100, this.level + 10);
                audioPlayer.volume = this.level / 100;
                document.getElementById('volume-level').textContent = `Volume: ${this.level}%`;
            };
        }
    };
    volumeControl.init();

    const mediaControls = {
        playPauseBtn: document.querySelector('.play-pause'),
        stopBtn: document.querySelector('.stop'),
        volumeSlider: document.querySelector('.volume-slider'),
        progress: document.querySelector('.progress'),
        timeDisplay: document.querySelector('.time-display'),

        init() {
            this.playPauseBtn.onclick = () => this.togglePlay();
            this.stopBtn.onclick = () => this.stop();
            this.volumeSlider.oninput = (e) => {
                audioPlayer.volume = e.target.value / 100;
                volumeControl.level = e.target.value;
                document.getElementById('volume-level').textContent = `Volume: ${e.target.value}%`;
            };
            audioPlayer.ontimeupdate = () => this.updateProgress();
            
            audioPlayer.volume = volumeControl.level / 100;
            this.volumeSlider.value = volumeControl.level;
        },

        togglePlay() {
            isPlaying ? audioPlayer.pause() : audioPlayer.play();
            isPlaying = !isPlaying;
            this.playPauseBtn.textContent = isPlaying ? '❚❚' : '►';
        },

        stop() {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            isPlaying = false;
            this.playPauseBtn.textContent = '►';
        },

        updateProgress() {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            this.progress.style.width = `${progress}%`;
            const formatTime = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
            this.timeDisplay.textContent = `${formatTime(audioPlayer.currentTime)} / ${formatTime(audioPlayer.duration)}`;
        }
    };
    mediaControls.init();

    mainWindow.hide();
});
