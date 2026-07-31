import { useEffect, useState } from 'react'
import type { Story } from '../lib/types'

type Group = {
  authorId: string
  authorName: string
  authorAvatar: string
  stories: Story[]
}

type Props = {
  stories: Story[]
  onAdd?: () => void
  onOpen: (group: Group, index: number) => void
}

export function StoryTray({ stories, onAdd, onOpen }: Props) {
  const groups = groupStories(stories)

  return (
    <div className="story-tray" aria-label="Stories">
      {onAdd && (
        <button type="button" className="story-bubble story-add" onClick={onAdd}>
          <div className="story-ring">+</div>
          <span>Your story</span>
        </button>
      )}
      {groups.map((g) => (
        <button
          key={g.authorId}
          type="button"
          className="story-bubble"
          onClick={() => onOpen(g, 0)}
        >
          <div className="story-ring">
            {g.authorAvatar ? (
              <img src={g.authorAvatar} alt="" />
            ) : (
              <div className="placeholder" />
            )}
          </div>
          <span>{g.authorName.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  )
}

export function StoryViewer({
  group,
  startIndex,
  onClose,
}: {
  group: Group
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (index < group.stories.length - 1) setIndex((i) => i + 1)
      else onClose()
    }, 5000)
    return () => window.clearTimeout(t)
  }, [index, group.stories.length, onClose])

  const story = group.stories[index]
  if (!story) return null

  return (
    <div className="story-viewer" role="dialog" aria-modal="true">
      <div className="story-progress">
        {group.stories.map((_, i) => (
          <span key={i} className={i === index ? 'active' : i < index ? 'done' : ''}>
            <i style={i < index ? { width: '100%' } : undefined} />
          </span>
        ))}
      </div>
      <div className="story-viewer-top">
        <img
          className="avatar"
          src={
            group.authorAvatar ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(group.authorName)}`
          }
          alt=""
        />
        <strong style={{ flex: 1 }}>{group.authorName}</strong>
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <img
        src={story.mediaUrl}
        alt=""
        onClick={() => {
          if (index < group.stories.length - 1) setIndex((i) => i + 1)
          else onClose()
        }}
      />
    </div>
  )
}

function groupStories(stories: Story[]): Group[] {
  const map = new Map<string, Group>()
  for (const s of stories) {
    const existing = map.get(s.authorId)
    if (existing) existing.stories.push(s)
    else {
      map.set(s.authorId, {
        authorId: s.authorId,
        authorName: s.authorName,
        authorAvatar: s.authorAvatar,
        stories: [s],
      })
    }
  }
  return [...map.values()]
}

export type { Group as StoryGroup }
