import { Component, Input, Output, EventEmitter, HostListener, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Vector } from './../vector';

import Logger from '../../utils/logger';

/**A Component for rendering shapes and colors on a canvas.*/
@Component({
  selector: 'renderer',
  template: `
  <div #canvasContainer id="canvasContainer" [ngClass]="{'fixed-canvas': fixedSize, 'text-center': center}">
    <canvas #theCanvas id="theCanvas"></canvas>
  </div>`,
  styles: [
    '.fixed-canvas {overflow: auto}',
    '#theCanvas {width: 100%}',
  ]
})
export class Renderer implements AfterViewInit {
  @Output() renderResize: EventEmitter<Renderer> = new EventEmitter();
  @Input() fixedWidth: number;
  @Input() fixedHeight: number;
  @Output() render: EventEmitter<Renderer> = new EventEmitter();
  @Output() mouseOver: EventEmitter<Vector> = new EventEmitter();
  @Input() fixedSize: boolean;
  @Input() center = true;
  @ViewChild('theCanvas', { static: false }) canvasView;
  @ViewChild('canvasContainer', { static: false }) canvasContainer;
  // The actual width of the canvas
  width: number;
  // The actual height of the canvas
  height: number;
  // The x origin point (0, y)
  originX: number;
  // The y origin point (x, 0)
  originY: number;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private imageBackground: HTMLImageElement;
  private imageLoaded = false;
  private backgroundColor = 'black';

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit() {
    this.canvas = this.canvasView.nativeElement;
    this.canvasContainer = document.getElementById('canvasContainer');
    this.context = this.canvas.getContext('2d');

    this.resizeCanvas();
    this.renderLoop();
  }

  ellipse(x: number, y: number, radius: number, color: string) {
    this.context.beginPath();
    this.context.ellipse(x, y, radius, radius, 0, 2 * Math.PI, 0, false);
    this.context.fillStyle = color;
    this.context.fill();
    this.context.closePath();
  }

  polygon(points: Vector[], color: string, alpha?: number) {
    let polygonPoints = points.slice(0);  // Need a copy of the points here
    this.context.beginPath();
    color = this.convertHex(color, alpha);
    this.context.fillStyle = color;

    let firstPoint = polygonPoints[0];
    let separatePoints = new Array<Vector>();
    for (let i = 0; i < polygonPoints.length; i++) {
      let point = polygonPoints[i];
      if (i === 0) {
        this.context.moveTo(point.x, point.y);
      } else {
        if (point.x === firstPoint.x && point.y === firstPoint.y && i < polygonPoints.length - 1) {
          // Need to create a separate polygon for these points
          separatePoints = polygonPoints.splice(i + 1, polygonPoints.length - i);
        }
        this.context.lineTo(point.x, point.y);
      }
    }

    this.context.fill();
    this.context.closePath();

    if (separatePoints.length > 0) {
      this.polygon(separatePoints, color);
    }
  }

  text(x: number, y: number, text: string, color: string, centerText?: boolean) {
    this.context.font = 'bold 16px Segoe UI';
    this.context.fillStyle = color;
    if (centerText) {
      let metrics = this.context.measureText(text);
      x -= metrics.width / 2;
    }
    this.context.fillText(text, x, y);
  };

	/**
	 * Loads an image to the background of the canvas.
	 * @param url The image url
	 * @param error An error callback
	 */
  loadImageBackground(url: string, error: any) {
    if (this.imageBackground === undefined) {
      this.imageBackground = new Image();
    }
    this.imageBackground.onload = () => { this.imageLoaded = true; };
    this.imageBackground.onerror = () => { error(`Could not load image at ${url}...`); };
    this.imageBackground.src = url;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    let rect = this.canvasView.nativeElement.getBoundingClientRect();

    let width = this.canvas.width;
    let height = this.canvas.height;

    let centerX = width / 2;
    let centerY = height / 2;

    let x = event.clientX - rect.left - centerX;
    let y = event.clientY - rect.top - centerY;
    this.mouseOver.emit(new Vector(x, y));
  }

  private renderLoop() {
    try {
      this.context.save();

      let width = this.canvas.width;
      let height = this.canvas.height;
      this.width = width;
      this.height = height;

      this.originX = 0;
      this.originY = 0;

      this.clear(this.context.canvas);
      this.drawImageBackground();

      this.render.emit(this);

      this.context.restore();

      requestAnimationFrame(() => { this.renderLoop(); });
    } catch (e) {
      Logger.error(e);
    }
  }

  private drawImageBackground() {
    if (!this.imageBackground || !this.imageLoaded) {
      return;
    }

    let width = this.canvas.width;
    let height = this.canvas.height;

    this.context.beginPath();
    this.context.drawImage(this.imageBackground, 0, 0, width, height);
    this.context.closePath();
  }

  private clear(canvas: HTMLCanvasElement) {
    this.context.fillStyle = this.backgroundColor;
    this.context.fillRect(this.originX, this.originY, canvas.width, canvas.height);
  }

  private convertHex(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    let a = parseInt(alpha, 16) / 255;
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';
  }

  @HostListener('window:resize', ['$event'])
  resizeCanvas(event?) {
    let width, height;
    if (this.fixedWidth != null && this.fixedHeight != null) {
      width = this.fixedWidth;
      height = this.fixedHeight;
    } else {
      width = this.canvasContainer.clientWidth;
      height = this.canvasContainer.clientHeight;
    }
    
    this.canvas.width = width;
    this.canvas.height = height;

    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.width = width;
    this.height = height;

    this.renderResize.emit(this);
  }
}
