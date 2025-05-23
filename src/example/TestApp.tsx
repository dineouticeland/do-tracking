import React, {useState} from 'react';
import ReactDOM from 'react-dom/client';
import {DineoutTracking, sendDineoutEvent} from "../DineoutTracking";

export default function TestApp() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [initialised, setInitialised] = useState(false);

    return (
        <>
            <h1>Insert company identifier!</h1>
            <div>
                <input type={'text'} placeholder={'Company slug or ID'}
                       onChange={(e) => {
                           setInitialised(false);
                           setCompanyIdentifier(e.target.value);
                       }}/>
                <button onClick={() => setInitialised(true)}>Test integration</button>
            </div>
            <div style={{marginTop: 20}}>
                {companyIdentifier && initialised && (
                    <>
                        <div>
                            <button onClick={() => sendDineoutEvent('Purchase', {
                                value: 29,
                                currency: 'USD'
                            })}>
                                Send Purchase Event
                            </button>

                            <button onClick={() => sendDineoutEvent('AddToCart', undefined)}>
                                Send Add to Cart
                            </button>

                            <button onClick={() => sendDineoutEvent('Custom', {
                                meta: {
                                    name: 'Adam',
                                    age: 34,
                                    position: 'Junior piece of sh|t dev'
                                }
                            })}>
                                Send Custom Event
                            </button>
                        </div>
                        <DineoutTracking companyIdentifier={companyIdentifier}/>

                    </>
                )}
            </div>
        </>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TestApp/>
    </React.StrictMode>
);
