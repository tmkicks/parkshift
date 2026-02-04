import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/logos/logo_dark.png" />
        <link rel="apple-touch-icon" href="/logos/logo_dark.png" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="description" content="Find parking spaces or share your own with ParkShift - Belgium's premier parking marketplace" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
