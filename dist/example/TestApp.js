import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { DineoutTracking } from "../DineoutTracking";
export default function TestApp() {
    const [companyIdentifier, setCompanyIdentifier] = useState('');
    const [initialised, setInitialised] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("h1", { children: "Insert company identifier!" }), _jsxs("div", { children: [_jsx("input", { type: 'text', placeholder: 'Company slug or ID', onChange: (e) => setCompanyIdentifier(e.target.value) }), _jsx("button", { onClick: () => setInitialised(true), children: "Test integration" })] }), _jsx("div", { style: { marginTop: 20 }, children: companyIdentifier && initialised && (_jsx(DineoutTracking, { companyIdentifier: companyIdentifier })) })] }));
}
;
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(TestApp, {}) }));
//# sourceMappingURL=TestApp.js.map