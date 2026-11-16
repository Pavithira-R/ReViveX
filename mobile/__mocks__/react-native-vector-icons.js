// Mock for react-native-vector-icons/* — icons render null in Jest (no font file needed).
const React = require('react');
const Icon = () => null;
Icon.displayName = 'Icon';
module.exports = { __esModule: true, default: Icon };

