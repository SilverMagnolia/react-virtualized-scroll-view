import React, {forwardRef} from 'react';
import VirtualizedScroller from './VirtualizedScroller';
import {makeStyles} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import {testStringArr} from './TestData';

const items = (() => {    
    const numOfArr = 1000;
    const dataSource = new Array(numOfArr);
    for (let i = 0; i < numOfArr; i++) {
        dataSource[i] = {
            title: `Hello World (${i})`,
            desc: testStringArr[Math.floor(Math.random() * testStringArr.length)],
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
        padding: 16,

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    desc: {
        marginTop: 16,
        width: '100%',
        backgroundColor: 'gray',
        color: 'white',
        fontSize: '1rem',

        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: "break-word"
    }
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
            <div className={classes.desc}>
                {descriptor.desc}
            </div>
        </div>
    );
});