import { createContext, useContext, useEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { DEFAULT_OFFER_NAME, SITE_NAME } from './data/content'

// Campaign context: the ?f= keyword param names the brand shown on the
// page and is sent as offerName with every lead. &subid= tags the source.
export const CampaignContext = createContext({
  brand: SITE_NAME,
  offerName: DEFAULT_OFFER_NAME,
  subid: '',
})

export function useCampaign() {
  return useContext(CampaignContext)
}

// On navigation, jump to the #hash target if there is one, else top.
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

// Display name for a keyword: the raw ?f= value stays in the URL and is
// sent as offerName, but on the page hyphens become spaces and each word
// is capitalised, with common suffixes uppercased (trader-ai -> Trader AI).
const displayName = (f) =>
  f
    .split('-')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bBtc\b/g, 'BTC')
    .replace(/\bAt\b/g, 'AT')

export default function App() {
  const [searchParams] = useSearchParams()
  const f = searchParams.get('f')?.trim() || ''
  const subid = searchParams.get('subid')?.trim() || ''
  // Canonical keyword: hyphens in the URL (never %20), spaces on the page.
  const keyword = f.replaceAll(' ', '-')
  const brand = keyword ? displayName(keyword) : SITE_NAME

  // If a visitor lands with spaces in ?f=, rewrite the address bar to the
  // hyphenated form so the URL reads ?f=Vinty-AI instead of ?f=Vinty%20AI.
  useEffect(() => {
    if (f && f !== keyword) {
      const params = new URLSearchParams(searchParams)
      params.set('f', keyword)
      window.history.replaceState(null, '', `?${params.toString()}`)
    }
  }, [f, keyword, searchParams])

  // Each keyword lands on the same page: brand display follows the ?f=
  // param and leads are tagged per keyword as "<keyword>-LP".
  const campaign = {
    brand,
    offerName: keyword ? `${keyword}-LP` : DEFAULT_OFFER_NAME,
    subid,
  }

  useEffect(() => {
    document.title = `${brand} - Smart Trading Made Simple`

    // Meta descriptions follow the active keyword too, so each landing
    // URL carries its own SEO text (homepage falls back to Austrio Smart Up).
    const desc = document.querySelector('meta[name="description"]')
    if (desc) {
      desc.setAttribute(
        'content',
        `${brand} analyses global markets in real time and shows you when to enter. Register free, talk to a personal manager, and start your first trade.`,
      )
    }
    const og = document.querySelector('meta[property="og:description"]')
    if (og) {
      og.setAttribute(
        'content',
        `Register free and get a personal manager. ${brand} analyses 50+ market factors every second.`,
      )
    }

    // Canonical and og:url are self-referencing: exactly the visited URL,
    // so SEO audits never flag the page as canonicalised elsewhere.
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', window.location.href)
    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', window.location.href)
    const twTitle = document.querySelector('meta[name="twitter:title"]')
    if (twTitle) twTitle.setAttribute('content', `${brand} - Smart Trading Made Simple`)
    const twDesc = document.querySelector('meta[name="twitter:description"]')
    if (twDesc) {
      twDesc.setAttribute(
        'content',
        `Register free and get a personal manager. ${brand} analyses 50+ market factors every second.`,
      )
    }
  }, [brand, keyword])

  return (
    <CampaignContext.Provider value={campaign}>
      <ScrollManager />
      <Navbar />
      <Outlet />
      <Footer />
    </CampaignContext.Provider>
  )
}
