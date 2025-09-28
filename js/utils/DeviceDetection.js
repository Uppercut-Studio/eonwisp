// Device detection and capability utilities
export const DeviceDetection = {
    // Check if device is mobile
    isMobile() {
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const canOrient = ('ondeviceorientation' in window) || (typeof DeviceOrientationEvent !== 'undefined');
        const userAgent = navigator.userAgent.toLowerCase();
        
        // Check user agent for mobile indicators
        const mobileKeywords = [
            'mobile', 'android', 'iphone', 'ipad', 'ipod', 
            'blackberry', 'windows phone', 'opera mini'
        ];
        
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        return hasTouch && (canOrient || isMobileUA);
    },

    // Check if device supports device motion
    supportsDeviceMotion() {
        return typeof DeviceMotionEvent !== 'undefined';
    },

    // Check if device motion permission is required (iOS 13+)
    requiresMotionPermission() {
        return typeof DeviceMotionEvent !== 'undefined' && 
               typeof DeviceMotionEvent.requestPermission === 'function';
    },

    // Check if device supports pointer lock
    supportsPointerLock() {
        return 'requestPointerLock' in document.documentElement;
    },

    // Get screen orientation
    getOrientation() {
        if (screen.orientation) {
            return screen.orientation.type;
        }
        
        // Fallback for older browsers
        const orientation = window.orientation;
        if (orientation === 0 || orientation === 180) {
            return 'portrait';
        } else if (orientation === 90 || orientation === -90) {
            return 'landscape';
        }
        
        // Guess based on dimensions
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    },

    // Check if device is in landscape mode
    isLandscape() {
        return this.getOrientation().includes('landscape');
    },

    // Check if device is in portrait mode
    isPortrait() {
        return this.getOrientation().includes('portrait');
    },

    // Get device pixel ratio
    getPixelRatio() {
        return window.devicePixelRatio || 1;
    },

    // Check if high DPI display
    isHighDPI() {
        return this.getPixelRatio() > 1.5;
    },

    // Check if device supports vibration
    supportsVibration() {
        return 'vibrate' in navigator;
    },

    // Get available input types
    getInputCapabilities() {
        return {
            touch: 'ontouchstart' in window,
            mouse: matchMedia('(pointer: fine)').matches,
            keyboard: true, // Assume keyboard is always available
            gamepad: 'getGamepads' in navigator,
            deviceMotion: this.supportsDeviceMotion(),
            pointerLock: this.supportsPointerLock(),
            vibration: this.supportsVibration()
        };
    },

    // Get screen dimensions
    getScreenDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            pixelRatio: this.getPixelRatio()
        };
    },

    // Check if device is likely a tablet
    isTablet() {
        const { width, height } = this.getScreenDimensions();
        const minDimension = Math.min(width, height);
        const maxDimension = Math.max(width, height);
        
        // Tablets typically have larger screens
        return this.isMobile() && minDimension >= 768 && maxDimension >= 1024;
    },

    // Check if device is likely a phone
    isPhone() {
        return this.isMobile() && !this.isTablet();
    },

    // Check browser capabilities
    getBrowserCapabilities() {
        return {
            webgl: !!window.WebGLRenderingContext,
            webgl2: !!window.WebGL2RenderingContext,
            webAudio: !!(window.AudioContext || window.webkitAudioContext),
            fullscreen: !!(document.fullscreenEnabled || document.webkitFullscreenEnabled),
            localStorage: !!window.localStorage,
            sessionStorage: !!window.sessionStorage,
            indexedDB: !!window.indexedDB,
            workers: !!window.Worker,
            fetch: !!window.fetch
        };
    },

    // Performance hint based on device
    getPerformanceHint() {
        const { width, height } = this.getScreenDimensions();
        const pixelRatio = this.getPixelRatio();
        const totalPixels = width * height * pixelRatio;
        
        if (this.isPhone()) {
            return totalPixels > 2000000 ? 'medium' : 'low'; // Rough threshold
        } else if (this.isTablet()) {
            return 'medium';
        } else {
            return 'high'; // Desktop
        }
    },

    // Check if reduced motion is preferred
    prefersReducedMotion() {
        return window.matchMedia && 
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // Check color scheme preference
    getColorSchemePreference() {
        if (window.matchMedia) {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
        }
        return 'auto';
    }
};

// Device-specific optimizations
export const DeviceOptimizations = {
    // Get recommended settings based on device
    getRecommendedSettings(baseConfig) {
        const performanceHint = DeviceDetection.getPerformanceHint();
        const isMobile = DeviceDetection.isMobile();
        const capabilities = DeviceDetection.getBrowserCapabilities();
        
        const optimizedConfig = { ...baseConfig };
        
        // Adjust particle counts based on performance
        if (performanceHint === 'low') {
            optimizedConfig.effects.splashAmount *= 0.5;
            optimizedConfig.visual.trailDuration *= 0.7;
        } else if (performanceHint === 'medium') {
            optimizedConfig.effects.splashAmount *= 0.8;
        }
        
        // Mobile-specific adjustments
        if (isMobile) {
            // Larger touch targets
            optimizedConfig.mobile.touchTargetMultiplier = 1.2;
            
            // Different control sensitivity
            optimizedConfig.mobile.accelerometerMultiplier = DeviceDetection.isTablet() ? 1.5 : 2.0;
            
            // Battery saving adjustments
            optimizedConfig.effects.slowMoDuration *= 0.8;
        }
        
        // Adjust based on display characteristics
        if (DeviceDetection.isHighDPI()) {
            // High DPI displays can handle more detail
            optimizedConfig.visual.minThickness *= 1.2;
            optimizedConfig.visual.maxThickness *= 1.2;
        }
        
        return optimizedConfig;
    },

    // Get control scheme recommendation
    getRecommendedControlScheme() {
        if (!DeviceDetection.isMobile()) {
            return 'mouse';
        }
        
        if (DeviceDetection.supportsDeviceMotion()) {
            return DeviceDetection.isTablet() ? 'joystick' : 'accelerometer';
        }
        
        return 'joystick';
    },

    // Check if should enable debug features
    shouldEnableDebug() {
        return !DeviceDetection.isMobile() || 
               new URLSearchParams(window.location.search).has('debug');
    }
};
