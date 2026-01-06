import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DineoutTracking, dineoutTrack, identifyUser, reset, sendDineoutEvent } from "../DineoutTracking";

const TEST_USERS = [
    { id: null, name: 'Anonymous (No User)' },
    { id: 'gummi-cray-001', name: 'GUMMI CRAY' },
    { id: 'testtester-002', name: 'testtester' },
];

export default function TestApp() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [initialised, setInitialised] = useState(false);
    const [currentUser, setCurrentUser] = useState<typeof TEST_USERS[0]>(TEST_USERS[0]);

    const handleUserSelect = (user: typeof TEST_USERS[0]) => {
        if (user.id) {
            identifyUser(user.id);
        } else {
            reset();
        }
        setCurrentUser(user);
    };

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 800 }}>
            <h1>DO Tracking Test App</h1>
            
            <div style={{ marginBottom: 20 }}>
                <input 
                    type="text" 
                    placeholder="Company slug or ID"
                    style={{ padding: 8, marginRight: 8, width: 200 }}
                    onChange={(e) => {
                        setInitialised(false);
                        setCompanyIdentifier(e.target.value);
                    }}
                />
                <button 
                    onClick={() => setInitialised(true)}
                    style={{ padding: '8px 16px' }}
                >
                    Initialize Tracking
                </button>
            </div>

            {companyIdentifier && initialised && (
                <>
                    <DineoutTracking companyIdentifier={companyIdentifier} />
                    
                    {/* User Selection */}
                    <section style={{ marginBottom: 30, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                        <h2 style={{ marginTop: 0 }}>Select User</h2>
                        <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                            Current: <strong>{currentUser.name}</strong> 
                            {currentUser.id && <span style={{ color: '#888' }}> (ID: {currentUser.id})</span>}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {TEST_USERS.map((user) => (
                                <button 
                                    key={user.name}
                                    onClick={() => handleUserSelect(user)}
                                    style={{ 
                                        padding: '8px 16px',
                                        background: currentUser.name === user.name ? '#007bff' : '#fff',
                                        color: currentUser.name === user.name ? '#fff' : '#333',
                                        border: '1px solid #ccc',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {user.name}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Booking Funnel Events */}
                    <section style={{ marginBottom: 30 }}>
                        <h2>Booking Funnel (dineoutTrack)</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button onClick={() => dineoutTrack('Booking Flow Started')}>
                                1. Booking Flow Started
                            </button>
                            <button onClick={() => dineoutTrack('Service Category Selected', { 
                                categoryId: 'cat-1', 
                                categoryName: 'Haircuts' 
                            })}>
                                2. Service Category Selected
                            </button>
                            <button onClick={() => dineoutTrack('Service Selected', { 
                                serviceId: 'svc-1', 
                                serviceName: 'Mens Haircut', 
                                price: 4500 
                            })}>
                                3. Service Selected
                            </button>
                            <button onClick={() => dineoutTrack('Service Variation Selected', { 
                                variationId: 'var-1', 
                                variationName: 'Long Hair' 
                            })}>
                                4. Service Variation Selected
                            </button>
                            <button onClick={() => dineoutTrack('Employee Selected', { 
                                employeeId: 'emp-1', 
                                employeeName: 'John' 
                            })}>
                                5. Employee Selected
                            </button>
                            <button onClick={() => dineoutTrack('Time Slot Selected', { 
                                date: '2026-01-10', 
                                time: '14:00' 
                            })}>
                                6. Time Slot Selected
                            </button>
                            <button onClick={() => dineoutTrack('Customer Info Submitted', { 
                                email: 'test@example.com', 
                                phone: '+354 123 4567' 
                            })}>
                                7. Customer Info Submitted
                            </button>
                            <button onClick={() => dineoutTrack('Payment Started', { 
                                amount: 4500, 
                                currency: 'ISK' 
                            })}>
                                8. Payment Started
                            </button>
                            <button onClick={() => dineoutTrack('Booking Completed', { 
                                bookingId: 'booking-123', 
                                totalAmount: 4500, 
                                currency: 'ISK' 
                            })}>
                                9. Booking Completed
                            </button>
                        </div>
                    </section>

                    {/* Legacy Events */}
                    <section style={{ marginBottom: 30 }}>
                        <h2>Legacy Events (sendDineoutEvent - deprecated)</h2>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => sendDineoutEvent('Purchase', {
                                value: 29,
                                currency: 'USD'
                            })}>
                                Purchase
                            </button>
                            <button onClick={() => sendDineoutEvent('AddToCart', undefined)}>
                                Add to Cart
                            </button>
                            <button onClick={() => sendDineoutEvent('Custom', {
                                name: 'TestEvent',
                                foo: 'bar'
                            })}>
                                Custom Event
                            </button>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <TestApp />
    </React.StrictMode>
);
