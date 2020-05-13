import React, {useEffect, useState, useRef} from 'react';
import {makeStyles} from '@material-ui/core';
import PropTypes, { elementType } from 'prop-types';

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

function calcLayout(visibleRect, numOfItems, itemHeightCache, windowHeight) {
    const visibleRectY = visibleRect.y;
    const visibleRectMaxY = visibleRect.y + visibleRect.height;
    const invisibleRenderingHeight = windowHeight === null ? 300 : windowHeight / 2;

    const visibleCellIndices = [];
    
    let containerPaddingTop = 0;
    let containerPaddingBottom = 0;

    // console.log('======================')
    // console.info('🤡 visibleRect: ', `y: ${visibleRect.y}, maxY: ${visibleRect.y + visibleRect.height} `);

    let curY = 0

    for (let i = 0; i < numOfItems; i++) {
        const cellHeight = itemHeightCache[i] || ESTIMATED_CELL_HEIGHT;

        const ithCellY = curY;
        const ithCellMaxY = ithCellY + cellHeight;

        // console.info('🤢', ithCellYPos);
        // console.info('🦊', ithCellMaxY);
        
        if (
            ithCellY <= (visibleRectMaxY + invisibleRenderingHeight)
            && ithCellMaxY >= (visibleRectY - invisibleRenderingHeight)
        ) {
            // console.log(`${i}) height: ${cellHeight}`);
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

export default function VirtualizedScroller(props) {
    const classes = useStyles(props);
    const {items, itemComponent} = props;
    // const [itemHeightArr, setItemHeightArr] = useState(new Array(props.items.length));
    const [scrollState, setScrollState] = useState(null);

    const containerRef = useRef(null);
    const containerTopMargin = useRef(null);
    const itemRefs = useRef(new Array(props.items.length));
    const itemHeightCache = useRef(new Array(props.items.length));

    // const contentHeight = props.items.length * 51;
    const ItemComponent = itemComponent;

    useEffect(() => {
        const eventListener1 = window.addEventListener('scroll', () => {
            setScrollState({
                windowHeight: window.innerHeight,
                windowScrollY: window.scrollY,
                containerScrollHeight: containerRef.current.scrollHeight,
                containerOffsetTop: containerRef.current.getBoundingClientRect().top,
            });
        })

        return () => {
            window.removeEventListener('scroll', eventListener1);
        }
    }, []);
    
    const visibleRect = new Rect(
        0, 
        (scrollState && scrollState.windowScrollY) || 0,
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
        itemHeightCache.current, 
        scrollState === null ? null : scrollState.windowHeight
    );
    
    console.log(visibleCellIndices);

    return (
        <div 
            ref={(ref) => {
                if (containerRef.current !== null) {
                    return;
                }
                
                const topMargin = ref.getBoundingClientRect().top;

                containerRef.current = ref;
                containerTopMargin.current = topMargin;

                setScrollState({
                    windowHeight: window.innerHeight,
                    windowScrollY: window.scrollY,
                    containerScrollHeight: ref.scrollHeight,
                    containerOffsetTop: topMargin,
                });
            }}
            className={classes.container}
            style={{
                paddingTop: containerPaddingTop,
                paddingBottom: containerPaddingBottom,
            }}
        >
            {items.map((item, i) => {
                if (visibleCellIndices.includes(i) === true) {
                    return (
                        <ItemComponent 
                            ref={(ref) => {
                                if (ref === null) {
                                    return;
                                }
                                
                                itemRefs.current[i] = ref;
                                itemHeightCache.current[i] = ref.clientHeight;
                            }}
                            key={i}
                            descriptor={item}
                        />
                    );
                } else {
                    return null;
                }
            })}
        </div>
    );
}
