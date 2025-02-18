## React Virtual Scroll

- This module is an implementation of [Twitter VirtualScroller](https://itsze.ro/blog/2017/04/09/infinite-list-and-react.html "Twitter VirtualScroller").

- When developing native iOS or Android apps, Apple and Google provide **UICollectionView** and **RecyclerView** for handling infinite lists. These classes render only the visible items by considering factors such as the container size, the total content size, and the scroll position. However, React does not have a built-in solution for this.

- By default, when developing a website, there are no native solutions for handling large lists efficiently. React renders all items, even if there are millions, which negatively impacts scroll performance and can lead to unexpected issues. [react-virtualized](https://github.com/bvaughn/react-virtualized "react-virtualized") addresses this problem and is a great choice for implementing infinite lists. However, it did not fully meet my specific requirements, so I decided to implement my own solution.

- [Usage example](https://github.com/SilverMagnolia/react-virtual-scroll/blob/master/src/ImageFeed.js "Usage example")
