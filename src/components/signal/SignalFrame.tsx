import { SignalNav } from './SignalNav'
import { SignalFooter } from './SignalFooter'

// Applies a saved light theme before first paint on a hard load. Client navigations are covered by useSgTheme.
const THEME_JS = "(function(){try{var t=localStorage.getItem('wyber-sg-theme');if(t==='light'||t==='dark'){document.currentScript.parentElement.setAttribute('data-sg-theme',t)}}catch(x){}})()"

/**
 * The shared Signal page shell: skip link, nav, main landmark, footer.
 * `bare` is for sign-up, sign-in and onboarding: logo and theme switch only, no marketing chrome.
 */
export function SignalFrame({ children, bare = false }: { children: React.ReactNode; bare?: boolean }) {
  return (
    <div className="sg" data-sg-theme="dark" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
      <a className="sg-skip" href="#sg-main">Skip to content</a>
      <SignalNav bare={bare} />
      <main id="sg-main">{children}</main>
      {!bare && <SignalFooter />}
    </div>
  )
}
