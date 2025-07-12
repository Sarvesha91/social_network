import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const EmojiPicker = ({ onEmojiSelect, onClose, isOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const pickerRef = useRef(null);

  const emojiCategories = {
    smileys: {
      name: 'Smileys & People',
      icon: '😀',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚',
        '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭',
        '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
        '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
        '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸'
      ]
    },
    animals: {
      name: 'Animals & Nature',
      icon: '🐶',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
        '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
        '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
        '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'
      ]
    },
    food: {
      name: 'Food & Drink',
      icon: '🍎',
      emojis: [
        '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
        '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
        '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔',
        '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈'
      ]
    },
    activities: {
      name: 'Activities',
      icon: '⚽',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
        '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
        '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷',
        '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '⛹️'
      ]
    },
    objects: {
      name: 'Objects',
      icon: '💎',
      emojis: [
        '💎', '🔔', '🔕', '🎵', '🎶', '💰', '💴', '💵', '💶', '💷',
        '💸', '💳', '🧾', '💹', '💱', '💲', '✉️', '📧', '📨', '📩',
        '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '✏️',
        '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️'
      ]
    },
    symbols: {
      name: 'Symbols',
      icon: '❤️',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
        '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
        '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐'
      ]
    }
  };

  const filteredEmojis = searchQuery
    ? Object.values(emojiCategories)
      .flatMap(category => category.emojis)
      .filter(emoji => {
        // Simple search - could be enhanced with emoji names
        return true; // For now, show all emojis when searching
      })
    : emojiCategories[activeCategory]?.emojis || [];

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Create portal to render at the end of body
  const modalRoot = document.getElementById('modal-root') || document.body;

  return createPortal(
    <div
      className="emoji-picker-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="emoji-picker"
        ref={pickerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          width: '350px',
          maxHeight: '450px',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.3s ease-out'
        }}
      >
        <div className="emoji-picker-header">
          <input
            type="text"
            placeholder="Search emojis"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="emoji-search"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderBottom: '1px solid #e2e8f0',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {!searchQuery && (
          <div className="emoji-categories" style={{
            display: 'flex',
            padding: '8px',
            borderBottom: '1px solid #e2e8f0',
            gap: '4px'
          }}>
            {Object.entries(emojiCategories).map(([key, category]) => (
              <button
                key={key}
                className={`category-btn ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}
                title={category.name}
                style={{
                  background: activeCategory === key ? '#667eea' : 'transparent',
                  border: 'none',
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {category.icon}
              </button>
            ))}
          </div>
        )}

        <div className="emoji-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '4px',
          padding: '12px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {filteredEmojis.map((emoji, index) => (
            <button
              key={index}
              className="emoji-btn"
              onClick={() => {
                onEmojiSelect(emoji);
                onClose();
              }}
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                fontSize: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                aspectRatio: '1'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f1f5f9';
                e.target.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.transform = 'scale(1)';
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default EmojiPicker;
