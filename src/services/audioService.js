import Sound from 'react-native-sound';

Sound.setCategory('Playback');

class AudioService {
  constructor() {
    this.sound = null;
    this.isLoaded = false;
    this.currentTime = 0;
    this.duration = 0;
    this.timer = null;
  }

  loadTrack(filePath, onLoad, onProgress) {
    if (this.sound) {
      this.sound.release();
    }

    this.sound = new Sound(filePath, '', (error) => {
      if (error) {
        console.log('Failed to load sound', error);
        return;
      }
      
      this.isLoaded = true;
      this.duration = this.sound.getDuration();
      onLoad && onLoad(this.duration);
      
      this.startProgressTimer(onProgress);
    });
  }

  play(onProgress) {
    if (this.sound && this.isLoaded) {
      this.sound.play(() => {
        this.stopProgressTimer();
      });
      this.startProgressTimer(onProgress);
    }
  }

  pause() {
    if (this.sound && this.isLoaded) {
      this.sound.pause();
      this.stopProgressTimer();
    }
  }

  seekTo(time) {
    if (this.sound && this.isLoaded) {
      this.sound.setCurrentTime(time);
      this.currentTime = time;
    }
  }

  startProgressTimer(onProgress) {
    this.stopProgressTimer();
    this.timer = setInterval(() => {
      if (this.sound && this.isLoaded) {
        this.sound.getCurrentTime((seconds) => {
          this.currentTime = seconds;
          onProgress && onProgress(seconds, this.duration);
        });
      }
    }, 100);
  }

  stopProgressTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  release() {
    this.stopProgressTimer();
    if (this.sound) {
      this.sound.release();
      this.sound = null;
    }
    this.isLoaded = false;
  }
}

export default new AudioService();