import React, {useEffect, useState, useRef} from 'react';
import {makeStyles} from '@material-ui/core';
import PropTypes, { elementType } from 'prop-types';
import _ from 'lodash';

VirtualizedScroller.propTypes ={
    items: PropTypes.array.isRequired,
    itemComponent: elementType.isRequired,
};

const useStyles = makeStyles({
    container: {}
});

function Rect(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
}

const ESTIMATED_CELL_HEIGHT = 100;

function calcLayout(visibleRect, numOfItems, itemRectCache, windowHeight) {
    const visibleRectY = visibleRect.y;
    const visibleRectMaxY = visibleRect.y + visibleRect.height;
    const invisibleRenderingHeight = windowHeight === null ? 300 : windowHeight / 2;

    const visibleCellIndices = [];
    
    let containerPaddingTop = 0;
    let containerPaddingBottom = 0;

    let curY = 0

    for (let i = 0; i < numOfItems; i++) {
        const cellHeight = (itemRectCache[i] === undefined || itemRectCache[i] === null) 
            ? ESTIMATED_CELL_HEIGHT 
            : itemRectCache[i].height;

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

function RestorationInfo(projection, itemRectCache) {
    this.projection = projection;
    this.itemRectCache = itemRectCache;
}

function Projection(visibleItemIndices, beforePadder, afterPadder) {
    this.visibleItemIndices = visibleItemIndices;
    this.beforePadder = beforePadder;
    this.afterPadder = afterPadder;
}

function calcLayoutWithEstimatedHeightAtInit(numOfItems) {
    const visibleRectMaxY = window.innerHeight;
    const visibleItemIndices = [];
    
    let containerPaddingTop = 0;
    let containerPaddingBottom = 0;

    let curY = 0

    for (let i = 0; i < numOfItems; i++) {

        if (curY <= visibleRectMaxY) {
            visibleItemIndices.push(i);
        } else {
            containerPaddingBottom += ESTIMATED_CELL_HEIGHT;
        }

        curY += ESTIMATED_CELL_HEIGHT;
    }    
    return {visibleItemIndices, containerPaddingTop, containerPaddingBottom};
}

let findInconsistency = false;
let restorationCache = null;

export default function VirtualizedScroller(props) {
    const classes = useStyles(props);
    const {items, itemComponent} = props;

    const [projection, setProjection] = useState(restorationCache === null ? null : restorationCache.projection);

    const containerRef = useRef(null);
    const containerTopMargin = useRef(null);
    const itemRectCache = useRef((() => {
        if (restorationCache === null) {
            const arr = new Array(props.items.length);
            return arr.map((_, i) => new Rect(0, i * ESTIMATED_CELL_HEIGHT, window.innerWidth, ESTIMATED_CELL_HEIGHT));
        } else {
            return restorationCache.itemRectCache;
        }
    })());
    const itemRefs = useRef(new Array(props.items.length));
    const isResizing = useRef(false);

    const ItemComponent = itemComponent;

    useEffect(() => {
        return () => {
            const haha = new RestorationInfo(
                projection, 
                [...itemRectCache.current]
            );
            restorationCache = haha;
        }
    }, [projection]);

    useEffect(() => {
        const scrollEventHandler = () => {
            if (isResizing.current === true) {
                return;
            }
            
            handleScrollEvent();
        };

        window.addEventListener('scroll', scrollEventHandler);
        return () => window.removeEventListener('scroll', scrollEventHandler);
    }, [projection]);

    // useEffect(() => {
    //     let timer = null;
    //     const resizeEventHandler = () => {
    //         if (timer !== null) {
    //             clearTimeout(timer);
    //         }

    //         isResizing.current = true;

    //         timer = setTimeout(() => {
    //             isResizing.current = false;
    //             handleScrollEvent();
    //         }, 300);
    //     }

    //     window.addEventListener('resize', resizeEventHandler);
    //     return () => window.removeEventListener('resize', resizeEventHandler);
    // }, []);

    function handleScrollEvent() {
        if (projection === null) {
            return;
        }

        const windowHeight = window.innerHeight;
        // const windowWidth = window.innerWidth;
        const windowScrollY = window.scrollY;
        // const containerScrollWidth = containerRef.current.scrollWidth;
        // const containerScrollHeight = containerRef.current.scrollHeight;
        // const containerOffsetTop = containerRef.current.getBoundingClientRect().top;

        const visibleRect = new Rect(
            0, 
            windowScrollY,
            window.innerWidth,
            window.innerHeight
        );
    
        const {
            visibleCellIndices, 
            containerPaddingTop, 
            containerPaddingBottom
        } = calcLayout(
            visibleRect, 
            props.items.length, 
            itemRectCache.current, 
            windowHeight
        );

        setProjection(new Projection(visibleCellIndices, containerPaddingTop, containerPaddingBottom));
    }

    function renderItem(itemDescriptor, i, lastVisibleItemIndex) {
        return (
            <ItemComponent 
                ref={(ref) => {
                    if (ref === null) {
                        return;
                    }

                    itemRefs.current[i] = ref;
                    const curItemRect = getComponentRect(ref);
                    

                    if (
                        (itemRectCache.current[i] === null || itemRectCache.current[i] === undefined)
                    ) {
                        findInconsistency = true;
                    } else {
                        const prevHeight = itemRectCache.current[i].height;
                        const curHeight = curItemRect.height;

                        if (Math.abs(curHeight - prevHeight) >= 10) {
                            findInconsistency = true;
                        }
                    }

                    itemRectCache.current[i] = curItemRect;

                    if (lastVisibleItemIndex === i && findInconsistency) {
                        findInconsistency = false;
                        const windowScrollY = window.scrollY;
                        const windowHeight = window.innerHeight;

                        const visibleRect = new Rect(
                            0, 
                            windowScrollY,
                            window.innerWidth,
                            window.innerHeight
                        );
                    
                        const {
                            visibleCellIndices, 
                            containerPaddingTop, 
                            containerPaddingBottom
                        } = calcLayout(
                            visibleRect, 
                            props.items.length, 
                            itemRectCache.current, 
                            windowHeight
                        );

                        setProjection(new Projection(visibleCellIndices, containerPaddingTop, containerPaddingBottom));
                    }
                }}
                key={itemDescriptor.id}
                descriptor={itemDescriptor}
            />
        )
    }

    return (
        <div 
            ref={(ref) => {
                
                if (containerRef.current !== null) {
                    return;
                }
                
                const topMargin = ref.getBoundingClientRect().top;
                containerRef.current = ref;
                containerTopMargin.current = topMargin;
                handleScrollEvent();
            }}
            className={classes.container}
            style={{
                paddingTop: projection === null ? 0 : projection.beforePadder,
                paddingBottom: projection === null ? 0 : projection.afterPadder,
            }}
        >
            {items.map((item, i) => {
                if (projection === null) {
                    const {visibleItemIndices} = calcLayoutWithEstimatedHeightAtInit(props.items.length);
                    if (visibleItemIndices.includes(i) === true) {
                        return renderItem(item, i, visibleItemIndices[visibleItemIndices.length - 1]);
                    } else {
                        return null;
                    }

                } else {
                    if (projection.visibleItemIndices.includes(i) === true) {
                        return renderItem(item, i, projection.visibleItemIndices[projection.visibleItemIndices.length - 1]);
                    } else {
                        return null;
                    }
                }
            })}
        </div>
    );
}
