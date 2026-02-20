type EventCallback = () => void;

class ReviewStatusEvents {
  private listeners: Set<EventCallback> = new Set();

  subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  emit(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in review status event listener:', error);
      }
    });
  }
}

export const reviewStatusEvents = new ReviewStatusEvents();
