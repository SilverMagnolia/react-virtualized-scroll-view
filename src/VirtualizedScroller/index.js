/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState, useRef} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

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
    const visibleRectY = visibleRect.y;
    const visibleRectMaxY = visibleRect.y + visibleRect.height;
    const invisibleRenderingHeight = visibleRect.height + visibleRect.height / 3;
    const visibleCellIndices = [];

    let paddingTop = 0;
    let paddingBottom = 0;

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
            paddingTop += cellHeight;
        } else {
            paddingBottom += cellHeight;
        }

        curY += cellHeight;
    }
    return {visibleCellIndices, paddingTop, paddingBottom};
}

function getComponentRect(componentRef) {
    const clientRect = componentRef.getBoundingClientRect();

    const x = clientRect.x;
    const y = clientRect.y;
    const width = componentRef.clientWidth;
    const height = componentRef.clientHeight;

    return new Rect(x, y, width, height);
}

function Projection(visibleItemIndices, paddingTop, paddingBottom, windowScrollY) {
    this.visibleItemIndices = visibleItemIndices;
    this.paddingTop = paddingTop;
    this.paddingBottom = paddingBottom;
    this.windowScrollY = windowScrollY;
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
        // restore scroll  
        if (props.scrollRestorationInfo !== null && props.scrollRestorationInfo !== undefined) {
            window.scrollTo(0, props.scrollRestorationInfo.projection.windowScrollY);
        }

        return () => {
            // create restoration info to restore scroll.
            if (lastProjection.current === null) {
                return;
            }

            const restorationInfo = {
                projection: lastProjection.current,
                itemRects: [...itemRectCache.current]
            };

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

    function calcProjection(){
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
            paddingTop,
            paddingBottom
        } = calcLayout(
            visibleRect,
            props.items.length,
            itemRectCache.current,
            scrollContainerMarginTop,
            props.itemVerticalSpacing
        );

        setProjection(new Projection(
            visibleCellIndices, 
            paddingTop, 
            paddingBottom,
            windowScrollY // 스크롤 복구에 쓰임
        ));
    };

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
                        // 1. 캐시에 있는 아이템의 높이와 현재 아이템의 높이가 불일치하면,
                        foundItemHeightInconsistency.current = true;
                    }

                    itemRectCache.current[i] = curItemRect;

                    const shouldRecalcProjection =
                        i === projection.visibleItemIndices[projection.visibleItemIndices.length - 1]
                        && foundItemHeightInconsistency.current === true;

                    if (shouldRecalcProjection === true) {
                        // 2. 프로젝션 재계산 -> 렌더링.
                        calcProjection();
                        foundItemHeightInconsistency.current = false;
                    }
                }}
                key={itemDescriptor.id}
                descriptor={itemDescriptor}
            />
        );
    }

    const containerPaddingTop = projection === null || items.length === 0 ? 0 : projection.paddingTop;
    const containerPaddingBottom = projection === null || items.length === 0 ? 0 : projection.paddingBottom;

    return (
        <div
            ref={(ref) => {
                if (ref === null) {
                    return;
                }

                containerRef.current = ref;
            }}
            style={{
                paddingTop: containerPaddingTop,
                paddingBottom: containerPaddingBottom,
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
