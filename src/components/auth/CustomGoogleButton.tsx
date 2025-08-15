import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { message } from 'antd';

interface CustomGoogleButtonProps {
  onSuccess: (credentialResponse: any) => void;
  className?: string;
}

/**
 * A fully custom Google login button component that matches the styling of regular buttons.
 */
const CustomGoogleButton: React.FC<CustomGoogleButtonProps> = ({
  onSuccess,
  className = '',
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <>
      {contextHolder}
      <div className={`w-full ${className}`}>
        <GoogleLogin
          onSuccess={onSuccess}
          onError={() => {
            messageApi.error({
              content: "Google login failed.",
              duration: 5,
            });
          }}
          theme="filled_black"
          text="signin_with"
          shape="rectangular"
          width="100%"
          size="large"
          locale="en"
          useOneTap
          type="standard"
        />
        
        {/* Additional custom styles for the Google button */}
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
    </>
  );
};

export default CustomGoogleButton; 