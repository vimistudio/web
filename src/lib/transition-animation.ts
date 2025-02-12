interface TransitionAnimationOptions {
  duration: number;
  navbarHeight: number;
}

export class TransitionAnimation {
  private container: HTMLDivElement;
  private slider: HTMLDivElement;

  constructor(private options: TransitionAnimationOptions) {
    this.container = document.createElement('div');
    this.slider = document.createElement('div');
    this.setupElements();
  }

  private setupElements() {
    // Setup container
    this.container.style.position = 'fixed';
    this.container.style.top = `${this.options.navbarHeight}px`;
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = `calc(100% - ${this.options.navbarHeight}px)`;
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '100';
    this.container.style.willChange = 'transform';
    this.container.style.overflow = 'hidden';
    this.container.style.transformStyle = 'preserve-3d';
    this.container.style.backfaceVisibility = 'hidden';

    // Setup slider
    this.slider.style.position = 'absolute';
    this.slider.style.top = '0';
    this.slider.style.right = '0';
    this.slider.style.width = '100%';
    this.slider.style.height = '100%';
    this.slider.style.backgroundColor = '#fbfafa';
    this.slider.style.transform = 'translate3d(100%, 0, 0)';
    this.slider.style.willChange = 'transform';
    this.slider.style.transformStyle = 'preserve-3d';
    this.slider.style.backfaceVisibility = 'hidden';
  }

  public async animate(): Promise<void> {
    return new Promise((resolve) => {
      // Append elements
      document.body.appendChild(this.container);
      this.container.appendChild(this.slider);

      // Force reflow and add transition before animation starts
      this.slider.offsetHeight;
      this.slider.style.transition = `transform ${this.options.duration/1000}s cubic-bezier(0.4, 0, 0.2, 1)`;

      // Trigger animation in next frame
      const animateFrame = () => {
        this.slider.style.transform = 'translate3d(0, 0, 0)';
      };
      requestAnimationFrame(animateFrame);

      // Resolve promise after animation completes
      this.slider.addEventListener('transitionend', () => {
        this.cleanup();
        resolve();
      }, { once: true });

      // Backup cleanup in case transitionend doesn't fire
      setTimeout(() => {
        this.cleanup();
        resolve();
      }, this.options.duration + 100);
    });
  }

  public cleanup(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
