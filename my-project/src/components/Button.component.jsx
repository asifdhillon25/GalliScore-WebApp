import React from 'react';
import PropTypes from 'prop-types';

const Button = ({ onClick, children, className, variant = 'primary', size = 'medium' }) => {
    // Define styles for different button variants and sizes
    const variantStyles = {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-500 text-white hover:bg-gray-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
    };

    const sizeStyles = {
        small: 'px-2 py-1 text-sm',
        medium: 'px-4 py-2 text-base',
        large: 'px-6 py-3 text-lg',
    };

    return (
        <button
            onClick={onClick}
            className={`rounded focus:outline-none active:scale-105 duration-75 ease-in focus:bg-red-600 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        >
            {children}
        </button>
    );
};

Button.propTypes = {
    onClick: PropTypes.func.isRequired,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
};

Button.defaultProps = {
    className: '',
    variant: 'primary',
    size: 'medium',
};

export default Button;
