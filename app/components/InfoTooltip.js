'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export default function InfoTooltip({ content, size = 14, className = '' }) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    // Update position when showing
    useEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;

            // Default: Center above the icon
            setPosition({
                top: rect.top + scrollY - 8, // 8px padding above
                left: rect.left + scrollX + (rect.width / 2),
            });
        }
    }, [isVisible]);

    return (
        <>
            <div
                ref={triggerRef}
                className={`info-tooltip-trigger ${className}`}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'help', color: 'var(--text-tertiary)' }}
            >
                <Info size={size} />
            </div>

            {isVisible && createPortal(
                <div
                    className="portal-tooltip animate-in"
                    style={{
                        position: 'absolute',
                        top: position.top,
                        left: position.left,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 9999,
                    }}
                >
                    {content}
                    <div className="portal-arrow" />
                </div>,
                document.body
            )}
        </>
    );
}
