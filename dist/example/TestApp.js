import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DineoutTracking, trackSinna, trackDineout, trackDineoutDiscovery, trackTakeaway, trackPageView, identifyUser, reset, sendDineoutEvent, } from "../DineoutTracking.js";
const TEST_USERS = [
    { id: null, name: 'Anonymous (No User)' },
    { id: 'gummi-cray-001', name: 'GUMMI CRAY' },
    { id: 'testtester-002', name: 'testtester' },
];
const TAKEAWAY_ITEMS = [
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
    fulfillment_type: 'pickup',
    items: TAKEAWAY_ITEMS,
    value: 3290,
};
export default function TestApp() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [initialised, setInitialised] = useState(false);
    const [currentUser, setCurrentUser] = useState(TEST_USERS[0]);
    const [companyTrackingMode, setCompanyTrackingMode] = useState('auto');
    const [takeawayOrderNumber, setTakeawayOrderNumber] = useState(104582);
    const takeawayOrderId = String(takeawayOrderNumber);
    const handleUserSelect = (user) => {
        if (user.id) {
            identifyUser(user.id);
        }
        else {
            reset();
        }
        setCurrentUser(user);
    };
    return (_jsxs("div", { style: { fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 900 }, children: [_jsx("h1", { children: "DO Tracking Test App" }), _jsxs("div", { style: { marginBottom: 20 }, children: [_jsx("input", { type: "text", placeholder: "Company slug or ID", style: { padding: 8, marginRight: 8, width: 200 }, onChange: (e) => {
                            setInitialised(false);
                            setCompanyIdentifier(e.target.value);
                        } }), _jsxs("select", { "aria-label": "Company tracking mode", value: companyTrackingMode, onChange: (event) => {
                            setInitialised(false);
                            setCompanyTrackingMode(event.target.value);
                        }, style: { padding: 8, marginRight: 8 }, children: [_jsx("option", { value: "auto", children: "Auto (all configured destinations)" }), _jsx("option", { value: "direct", children: "Direct company tags only" }), _jsx("option", { value: "gtm", children: "Company GTM only" }), _jsx("option", { value: "both", children: "Direct + GTM" })] }), _jsx("button", { onClick: () => setInitialised(true), style: { padding: '8px 16px' }, children: "Initialize Tracking" })] }), companyIdentifier && initialised && (_jsxs(_Fragment, { children: [_jsx(DineoutTracking, { companyIdentifier: companyIdentifier, companyTrackingMode: companyTrackingMode }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#f3e5f5', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Page view" }), _jsx("p", { style: { margin: '0 0 12px 0', color: '#666', fontSize: 14 }, children: "Sends one manual page view with the full browser URL." }), _jsx("button", { onClick: () => trackPageView(window.location.href, document.title), children: "Track current page" })] }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#f5f5f5', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Select User" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666' }, children: ["Current: ", _jsx("strong", { children: currentUser.name }), currentUser.id && _jsxs("span", { style: { color: '#888' }, children: [" (ID: ", currentUser.id, ")"] })] }), _jsx("div", { style: { display: 'flex', gap: 8 }, children: TEST_USERS.map((user) => (_jsx("button", { onClick: () => handleUserSelect(user), style: {
                                        padding: '8px 16px',
                                        background: currentUser.name === user.name ? '#007bff' : '#fff',
                                        color: currentUser.name === user.name ? '#fff' : '#333',
                                        border: '1px solid #ccc',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }, children: user.name }, user.name))) })] }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#e8f5e9', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "\uD83E\uDD61 Takeaway Ecommerce (trackTakeaway)" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666', fontSize: 14 }, children: [_jsx("code", { children: "takeaway.dineout.is/funkybhangra/order" }), " \u2014 menu, cart, checkout, and confirmation flow. Current test order: ", _jsx("strong", { children: takeawayOrderId }), ". Click completion twice to verify deduplication."] }), _jsx("h3", { style: { marginBottom: 8, color: '#666' }, children: "Menu and cart" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, children: [_jsx("button", { onClick: () => trackTakeaway('Takeaway Menu Viewed', TAKEAWAY_CONTEXT), children: "1. Menu Viewed" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Item Selected', TAKEAWAY_CONTEXT), children: "2. Item Selected" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Item Viewed', TAKEAWAY_CONTEXT), children: "3. Item Viewed" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Item Added', TAKEAWAY_CONTEXT), children: "4. Item Added (+1 delta)" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Item Removed', TAKEAWAY_CONTEXT), children: "5. Item Removed (-1 delta)" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Cart Viewed', TAKEAWAY_CONTEXT), children: "6. Cart Viewed" })] }), _jsx("h3", { style: { marginBottom: 8, color: '#666' }, children: "Promo and gift card responses" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, children: [_jsx("button", { onClick: () => trackTakeaway('Takeaway Promo Applied', Object.assign(Object.assign({}, TAKEAWAY_CONTEXT), { coupon: 'SUMMER' })), children: "Promo Applied" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Promo Rejected', TAKEAWAY_CONTEXT), children: "Promo Rejected (no attempted code)" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Gift Card Applied', Object.assign(Object.assign({}, TAKEAWAY_CONTEXT), { gift_card_value: 1000 })), children: "Gift Card Applied (no card code)" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Gift Card Rejected', TAKEAWAY_CONTEXT), children: "Gift Card Rejected (no card code)" })] }), _jsx("h3", { style: { marginBottom: 8, color: '#666' }, children: "Checkout and confirmation" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: [_jsx("button", { onClick: () => setTakeawayOrderNumber((current) => current + 1), children: "Use a fresh test order ID" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Checkout Started', TAKEAWAY_CONTEXT), children: "7. Checkout Started" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Payment Submitted', Object.assign(Object.assign({}, TAKEAWAY_CONTEXT), { payment_type: 'card' })), children: "8. Payment Submitted" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Payment Failed', Object.assign(Object.assign({}, TAKEAWAY_CONTEXT), { failure_code: 'declined' })), style: { background: '#ffebee', borderColor: '#ef5350' }, children: "\u274C Payment Failed" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Payment Succeeded', Object.assign(Object.assign({}, TAKEAWAY_CONTEXT), { order_id: takeawayOrderId, payment_transaction_id: `pay-${takeawayOrderId}` })), style: { background: '#e3f2fd', borderColor: '#42a5f5' }, children: "Payment Succeeded" }), _jsx("button", { onClick: () => trackTakeaway('Takeaway Order Completed', Object.assign(Object.assign({}, TAKEAWAY_CONTEXT), { order_id: takeawayOrderId, tax: 783, shipping: 0, coupon: 'SUMMER' })), style: { background: '#c8e6c9', borderColor: '#66bb6a' }, children: "\u2705 9. Order Completed" })] })] }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#e3f2fd', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "\uD83C\uDFEA Sinna Service Booking (trackSinna)" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666', fontSize: 14 }, children: [_jsx("code", { children: "book.sinna.is" }), " - Service booking flow"] }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: [_jsx("button", { onClick: () => trackSinna('Booking Flow Started'), children: "1. Booking Flow Started" }), _jsx("button", { onClick: () => trackSinna('Service Category Selected', {
                                            categoryId: 'cat-1',
                                            categoryName: 'Haircuts'
                                        }), children: "2. Service Category Selected" }), _jsx("button", { onClick: () => trackSinna('Service Selected', {
                                            serviceId: 'svc-1',
                                            serviceName: 'Mens Haircut',
                                            price: 4500
                                        }), children: "3. Service Selected" }), _jsx("button", { onClick: () => trackSinna('Service Variation Selected', {
                                            variationId: 'var-1',
                                            variationName: 'Long Hair'
                                        }), children: "4. Service Variation Selected" }), _jsx("button", { onClick: () => trackSinna('Employee Selected', {
                                            employeeId: 'emp-1',
                                            employeeName: 'John'
                                        }), children: "5. Employee Selected" }), _jsx("button", { onClick: () => trackSinna('Time Slot Selected', {
                                            date: '2026-01-10',
                                            time: '14:00'
                                        }), children: "6. Time Slot Selected" }), _jsx("button", { onClick: () => trackSinna('Customer Info Submitted', {
                                            hasEmail: true,
                                            hasPhone: true
                                        }), children: "7. Customer Info Submitted" }), _jsx("button", { onClick: () => trackSinna('Booking Payment Started', {
                                            amount: 4500,
                                            currency: 'ISK'
                                        }), children: "8. Payment Started" }), _jsx("button", { onClick: () => trackSinna('Booking Completed', {
                                            bookingId: 'booking-123',
                                            totalAmount: 4500,
                                            currency: 'ISK'
                                        }), style: { background: '#c8e6c9', borderColor: '#66bb6a' }, children: "\u2705 9. Booking Completed" })] })] }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#fff8e1', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "\uD83C\uDF7D\uFE0F Dineout Reservation" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666', fontSize: 14 }, children: [_jsx("code", { children: "dineout.is" }), " \u2192 ", _jsx("code", { children: "booking.dineout.is" }), " - Restaurant reservation flow", _jsx("br", {}), _jsx("em", { children: "User identity tracked by Mixpanel's cross_subdomain_cookie" })] }), _jsx("h3", { style: { marginBottom: 8, color: '#666' }, children: "Phase 1: Reservation Selection (dineout.is)" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, children: [_jsx("button", { onClick: () => trackDineoutDiscovery('Reservation Flow Started', {
                                            company_id: companyIdentifier,
                                            restaurant_id: 'rest-123',
                                            lng: 'is',
                                            source: 'marketplace'
                                        }), children: "1. Flow Started" }), _jsx("button", { onClick: () => trackDineoutDiscovery('Reservation Date Selected', {
                                            date: '2026-01-15'
                                        }), children: "2. Date Selected" }), _jsx("button", { onClick: () => trackDineoutDiscovery('Reservation Guests Selected', {
                                            guests: 4
                                        }), children: "3. Guests Selected" }), _jsx("button", { onClick: () => trackDineoutDiscovery('Reservation Time Selected', {
                                            dateTime: '2026-01-15T19:00:00',
                                            guests: 4
                                        }), children: "4. Time Selected" }), _jsx("button", { onClick: () => trackDineoutDiscovery('Reservation Redirected To Checkout', {
                                            target: 'booking.dineout.is'
                                        }), children: "5. Redirect to Checkout \u2192" })] }), _jsx("h3", { style: { marginBottom: 8, color: '#666' }, children: "Phase 2: Checkout (booking.dineout.is)" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: [_jsx("button", { onClick: () => trackDineout('Reservation Checkout Loaded', {
                                            restaurant_id: 'rest-123',
                                            dateTime: '2026-01-15T19:00:00',
                                            guests: 4,
                                            lng: 'is'
                                        }), children: "6. Checkout Loaded" }), _jsx("button", { onClick: () => trackDineout('Reservation Hold Started', {
                                            hold_seconds: 600
                                        }), children: "7. Hold Started (10min)" }), _jsx("button", { onClick: () => trackDineout('Customer Details Submitted', {
                                            has_email: true,
                                            has_phone: true,
                                            has_special_request: false
                                        }), children: "8. Details Submitted" }), _jsx("button", { onClick: () => trackDineout('Payment Required Shown', {
                                            required: true,
                                            amount: 2000,
                                            currency: 'ISK',
                                            reason: 'deposit'
                                        }), children: "9. Payment Required" }), _jsx("button", { onClick: () => trackDineout('Reservation Payment Started', {
                                            amount: 2000,
                                            currency: 'ISK',
                                            provider: 'valitor'
                                        }), children: "10. Payment Started" }), _jsx("button", { onClick: () => trackDineout('Reservation Payment Failed', {
                                            provider: 'valitor',
                                            error_code: 'card_declined',
                                            card_provider: 'visa'
                                        }), style: { background: '#ffebee', borderColor: '#ef5350' }, children: "\u274C Payment Failed" }), _jsx("button", { onClick: () => trackDineout('Reservation Completed', {
                                            restaurant_id: 'rest-123',
                                            reservation_id: 'res-456',
                                            payment_required: true
                                        }), style: { background: '#c8e6c9', borderColor: '#66bb6a' }, children: "\u2705 Reservation Completed" }), _jsx("button", { onClick: () => trackDineout('Reservation Deposit Paid', {
                                            restaurant_id: 'rest-123',
                                            reservation_id: 'res-456',
                                            payment_transaction_id: 'deposit-pay-789',
                                            value: 2000,
                                            currency: 'ISK',
                                        }), style: { background: '#c8e6c9', borderColor: '#43a047' }, children: "\uD83D\uDCB3 Deposit Paid (Purchase)" }), _jsx("button", { onClick: () => trackDineout('Reservation Hold Expired'), style: { background: '#fff3e0', borderColor: '#ffa726' }, children: "\u23F0 Hold Expired" })] })] }), _jsxs("section", { style: { marginBottom: 30 }, children: [_jsx("h2", { children: "Legacy Events (sendDineoutEvent - deprecated)" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: () => sendDineoutEvent('Purchase', {
                                            value: 29,
                                            currency: 'USD'
                                        }), children: "Purchase" }), _jsx("button", { onClick: () => sendDineoutEvent('AddToCart', undefined), children: "Add to Cart" }), _jsx("button", { onClick: () => sendDineoutEvent('Custom', {
                                            name: 'TestEvent',
                                            foo: 'bar'
                                        }), children: "Custom Event" })] })] })] }))] }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(TestApp, {}) }));
//# sourceMappingURL=TestApp.js.map