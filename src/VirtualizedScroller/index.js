import React, {useEffect, useState, useRef} from 'react';
import {makeStyles} from '@material-ui/core';
import PropTypes, { elementType } from 'prop-types';
import _ from 'lodash';

VirtualizedScroller.propTypes ={
    items: PropTypes.array.isRequired,
    itemComponent: elementType.isRequired,
};

const useStyles = makeStyles({
    container: (props) => ({
        ...(typeof props.containerInset === 'object' 
        ? {
            paddingTop: props.containerInset.top, 
            paddingLeft: props.containerInset.left, 
            paddingRight: props.containerInset.right, 
            paddingBottom: props.containerInset.bottom
        } : {}),
    })
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

    // const itemRectsAboveLastVisibleItem = itemRectCache.slice(0, visibleCellIndices[visibleCellIndices.length - 1] + 1);

    // const sumOfDirtyHeightOnTopItems = itemRectsAboveLastVisibleItem
    //     .filter(i => i.dirtyHeight !== null)
    //     .map(i => i.dirtyHeight)
    //     .reduce((total, n) => n + total, 0);
    
    // console.info('🦊', sumOfDirtyHeightOnTopItems);
    // containerPaddingBottom -= sumOfDirtyHeightOnTopItems;

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

// function RestorationInfo(itemRects, visibleIndices) {
//     this.itemRects = itemRects;
//     this.visibleIndices = visibleIndices;
// }

function Projection(visibleItemIndices, beforePadder, afterPadder) {
    this.visibleItemIndices = visibleItemIndices;
    this.beforePadder = beforePadder;
    this.afterPadder = afterPadder;
}

export default function VirtualizedScroller(props) {
    const classes = useStyles(props);
    const {items, itemComponent} = props;

    const [scrollState, setScrollState] = useState(null);
    const [projection, setProjection] = useState(null);

    const containerRef = useRef(null);
    const containerTopMargin = useRef(null);
    const itemRectCache = useRef([]);
    
    const isResizing = useRef(false);

    // const curVisibleCellIndices = useRef(null);
    // const itemHeightCache = useRef(new Array(props.items.length));

    const ItemComponent = itemComponent;

    useEffect(() => {
        const scrollEventHandler = () => {
            if (isResizing.current === true) {
                return;
            }
            // console.log('scroll')
            handleScrollEvent();
        };

        window.addEventListener('scroll', scrollEventHandler);
        return () => window.removeEventListener('scroll', scrollEventHandler);
    }, []);

    useEffect(() => {
        let timer = null;
        const resizeEventHandler = () => {
            if (timer !== null) {
                clearTimeout(timer);
            }

            isResizing.current = true;
            // console.log('resize')

            timer = setTimeout(() => {
                // console.log('🦊 end resizing')
                isResizing.current = false;
                handleScrollEvent();
            }, 300);
        }

        window.addEventListener('resize', resizeEventHandler);
        return () => window.removeEventListener('resize', resizeEventHandler);
    }, []);

    function handleScrollEvent() {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const windowScrollY = window.scrollY;
        const containerScrollWidth = containerRef.current.scrollWidth;
        const containerScrollHeight = containerRef.current.scrollHeight;
        const containerOffsetTop = containerRef.current.getBoundingClientRect().top;

        setScrollState({
            windowHeight,
            windowWidth,
            windowScrollY,
            containerScrollWidth,
            containerScrollHeight,
            containerOffsetTop,
        });
    }

    // const visibleRect = new Rect(
    //     0, 
    //     scrollState === null ? 0 : scrollState.windowScrollY,
    //     window.innerWidth,
    //     window.innerHeight
    // );

    // const {
    //     visibleCellIndices, 
    //     containerPaddingTop, 
    //     containerPaddingBottom
    // } = calcLayout(
    //     visibleRect, 
    //     props.items.length, 
    //     itemRectCache.current, 
    //     scrollState === null ? null : scrollState.windowHeight
    // );
    
    console.info('😈 render - item rect cache: ', [...itemRectCache.current]);
    
    function renderItem(itemDescriptor, i) {
        return (
            <ItemComponent 
                ref={(ref) => {
                    if (ref === null) {
                        return;
                    }
                    // console.log(`🦊get ref: ${i}`);
                    const curItemRect = getComponentRect(ref);
                    const prevItemRect = itemRectCache.current[i];

                    itemRectCache.current[i] = curItemRect;

                    if (
                        prevItemRect !== undefined && prevItemRect !== null 
                        && prevItemRect.height !== curItemRect.height
                        && Math.abs(curItemRect.height - prevItemRect.height) > 10
                    ) {
                        // 불일치
                        // console.log(`🤡 ${i}) found inconsistency: ${curItemRect.height - prevItemRect.height}`);
                        // handleScrollEvent();
                        // document.getElementById('virtualized-scroller-root').style.transform = `translateY(${-(curItemRect.height - prevItemRect.height)}px)`;
                        // document.getElementById('virtualized-scroller-content').style.paddingTop += (curItemRect.height - prevItemRect.height);
                    } else {
                        // document.getElementById('virtualized-scroller-root').style.transform = null;
                    }

                    console.info(`${i}th item loaded: ` , [...itemRectCache.current]);

                    // if (i === visibleCellIndices[visibleCellIndices.length - 1]) {
                    //     // check inconsistency. how?
                    //     // 
                    //     console.log('🍀 finished rendering items!!!!')
                    // }
                }}
                key={itemDescriptor.id}
                descriptor={itemDescriptor}
            />
        )
    }

    return (
        <div 
            id='virtualized-scroller-root'
            style={{border: '1px solid #f00'}}
        >
            <div 
                id='virtualized-scroller-content'
                ref={(ref) => {
                    
                    if (containerRef.current !== null) {
                        return;
                    }
                    
                    const topMargin = ref.getBoundingClientRect().top;
                    containerRef.current = ref;
                    containerTopMargin.current = topMargin;
                    // console.log('🤢get container ref');
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
                        if (i >= 0 && i < 10) {
                            return renderItem(item, i);
                        } else {
                            return null;
                        }
                    } else {
                        if (projection.visibleItemIndices.includes(i) === true) {
                            return renderItem(item, i);
                        } else {
                            return null;
                        }
                    }
                })}
            </div>
        </div>
    );
}
