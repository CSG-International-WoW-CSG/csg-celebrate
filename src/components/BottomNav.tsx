import { NavLink } from 'react-router-dom'

type Props = {
  activityCount?: number
  dmCount?: number
}

export function BottomNav({ activityCount = 0, dmCount = 0 }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLink to="/app" end>
        {({ isActive }) => (
          <>
            <span className="nav-icon">{isActive ? '⌂' : '⌂'}</span>
            Home
          </>
        )}
      </NavLink>
      <NavLink to="/app/explore">
        <span className="nav-icon">⌕</span>
        Explore
      </NavLink>
      <NavLink to="/app/create" aria-label="Create post">
        <span className="create-fab">+</span>
      </NavLink>
      <NavLink to="/app/activity">
        <span className="nav-icon">♡</span>
        Activity
        {activityCount > 0 && <span className="badge">{activityCount > 9 ? '9+' : activityCount}</span>}
      </NavLink>
      <NavLink to="/app/profile">
        <span className="nav-icon">◎</span>
        Profile
        {dmCount > 0 && <span className="badge">{dmCount > 9 ? '9+' : dmCount}</span>}
      </NavLink>
    </nav>
  )
}
