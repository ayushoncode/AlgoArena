import React from 'react'
import { Link } from 'react-router-dom'
import { HOME_CONFIG } from '../../../content/home'
import { ArenaEmblem } from '../../../components/ArenaLogo'
import DepthSection from '../../../components/home/DepthSection'
import './sections.css'

const { footer } = HOME_CONFIG

export default function FooterSection() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="home-site-footer" id="site-footer">
      <div className="depth-hairline-draw surface-hairline-top" aria-hidden="true" />
      <DepthSection id="s9-footer" enter={true} exit={false}>
        <div className="section-container">
          
          {/* Top Footer Grid */}
          <div className="footer-top-row">
            
            {/* Brand Column */}
            <div className="footer-brand-col">
              <Link to="/" className="footer-brand-lockup">
                <ArenaEmblem className="footer-brand-emblem" glow={false} />
                <span className="footer-brand-word">{footer.brand}</span>
              </Link>
              <p className="footer-tagline">{footer.tagline}</p>
              
              {/* Live Systems Pulse Badge */}
              <div className="footer-system-status">
                <span className="status-pulse-dot" />
                <span className="status-text">All systems operational</span>
              </div>
            </div>

            {/* Navigation Links Column */}
            <div className="footer-nav-col">
              <span className="footer-col-heading">Platform</span>
              <ul className="footer-links-list">
                <li><Link to="/lobby">Lobby</Link></li>
                <li><Link to="/leaderboard">Leaderboard</Link></li>
                <li><Link to="/who-we-are">Who We Are</Link></li>
                <li>
                  <a href={footer.githubUrl} target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal / Policy Column */}
            <div className="footer-nav-col">
              <span className="footer-col-heading">Resources</span>
              <ul className="footer-links-list">
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li id="mascot-footer-slot" data-mascot="toggle" />
              </ul>
            </div>

          </div>

          {/* Bottom Horizontal Hairline & Copyright */}
          <div className="footer-bottom-row">
            <span className="footer-copyright">
              &copy; {currentYear} {footer.brand}. Built for competitive programmers.
            </span>
            <span className="footer-season-tag">Season 1</span>
          </div>

        </div>
      </DepthSection>
    </footer>
  )
}
