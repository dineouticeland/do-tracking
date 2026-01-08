import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DineoutTracking, trackSinna, trackDineout, identifyUser, reset, sendDineoutEvent } from "../DineoutTracking";
const TEST_USERS = [
    { id: null, name: 'Anonymous (No User)' },
    { id: 'gummi-cray-001', name: 'GUMMI CRAY' },
    { id: 'testtester-002', name: 'testtester' },
];
// Generate a unique flow ID for cross-domain tracking
function generateFlowId() {
    return `flow_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
export default function TestApp() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [initialised, setInitialised] = useState(false);
    const [currentUser, setCurrentUser] = useState(TEST_USERS[0]);
    const [flowId, setFlowId] = useState(generateFlowId());
    const handleUserSelect = (user) => {
        if (user.id) {
            identifyUser(user.id);
        }
        else {
            reset();
        }
        setCurrentUser(user);
    };
    const newFlowId = () => {
        const id = generateFlowId();
        setFlowId(id);
        return id;
    };
    return (_jsxs("div", { style: { fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 900 }, children: [_jsx("h1", { children: "DO Tracking Test App" }), _jsxs("div", { style: { marginBottom: 20 }, children: [_jsx("input", { type: "text", placeholder: "Company slug or ID", style: { padding: 8, marginRight: 8, width: 200 }, onChange: (e) => {
                            setInitialised(false);
                            setCompanyIdentifier(e.target.value);
                        } }), _jsx("button", { onClick: () => setInitialised(true), style: { padding: '8px 16px' }, children: "Initialize Tracking" })] }), companyIdentifier && initialised && (_jsxs(_Fragment, { children: [_jsx(DineoutTracking, { companyIdentifier: companyIdentifier }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#f5f5f5', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Select User" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666' }, children: ["Current: ", _jsx("strong", { children: currentUser.name }), currentUser.id && _jsxs("span", { style: { color: '#888' }, children: [" (ID: ", currentUser.id, ")"] })] }), _jsx("div", { style: { display: 'flex', gap: 8 }, children: TEST_USERS.map((user) => (_jsx("button", { onClick: () => handleUserSelect(user), style: {
                                        padding: '8px 16px',
                                        background: currentUser.name === user.name ? '#007bff' : '#fff',
                                        color: currentUser.name === user.name ? '#fff' : '#333',
                                        border: '1px solid #ccc',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }, children: user.name }, user.name))) })] }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#e3f2fd', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "\uD83C\uDFEA Sinna Service Booking (trackSinna)" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666', fontSize: 14 }, children: [_jsx("code", { children: "book.sinna.is" }), " - Service booking flow"] }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: [_jsx("button", { onClick: () => trackSinna('Booking Flow Started'), children: "1. Booking Flow Started" }), _jsx("button", { onClick: () => trackSinna('Service Category Selected', {
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
                                        }), style: { background: '#c8e6c9', borderColor: '#66bb6a' }, children: "\u2705 9. Booking Completed" })] })] }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#fff8e1', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "\uD83C\uDF7D\uFE0F Dineout Reservation (trackDineout)" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666', fontSize: 14 }, children: [_jsx("code", { children: "dineout.is" }), " \u2192 ", _jsx("code", { children: "booking.dineout.is" }), " - Restaurant reservation flow"] }), _jsxs("div", { style: { marginBottom: 16, padding: 12, background: '#fff', borderRadius: 4, border: '1px solid #ddd' }, children: [_jsx("strong", { children: "Flow ID:" }), " ", _jsx("code", { style: { background: '#eee', padding: '2px 6px', borderRadius: 3 }, children: flowId }), _jsx("button", { onClick: newFlowId, style: { marginLeft: 12, padding: '4px 8px', fontSize: 12 }, children: "Generate New Flow ID" })] }), _jsx("h3", { style: { marginBottom: 8, color: '#666' }, children: "Phase 1: Reservation Selection (dineout.is)" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }, children: [_jsx("button", { onClick: () => trackDineout('Reservation Flow Started', {
                                            flow_id: flowId,
                                            company_id: companyIdentifier,
                                            restaurant_id: 'rest-123',
                                            lng: 'is',
                                            source: 'marketplace'
                                        }), children: "1. Flow Started" }), _jsx("button", { onClick: () => trackDineout('Reservation Date Selected', {
                                            flow_id: flowId,
                                            date: '2026-01-15'
                                        }), children: "2. Date Selected" }), _jsx("button", { onClick: () => trackDineout('Reservation Guests Selected', {
                                            flow_id: flowId,
                                            guests: 4
                                        }), children: "3. Guests Selected" }), _jsx("button", { onClick: () => trackDineout('Reservation Time Selected', {
                                            flow_id: flowId,
                                            dateTime: '2026-01-15T19:00:00',
                                            guests: 4
                                        }), children: "4. Time Selected" }), _jsx("button", { onClick: () => trackDineout('Reservation Redirected To Checkout', {
                                            flow_id: flowId,
                                            target: 'booking.dineout.is'
                                        }), children: "5. Redirect to Checkout \u2192" })] }), _jsx("h3", { style: { marginBottom: 8, color: '#666' }, children: "Phase 2: Checkout (booking.dineout.is)" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: [_jsx("button", { onClick: () => trackDineout('Reservation Checkout Loaded', {
                                            flow_id: flowId,
                                            restaurant_id: 'rest-123',
                                            dateTime: '2026-01-15T19:00:00',
                                            guests: 4,
                                            lng: 'is'
                                        }), children: "6. Checkout Loaded" }), _jsx("button", { onClick: () => trackDineout('Reservation Hold Started', {
                                            flow_id: flowId,
                                            hold_seconds: 600
                                        }), children: "7. Hold Started (10min)" }), _jsx("button", { onClick: () => trackDineout('Customer Details Submitted', {
                                            flow_id: flowId,
                                            has_email: true,
                                            has_phone: true,
                                            has_special_request: false
                                        }), children: "8. Details Submitted" }), _jsx("button", { onClick: () => trackDineout('Payment Required Shown', {
                                            flow_id: flowId,
                                            required: true,
                                            amount: 2000,
                                            currency: 'ISK',
                                            reason: 'deposit'
                                        }), children: "9. Payment Required" }), _jsx("button", { onClick: () => trackDineout('Reservation Payment Started', {
                                            flow_id: flowId,
                                            amount: 2000,
                                            currency: 'ISK',
                                            provider: 'valitor'
                                        }), children: "10. Payment Started" }), _jsx("button", { onClick: () => trackDineout('Reservation Payment Failed', {
                                            flow_id: flowId,
                                            provider: 'valitor',
                                            error_code: 'card_declined',
                                            card_provider: 'visa'
                                        }), style: { background: '#ffebee', borderColor: '#ef5350' }, children: "\u274C Payment Failed" }), _jsx("button", { onClick: () => trackDineout('Reservation Completed', {
                                            flow_id: flowId,
                                            reservation_id: 'res-456',
                                            amount_paid: 2000,
                                            currency: 'ISK',
                                            payment_required: true
                                        }), style: { background: '#c8e6c9', borderColor: '#66bb6a' }, children: "\u2705 Reservation Completed" }), _jsx("button", { onClick: () => trackDineout('Reservation Hold Expired', {
                                            flow_id: flowId
                                        }), style: { background: '#fff3e0', borderColor: '#ffa726' }, children: "\u23F0 Hold Expired" })] })] }), _jsxs("section", { style: { marginBottom: 30 }, children: [_jsx("h2", { children: "Legacy Events (sendDineoutEvent - deprecated)" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: () => sendDineoutEvent('Purchase', {
                                            value: 29,
                                            currency: 'USD'
                                        }), children: "Purchase" }), _jsx("button", { onClick: () => sendDineoutEvent('AddToCart', undefined), children: "Add to Cart" }), _jsx("button", { onClick: () => sendDineoutEvent('Custom', {
                                            name: 'TestEvent',
                                            foo: 'bar'
                                        }), children: "Custom Event" })] })] })] }))] }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(TestApp, {}) }));
//# sourceMappingURL=TestApp.js.map