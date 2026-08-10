import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
    DineoutTracking,
    trackSinna,
    trackDineout,
    trackDineoutDiscovery,
    trackTakeaway,
    trackPageView,
    identifyUser,
    reset,
    sendDineoutEvent,
    type TakeawayItem,
} from "../DineoutTracking.js";

const TEST_USERS = [
    { id: null, name: 'Anonymous (No User)' },
    { id: 'gummi-cray-001', name: 'GUMMI CRAY' },
    { id: 'testtester-002', name: 'testtester' },
];

const TAKEAWAY_ITEMS: TakeawayItem[] = [
    {
        item_id: 'burger-101',
        item_name: 'Funky Burger',
        item_category: 'Burgers',
        item_variant: 'burger-101|patty:double|sauce:chili',
        item_list_id: 'main-menu',
        item_list_name: 'Main menu',
        price: 3290,
        quantity: 1,
        discount: 500,
    },
];

const TAKEAWAY_CONTEXT = {
    restaurant_id: 'funkybhangra',
    restaurant_name: 'Funky Bhangra',
    cart_id: 'cart-4821',
    currency: 'ISK',
    fulfillment_type: 'pickup' as const,
    items: TAKEAWAY_ITEMS,
    value: 3290,
};

export default function TestApp() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [initialised, setInitialised] = useState(false);
    const [currentUser, setCurrentUser] = useState<typeof TEST_USERS[0]>(TEST_USERS[0]);
    const [companyTrackingMode, setCompanyTrackingMode] = useState<'auto' | 'direct' | 'gtm' | 'both'>('auto');
    const [takeawayOrderNumber, setTakeawayOrderNumber] = useState(104582);
    const takeawayOrderId = String(takeawayOrderNumber);

    const handleUserSelect = (user: typeof TEST_USERS[0]) => {
        if (user.id) {
            identifyUser(user.id);
        } else {
            reset();
        }
        setCurrentUser(user);
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
                <select
                    aria-label="Company tracking mode"
                    value={companyTrackingMode}
                    onChange={(event) => {
                        setInitialised(false);
                        setCompanyTrackingMode(event.target.value as 'auto' | 'direct' | 'gtm' | 'both');
                    }}
                    style={{ padding: 8, marginRight: 8 }}
                >
                    <option value="auto">Auto (all configured destinations)</option>
                    <option value="direct">Direct company tags only</option>
                    <option value="gtm">Company GTM only</option>
                    <option value="both">Direct + GTM</option>
                </select>
                <button 
                    onClick={() => setInitialised(true)}
                    style={{ padding: '8px 16px' }}
                >
                    Initialize Tracking
                </button>
            </div>

                {companyIdentifier && initialised && (
                    <>
                    <DineoutTracking
                        companyIdentifier={companyIdentifier}
                        companyTrackingMode={companyTrackingMode}
                    />

                    <section style={{ marginBottom: 30, padding: 16, background: '#f3e5f5', borderRadius: 8 }}>
                        <h2 style={{ marginTop: 0 }}>Page view</h2>
                        <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 14 }}>
                            Sends one manual page view with the full browser URL.
                        </p>
                        <button onClick={() => trackPageView(window.location.href, document.title)}>
                            Track current page
                        </button>
                    </section>
                    
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

                    {/* Takeaway Ecommerce Flow */}
                    <section style={{ marginBottom: 30, padding: 16, background: '#e8f5e9', borderRadius: 8 }}>
                        <h2 style={{ marginTop: 0 }}>🥡 Takeaway Ecommerce (trackTakeaway)</h2>
                        <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 14 }}>
                            <code>takeaway.dineout.is/funkybhangra/order</code> — menu, cart, checkout, and confirmation flow.
                            Current test order: <strong>{takeawayOrderId}</strong>. Click completion twice to verify deduplication.
                        </p>

                        <h3 style={{ marginBottom: 8, color: '#666' }}>Menu and cart</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            <button onClick={() => trackTakeaway('Takeaway Menu Viewed', TAKEAWAY_CONTEXT)}>
                                1. Menu Viewed
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Item Selected', TAKEAWAY_CONTEXT)}>
                                2. Item Selected
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Item Viewed', TAKEAWAY_CONTEXT)}>
                                3. Item Viewed
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Item Added', TAKEAWAY_CONTEXT)}>
                                4. Item Added (+1 delta)
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Item Removed', TAKEAWAY_CONTEXT)}>
                                5. Item Removed (-1 delta)
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Cart Viewed', TAKEAWAY_CONTEXT)}>
                                6. Cart Viewed
                            </button>
                        </div>

                        <h3 style={{ marginBottom: 8, color: '#666' }}>Promo and gift card responses</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            <button onClick={() => trackTakeaway('Takeaway Promo Applied', {
                                ...TAKEAWAY_CONTEXT,
                                coupon: 'SUMMER',
                            })}>
                                Promo Applied
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Promo Rejected', TAKEAWAY_CONTEXT)}>
                                Promo Rejected (no attempted code)
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Gift Card Applied', {
                                ...TAKEAWAY_CONTEXT,
                                gift_card_value: 1000,
                            })}>
                                Gift Card Applied (no card code)
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Gift Card Rejected', TAKEAWAY_CONTEXT)}>
                                Gift Card Rejected (no card code)
                            </button>
                        </div>

                        <h3 style={{ marginBottom: 8, color: '#666' }}>Checkout and confirmation</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button onClick={() => setTakeawayOrderNumber((current) => current + 1)}>
                                Use a fresh test order ID
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Checkout Started', TAKEAWAY_CONTEXT)}>
                                7. Checkout Started
                            </button>
                            <button onClick={() => trackTakeaway('Takeaway Payment Submitted', {
                                ...TAKEAWAY_CONTEXT,
                                payment_type: 'card',
                            })}>
                                8. Payment Submitted
                            </button>
                            <button
                                onClick={() => trackTakeaway('Takeaway Payment Failed', {
                                    ...TAKEAWAY_CONTEXT,
                                    failure_code: 'declined',
                                })}
                                style={{ background: '#ffebee', borderColor: '#ef5350' }}
                            >
                                ❌ Payment Failed
                            </button>
                            <button
                                onClick={() => trackTakeaway('Takeaway Payment Succeeded', {
                                    ...TAKEAWAY_CONTEXT,
                                    order_id: takeawayOrderId,
                                    payment_transaction_id: `pay-${takeawayOrderId}`,
                                })}
                                style={{ background: '#e3f2fd', borderColor: '#42a5f5' }}
                            >
                                Payment Succeeded
                            </button>
                            <button
                                onClick={() => trackTakeaway('Takeaway Order Completed', {
                                    ...TAKEAWAY_CONTEXT,
                                    order_id: takeawayOrderId,
                                    tax: 783,
                                    shipping: 0,
                                    coupon: 'SUMMER',
                                })}
                                style={{ background: '#c8e6c9', borderColor: '#66bb6a' }}
                            >
                                ✅ 9. Order Completed
                            </button>
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
                            <button onClick={() => trackSinna('Booking Payment Started', { 
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
                        <h2 style={{ marginTop: 0 }}>🍽️ Dineout Reservation</h2>
                        <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: 14 }}>
                            <code>dineout.is</code> → <code>booking.dineout.is</code> - Restaurant reservation flow
                            <br />
                            <em>User identity tracked by Mixpanel's cross_subdomain_cookie</em>
                        </p>

                        {/* Phase 1: dineout.is */}
                        <h3 style={{ marginBottom: 8, color: '#666' }}>Phase 1: Reservation Selection (dineout.is)</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            <button onClick={() => trackDineoutDiscovery('Reservation Flow Started', { 
                                company_id: companyIdentifier,
                                restaurant_id: 'rest-123',
                                lng: 'is',
                                source: 'marketplace'
                            })}>
                                1. Flow Started
                            </button>
                            <button onClick={() => trackDineoutDiscovery('Reservation Date Selected', { 
                                date: '2026-01-15' 
                            })}>
                                2. Date Selected
                            </button>
                            <button onClick={() => trackDineoutDiscovery('Reservation Guests Selected', { 
                                guests: 4 
                            })}>
                                3. Guests Selected
                            </button>
                            <button onClick={() => trackDineoutDiscovery('Reservation Time Selected', { 
                                dateTime: '2026-01-15T19:00:00', 
                                guests: 4 
                            })}>
                                4. Time Selected
                            </button>
                            <button onClick={() => trackDineoutDiscovery('Reservation Redirected To Checkout', { 
                                target: 'booking.dineout.is' 
                            })}>
                                5. Redirect to Checkout →
                            </button>
                        </div>

                        {/* Phase 2: booking.dineout.is */}
                        <h3 style={{ marginBottom: 8, color: '#666' }}>Phase 2: Checkout (booking.dineout.is)</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            <button onClick={() => trackDineout('Reservation Checkout Loaded', { 
                                restaurant_id: 'rest-123',
                                dateTime: '2026-01-15T19:00:00',
                                guests: 4,
                                lng: 'is'
                            })}>
                                6. Checkout Loaded
                            </button>
                            <button onClick={() => trackDineout('Reservation Hold Started', { 
                                hold_seconds: 600 
                            })}>
                                7. Hold Started (10min)
                            </button>
                            <button onClick={() => trackDineout('Customer Details Submitted', { 
                                has_email: true,
                                has_phone: true,
                                has_special_request: false
                            })}>
                                8. Details Submitted
                            </button>
                            <button onClick={() => trackDineout('Payment Required Shown', { 
                                required: true,
                                amount: 2000,
                                currency: 'ISK',
                                reason: 'deposit'
                            })}>
                                9. Payment Required
                            </button>
                            <button onClick={() => trackDineout('Reservation Payment Started', { 
                                amount: 2000,
                                currency: 'ISK',
                                provider: 'valitor'
                            })}>
                                10. Payment Started
                            </button>
                            <button 
                                onClick={() => trackDineout('Reservation Payment Failed', { 
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
                                    restaurant_id: 'rest-123',
                                    reservation_id: 'res-456',
                                    payment_required: true
                                })}
                                style={{ background: '#c8e6c9', borderColor: '#66bb6a' }}
                            >
                                ✅ Reservation Completed
                            </button>
                            <button
                                onClick={() => trackDineout('Reservation Deposit Paid', {
                                    restaurant_id: 'rest-123',
                                    reservation_id: 'res-456',
                                    payment_transaction_id: 'deposit-pay-789',
                                    value: 2000,
                                    currency: 'ISK',
                                })}
                                style={{ background: '#c8e6c9', borderColor: '#43a047' }}
                            >
                                💳 Deposit Paid (Purchase)
                            </button>
                            <button 
                                onClick={() => trackDineout('Reservation Hold Expired')}
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
