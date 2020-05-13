import React from 'react';

export default function HelloWorldPage(props) {
    const {match} = props;

    return (
        <div 
            style={{
                backgroundColor: 'orange',
                color: 'white',
                fontSize: 30,
                fontWeight: 'bold',
                height: 350,

                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            {`Hello World ${match.params.index}`}
        </div>
    );
}