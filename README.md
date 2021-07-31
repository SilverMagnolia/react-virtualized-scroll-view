## React Virtual Scroll

- This module is an implementation of [Twitter VirtualScroller](https://itsze.ro/blog/2017/04/09/infinite-list-and-react.html "Twitter VirtualScroller").

- When you develop an iOS or Andoroid native apps, Apple and Google provide UICollectionView and RecyclerView for infinite list. These classes render only visible items by comparing some factors - size of container, size of all contents and scoll position, but React does not. Basically when you develop an web site, there are not any native solutions for this purpose. React renders all items even if a million items exist. This impacts scoll performance and may result in unexpected problems. [react-virtualized](https://github.com/bvaughn/react-virtualized "react-virtualized") solves this issue and it is a good choice when you implement a infinite list. But this library was not fit to my case. So I decided to implement myself.

- [Usage example](https://github.com/SilverMagnolia/react-virtual-scroll/blob/master/src/ImageFeed.js "Usage example")