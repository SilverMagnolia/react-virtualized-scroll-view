import React, {useEffect, useState, useRef, forwardRef} from 'react';
import {
    Container,
    Card,
    makeStyles
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import UnsplashAPIService from './UnsplashAPIService';
import VirtualizedScroller from './VirtualScroller';

function ImageInfo(rawInfo) {
    this.id = rawInfo.id;
    this.likes = rawInfo.likes;
    this.url = rawInfo.urls.regular;
    this.updatedAt = rawInfo.updated_at;
}

const useStyles = makeStyles({
    container: {
        paddingTop: 32,
        paddingBottom: 32,
    },
    img: {
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        padding: 50,
        boxSizing: 'border-box'
    },
});

export default function (props) {
    const classes = useStyles();
    const [state, setState] = useState({
        page: 1,
        list: []
    })

    useEffect(() => {
        requestList();
    }, []);

    async function requestList() {
        try {
            const resultList = (await UnsplashAPIService.getImageList(state.page)).map(e => new ImageInfo(e));
            const resultList1 = (await UnsplashAPIService.getImageList(2)).map(e => new ImageInfo(e));
            const resultList2 = (await UnsplashAPIService.getImageList(3)).map(e => new ImageInfo(e));
            const resultList3 = (await UnsplashAPIService.getImageList(4)).map(e => new ImageInfo(e));
            const resultList4 = (await UnsplashAPIService.getImageList(5)).map(e => new ImageInfo(e));
            
            console.log('received > ', resultList[0]);

            setState({
                page: state.page + 1,
                list: state.list.concat(resultList.concat(resultList1).concat(resultList2).concat(resultList3).concat(resultList4))
            })

        } catch (err) {
            alert(err.message);
        }
    } 

    return (
        <Container maxWidth='sm' className={classes.container}>
            <VirtualizedScroller 
                items={state.list}
                itemComponent={ImageItem}
                itemVerticalSpacing={16}
                onDismiss={() => {}}
            />
        </Container>
    );
}

const ImageItem = forwardRef((props, ref) => {
    const classes = useStyles();
    const {descriptor} = props;
    
    return (
        <Card raised={true} ref={ref}>
            <img src={descriptor.url} className={classes.img} />
        </Card>
    );
});

// const ImageItem = (props) => {
//     const classes = useStyles();
//     const {descriptor} = props;
    
//     return (
//         <Card raised={true}>
//             <img src={descriptor.url} className={classes.img} />
//         </Card>
//     );
// };