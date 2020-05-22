/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState, useRef} from 'react';
import PropTypes from 'prop-types';

VirtualizedScroller.propTypes ={
    items: PropTypes.array.isRequired,
    itemComponent: PropTypes.elementType.isRequired,
    itemVerticalSpacing: PropTypes.number.isRequired,

    onDismiss: PropTypes.func.isRequired,
    scrollRestorationInfo: PropTypes.shape({
        projection: PropTypes.object.isRequired,
        itemRects: PropTypes.array.isRequired,
    })
};

const ESTIMATED_CELL_HEIGHT = 100;

function Rect(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

function calcLayout(visibleRect, numOfItems, itemRectCache, scrollContainerMarginTop, itemVerticalSpacing) {
    // console.info('\n>>>🤢🤢🤢 visibleRect: ', visibleRect)
    const visibleRectY = visibleRect.y;
    const visibleRectMaxY = visibleRect.y + visibleRect.height;
    const invisibleRenderingHeight = visibleRect.height + visibleRect.height / 3;
    const visibleCellIndices = [];

    let containerPaddingTop = 0;
    let containerPaddingBottom = 0;

    let curY = scrollContainerMarginTop;

    for (let i = 0; i < numOfItems; i++) {
        const cellHeight = (itemRectCache[i] === undefined || itemRectCache[i] === null)
            ? ESTIMATED_CELL_HEIGHT + (itemVerticalSpacing || 0)
            : itemRectCache[i].height + (itemVerticalSpacing || 0);

        const ithCellY = curY;
        const ithCellMaxY = ithCellY + cellHeight;

        if (
            ithCellY <= (visibleRectMaxY + invisibleRenderingHeight)
            && ithCellMaxY >= (visibleRectY - invisibleRenderingHeight)
        ) {
            visibleCellIndices.push(i);
        } else if (visibleCellIndices.length === 0) {
            containerPaddingTop += cellHeight;
        } else {
            containerPaddingBottom += cellHeight;
        }

        curY += cellHeight;
    }
    return {visibleCellIndices, containerPaddingTop, containerPaddingBottom};
}

function getComponentRect(componentRef) {
    const clientRect = componentRef.getBoundingClientRect();

    const x = clientRect.x;
    const y = clientRect.y;
    const width = componentRef.clientWidth;
    const height = componentRef.clientHeight;

    return new Rect(x, y, width, height);
}

function Projection(visibleItemIndices, beforePadder, afterPadder, scrollContainerMarginTop) {
    this.visibleItemIndices = visibleItemIndices;
    this.beforePadder = beforePadder;
    this.afterPadder = afterPadder;
    this.scrollContainerMarginTop = scrollContainerMarginTop;
}

export default function VirtualizedScroller(props) {
    const {items, itemComponent} = props;

    const [projection, setProjection] = useState(
        props.scrollRestorationInfo !== null && props.scrollRestorationInfo !== undefined
        ? props.scrollRestorationInfo.projection
        : null
    );

    const containerRef = useRef(null);
    const didInitFirstProjection = useRef(props.scrollRestorationInfo !== null && props.scrollRestorationInfo !== undefined ? true : false);
    const foundItemHeightInconsistency = useRef(false);
    const lastProjection = useRef(null);

    const itemRectCache = useRef(
        props.scrollRestorationInfo !== null && props.scrollRestorationInfo !== undefined
        ? props.scrollRestorationInfo.itemRects
        : Array(props.items.length).fill().map((_, i) => new Rect(0, i * ESTIMATED_CELL_HEIGHT, window.innerWidth, ESTIMATED_CELL_HEIGHT))
    );

    const ItemComponent = itemComponent;

    useEffect(() => {
        if (props.scrollRestorationInfo !== null && props.scrollRestorationInfo !== undefined) {
            // console.info('🍀🍀🍀🍀 restore ', props.scrollRestorationInfo);

            window.scrollTo(
                0, 
                // props.scrollRestorationInfo.windowScrollY + props.scrollRestorationInfo.projection.scrollContainerMarginTop
                props.scrollRestorationInfo.windowScrollY
            );
        }

        return () => {
            if (lastProjection.current === null) {
                return;
            }

            const restorationInfo = {
                projection: lastProjection.current,
                itemRects: [...itemRectCache.current],
                windowScrollY: window.scrollY,
                // scrollContainerScrollY: containerRef.current.getBoundingClientRect().top,
                // scrollContainerMarginTop: window.scrollY + containerRef.current.getBoundingClientRect().top,
            };

            // console.info('🤡🤡🤡🤡 onDismiss(restorationInfo) ', restorationInfo);
            props.onDismiss(restorationInfo);
        }
    }, []);

    useEffect(() => {
        if (
            (items.length > 0 && didInitFirstProjection.current === false)
        ) {
            setProjection(new Projection(
                Array(props.items.length).fill().map((_, i) => i),
                0,
                0,
                0
            ));
            didInitFirstProjection.current = true
        }
    }, [props.items.length]);

    useEffect(() => {
        lastProjection.current = projection;
        const scrollEventHandler = () => {
            handleScrollEvent();
        };

        window.addEventListener('scroll', scrollEventHandler);
        return () => {
            window.removeEventListener('scroll', scrollEventHandler);
        };
    }, [projection]);

    function handleScrollEvent() {
        calcProjection();
    }

    function calcProjection() {
        if (projection === null || containerRef.current === null) {
            return;
        }

        const windowHeight = window.innerHeight;
        const windowScrollY = window.scrollY;

        const scrollContainerRect = containerRef.current.getBoundingClientRect();
        const scrollContainerWidth = containerRef.current.scrollWidth;
        const scrollContainerMarginLeft = scrollContainerRect.left;
        const scrollContainerMarginTop = windowScrollY + scrollContainerRect.top;

        const visibleRect = new Rect(
            scrollContainerMarginLeft,
            windowScrollY + scrollContainerMarginTop,
            scrollContainerWidth,
            windowHeight - scrollContainerMarginTop
        );

        const {
            visibleCellIndices,
            containerPaddingTop,
            containerPaddingBottom
        } = calcLayout(
            visibleRect,
            props.items.length,
            itemRectCache.current,
            scrollContainerMarginTop,
            props.itemVerticalSpacing
        );

        setProjection(new Projection(
            visibleCellIndices, 
            containerPaddingTop, 
            containerPaddingBottom,
            scrollContainerMarginTop
        ));
    }

    function renderItem(itemDescriptor, i) {
        return (
            <ItemComponent
                ref={(ref) => {
                    if (ref === null) {
                        return;
                    }

                    const prevItemRect = itemRectCache.current[i] || null;
                    const curItemRect = getComponentRect(ref);

                    if (prevItemRect === null || (prevItemRect.height !== curItemRect.height)) {
                        foundItemHeightInconsistency.current = true;
                    }

                    itemRectCache.current[i] = curItemRect;

                    const shouldRecalcProjection =
                        i === projection.visibleItemIndices[projection.visibleItemIndices.length - 1]
                        && foundItemHeightInconsistency.current === true;

                    if (shouldRecalcProjection === true) {
                        calcProjection();
                        foundItemHeightInconsistency.current = false;
                    }
                }}
                key={itemDescriptor.postInfo.id}
                descriptor={itemDescriptor}
            />
        )
    }

    const scrollContainerPaddingTop = projection === null || items.length === 0 ? 0 : projection.beforePadder;
    const scrollContainerPaddingBottom = projection === null || items.length === 0 ? 0 : projection.afterPadder;

    // console.info('🦊 items: ', props.items.length);
    // console.info('🐽', projection);
    // console.info('🤢', itemRectCache.current);

    return (
        <div
            ref={(ref) => {
                if (ref === null) {
                    return;
                }

                if (containerRef.current === null && props.scrollRestorationInfo) {
                    // ref.scroll(0, props.scrollRestorationInfo.scrollContainerTop)
                }

                containerRef.current = ref;
            }}
            style={{
                paddingTop: scrollContainerPaddingTop,
                paddingBottom: scrollContainerPaddingBottom,
            }}
        >
            {projection !== null && items.length > 0 &&
                items.map((item, i) => {
                    if (projection.visibleItemIndices.includes(i) === true) {
                        return renderItem(item, i);
                    } else {
                        return null;
                    }
                })
            }
        </div>
    );
}
