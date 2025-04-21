import { GoogleLogin } from "@react-oauth/google";
import { useContext, useState } from "react";
import { useRouter } from "next/router";
import { login, loginWithGoogle } from "@/api/auth";
import { UserContext } from "@/context/UserContext";
import Cookies from "js-cookie";
import { ImagesSlider } from "@/components/ui/images-slider";
import { motion } from "framer-motion";
import { message } from "antd";

export default function Login() {
  console.log("Login");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const context = useContext(UserContext);
  const [messageApi, contextHolder] = message.useMessage();

  const { loginContext } = context || {};

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loginResponse = await login({ username, password });
      if (loginResponse.isSuccess && loginResponse.data) {
        const { user: loggedInUser, token } = loginResponse.data;
        console.log("Logged in user:", loggedInUser);
        loginContext?.(loggedInUser.email, token);
        messageApi.success({ content: "Login successful!", duration: 5 });
        router.push("/home");
      } else {
        messageApi.error({
          content: "Login failed. Please try again.",
          duration: 5,
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        messageApi.error({
          content: error.message || "An error occurred with the API",
          duration: 5,
        });
      } else {
        messageApi.error({ content: "An unknown error occurred", duration: 5 });
      }
    }
  };

  const handleGoogleLogin = async (response: any) => {
    try {
      const googleResponse = await loginWithGoogle(response.credential);
      if (googleResponse.isSuccess && googleResponse.data) {
        const { user: loggedInUser, token } = googleResponse.data;
        loginContext?.(loggedInUser.email, token);

        if (rememberMe) {
          Cookies.set("token", token, { expires: 7 });
        } else {
          Cookies.set("token", token);
        }

        messageApi.success({
          content: "Login with Google successful!",
          duration: 5,
        });
        router.push("/home");
      } else {
        messageApi.error({ content: "Login with Google failed", duration: 5 });
      }
    } catch (error) {
      if (error instanceof Error) {
        messageApi.error({
          content: error.message || "An error occurred with the API",
          duration: 5,
        });
      } else {
        messageApi.error({ content: "An unknown error occurred", duration: 5 });
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const focusUsernameInput = () => {
    const usernameInput = document.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement;
    if (usernameInput) {
      usernameInput.focus();
    }
  };

  const images = [
    "../fpt-ct-campus1.jpg",
    "../fpt-ct-campus2.jpg",
    "../fpt-ct-campus3.jpg",
    "../fpt-ct-campus4.jpg",
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {contextHolder}
      {/* Left section with slideshow */}
      <div className="hidden md:flex w-2/3 h-full relative overflow-hidden">
        <ImagesSlider className="h-full w-full" images={images}>
          <motion.div
            initial={{
              opacity: 0,
              y: -80,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
            }}
            className="z-50 flex flex-col justify-center items-center"
          >
            <div className="text-center space-y-2">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-bold text-2xl md:text-6xl text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-white to-orange-500 py-2"
              >
                Welcome to FPT Medical Care System
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="font-medium text-lg md:text-3xl text-center text-white/80 drop-shadow-lg"
              >
                Your Health, Our Priority
              </motion.p>
            </div>
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 0px 8px rgb(16 185 129 / 0.6)",
              }}
              className="mt-8 px-6 py-2.5 backdrop-blur-sm border bg-emerald-500/20 border-emerald-500/30 text-white mx-auto text-center rounded-full relative"
              onClick={focusUsernameInput}
            >
              <span className="relative z-10">Join now →</span>
              <div className="absolute inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-emerald-500 to-transparent" />
            </motion.button>
          </motion.div>
        </ImagesSlider>
      </div>
      {/* Right section with form */}
      <div className="flex flex-1 justify-center items-center bg-white">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <img
              src="../logo-fpt.png"
              alt="logo of FPT University"
              className="w-40 mx-auto mb-4"
            />
            <h1 className="text-black text-2xl font-bold">
              {Array.from("FPT Medical Care System").map((char, index) => (
                <span
                  key={index}
                  style={{
                    animation: `wave 1s ease-in-out ${index * 0.1}s infinite`,
                    display: "inline-block",
                    color: char !== " " ? "transparent" : "inherit",
                    backgroundImage:
                      char !== " "
                        ? "linear-gradient(to right, #fb923c, #f97316, #ea580c)"
                        : "none",
                    backgroundClip: char !== " " ? "text" : "none",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h1>
          </div>
          <style jsx global>{`
            @keyframes wave {
              0%,
              50% {
                transform: translateY(0);
              }
              100% {
                transform: translateY(-5px);
              }
            }
          `}</style>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300 text-black"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300 text-black"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <button
                type="button"
                onClick={handleClickShowPassword}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                      clipRule="evenodd"
                    />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path
                      fillRule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>{" "}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-gray-600">
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:bg-blue-500 checked:translate-x-4 transition-transform duration-200 ease-in-out"
                  />
                  <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer hover:bg-gray-400"></label>{" "}
                </div>
                <span>Remember me</span>
              </label>
              <a
                href="/auth/recover-password"
                className="text-blue-500 hover:underline text-sm"
              >
                Forgot password?
              </a>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition"
            >
              Sign In
            </button>
          </form>{" "}
          <div className="text-black text-center my-4 text-gray-500">Or</div>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              messageApi.error({
                content: "Google login failed.",
                duration: 5,
              });
            }}
            containerProps={{ className: "w-full" }}
            theme="filled_black"
            text="signin_with"
            locale="en"
            useOneTap
          />
          <div className="flex flex-row items-center justify-between self-stretch shrink-0 h-6 relative mt-6">
            <div className="flex flex-row gap-1 items-center justify-start shrink-0 relative">
              <div
                className="text-[#666666] text-left font-['Roboto-Regular',_sans-serif] text-xs leading-4 font-normal relative"
                style={{ letterSpacing: "-0.4px" }}
              >
                © 2025 Copyright belongs to FPT University.{" "}
              </div>
            </div>
            <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/daihocfpt"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/facebook.svg"
                  alt="Facebook"
                  width="16"
                  height="16"
                />
              </a>
              <a
                href="https://www.youtube.com/c/TrườngĐạiHọcFPTCầnThơ"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/youtube.svg" alt="YouTube" width="16" height="16" />
              </a>
              <a
                href="https://id.zalo.me/account?continue=http%3A%2F%2Fzalo.me%2Fdaihocfpt"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/zalo.svg" alt="Zalo" width="16" height="16" />
              </a>
              <a
                href="https://www.tiktok.com/@fptuniversity"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/tiktok.svg" alt="TikTok" width="16" height="16" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
