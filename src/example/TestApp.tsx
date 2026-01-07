import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DineoutTracking, trackSinna, trackDineout, identifyUser, reset, sendDineoutEvent } from "../DineoutTracking";

const TEST_USERS = [
    { id: null, name: 'Anonymous (No User)' },
    { id: 'gummi-cray-001', name: 'GUMMI CRAY' },
    { id: 'testtester-002', name: 'testtester' },
];

// Generate a unique flow ID for cross-domain tracking
function generateFlowId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function TestApp() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [initialised, setInitialised] = useState(false);
    const [currentUser, setCurrentUser] = useState<typeof TEST_USERS[0]>(TEST_USERS[0]);
    const [flowId, setFlowId] = useState(generateFlowId());

    const handleUserSelect = (user: typeof TEST_USERS[0]) => {
        if (user.id) {
            identifyUser(user.id);
        } else {
            reset();
        }
        setCurrentUser(user);
    };

    const newFlowId = () => {
        const id = generateFlowId();
        setFlowId(id);
        return id;
    };

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 900 }}>
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

                    {/* Sinna Service Booking Flow */}
                    <section style={{ marginBottom: 30, padding: 16, background: '#e3f2fd', borderRadius: 8 }}>
                        <h2 style={{ marginTop: 0 }}>🏪 Sinna Service Booking (trackSinna)</h2>
                        <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 14 }}>
                            <code>book.sinna.is</code> - Service booking flow
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button onClick={() => trackSinna('Booking Flow Started')}>
                                1. Booking Flow Started
                            </button>
                            <button onClick={() => trackSinna('Service Category Selected', { 
                                categoryId: 'cat-1', 
                                categoryName: 'Haircuts' 
                            })}>
                                2. Service Category Selected
                            </button>
                            <button onClick={() => trackSinna('Service Selected', { 
                                serviceId: 'svc-1', 
                                serviceName: 'Mens Haircut', 
                                price: 4500 
                            })}>
                                3. Service Selected
                            </button>
                            <button onClick={() => trackSinna('Service Variation Selected', { 
                                variationId: 'var-1', 
                                variationName: 'Long Hair' 
                            })}>
                                4. Service Variation Selected
                            </button>
                            <button onClick={() => trackSinna('Employee Selected', { 
                                employeeId: 'emp-1', 
                                employeeName: 'John' 
                            })}>
                                5. Employee Selected
                            </button>
                            <button onClick={() => trackSinna('Time Slot Selected', { 
                                date: '2026-01-10', 
                                time: '14:00' 
                            })}>
                                6. Time Slot Selected
                            </button>
                            <button onClick={() => trackSinna('Customer Info Submitted', { 
                                hasEmail: true, 
                                hasPhone: true 
                            })}>
                                7. Customer Info Submitted
                            </button>
                            <button onClick={() => trackSinna('Payment Started', { 
                                amount: 4500, 
                                currency: 'ISK' 
                            })}>
                                8. Payment Started
                            </button>
                            <button 
                                onClick={() => trackSinna('Booking Completed', { 
                                    bookingId: 'booking-123', 
                                    totalAmount: 4500, 
                                    currency: 'ISK' 
                                })}
                                style={{ background: '#c8e6c9', borderColor: '#66bb6a' }}
                            >
                                ✅ 9. Booking Completed
                            </button>
                        </div>
                    </section>

                    {/* Dineout Reservation Flow */}
                    <section style={{ marginBottom: 30, padding: 16, background: '#fff8e1', borderRadius: 8 }}>
                        <h2 style={{ marginTop: 0 }}>🍽️ Dineout Reservation (trackDineout)</h2>
                        <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 14 }}>
                            <code>dineout.is</code> → <code>booking.dineout.is</code> - Restaurant reservation flow
                        </p>
                        
                        {/* Flow ID Display */}
                        <div style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 4, border: '1px solid #ddd' }}>
                            <strong>Flow ID:</strong> <code style={{ background: '#eee', padding: '2px 6px', borderRadius: 3 }}>{flowId}</code>
                            <button 
                                onClick={newFlowId} 
                                style={{ marginLeft: 12, padding: '4px 8px', fontSize: 12 }}
                            >
                                Generate New Flow ID
                            </button>
                        </div>

                        {/* Phase 1: dineout.is */}
                        <h3 style={{ marginBottom: 8, color: '#666' }}>Phase 1: Reservation Selection (dineout.is)</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            <button onClick={() => trackDineout('Reservation Flow Started', { 
                                flow_id: flowId, 
                                company_id: companyIdentifier,
                                restaurant_id: 'rest-123',
                                lng: 'is',
                                source: 'marketplace'
                            })}>
                                1. Flow Started
                            </button>
                            <button onClick={() => trackDineout('Reservation Date Selected', { 
                                flow_id: flowId, 
                                date: '2026-01-15' 
                            })}>
                                2. Date Selected
                            </button>
                            <button onClick={() => trackDineout('Reservation Guests Selected', { 
                                flow_id: flowId, 
                                guests: 4 
                            })}>
                                3. Guests Selected
                            </button>
                            <button onClick={() => trackDineout('Reservation Time Selected', { 
                                flow_id: flowId, 
                                dateTime: '2026-01-15T19:00:00', 
                                guests: 4 
                            })}>
                                4. Time Selected
                            </button>
                            <button onClick={() => trackDineout('Reservation Redirected To Checkout', { 
                                flow_id: flowId, 
                                target: 'booking.dineout.is' 
                            })}>
                                5. Redirect to Checkout →
                            </button>
                        </div>

                        {/* Phase 2: booking.dineout.is */}
                        <h3 style={{ marginBottom: 8, color: '#666' }}>Phase 2: Checkout (booking.dineout.is)</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button onClick={() => trackDineout('Reservation Checkout Loaded', { 
                                flow_id: flowId, 
                                restaurant_id: 'rest-123',
                                dateTime: '2026-01-15T19:00:00',
                                guests: 4,
                                lng: 'is'
                            })}>
                                6. Checkout Loaded
                            </button>
                            <button onClick={() => trackDineout('Reservation Hold Started', { 
                                flow_id: flowId, 
                                hold_seconds: 600 
                            })}>
                                7. Hold Started (10min)
                            </button>
                            <button onClick={() => trackDineout('Customer Details Submitted', { 
                                flow_id: flowId,
                                has_email: true,
                                has_phone: true,
                                has_special_request: false
                            })}>
                                8. Details Submitted
                            </button>
                            <button onClick={() => trackDineout('Payment Required Shown', { 
                                flow_id: flowId,
                                required: true,
                                amount: 2000,
                                currency: 'ISK',
                                reason: 'deposit'
                            })}>
                                9. Payment Required
                            </button>
                            <button onClick={() => trackDineout('Reservation Payment Started', { 
                                flow_id: flowId,
                                amount: 2000,
                                currency: 'ISK',
                                provider: 'valitor'
                            })}>
                                10. Payment Started
                            </button>
                            <button 
                                onClick={() => trackDineout('Payment Failed', { 
                                    flow_id: flowId,
                                    provider: 'valitor',
                                    error_code: 'card_declined',
                                    card_provider: 'visa'
                                })}
                                style={{ background: '#ffebee', borderColor: '#ef5350' }}
                            >
                                ❌ Payment Failed
                            </button>
                            <button 
                                onClick={() => trackDineout('Reservation Completed', { 
                                    flow_id: flowId,
                                    reservation_id: 'res-456',
                                    amount_paid: 2000,
                                    currency: 'ISK',
                                    payment_required: true
                                })}
                                style={{ background: '#c8e6c9', borderColor: '#66bb6a' }}
                            >
                                ✅ Reservation Completed
                            </button>
                            <button 
                                onClick={() => trackDineout('Reservation Hold Expired', { 
                                    flow_id: flowId 
                                })}
                                style={{ background: '#fff3e0', borderColor: '#ffa726' }}
                            >
                                ⏰ Hold Expired
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
