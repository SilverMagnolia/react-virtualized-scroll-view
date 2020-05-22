import React, {forwardRef, useEffect, useState} from 'react';
import VirtualizedScroller from './VirtualizedScroller';
import {
    makeStyles, 
    Container,
    Tabs,
    Tab
} from '@material-ui/core';
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

let state1 = null;
let state2 = null;
let state3 = null;

let isLoading = false;

let trendingRestorationInfo = null;
let followingRestorationInfo = null;
let freshRestorationInfo = null;
let lastTabIndex = 0;

function PostListState(list, offset, hasMore) {
    this.list = list;
    this.offset = offset;
    this.hasMore = hasMore;
}

export default function HelloWorldList(props) {
    const [tabIndex, setTabIndex] = useState(lastTabIndex);

    const [trendingState, setTrendingState] = useState(state1 || new PostListState([], 0, true));
    const [followingState, setFollowingState] = useState(state2 || new PostListState([], 0, true));
    const [freshState, setFreshState] = useState(state3 || new PostListState([], 0, true));
    const [showSomething, setShowSomething] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            // setShowSomething(true);
        }, 2000);
    }, []);

    useEffect(() => {
        // console.log(`🌈 window.srollY: ${window.scrollY} / window.innerHeight: ${window.innerHeight}`)
        // console.log('🌈 body.height ', document.body.clientHeight);
        lastTabIndex = tabIndex;

        if (tabIndex === 0 && trendingState.list.length === 0) {
            fetchTrending(0);
        } else if (tabIndex === 1 && followingState.list.length === 0) {
            fetchFollowing(0);
        } else if (tabIndex === 2 && freshState.list.length === 0) {
            fetchFresh(0);
        }
        
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabIndex]);


    async function fetchFresh(offset) {
        if (isLoading === true) {
            return;
        }

        isLoading = true;

        const num = 10;

        console.info('👅 fetch fresh: ', offset);
        
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
            const newState = new PostListState(
                freshState.list.concat(data.list),
                offset += num,
                data.list.length >= num    
            );
            state3 = newState;
            // console.info('👅 setPostList: ', gPostList.length);
            setFreshState(newState);
            isLoading = false;
        })
        .catch((error) => {
            console.error('Error:', error);
            isLoading = false;
        });
    }

    async function fetchFollowing(offset) {
        if (isLoading === true) {
            return;
        }

        isLoading = true;

        const num = 10;

        console.info('🌈 fetch following: ', offset);
        
        fetch(`https://www.mogao.io/api/posts/follow/${offset}/${num}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'fb901f32-89d3-4dcd-b376-5845143486b2'
            },
            body: null,
        })
        .then(response => response.json())
        .then(data => {
            const newState = new PostListState(
                followingState.list.concat(data.list),
                offset += num,
                data.list.length >= num    
            );
            state2 = newState;
            // console.info('👅 setPostList: ', gPostList.length);
            setFollowingState(newState);
            isLoading = false;
        })
        .catch((error) => {
            console.error('Error:', error);
            isLoading = false;
        });
    }

    async function fetchTrending(offset) {
        if (isLoading === true) {
            return;
        }

        isLoading = true;

        const num = 10;

        console.info('🍀 fetch trending: ', offset);
        
        fetch(`https://www.mogao.io/api/posts/trending/${offset}/${num}`, {
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: null,
        })
        .then(response => response.json())
        .then(data => {
            const newState = new PostListState(
                trendingState.list.concat(data.list),
                offset += num,
                data.list.length >= num    
            );
            state1 = newState;
            // console.info('👅 setPostList: ', gPostList.length);
            setTrendingState(newState);
            isLoading = false;
        })
        .catch((error) => {
            console.error('Error:', error);
            isLoading = false;
        });
    }

    
    return (
        <Container maxWidth='sm'>
            <MogaoTabBar
                selectedIndex={tabIndex}
                onChange={(newValue) => setTabIndex(newValue)}
                items={['TRENDING', 'FOLLOWING', 'FRESH']}
            />

            {tabIndex === 0 && 
                <>
                <div style={{width: '100%', height: 50, backgroundColor: 'blue'}} />
                <div style={{width: '100%', height: 100, backgroundColor: 'red'}} />
                {showSomething === true && 
                    <div style={{width: '100%', height: 100, backgroundColor: 'red'}} />
                }   
                <InfiniteFeedList 
                    list={trendingState.list}
                    hasMore={trendingState.hasMore}
                    fetchFn={() => fetchTrending(trendingState.offset)}
                    onDismiss={(restorationInfo) => trendingRestorationInfo = restorationInfo}
                    scrollRestorationInfo={trendingRestorationInfo}
                    name='trending'
                />
                </>
            }

            {tabIndex === 1 && 
                <>
                {/* <div style={{width: '100%', height: 70, backgroundColor: 'blue'}} /> */}
                <InfiniteFeedList 
                    list={followingState.list}
                    hasMore={followingState.hasMore}
                    fetchFn={() => fetchFollowing(followingState.offset)}
                    onDismiss={(restorationInfo) => followingRestorationInfo = restorationInfo}
                    scrollRestorationInfo={followingRestorationInfo}
                    name='following'
                />
                </>
            }
            
            {tabIndex === 2 && 
                <InfiniteFeedList 
                    list={freshState.list}
                    hasMore={freshState.hasMore}
                    fetchFn={() => fetchFresh(freshState.offset)}
                    onDismiss={(restorationInfo) => freshRestorationInfo = restorationInfo}
                    scrollRestorationInfo={freshRestorationInfo}
                    name='following'
                />
            }
        </Container>
    );
}

function InfiniteFeedList(props) {
    const {list, hasMore, fetchFn} = props;
    
    return (
        <InfiniteScroll
            dataLength={list.length}
            next={fetchFn}
            hasMore={hasMore}
            scrollThreshold={0.9}
            loader={<div>Loading...</div>}
        >
            <VirtualizedScroller 
                items={list}
                itemComponent={Cell}
                itemVerticalSpacing={8}
                onDismiss={props.onDismiss}
                scrollRestorationInfo={props.scrollRestorationInfo}
                name={props.name}
            />
        </InfiniteScroll>
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
        alignItems: 'center',
        marginTop: 8
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


const useTabBarStyles = makeStyles(theme => ({
    tabbar: {
        width: '100%',
        backgroundColor: 'white',
        borderBottom: '2px solid black',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 100
    },
    tabText: {
        color: theme.mainTextColor,
        fontSize: 14,
        fontWeight: 'bold'
    },
}));

function MogaoTabBar(props) {
    const classes = useTabBarStyles();
    return (
        <Tabs
            value={props.selectedIndex}
            className={classes.tabbar}
            variant={props.variant ?? 'fullWidth'}
            scrollButtons="off"
            onChange={(_, newValue) => props.onChange(newValue)}
        >
            {props.items.map((tab, index) =>
                <Tab label={tab} className={classes.tabText} key={index} />
            )}
        </Tabs>
    );
}