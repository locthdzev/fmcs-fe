import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="vi">
      <Head>
        {/* Character Set */}
        <meta charSet="utf-8" />

        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Primary Meta Tags */}
        <meta name="title" content="FMCS - FPT Medical Care System" />
        <meta
          name="description"
          content="Hệ thống quản lý y tế FPT - Quản lý sức khỏe, lịch khám và hỗ trợ y tế cho sinh viên và nhân viên trường Đại học FPT"
        />
        <meta
          name="keywords"
          content="healthcare, medical, FPT, appointment, health check, medicine"
        />

        {/* Open Graph / Facebook Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://fmcs.example.com/" />
        <meta property="og:title" content="FMCS - FPT Medical Care System" />
        <meta
          property="og:description"
          content="Hệ thống quản lý y tế FPT - Quản lý sức khỏe, lịch khám và hỗ trợ y tế cho sinh viên và nhân viên trường Đại học FPT"
        />
        <meta property="og:image" content="/images/og-image.jpg" />

        {/* Twitter Meta Tags */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://fmcs.example.com/" />
        <meta
          property="twitter:title"
          content="FMCS - FPT Medical Care System"
        />
        <meta
          property="twitter:description"
          content="Hệ thống quản lý y tế FPT - Quản lý sức khỏe, lịch khám và hỗ trợ y tế cho sinh viên và nhân viên trường Đại học FPT"
        />
        <meta property="twitter:image" content="/images/og-image.jpg" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />

        {/* Theme Color */}
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
