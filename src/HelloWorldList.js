import React, {forwardRef} from 'react';
import VirtualizedScroller from './VirtualizedScroller';
import {makeStyles} from '@material-ui/core';
import { useHistory } from 'react-router-dom';

const items = (() => {
    const numOfArr = 500;
    const dataSource = new Array(numOfArr);
    for (let i = 0; i < numOfArr; i++) {
        dataSource[i] = {
            title: `Hello World (${i})`,
            index: i,
        };
    }
    return dataSource;
})();

export default function HelloWorldList(props) {
    return (
        <VirtualizedScroller 
            items={items}
            itemComponent={Cell}
        />
    );
}

const useCellStyels = makeStyles({
    cellWrapper: {
        borderBottom: '1px solid #333',
        color: 'black',
        fontSize: 18,
        minHeight: 50,

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
});
  
const Cell = forwardRef(function (props, ref) {
    const history = useHistory();
    const classes = useCellStyels();
    const {descriptor} = props;
    return(
        <div 
            className={classes.cellWrapper} 
            ref={ref}
            onClick={() => history.push(`/hello-world/${descriptor.index}`)}
        >
            {descriptor.title}
        </div>
    );
});