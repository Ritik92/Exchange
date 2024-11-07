import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';

interface ChartOptions {
  background?: string;
  textColor?: string;
  gridColor?: string;
  upColor?: string;
  downColor?: string;
  volumeUpColor?: string;
  volumeDownColor?: string;
}

export class ChartManager {
  private chart: IChartApi;
  private candleSeries: ISeriesApi<'Candlestick'>;
  private volumeSeries: ISeriesApi<'Histogram'>;

  constructor(
    container: HTMLElement,
    initialData: any[],
    options: ChartOptions = {}
  ) {
    // Set default options for dark theme
    const defaultOptions = {
      background: '#131722',
      textColor: '#D9D9D9',
      gridColor: '#363c4e',
      upColor: '#26a69a',
      downColor: '#ef5350',
      volumeUpColor: 'rgba(38, 166, 154, 0.5)',
      volumeDownColor: 'rgba(239, 83, 80, 0.5)',
      ...options
    };

    // Create main chart
    this.chart = createChart(container, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: defaultOptions.background,
        },
        textColor: defaultOptions.textColor,
      },
      grid: {
        vertLines: {
          color: defaultOptions.gridColor,
          style: 1,
        },
        horzLines: {
          color: defaultOptions.gridColor,
          style: 1,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: 'rgba(224, 227, 235, 0.3)',
          style: 1,
          labelBackgroundColor: '#2B2B43',
        },
        horzLine: {
          width: 1,
          color: 'rgba(224, 227, 235, 0.3)',
          style: 1,
          labelBackgroundColor: '#2B2B43',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.3)',
        textColor: defaultOptions.textColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.3)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString([], { 
            month: 'short',
            day: 'numeric',
          });
        },
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    });

    // Add candlestick series with improved styling
    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: defaultOptions.upColor,
      downColor: defaultOptions.downColor,
      borderVisible: false,
      wickUpColor: defaultOptions.upColor,
      wickDownColor: defaultOptions.downColor,
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Add volume series with improved styling
    this.volumeSeries = this.chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Set to empty string for overlay
      //@ts-ignore
      scaleMargins: {
        top: 0.8, // Position at the bottom of the chart
        bottom: 0,
      },
    });

    // Set initial data
    const { candleData, volumeData } = this.processData(initialData);
    this.candleSeries.setData(candleData);
    this.volumeSeries.setData(volumeData);

    // Fit content to view
    this.chart.timeScale().fitContent();

    // Add window resize handler
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    const parent = this.chart.chartElement().parentElement;
    if (parent) {
      this.resize(parent.clientWidth, parent.clientHeight);
    }
  };

  private processData(data: any[]) {
    const candleData = data.map((d) => ({
      time: (d.timestamp / 1000) as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = data.map((d) => ({
      time: (d.timestamp / 1000) as UTCTimestamp,
      value: d.volume,
      color: d.close >= d.open 
        ? this.volumeSeries.options().color || 'rgba(38, 166, 154, 0.5)' 
        : 'rgba(239, 83, 80, 0.5)',
    }));

    return { candleData, volumeData };
  }

  public setVisibleRange(from: number, to: number) {
    this.chart.timeScale().setVisibleRange({
      from: (from / 1000) as UTCTimestamp,
      to: (to / 1000) as UTCTimestamp,
    });
  }

  public update(data: any) {
    const timestamp = (data.timestamp / 1000) as UTCTimestamp;
    
    this.candleSeries.update({
      time: timestamp,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
    });

    this.volumeSeries.update({
      time: timestamp,
      value: data.volume,
      color: data.close >= data.open 
        ? this.volumeSeries.options().color || 'rgba(38, 166, 154, 0.5)'
        : 'rgba(239, 83, 80, 0.5)',
    });
  }

  public resize(width?: number, height?: number) {
    this.chart.applyOptions({
      width: width || this.chart.chartElement().clientWidth,
      height: height || this.chart.chartElement().clientHeight,
    });
  }

  public destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.chart.remove();
  }

  // New methods to match the reference UI
  public setChartType(type: 'candlestick' | 'line' | 'bar') {
    // Implementation for switching chart types
    // Note: Would require additional series setup and data transfer
  }

  public toggleVolume(visible: boolean) {
    this.volumeSeries.applyOptions({
      visible: visible,
    });
  }

  public setTimeInterval(interval: '1h' | '4h' | '1D' | '1W') {
    // Implementation for changing time interval
    // Would require fetching new data at different granularity
  }
}