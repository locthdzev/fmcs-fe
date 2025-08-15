import { CSSProperties, useEffect, useRef } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { message } from "antd";

interface GoogleLoginButtonProps {
  onSuccess: (response: any) => void;
  className?: string;
  style?: CSSProperties;
}

// Custom Google login button to ensure proper styling in production
const GoogleLoginButton = ({ onSuccess, className = "", style }: GoogleLoginButtonProps) => {
  const messageApi = message.useMessage()[0];
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Apply custom CSS to ensure the Google button matches the width of regular buttons
  useEffect(() => {
    // Target the Google button after it renders
    if (containerRef.current) {
      const googleButton = containerRef.current.querySelector('div[role="button"]');
      
      if (googleButton instanceof HTMLElement) {
        // Force the button to take full width
        googleButton.style.width = "100%";
        googleButton.style.justifyContent = "center";
        
        // Ensure proper height
        googleButton.style.height = "48px"; // Match the height of Sign In button
        
        // Apply additional styles if needed
        googleButton.style.borderRadius = "0.5rem"; // 8px rounded corners
      }
    }
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className={`w-full google-btn-container ${className}`} 
      style={style}
    >
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => {
          messageApi.error({
            content: "Google login failed.",
            duration: 5,
          });
        }}
        containerProps={{ 
          className: "w-full",
          style: {
            display: 'flex',
            justifyContent: 'center',
          }
        }}
        theme="filled_black"
        text="signin_with"
        locale="en"
        useOneTap
      />
      
      {/* Additional custom styles to fix Google button in production */}
      <style jsx global>{`
        .google-btn-container > div {
          width: 100% !important;
        }
        
        .google-btn-container > div > div {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
        }
        
        .google-btn-container > div > div > div {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
        }
        
        .google-btn-container iframe {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default GoogleLoginButton; 