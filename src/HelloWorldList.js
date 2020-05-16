import React, {forwardRef, useEffect, useState} from 'react';
import VirtualizedScroller from './VirtualizedScroller';
import {makeStyles, Container} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';

const PostDescriptionElementType = {
    plainText: 'plain-text',
    image: 'image',
    linkPreview: 'link',
    gif: 'gif',
    youtube: 'youtube',

    inlineMention: 'inline-mention',
    inlineLink: 'inline-link',
};

let gPostList = [];
let offset = 0;
let isLoading = false;

export default function HelloWorldList(props) {
    const [postList, setPostList] = useState(gPostList);
    useEffect(() => {
        if (postList.length > 0) {
            return;
        }

        fetchPostList(offset);
    }, []);

    async function fetchPostList() {
        if (isLoading === true) {
            return;
        }

        isLoading = true;

        const num = 15;

        // console.info('🍀 fetch: ', offset);

        fetch(`https://www.mogao.io/api/posts/latest/${offset}/${num}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: null,
        })
        .then(response => response.json())
        .then(data => {
            gPostList = postList.concat(data.list);
            offset += num;
            // console.info('👅 setPostList: ', gPostList.length);
            setPostList(gPostList);
            isLoading = false;
        })
        .catch((error) => {
            console.error('Error:', error);
            isLoading = false;
        });
    }

    return (
        <Container maxWidth='sm'>
            <InfiniteScroll
                dataLength={postList.length}
                next={fetchPostList}
                hasMore={true}
                scrollThreshold={0.9}
            >
                <VirtualizedScroller 
                    items={postList}
                    itemComponent={Cell}
                />
            </InfiniteScroll>
        </Container>
    );
}

const useCellStyels = makeStyles({
    cellWrapper: {
        // borderBottom: '1px solid #333',
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
        fontSize: '1.1rem',

        wordBreak: 'break-word',
        overflowWrap: "break-word",
        lineHeight: 1.5,

        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: 'normal',
        display: "-webkit-box",
        "-webkit-box-orient": "vertical",
        "-webkit-line-clamp": 4,
    },
});
  
const Cell = forwardRef(function (props, ref) {
    const history = useHistory(props);
    const classes = useCellStyels();
    const {descriptor} = props;

    const parseResult = mogaoParse(descriptor.description || '');
    const imageInfo = parseResult.images !== null && parseResult.images.length > 0 ? parseResult.images[0] : null;

    return(
        <div 
            className={classes.cellWrapper} 
            ref={ref}
            onClick={() => history.push(`/hello-world/${descriptor.index}`)}
        >
            {descriptor.title}
            {parseResult.plainText.length > 0 && 
                <div className={classes.desc}>
                    {parseResult.plainText}
                </div>   
            }
            {imageInfo !== null &&
                <MogaoImage imageInfo={imageInfo} />
            }
        </div>
    );
});

const useMogaoImageStyles = makeStyles({
    imgWrapper: (props) => ({
        width: '100%',
        paddingTop: `${props.imageInfo.ratio.height / props.imageInfo.ratio.width * 100}%`,
        overflow: 'hidden',
        position: 'relative'
    }),
    img: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    }
});

function MogaoImage(props) {
    const classes = useMogaoImageStyles(props);
    const {imageInfo} = props;
    const [src, setSrc] = useState(null);

    useEffect(() => {
        fetchImage();
    }, []);

    async function fetchImage() {
        fetch(`https://www.mogao.io/api/files/${imageInfo.id}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: null,
        })
        .then(response => response.json())
        .then(data => {
            const imageUrl = 'https://www.mogao.io'+data.data.info.imageNames.md;
            setSrc(imageUrl);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    return (
        <div className={classes.imgWrapper}>
            {src !== null && 
                <img src={src} alt='thumbnail' className={classes.img} />
            }
        </div>
    );
}


function mogaoParse(rawString, mentionUserList) {
    // invariant(typeof rawString === 'string', `[mogaoParseForSimpleViewer] Invalid type of rawString: ${typeof rawString}`);
    let parseResult = mogaoParseBase(rawString);

    // plain text, inline mention, inline url 엘리먼트 하나의 스트링으로 합치기
    const plainText = parseResult
        .filter(elem => {
            switch (elem.type) {
                case PostDescriptionElementType.plainText:
                case PostDescriptionElementType.inlineMention:
                case PostDescriptionElementType.inlineLink:
                    return true;
                default:
                    return false;
            }
        })
        .map(elem => {
            if (elem.type === PostDescriptionElementType.plainText) {
                return elem.text;
            } else if (elem.type === PostDescriptionElementType.inlineLink) {
                return elem.url;
            } else /* elem.type === inlineMention */{
                if (mentionUserList !== null && mentionUserList !== undefined && Array.isArray(mentionUserList) === true) {
                    const latestUserInfo = mentionUserList.filter(mentionUser => mentionUser.id === elem.id)[0];
                    if (latestUserInfo !== null && latestUserInfo !== undefined) {
                        return `@${latestUserInfo.username}`;
                    } else {
                        return '@'+elem.username;    
                    }
                } else {
                    return '@'+elem.username;
                }
            }
        })
        .join('');
    
    // 이미지 > 링크(유튜브) > gif 우선순위로 보여줌.
    const imageElems = [];
    let gifElem;
    let linkPreviewElem;
    let youtubeElem;

    for (let i = 0; i < parseResult.length; i++) {
        if (parseResult[i].type === PostDescriptionElementType.image) {
            imageElems.push(parseResult[i]);
        } else if (parseResult[i].type === PostDescriptionElementType.linkPreview) {
            linkPreviewElem = parseResult[i].preview;
        } else if (parseResult[i].type === PostDescriptionElementType.gif) {
            gifElem = parseResult[i];
        } else if (parseResult[i].type === PostDescriptionElementType.youtube) {
            youtubeElem = parseResult[i];
        }   
    }
    
    const ret = {plainText, images: null, linkPreview: null, gifInfo: null};

    if (imageElems.length > 0) {
        ret.images = imageElems;
    } else if (linkPreviewElem !== null && linkPreviewElem !== undefined) {
        ret.linkPreview = linkPreviewElem;
    } else if (youtubeElem !== null && youtubeElem !== undefined) {
        const youtubeLinkPreview = {
            image: youtubeElem.thumbnail,
            title: youtubeElem.channelTitle,
            url: youtubeElem.url,
            description: youtubeElem.title
        };
        ret.linkPreview = youtubeLinkPreview;
    } else if (gifElem !== null && gifElem !== undefined) {
        ret.gifInfo = gifElem;
    }

    return ret;
};

const REGULAR_PREFIX =  /\[\^0\^=>/;
const REGULAR_POSTFIX =  /<=\^0\^\]/;

function mogaoParseBase(origin) {
    // invariant(typeof origin === 'string', '[Mogao parse error] Invalid type of origin. It must be a string.');

    function splitComponentAndPlainText( org, out ) {
        let parts = org.split(REGULAR_POSTFIX);
        out.push( JSON.parse(parts[0]) );
        if( parts.length === 2 )
        	addPlainText(parts[1], out);
    }

    function addPlainText(text, out) {
        if( !text ) return ;
    	out.push(  {
    		type : PostDescriptionElementType.plainText,
    		text : text
    	});
    }

    let result = [];

    const strings = origin.split(REGULAR_PREFIX);

    if( strings.length === 0 )
        return result;

    // first sentence is start plain text or not
    if( strings[0].match(REGULAR_POSTFIX) )
        splitComponentAndPlainText(strings[0], result);
    else
        addPlainText(strings[0], result);

    // from second sentence, it compose to mogao text componet and planin text
    for(let i = 1; 	i < strings.length; 	++i )
        splitComponentAndPlainText(strings[i], result);

    return result;
}