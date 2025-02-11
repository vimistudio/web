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
    this.container.style.overflow = 'hidden'; // Prevent any potential overflow

    // Setup slider
    this.slider.style.position = 'absolute';
    this.slider.style.top = '0';
    this.slider.style.right = '0';
    this.slider.style.width = '100%';
    this.slider.style.height = '100%';
    this.slider.style.backgroundColor = '#fbfafa';
    this.slider.style.transform = 'translateX(100%)';
    this.slider.style.willChange = 'transform';
  }

  public async animate(): Promise<void> {
    return new Promise((resolve) => {
      // Append elements
      document.body.appendChild(this.container);
      this.container.appendChild(this.slider);

      // Force reflow
      this.slider.offsetHeight;

      // Add transition
      this.slider.style.transition = `transform ${this.options.duration/1000}s cubic-bezier(0.65, 0, 0.35, 1)`;

      // Start animation
      requestAnimationFrame(() => {
        this.slider.style.transform = 'translateX(0%)';
      });

      // Cleanup after animation
      const cleanup = () => {
        this.container.remove();
        resolve();
      };

      setTimeout(cleanup, this.options.duration/2);
    });
  }

  public cleanup(): void {
    this.container.remove();
  }
}
