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
        // '& > *': {
        //     marginBottom: 16
        // }
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
            const resultList = await UnsplashAPIService.getImageList(state.page);
            console.log('received > ', resultList[0]);

            setState({
                page: state.page + 1,
                list: state.list.concat(resultList.map(e => new ImageInfo(e)))
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

const ImageItem = (props) => {
    const classes = useStyles();
    const {descriptor} = props;
    
    return (
        <Card raised={true}>
            <img src={descriptor.url} className={classes.img} />
        </Card>
    );
};