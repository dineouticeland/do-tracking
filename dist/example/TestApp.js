import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const [currentUser, setCurrentUser] = useState(TEST_USERS[0]);
    const handleUserSelect = (user) => {
        if (user.id) {
            identifyUser(user.id);
        }
        else {
            reset();
        }
        setCurrentUser(user);
    };
    return (_jsxs("div", { style: { fontFamily: 'system-ui, sans-serif', padding: 20, maxWidth: 800 }, children: [_jsx("h1", { children: "DO Tracking Test App" }), _jsxs("div", { style: { marginBottom: 20 }, children: [_jsx("input", { type: "text", placeholder: "Company slug or ID", style: { padding: 8, marginRight: 8, width: 200 }, onChange: (e) => {
                            setInitialised(false);
                            setCompanyIdentifier(e.target.value);
                        } }), _jsx("button", { onClick: () => setInitialised(true), style: { padding: '8px 16px' }, children: "Initialize Tracking" })] }), companyIdentifier && initialised && (_jsxs(_Fragment, { children: [_jsx(DineoutTracking, { companyIdentifier: companyIdentifier }), _jsxs("section", { style: { marginBottom: 30, padding: 16, background: '#f5f5f5', borderRadius: 8 }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Select User" }), _jsxs("p", { style: { margin: '0 0 12px 0', color: '#666' }, children: ["Current: ", _jsx("strong", { children: currentUser.name }), currentUser.id && _jsxs("span", { style: { color: '#888' }, children: [" (ID: ", currentUser.id, ")"] })] }), _jsx("div", { style: { display: 'flex', gap: 8 }, children: TEST_USERS.map((user) => (_jsx("button", { onClick: () => handleUserSelect(user), style: {
                                        padding: '8px 16px',
                                        background: currentUser.name === user.name ? '#007bff' : '#fff',
                                        color: currentUser.name === user.name ? '#fff' : '#333',
                                        border: '1px solid #ccc',
                                        borderRadius: 4,
                                        cursor: 'pointer'
                                    }, children: user.name }, user.name))) })] }), _jsxs("section", { style: { marginBottom: 30 }, children: [_jsx("h2", { children: "Booking Funnel (dineoutTrack)" }), _jsxs("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: [_jsx("button", { onClick: () => dineoutTrack('Booking Flow Started'), children: "1. Booking Flow Started" }), _jsx("button", { onClick: () => dineoutTrack('Service Category Selected', {
                                            categoryId: 'cat-1',
                                            categoryName: 'Haircuts'
                                        }), children: "2. Service Category Selected" }), _jsx("button", { onClick: () => dineoutTrack('Service Selected', {
                                            serviceId: 'svc-1',
                                            serviceName: 'Mens Haircut',
                                            price: 4500
                                        }), children: "3. Service Selected" }), _jsx("button", { onClick: () => dineoutTrack('Service Variation Selected', {
                                            variationId: 'var-1',
                                            variationName: 'Long Hair'
                                        }), children: "4. Service Variation Selected" }), _jsx("button", { onClick: () => dineoutTrack('Employee Selected', {
                                            employeeId: 'emp-1',
                                            employeeName: 'John'
                                        }), children: "5. Employee Selected" }), _jsx("button", { onClick: () => dineoutTrack('Time Slot Selected', {
                                            date: '2026-01-10',
                                            time: '14:00'
                                        }), children: "6. Time Slot Selected" }), _jsx("button", { onClick: () => dineoutTrack('Customer Info Submitted', {
                                            email: 'test@example.com',
                                            phone: '+354 123 4567'
                                        }), children: "7. Customer Info Submitted" }), _jsx("button", { onClick: () => dineoutTrack('Payment Started', {
                                            amount: 4500,
                                            currency: 'ISK'
                                        }), children: "8. Payment Started" }), _jsx("button", { onClick: () => dineoutTrack('Booking Completed', {
                                            bookingId: 'booking-123',
                                            totalAmount: 4500,
                                            currency: 'ISK'
                                        }), children: "9. Booking Completed" })] })] }), _jsxs("section", { style: { marginBottom: 30 }, children: [_jsx("h2", { children: "Legacy Events (sendDineoutEvent - deprecated)" }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: () => sendDineoutEvent('Purchase', {
                                            value: 29,
                                            currency: 'USD'
                                        }), children: "Purchase" }), _jsx("button", { onClick: () => sendDineoutEvent('AddToCart', undefined), children: "Add to Cart" }), _jsx("button", { onClick: () => sendDineoutEvent('Custom', {
                                            name: 'TestEvent',
                                            foo: 'bar'
                                        }), children: "Custom Event" })] })] })] }))] }));
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(TestApp, {}) }));
//# sourceMappingURL=TestApp.js.map