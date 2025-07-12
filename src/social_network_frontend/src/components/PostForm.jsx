import { useState, useEffect } from 'react';
import { social_network_backend } from 'declarations/social_network_backend';
import EmojiPicker from './EmojiPicker';

function PostForm({ post, onPostCreated, onPostUpdated, onCancel, backendActor }) {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaUrls, setMediaUrls] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isEditing = !!post;
  const maxChars = 2000;

  useEffect(() => {
    if (isEditing && post) {
      setContent(post.content);
      setCharCount(post.content.length);
      setHashtags(post.hashtags ? post.hashtags.join(', ') : '');
      setMediaUrls(post.media_urls ? post.media_urls.join(', ') : '');
    }
  }, [post, isEditing]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCharCount(newContent.length);
    setError('');
  };

  const handleEmojiSelect = (emoji) => {
    const newContent = content + emoji;
    setContent(newContent);
    setCharCount(newContent.length);
  };

  // Image compression function
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);

    const processedFiles = [];
    const processedUrls = [];

    for (const file of files) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit (same as profile pics)

      if (!isImage && !isVideo) {
        setError('Only image and video files are allowed');
        continue;
      }
      if (!isValidSize) {
        setError('File size must be less than 5MB');
        continue;
      }

      // Use simple approach like profile images - no compression
      const reader = new FileReader();
      reader.onload = (e) => {
        processedUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
      processedFiles.push(file);
    }

    if (processedFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...processedFiles]);

      // Update URLs after a short delay to ensure all readers complete
      setTimeout(() => {
        setMediaUrls(prev => {
          const newUrls = prev ? prev.split('|||').filter(url => url.trim()) : [];
          newUrls.push(...processedUrls);
          return newUrls.join('|||');
        });
      }, 100);

      setError('');
    }
    setLoading(false);
  };

  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaUrls(prev => {
      const urls = prev ? prev.split('|||').filter(url => url.trim()) : [];
      urls.splice(index, 1);
      return urls.join('|||');
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    if (content.length > maxChars) {
      setError(`Post content too long (max ${maxChars} characters)`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        // Update existing post
        const actor = backendActor || social_network_backend;
        const result = await actor.update_post(post.post_id, content);
        if (result.includes('successfully')) {
          setContent('');
          setCharCount(0);
          if (onPostUpdated) onPostUpdated();
        } else {
          setError(result);
        }
      } else {
        // Create new post
        const hashtagArray = hashtags.split(',').map(tag => tag.trim()).filter(tag => tag);
        const mediaArray = mediaUrls.split('|||').map(url => url.trim()).filter(url => url);

        const actor = backendActor || social_network_backend;
        const result = await actor.create_post(content, hashtagArray, mediaArray);
        if ('Ok' in result) {
          setContent('');
          setHashtags('');
          setMediaUrls('');
          setCharCount(0);
          if (onPostCreated) onPostCreated();
        } else {
          setError(result.Err);
        }
      }
    } catch (err) {
      console.error('Error submitting post:', err);
      setError('Failed to submit post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setCharCount(0);
    setError('');
    if (onCancel) onCancel();
  };

  return (
    <div className="post-form">
      <div className="post-form-header">
        <h3>{isEditing ? '✏️ Edit Post' : '📝 Create New Post'}</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <div className="content-input-wrapper">
            <textarea
              id="content"
              value={content}
              onChange={handleContentChange}
              placeholder="What's on your mind? Use @username to mention someone..."
              rows={6}
              className="post-textarea"
              disabled={loading}
              maxLength={maxChars}
            />
            <div className="content-actions">
              <button
                type="button"
                className="emoji-trigger-btn"
                onClick={() => setShowEmojiPicker(true)}
                disabled={loading}
              >
                😊
              </button>
            </div>
          </div>
          <div className="char-counter">
            <span className={charCount > maxChars * 0.9 ? 'warning' : ''}>
              {charCount}/{maxChars}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="hashtags">Hashtags (optional)</label>
          <input
            id="hashtags"
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="Enter hashtags separated by commas (e.g., tech, social, web3)"
            className="form-input"
            disabled={loading}
          />
          <small className="form-hint">
            Add relevant hashtags to help others discover your post
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="media">Media URLs (optional)</label>
          <input
            id="media"
            type="text"
            value={mediaUrls}
            onChange={(e) => setMediaUrls(e.target.value)}
            placeholder="Enter image URLs separated by commas"
            className="form-input"
            disabled={loading}
          />
          <small className="form-hint">
            Add image URLs to include media in your post
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="file-upload">Upload Images/Videos</label>
          <div className="file-upload-container">
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="file-input"
              disabled={loading}
            />
            <label htmlFor="file-upload" className="file-upload-btn">
              📎 Choose Files
            </label>
          </div>
          <small className="form-hint">
            Upload images or videos (max 10MB each)
          </small>

          {mediaFiles.length > 0 && (
            <div className="media-preview">
              {mediaFiles.map((file, index) => (
                <div key={index} className="media-item">
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMediaFile(index)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !content.trim() || charCount > maxChars}
            className="submit-btn"
          >
            {loading ? 'Submitting...' : (isEditing ? 'Update Post' : 'Create Post')}
          </button>

          {(isEditing || onCancel) && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="post-tips">
        <h4>💡 Tips for great posts:</h4>
        <ul>
          <li>Be respectful and constructive</li>
          <li>Share interesting thoughts or experiences</li>
          <li>Ask questions to engage the community</li>
          <li>Keep it concise but meaningful</li>
        </ul>
      </div>

      <EmojiPicker
        isOpen={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
      />
    </div>
  );
}

export default PostForm;
