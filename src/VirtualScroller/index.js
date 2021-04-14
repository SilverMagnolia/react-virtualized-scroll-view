/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useState, useRef, forwardRef} from 'react';
import PropTypes from 'prop-types';
import {
    makeStyles
} from '@material-ui/core';

VirtualScroller.propTypes ={
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

function calcProjection(visibleRect, numOfItems, itemRectCache, itemVerticalSpacing) {
    const visibleRectY = visibleRect.y;
    const visibleRectMaxY = visibleRect.y + visibleRect.height;
    const invisibleRenderingHeight = visibleRect.height * 0.25;
    const visibleCellIndices = [];

    let paddingTop = 0;
    let paddingBottom = 0;

    let curY = 0;

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

const useStyles = makeStyles({
    container: (props) => ({
        '& > *': {
            marginBottom: props.itemVerticalSpacing || 0
        }
    })
});

export default function VirtualScroller(props) {
    const classes = useStyles(props);
    const {items, itemComponent} = props;
    const scrollRestorationInfoExists = props.scrollRestorationInfo !== null && props.scrollRestorationInfo !== undefined;

    const [projection, setProjection] = useState(
        scrollRestorationInfoExists
        ? props.scrollRestorationInfo.projection
        : null
    );

    const containerRef = useRef(null);
    const didInitFirstProjection = useRef(scrollRestorationInfoExists);
    const foundItemHeightInconsistency = useRef(false);
    const lastProjection = useRef(null);

    const itemRectCache = useRef(
        scrollRestorationInfoExists
        ? props.scrollRestorationInfo.itemRects
        : Array(props.items.length).fill().map((_, i) => new Rect(0, i * ESTIMATED_CELL_HEIGHT, window.innerWidth, ESTIMATED_CELL_HEIGHT))
    );

    const ItemComponent = itemComponent;

    useEffect(() => {
        // restore scroll position
        if (scrollRestorationInfoExists) {
            window.scrollTo(0, props.scrollRestorationInfo.projection.windowScrollY);
        }

        return () => {
            // create restoration info to restore scroll position.
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
        }

        window.addEventListener('scroll', scrollEventHandler);
        return () => {
            window.removeEventListener('scroll', scrollEventHandler);
        };
    }, [projection]);

    function handleScrollEvent() {
        recalcAndSetProjection();
    }

    function recalcAndSetProjection() {
        if (projection === null || containerRef.current === null) {
            return;
        }

        const windowHeight = window.innerHeight;
        const windowScrollY = window.scrollY;

        const scrollContainerRect = containerRef.current.getBoundingClientRect();

        const visibleRect = new Rect(
            scrollContainerRect.left, 
            scrollContainerRect.top >= 0 ? 0 : -scrollContainerRect.top,
            containerRef.current.scrollWidth,
            windowHeight - scrollContainerRect.top > windowHeight ? windowHeight : windowHeight - scrollContainerRect.top
        );

        const {
            visibleCellIndices,
            paddingTop,
            paddingBottom
        } = calcProjection(
            visibleRect,
            props.items.length,
            itemRectCache.current,
            props.itemVerticalSpacing
        );

        setProjection(new Projection(
            visibleCellIndices, 
            paddingTop, 
            paddingBottom,
            windowScrollY // used to restore scroll position.
        ));
    };

    function renderItem(itemDescriptor, i) {
        return (
            <ItemComponent
                ref={(ref) => {
                    console.log('>>>', ref);
                    if (ref === null) {
                        return;
                    }

                    const prevItemRect = itemRectCache.current[i] || null;
                    const curItemRect = getComponentRect(ref);

                    if (prevItemRect === null || (prevItemRect.height !== curItemRect.height)) {
                        // 1. if cache does not reflect the real height of i th item,
                        foundItemHeightInconsistency.current = true;
                    }

                    itemRectCache.current[i] = curItemRect;

                    const shouldRecalcProjection =
                        i === projection.visibleItemIndices[projection.visibleItemIndices.length - 1]
                        && foundItemHeightInconsistency.current === true;

                    if (shouldRecalcProjection === true) {
                        // 2. calc projection -> rendering
                        recalcAndSetProjection();
                        foundItemHeightInconsistency.current = false;
                    }
                }}
                key={i}
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
            className={classes.container}
            style={{
                paddingTop: containerPaddingTop,
                paddingBottom: containerPaddingBottom
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
