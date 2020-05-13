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

function calcLayout(visibleRect, numOfItems, itemHeightCache, windowHeight) {
    const visibleRectY = visibleRect.y;
    const visibleRectMaxY = visibleRect.y + visibleRect.height;
    const invisibleRenderingHeight = windowHeight === null ? 300 : windowHeight / 2;

    const visibleCellIndices = [];
    
    let containerPaddingTop = 0;
    let containerPaddingBottom = 0;

    let curY = 0

    for (let i = 0; i < numOfItems; i++) {
        const cellHeight = itemHeightCache[i] || ESTIMATED_CELL_HEIGHT;

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

export default function VirtualizedScroller(props) {
    const classes = useStyles(props);
    const {items, itemComponent} = props;
    const [scrollState, setScrollState] = useState(null);

    const containerRef = useRef(null);
    const containerTopMargin = useRef(null);
    const itemHeightCache = useRef(new Array(props.items.length));

    const ItemComponent = itemComponent;

    useEffect(() => {
        const scrollEventHandler = () => {
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
        };

        window.addEventListener('scroll', scrollEventHandler);
        
        return () => {
            window.removeEventListener('scroll', scrollEventHandler);
        }
    }, []);

    const visibleRect = new Rect(
        0, 
        scrollState === null ? 0 : scrollState.windowScrollY,
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

    return (
        <div 
            ref={(ref) => {
                if (containerRef.current !== null) {
                    return;
                }
                
                const topMargin = ref.getBoundingClientRect().top;

                containerRef.current = ref;
                containerTopMargin.current = topMargin;

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
            }}
            className={classes.container}
            style={{
                paddingTop: containerPaddingTop,
                paddingBottom: containerPaddingBottom,
            }}
        >
            {items.map((item, i) => {
                if (visibleCellIndices.includes(i) === true) {

                    const curItemId = item.id;

                    if (items.filter(e => e.id === curItemId).length > 1) {
                        console.log('\n\n=========================== multiple posts with same ID!!! ===========================\n\n');
                    }

                    return (
                        <ItemComponent 
                            ref={(ref) => {
                                if (ref === null) {
                                    return;
                                }
                                
                                itemHeightCache.current[i] = ref.clientHeight;
                            }}
                            key={item.id}
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
